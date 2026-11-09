// ===== Controlador raiz do caixa da reciclagem =====
// O caixa agora mora no Firestore (banco compartilhado) e chega por onSnapshot.
// Regras:
//  - A tela NUNCA persiste o dia inteiro: cada ação chama o repositório e o
//    novo estado chega pelo snapshot (o cache local do Firestore aplica na hora,
//    então funciona offline e sincroniza sozinho depois).
//  - Derivados (saldo, quebra, diferença) sempre via recalcular() no repositório.
//  - Escritas não bloqueiam a tela: chamamos sem `await` e só tratamos o erro.
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  atualizarMovimentacao,
  centavosParaReal,
  criarCompra,
  criarOutra,
  criarVenda,
  formatarData,
  hojeISO,
  novoDia,
  rotuloPerfil,
} from "./dia";
import * as dados from "./repositorio";
import { criarColetas, mesAtualISO, novoMes, recalcularMes } from "./shopping";
import { comIdsUnicos, contatosOrdenados } from "./contatos";
import { MATERIAIS_PADRAO } from "./materiais";
import { observarMeuUsuario, observarSessao, sair as sairConta } from "./usuarios";
import { resumoDadosAntigos, temDadosAntigos } from "./migracao";
import Login from "./componentes/Login";
import SeletorModo from "./componentes/SeletorModo";
import SemAcesso from "./componentes/SemAcesso";
import AberturaDia from "./componentes/AberturaDia";
import FundoProximoDia from "./componentes/FundoProximoDia";
import TelaFuncionario from "./componentes/TelaFuncionario";
import TelaDono from "./componentes/TelaDono";
import FechamentoDia from "./componentes/FechamentoDia";
import ResumoDia from "./componentes/ResumoDia";
import DiasFechados from "./componentes/DiasFechados";
import TabelaMateriais from "./componentes/TabelaMateriais";
import Backup from "./componentes/Backup";
import ColetaShopping from "./componentes/ColetaShopping";
import Contatos from "./componentes/Contatos";
import Usuarios from "./componentes/Usuarios";
import MigracaoDados from "./componentes/MigracaoDados";
import AvisoSemInternet from "./componentes/AvisoSemInternet";
import FormCompra from "./componentes/FormCompra";
import FormVenda from "./componentes/FormVenda";
import FormOutras from "./componentes/FormOutras";

const tabelaMateriaisInicial = () => ({
  version: 1,
  atualizadaEm: null,
  materiais: MATERIAIS_PADRAO,
});

const tabelaShoppingInicial = () => ({
  version: 1,
  atualizadaEm: null,
  materiais: MATERIAIS_PADRAO.map((m) => ({ nome: m.nome, precoPorKgCentavos: 0 })),
});

function TelaCarregando({ texto = "Carregando…" }) {
  return (
    <main className="app-main tela-carregando">
      <div className="login-logo">♻️</div>
      <p className="dica">{texto}</p>
    </main>
  );
}

export default function App() {
  // Sessão do Firebase Auth: undefined = ainda verificando, null = deslogado.
  const [sessao, setSessao] = useState(undefined);
  // Cadastro usuarios/{uid}: undefined = carregando, null = sem acesso liberado.
  const [usuario, setUsuario] = useState(undefined);
  // Modo escolhido pelo admin: null | "funcionario" | "dono".
  const [modo, setModo] = useState(null);
  // meta/geral: undefined = ainda sem snapshot, senão { diaAberto, fundoProximoDia, indiceDias }.
  const [meta, setMeta] = useState(undefined);
  const [dia, setDia] = useState(null); // dia aberto, já recalculado pelo repositório
  const [diaPronto, setDiaPronto] = useState(false); // snapshot do dia chegou?
  const [diasFechados, setDiasFechados] = useState(null); // null = carregando
  const [materiais, setMateriais] = useState(tabelaMateriaisInicial);
  // Coleta do shopping: separada do caixa (tabela e mês próprios).
  const [tabelaShopping, setTabelaShopping] = useState(tabelaShoppingInicial);
  const [mesShoppingKey, setMesShoppingKey] = useState(() => mesAtualISO());
  const [mesBruto, setMesBruto] = useState(() => novoMes(mesAtualISO()));
  // Contatos (catadores/clientes): só o gestor cadastra, mas os dois perfis
  // podem escolher um nome cadastrado na compra e na venda.
  const [contatos, setContatos] = useState([]);
  const [overlay, setOverlay] = useState(null); // 'fechamento'|'resumo'|'editar'|'diasFechados'|'materiais'|'backup'|'fundoProximoDia'|'shopping'|'contatos'|'usuarios'|'sair'|null
  const [resumoDe, setResumoDe] = useState(null); // dia exibido no overlay 'resumo'
  const [editando, setEditando] = useState(null); // movimentação do dia aberto em edição
  // Contagem do último fechamento — só é sugestão enquanto o fundo não foi definido.
  const [sugestaoFundo, setSugestaoFundo] = useState(null);
  // Dados do app antigo (localStorage) ainda não migrados neste aparelho.
  const [migracao, setMigracao] = useState(() => (temDadosAntigos() ? resumoDadosAntigos() : null));
  const [erro, setErro] = useState("");

  // Perfil de uso: comum só usa o funcionário; o admin escolhe depois do login.
  const perfil = usuario ? (usuario.papel === "admin" ? modo : "funcionario") : null;
  const nome = usuario?.nome || usuario?.email || "";
  const uid = usuario?.uid || null;
  const fundoProximoDia = meta?.fundoProximoDia || null;
  const diaAbertoISO = meta?.diaAberto || null;

  const mesShopping = useMemo(
    () => recalcularMes(mesBruto, tabelaShopping.materiais),
    [mesBruto, tabelaShopping],
  );
  const listaContatos = useMemo(() => contatosOrdenados(contatos), [contatos]);

  function aoFalhar(erroBanco) {
    console.error("Erro no banco:", erroBanco);
    setErro("Não deu para falar com o banco de dados. Confira a internet e tente de novo.");
  }

  // Pede ao navegador para não apagar o cache offline (índice do Firestore).
  useEffect(() => {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().catch(() => {});
    }
  }, []);

  // Sessão do Auth.
  useEffect(() => observarSessao(setSessao), []);

  // Cadastro (nome/papel). Sem documento = sem acesso ao caixa.
  useEffect(() => {
    setUsuario(undefined);
    if (!sessao) {
      setModo(null);
      setOverlay(null);
      return undefined;
    }
    return observarMeuUsuario(sessao.uid, setUsuario, (erroUsuario) => {
      console.error("Não deu para ler o cadastro:", erroUsuario);
      setUsuario(null);
    });
  }, [sessao]);

  // Admin com acesso liberado cria meta/geral se ainda não existir: é o
  // documento que diz qual dia está aberto (funcionário não pode criá-lo).
  useEffect(() => {
    if (uid && usuario?.papel === "admin") {
      dados.garantirMeta().catch((erroMeta) => console.error("meta:", erroMeta));
    }
  }, [uid, usuario?.papel]);

  // Dados compartilhados que a tela inteira usa (tabelas, contatos, meta).
  useEffect(() => {
    if (!uid) {
      setMeta(undefined);
      return undefined;
    }
    const parar = [
      dados.assinarMeta(setMeta, aoFalhar),
      dados.assinarTabelaMateriais(setMateriais, aoFalhar),
      dados.assinarTabelaShopping(setTabelaShopping, aoFalhar),
      dados.assinarContatos(setContatos, aoFalhar),
    ];
    return () => parar.forEach((cancelar) => cancelar && cancelar());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Dia aberto: acompanha dias/{meta.diaAberto}. Se outro aparelho fechar o dia,
  // meta.diaAberto vira null e esta tela volta sozinha para "abrir o dia".
  useEffect(() => {
    if (!uid || meta === undefined) return undefined;
    if (!diaAbertoISO) {
      setDia(null);
      setDiaPronto(false);
      return undefined;
    }
    setDiaPronto(false);
    return dados.assinarDia(
      diaAbertoISO,
      (novoDiaDoc) => {
        setDia(novoDiaDoc);
        setDiaPronto(true);
      },
      (erroDia) => {
        console.error("Não deu para ler o dia:", erroDia);
        setDiaPronto(true);
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, diaAbertoISO]);

  // Mês do shopping (a tela troca de mês e a assinatura acompanha).
  useEffect(() => {
    if (!uid) return undefined;
    return dados.assinarMesColeta(mesShoppingKey, setMesBruto, aoFalhar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, mesShoppingKey]);

  // Sugestão do fundo do próximo dia: contagem física do último fechamento.
  useEffect(() => {
    if (!uid || meta === undefined) return undefined;
    if (perfil !== "dono" || meta.diaAberto || meta.fundoProximoDia) {
      setSugestaoFundo(null);
      return undefined;
    }
    let ativo = true;
    dados
      .ultimaContagemFechada()
      .then((resultado) => {
        if (ativo) setSugestaoFundo(resultado);
      })
      .catch(aoFalhar);
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, perfil, meta]);

  // ------------------------------------------------------------ ações do dia

  function abrirDiaNovo(caixaInicialCentavos, quebraInicial) {
    const novo = novoDia(hojeISO(), caixaInicialCentavos, perfil, quebraInicial);
    novo.abertoPor = nome;
    dados.abrirDia(novo).catch(aoFalhar);
    setSugestaoFundo(null);
  }

  function adicionarCompra({ pessoa, itens }) {
    if (!dia) return;
    // Preço fotocopiado por item a partir da tabela atual (fallback: o que o form já trouxe).
    const comPreco = itens.map((i) => {
      const mat = materiais.materiais.find((m) => m.nome === i.material);
      return { ...i, precoPorKgCentavos: mat ? mat.precoPorKgCentavos : i.precoPorKgCentavos };
    });
    const m = criarCompra({ pessoa, itens: comPreco, registradoPor: nome, data: dia.data });
    dados.adicionarMovimentacao(dia.data, m).catch(aoFalhar);
  }

  function adicionarVenda({ pessoa, itens, ajusteTotalCentavos }) {
    if (!dia) return;
    const v = criarVenda({ pessoa, itens, ajusteTotalCentavos, registradoPor: nome, data: dia.data });
    dados.adicionarMovimentacao(dia.data, v).catch(aoFalhar);
  }

  function adicionarOutra({ direcao, descricao, valorCentavos }) {
    if (!dia) return;
    const o = criarOutra({ direcao, descricao, valorCentavos, registradoPor: nome, data: dia.data });
    dados.adicionarMovimentacao(dia.data, o).catch(aoFalhar);
  }

  function excluirMovimentacao(id) {
    if (!dia) return;
    dados.removerMovimentacao(dia.data, id).catch(aoFalhar);
  }

  // Edição só no dia aberto (dia fechado é somente leitura). A movimentação
  // original é guardada enquanto o formulário está aberto.
  function iniciarEdicao(m) {
    setEditando(m);
    setOverlay("editar");
  }

  function salvarEdicao(novosDados) {
    if (!dia || !editando) return;
    const atualizada = atualizarMovimentacao(editando, novosDados, nome);
    dados.substituirMovimentacao(dia.data, atualizada).catch(aoFalhar);
    setEditando(null);
    setOverlay(null);
  }

  function fecharEdicao() {
    setEditando(null);
    setOverlay(null);
  }

  function confirmarFechamento(quebra) {
    if (!dia) return;
    dados.fecharDia(dia, quebra, nome).catch(aoFalhar);
    setSugestaoFundo({ quebra, data: dia.data }); // pré-preenche a definição do fundo
    setOverlay(null);
  }

  // Grava o fundo definido para o próximo dia (fica no meta até o dia ser aberto).
  function definirFundoProximoDia(quebra) {
    if (!sugestaoFundo) return;
    dados
      .definirFundoProximoDia({ quebra, origemData: sugestaoFundo.data, definidoPor: nome })
      .catch(aoFalhar);
    setOverlay(null);
  }

  function abrirDiasFechados() {
    setDiasFechados(null);
    setOverlay("diasFechados");
    dados
      .carregarDiasFechados()
      .then(setDiasFechados)
      .catch((erroDias) => {
        aoFalhar(erroDias);
        setDiasFechados([]);
      });
  }

  async function verResumoDeDia(data) {
    try {
      const d = await dados.carregarDia(data);
      if (d) {
        setResumoDe(d);
        setOverlay("resumo");
      }
    } catch (erroResumo) {
      aoFalhar(erroResumo);
    }
  }

  function salvarMateriais(lista) {
    dados.salvarMateriais(lista).catch(aoFalhar);
    setOverlay(null);
  }

  // ---- Coleta do shopping ----
  // Ao abrir, volta para o mês atual (o mês pode ter virado desde o último uso).
  function abrirShopping() {
    const mes = mesAtualISO();
    if (mes !== mesShoppingKey) {
      setMesBruto(novoMes(mes));
      setMesShoppingKey(mes);
    }
    setOverlay("shopping");
  }

  function mudarMesShopping(mes) {
    if (mes !== mesShoppingKey) {
      setMesBruto(novoMes(mes));
      setMesShoppingKey(mes);
    }
  }

  function registrarColetas(itens) {
    const novas = criarColetas(itens, nome);
    dados.adicionarColetas(mesShoppingKey, novas).catch(aoFalhar);
  }

  function excluirColeta(id) {
    dados.removerColeta(mesShoppingKey, id).catch(aoFalhar);
  }

  function fecharMesShopping() {
    dados.fecharMesColeta(mesShopping, nome, tabelaShopping.materiais).catch(aoFalhar);
  }

  function salvarPrecosShopping(lista) {
    // Mês aberto mostra previsão com os preços atuais; mês fechado usa os congela­dos.
    dados.salvarTabelaShopping(lista).catch(aoFalhar);
  }

  // ---- Contatos ----
  function salvarListaContatos(lista) {
    dados.salvarContatos(comIdsUnicos(lista)).catch(aoFalhar);
    setOverlay(null);
  }

  // ---- Conta ----
  function sairDaConta() {
    setOverlay(null);
    setModo(null);
    sairConta().catch((erroSair) => console.error("Sair:", erroSair));
  }

  // ---- Roteamento ----
  if (sessao === undefined) return <TelaCarregando />;
  if (!sessao) return <Login />;
  if (usuario === undefined) return <TelaCarregando />;
  if (!usuario) return <SemAcesso email={sessao.email} onSair={sairDaConta} />;
  // Só o gestor pode subir os dados antigos do aparelho para o caixa compartilhado.
  if (migracao && usuario.papel === "admin") {
    return <MigracaoDados resumo={migracao} onPronto={() => setMigracao(null)} />;
  }
  if (!perfil) {
    return <SeletorModo nome={usuario.nome} onEscolher={setModo} onSair={sairDaConta} />;
  }
  if (meta === undefined) return <TelaCarregando />;
  if (meta.diaAberto && !diaPronto) return <TelaCarregando />;

  const diaAberto = meta.diaAberto ? dia : null;

  if (!diaAberto) {
    return (
      <div className="app">
        <AvisoSemInternet />
        <AberturaDia
          // Remonta a grade quando o fundo é definido (useState não realimenta da prop).
          key={fundoProximoDia ? fundoProximoDia.definidoEm : "sem-fundo"}
          onAbrir={abrirDiaNovo}
          fundo={fundoProximoDia}
          sugestaoFundo={perfil === "dono" ? sugestaoFundo : null}
          onDefinirFundo={() => setOverlay("fundoProximoDia")}
        />
        {overlay === "fundoProximoDia" && sugestaoFundo && (
          <FundoProximoDia
            quebraInicial={sugestaoFundo.quebra}
            origemData={sugestaoFundo.data}
            onDefinir={definirFundoProximoDia}
            onPular={() => setOverlay(null)}
          />
        )}
      </div>
    );
  }

  // No dia de hoje os dois perfis editam/excluem (sempre com confirmação);
  // dia fechado é somente leitura.
  const tela =
    perfil === "dono" ? (
      <TelaDono
        dia={diaAberto}
        materiais={materiais}
        contatos={listaContatos}
        onCompra={adicionarCompra}
        onVenda={adicionarVenda}
        onOutra={adicionarOutra}
        onEditar={iniciarEdicao}
        onExcluir={excluirMovimentacao}
        onAbrirFechamento={() => setOverlay("fechamento")}
        onAbrirResumo={() => {
          setResumoDe(diaAberto);
          setOverlay("resumo");
        }}
        onAbrirDiasFechados={abrirDiasFechados}
        onAbrirMateriais={() => setOverlay("materiais")}
        onAbrirBackup={() => setOverlay("backup")}
        onAbrirShopping={abrirShopping}
        onAbrirContatos={() => setOverlay("contatos")}
        onAbrirUsuarios={() => setOverlay("usuarios")}
      />
    ) : (
      <TelaFuncionario
        dia={diaAberto}
        materiais={materiais}
        contatos={listaContatos}
        onCompra={adicionarCompra}
        onVenda={adicionarVenda}
        onOutra={adicionarOutra}
        onEditar={iniciarEdicao}
        onExcluir={excluirMovimentacao}
      />
    );

  return (
    <div className="app">
      <AvisoSemInternet />
      <header className="app-header">
        <div className="app-header-info">
          <div className="app-header-data">{formatarData(diaAberto.data)}</div>
          <div className="app-header-perfil">
            {nome ? `${nome} · ` : ""}
            {rotuloPerfil(perfil)}
          </div>
        </div>
        <button className="btn-trocar" onClick={() => setOverlay("sair")}>
          Sair
        </button>
      </header>

      <main className="app-main">
        {erro && <p className="aviso-erro">{erro}</p>}
        <div className="saldo">
          <div className="saldo-rotulo">SALDO ESPERADO</div>
          <div className="saldo-valor">{centavosParaReal(diaAberto.saldoEsperadoCentavos)}</div>
          <p className="saldo-dica">O dinheiro que deveria estar na bolsa neste momento.</p>
        </div>
        {tela}
      </main>

      {overlay === "sair" && (
        <div className="overlay">
          <div className="overlay-header">
            <button className="btn-voltar" onClick={() => setOverlay(null)}>
              ← Voltar
            </button>
            <p className="overlay-titulo">Sair da conta?</p>
          </div>
          <div className="overlay-corpo">
            <p className="dica">Para entrar de novo neste aparelho vai precisar de internet.</p>
            <button className="btn btn-danger" onClick={sairDaConta}>
              ✕ SAIR DA CONTA
            </button>
            <button className="btn btn-ghost" onClick={() => setOverlay(null)}>
              CANCELAR
            </button>
          </div>
        </div>
      )}
      {overlay === "fechamento" && (
        <FechamentoDia dia={diaAberto} onFechar={confirmarFechamento} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "resumo" && <ResumoDia dia={resumoDe} onVoltar={() => setOverlay(null)} />}
      {overlay === "editar" && editando && (
        <div className="overlay">
          <div className="overlay-header">
            <button className="btn-voltar" onClick={fecharEdicao}>
              ← Voltar
            </button>
            <p className="overlay-titulo">
              {editando.tipo === "compra"
                ? "Editar compra"
                : editando.tipo === "venda"
                  ? "Editar venda"
                  : "Editar movimentação"}
            </p>
          </div>
          <div className="overlay-corpo">
            {editando.tipo === "compra" && (
              <FormCompra
                materiais={materiais.materiais}
                contatos={listaContatos}
                inicial={editando}
                modoEdicao
                onCompra={salvarEdicao}
              />
            )}
            {editando.tipo === "venda" && (
              <FormVenda
                materiais={materiais.materiais}
                contatos={listaContatos}
                inicial={editando}
                modoEdicao
                onVenda={salvarEdicao}
              />
            )}
            {editando.tipo === "outra" && <FormOutras inicial={editando} modoEdicao onOutra={salvarEdicao} />}
          </div>
        </div>
      )}
      {overlay === "diasFechados" && diasFechados === null && (
        <div className="overlay">
          <div className="overlay-header">
            <button className="btn-voltar" onClick={() => setOverlay(null)}>
              ← Voltar
            </button>
            <p className="overlay-titulo">Dias fechados</p>
          </div>
          <div className="overlay-corpo">
            <p className="dica">Buscando os dias fechados…</p>
          </div>
        </div>
      )}
      {overlay === "diasFechados" && diasFechados !== null && (
        <DiasFechados dias={diasFechados} onAbrir={verResumoDeDia} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "materiais" && (
        <TabelaMateriais tabela={materiais} onSalvar={salvarMateriais} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "backup" && <Backup onVoltar={() => setOverlay(null)} />}
      {overlay === "contatos" && (
        <Contatos contatos={listaContatos} onSalvar={salvarListaContatos} onVoltar={() => setOverlay(null)} />
      )}
      {overlay === "usuarios" && <Usuarios meuUid={uid} onVoltar={() => setOverlay(null)} />}
      {overlay === "shopping" && (
        <ColetaShopping
          mes={mesShopping}
          tabela={tabelaShopping}
          onMudarMes={mudarMesShopping}
          onRegistrar={registrarColetas}
          onExcluir={excluirColeta}
          onFechar={fecharMesShopping}
          onSalvarPrecos={salvarPrecosShopping}
          onVoltar={() => setOverlay(null)}
        />
      )}
    </div>
  );
}
