// ===== Controlador raiz do caixa da reciclagem =====
// Estado + persistência write-through + roteamento de visão (sem router lib).
// Regras do plano:
//  - Toda mutação computa o novo dia FORA do updater, salva no localStorage e depois setDia.
//  - Derivados (saldo, quebra, diferença) sempre via recalcular() — nunca confiar no salvo.
//  - Nunca salvarDia dentro de setState (StrictMode duplicaria a chamada).
import { useEffect, useState } from "react";
import "./App.css";
import {
  centavosParaReal,
  criarCompra,
  criarOutra,
  criarVenda,
  formatarData,
  hojeISO,
  novoDia,
  recalcular,
  rotuloPerfil,
} from "./dia";
import {
  abrirDia as abrirDiaStorage,
  carregarDia,
  carregarDiaAberto,
  carregarIndiceDias,
  carregarTabelaMateriais,
  fecharDia as fecharDiaStorage,
  pedirPersistencia,
  reabrirDia,
  salvarDia,
  salvarTabelaMateriais,
} from "./storage";
import SeletorPerfil from "./componentes/SeletorPerfil";
import AberturaDia from "./componentes/AberturaDia";
import TelaFuncionario from "./componentes/TelaFuncionario";
import TelaDono from "./componentes/TelaDono";
import FechamentoDia from "./componentes/FechamentoDia";
import ResumoDia from "./componentes/ResumoDia";
import DiasFechados from "./componentes/DiasFechados";
import TabelaMateriais from "./componentes/TabelaMateriais";
import Backup from "./componentes/Backup";

export default function App() {
  const [perfil, setPerfil] = useState(null); // null | 'funcionario' | 'dono'
  const [dia, setDia] = useState(null); // dia aberto/reaberto, sempre recalculado
  const [materiais, setMateriais] = useState(() => carregarTabelaMateriais());
  const [overlay, setOverlay] = useState(null); // 'fechamento'|'resumo'|'diasFechados'|'materiais'|'backup'|null
  const [resumoDe, setResumoDe] = useState(null); // dia exibido no overlay 'resumo'

  // Boot: pede persistência estável e reabre o dia em aberto (se houver).
  useEffect(() => {
    pedirPersistencia();
    const d = carregarDiaAberto();
    if (d) setDia(d);
  }, []);

  // Grava e atualiza: write-through síncrono, fora de qualquer updater.
  function persistir(novo) {
    const atualizado = recalcular(novo);
    salvarDia(atualizado);
    setDia(atualizado);
  }

  function abrirDia(caixaInicialCentavos, quebraInicial) {
    const d = recalcular(novoDia(hojeISO(), caixaInicialCentavos, perfil, quebraInicial));
    abrirDiaStorage(d);
    setDia(d);
  }

  function adicionarCompra({ pessoa, itens }) {
    if (!dia) return;
    // Preço fotocopiado por item a partir da tabela atual (fallback: o que o form já trouxe).
    const comPreco = itens.map((i) => {
      const mat = materiais.materiais.find((m) => m.nome === i.material);
      return { ...i, precoPorKgCentavos: mat ? mat.precoPorKgCentavos : i.precoPorKgCentavos };
    });
    const m = criarCompra({ pessoa, itens: comPreco, registradoPor: perfil, data: dia.data });
    persistir({ ...dia, movimentacoes: [...dia.movimentacoes, m] });
  }

  function adicionarVenda({ pessoa, itens, ajusteTotalCentavos }) {
    if (!dia) return;
    const v = criarVenda({ pessoa, itens, ajusteTotalCentavos, registradoPor: perfil, data: dia.data });
    persistir({ ...dia, movimentacoes: [...dia.movimentacoes, v] });
  }

  function adicionarOutra({ direcao, descricao, valorCentavos }) {
    if (!dia) return;
    const o = criarOutra({ direcao, descricao, valorCentavos, registradoPor: perfil, data: dia.data });
    persistir({ ...dia, movimentacoes: [...dia.movimentacoes, o] });
  }

  function excluirMovimentacao(id) {
    if (!dia) return;
    persistir({ ...dia, movimentacoes: dia.movimentacoes.filter((m) => m.id !== id) });
  }

  function confirmarFechamento(quebra) {
    if (!dia) return;
    const fechado = recalcular({
      ...dia,
      status: "fechado",
      quebraDeCaixa: quebra,
      fechadoEm: new Date().toISOString(),
      fechadoPor: perfil,
    });
    fecharDiaStorage(fechado);
    setDia(null);
    setOverlay(null);
  }

  function reabrir(data) {
    const base = carregarDia(data);
    if (!base) return;
    reabrirDia(data); // sai do indice-dias, vira diaAberto de novo
    // Dia volta "aberto" pra correção: limpa quebra/diferença/fechamento, marca reaberto.
    const d = recalcular({ ...base, status: "reaberto", quebraDeCaixa: null, fechadoEm: null, fechadoPor: null });
    salvarDia(d);
    setDia(d);
    setOverlay(null);
  }

  function verResumoDeDia(data) {
    setResumoDe(carregarDia(data));
    setOverlay("resumo");
  }

  function salvarMateriais(lista) {
    salvarTabelaMateriais(lista);
    setMateriais(carregarTabelaMateriais());
    setOverlay(null);
  }

  // ---- Roteamento ----
  if (!perfil) {
    return <SeletorPerfil onEscolher={setPerfil} />;
  }

  if (!dia) {
    return <AberturaDia onAbrir={abrirDia} />;
  }

  // Exclusão no histórico só para o gestor — o funcionário não apaga dados.
  const podeExcluir = perfil === "dono";

  const tela =
    perfil === "dono" ? (
      <TelaDono
        dia={dia}
        materiais={materiais}
        podeExcluir={podeExcluir}
        onCompra={adicionarCompra}
        onVenda={adicionarVenda}
        onOutra={adicionarOutra}
        onExcluir={excluirMovimentacao}
        onAbrirFechamento={() => setOverlay("fechamento")}
        onAbrirResumo={() => {
          setResumoDe(dia);
          setOverlay("resumo");
        }}
        onAbrirDiasFechados={() => setOverlay("diasFechados")}
        onAbrirMateriais={() => setOverlay("materiais")}
        onAbrirBackup={() => setOverlay("backup")}
      />
    ) : (
      <TelaFuncionario
        dia={dia}
        materiais={materiais}
        podeExcluir={podeExcluir}
        onCompra={adicionarCompra}
        onVenda={adicionarVenda}
        onOutra={adicionarOutra}
        onExcluir={excluirMovimentacao}
      />
    );

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-info">
          <div className="app-header-data">{formatarData(dia.data)}</div>
          <div className="app-header-perfil">{rotuloPerfil(perfil)}</div>
        </div>
        <button className="btn-trocar" onClick={() => setPerfil(null)}>
          Trocar
        </button>
      </header>

      <main className="app-main">
        <div className="saldo">
          <div className="saldo-rotulo">SALDO ESPERADO</div>
          <div className="saldo-valor">{centavosParaReal(dia.saldoEsperadoCentavos)}</div>
          <p className="saldo-dica">O dinheiro que deveria estar na bolsa neste momento.</p>
        </div>
        {tela}
      </main>

      {overlay === "fechamento" && (
        <FechamentoDia dia={dia} perfil={perfil} onFechar={confirmarFechamento} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "resumo" && <ResumoDia dia={resumoDe} onVoltar={() => setOverlay(null)} />}
      {overlay === "diasFechados" && (
        <DiasFechados
          dias={carregarIndiceDias()
            .map((data) => carregarDia(data))
            .filter(Boolean)
            .sort((a, b) => b.data.localeCompare(a.data))}
          onAbrir={verResumoDeDia}
          onReabrir={reabrir}
          onVoltar={() => setOverlay(null)}
        />
      )}
      {overlay === "materiais" && (
        <TabelaMateriais tabela={materiais} onSalvar={salvarMateriais} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "backup" && <Backup onVoltar={() => setOverlay(null)} />}
    </div>
  );
}
