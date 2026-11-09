// Coleta do Shopping (só gestor) — módulo separado do caixa: kg recolhidos por
// material e o fechamento mensal (kg × preço de contrato). Mês fechado fica
// travado: não reabre e guarda os preços da época. Sem controle de pago/pagável.
// O valor só vira "oficial" no relatório do mês fechado.
import { useState } from "react";
import { centavosParaReal, formatarPeso, nomeDeQuemFez } from "../dia";
import { gerarPdfShopping } from "../pdf";
import { coletasOrdenadas, mesAnterior, mesAtualISO, mesSeguinte, rotuloMes } from "../shopping";
import FormColeta from "./FormColeta";
import ModalConfirmar from "./ModalConfirmar";
import TabelaPrecosShopping from "./TabelaPrecosShopping";

export default function ColetaShopping({
  mes,
  tabela,
  onMudarMes,
  onRegistrar,
  onExcluir,
  onFechar,
  onSalvarPrecos,
  onVoltar,
}) {
  const [view, setView] = useState(null); // null | "nova" | "precos"
  const [excluindo, setExcluindo] = useState(null); // coleta aguardando confirmação
  const [fechando, setFechando] = useState(false);

  const fechado = mes.status === "fechado";
  const podeAvancar = mes.mes < mesAtualISO();
  const semPreco = mes.totais.filter((t) => t.precoPorKgCentavos === 0);
  const coletas = coletasOrdenadas(mes);

  if (view === "nova") {
    return (
      <div className="overlay">
        <div className="overlay-header">
          <button className="btn-voltar" onClick={() => setView(null)}>
            ← Voltar
          </button>
          <p className="overlay-titulo">Nova coleta</p>
        </div>
        <div className="overlay-corpo">
          <FormColeta
            mes={mes.mes}
            materiais={tabela.materiais}
            onRegistrar={(itens) => {
              onRegistrar(itens);
              setView(null);
            }}
            onCancelar={() => setView(null)}
          />
        </div>
      </div>
    );
  }

  if (view === "precos") {
    return (
      <TabelaPrecosShopping
        tabela={tabela}
        onSalvar={(lista) => {
          onSalvarPrecos(lista);
          setView(null);
        }}
        onVoltar={() => setView(null)}
      />
    );
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Coleta do shopping</p>
      </div>

      <div className="overlay-corpo">
        {/* Navegação entre meses — não passa do mês atual. */}
        <div className="mes-nav">
          <button className="mes-nav-btn" onClick={() => onMudarMes(mesAnterior(mes.mes))} aria-label="Mês anterior">
            ‹
          </button>
          <div className="mes-nav-titulo">
            {rotuloMes(mes.mes)}
            <span className={fechado ? "mes-status fechado" : "mes-status"}>{fechado ? "fechado" : "aberto"}</span>
          </div>
          <button
            className="mes-nav-btn"
            onClick={() => onMudarMes(mesSeguinte(mes.mes))}
            disabled={!podeAvancar}
            aria-label="Mês seguinte"
          >
            ›
          </button>
        </div>

        {fechado && (
          <p className="dica">
            Mês fechado
            {mes.fechadoEm ? ` em ${new Date(mes.fechadoEm).toLocaleDateString("pt-BR")}` : ""}
            {mes.fechadoPor ? ` por ${nomeDeQuemFez(mes.fechadoPor)}` : ""}.
            Não pode mais ser alterado.
          </p>
        )}

        <div className="shopping-totais">
          <div className="shopping-total-item">
            <span>KG NO MÊS</span>
            <strong>{formatarPeso(mes.kgTotal)} kg</strong>
          </div>
          <div className="shopping-total-item">
            <span>VALOR A PAGAR</span>
            <strong>{centavosParaReal(mes.valorTotalCentavos)}</strong>
          </div>
        </div>

        {!fechado && semPreco.length > 0 && (
          <p className="backup-alerta">
            {semPreco.length === 1 ? "1 material está" : `${semPreco.length} materiais estão`} com preço R$ 0,00.
            Confira em &quot;Preços do shopping&quot; antes de fechar o mês.
          </p>
        )}

        <button className="btn btn-primary" disabled={fechado} onClick={() => setView("nova")}>
          ➕ NOVA COLETA
        </button>
        <button className="btn btn-secondary" onClick={() => gerarPdfShopping(mes)}>
          📄 Relatório do mês
        </button>
        <button className="btn btn-ghost" onClick={() => setView("precos")}>
          💲 Preços do shopping
        </button>

        <h2 className="tela-titulo shopping-secao">Totais por material</h2>
        {mes.totais.length === 0 ? (
          <p className="vazio">Nenhuma coleta neste mês.</p>
        ) : (
          <div className="modal-resumo">
            {mes.totais.map((t) => (
              <div className="modal-resumo-linha" key={t.material}>
                <div className="modal-resumo-desc">
                  {t.material} — {formatarPeso(t.pesoKg)} kg × {centavosParaReal(t.precoPorKgCentavos)}/kg
                </div>
                <div className="modal-resumo-valor">{centavosParaReal(t.valorCentavos)}</div>
              </div>
            ))}
          </div>
        )}

        <h2 className="tela-titulo shopping-secao">Coletas</h2>
        {coletas.length === 0 ? (
          <p className="vazio">Nenhuma coleta registrada.</p>
        ) : (
          <div className="lista-mov">
            {coletas.map((c) => (
              <div className="shopping-coleta" key={c.id}>
                <div className="shopping-coleta-data">{c.data.split("-").reverse().join("/")}</div>
                <div className="shopping-coleta-material">{c.material}</div>
                <div className="shopping-coleta-peso">{formatarPeso(c.pesoKg)} kg</div>
                {!fechado && (
                  <button className="shopping-coleta-excluir" onClick={() => setExcluindo(c)}>
                    ✕ Excluir
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!fechado && (
          <button
            className="btn btn-success shopping-fechar"
            disabled={mes.coletas.length === 0}
            onClick={() => setFechando(true)}
          >
            🔒 FECHAR O MÊS
          </button>
        )}
        {!fechado && (
          <p className="dica">
            Ao fechar, o valor do mês fica travado com os preços de hoje. Depois não dá para mudar.
          </p>
        )}

        {excluindo && (
          <ModalConfirmar
            titulo="Excluir coleta"
            rotuloBotao="SIM, EXCLUIR"
            onConfirmar={() => {
              onExcluir(excluindo.id);
              setExcluindo(null);
            }}
            onCancelar={() => setExcluindo(null)}
          >
            <div className="modal-resumo-pessoa">
              {excluindo.material} — {formatarPeso(excluindo.pesoKg)} kg
            </div>
            <p className="dica">Essa coleta sai do mês e não volta.</p>
          </ModalConfirmar>
        )}

        {fechando && (
          <ModalConfirmar
            titulo="Fechar o mês"
            rotuloBotao="SIM, FECHAR O MÊS"
            onConfirmar={() => {
              onFechar();
              setFechando(false);
            }}
            onCancelar={() => setFechando(false)}
          >
            <div className="modal-resumo-pessoa">{rotuloMes(mes.mes)}</div>
            <div className="modal-resumo">
              <div className="modal-resumo-linha">
                <div className="modal-resumo-desc">Total coletado</div>
                <div className="modal-resumo-valor">{formatarPeso(mes.kgTotal)} kg</div>
              </div>
              <div className="modal-resumo-linha">
                <div className="modal-resumo-desc">Valor a pagar</div>
                <div className="modal-resumo-valor">{centavosParaReal(mes.valorTotalCentavos)}</div>
              </div>
            </div>
            {semPreco.length > 0 && (
              <p className="backup-alerta">
                Atenção: {semPreco.map((t) => t.material).join(", ")} com preço R$ 0,00. O valor fechado vai ficar sem
                essa parte.
              </p>
            )}
            <p className="dica">Depois de fechar, o mês não pode mais ser alterado.</p>
          </ModalConfirmar>
        )}
      </div>
    </div>
  );
}
