// Histórico do dia (mais novo primeiro), compartilhado entre funcionário e dono.
// Excluir só aparece quando podeExcluir (dono, ou dia reaberto) — regra do plano.
import { centavosParaReal, formatarHora, formatarPeso } from "../dia";

function LinhaMov({ m, podeExcluir, onExcluir }) {
  const isSai = m.tipo === "compra" || (m.tipo === "outra" && m.direcao === "saida");
  const rotulo =
    m.tipo === "compra" ? "COMPRA" : m.tipo === "venda" ? "VENDA" : m.direcao === "entrada" ? "ENTRADA" : "SAÍDA";
  const classeTipo =
    m.tipo === "compra" ? "compra" : m.tipo === "venda" ? "venda" : m.direcao === "entrada" ? "outra-entra" : "outra-sai";

  let desc, sub, valor;
  if (m.tipo === "compra") {
    desc = m.pessoa || "Sem nome";
    sub = m.itens
      .map(
        (i) =>
          `${i.material} ${formatarPeso(i.pesoKg)} kg × ${centavosParaReal(i.precoPorKgCentavos)}${i.descontoCentavos ? ` · desc. ${centavosParaReal(i.descontoCentavos)}` : ""}`,
      )
      .join(" | ");
    valor = m.totalCentavos;
  } else if (m.tipo === "venda") {
    desc = m.itens.map((i) => (i.quantidade ? `${i.material} ${i.quantidade}` : i.material)).join(" + ");
    sub = formatarHora(m.timestamp) + (m.pessoa ? ` · ${m.pessoa}` : "");
    valor = m.totalCentavos;
  } else {
    desc = m.descricao;
    sub = formatarHora(m.timestamp);
    valor = m.valorCentavos;
  }

  return (
    <div className="mov-linha">
      <div className={`mov-tipo ${classeTipo}`}>{rotulo}</div>
      <div className="mov-corpo">
        <div className="mov-desc">{desc}</div>
        <div className="mov-sub">{sub}</div>
      </div>
      <div className={`mov-valor ${isSai ? "sai" : "entra"}`}>
        {isSai ? "− " : "+ "}
        {centavosParaReal(valor)}
      </div>
      {podeExcluir && (
        <button className="mov-excluir" onClick={() => onExcluir(m.id)}>
          ✕ Excluir
        </button>
      )}
    </div>
  );
}

export default function HistoricoDia({ dia, podeExcluir, onExcluir }) {
  const movs = [...dia.movimentacoes].reverse();
  if (!movs.length) return <p className="vazio">Nenhuma movimentação registrada ainda hoje.</p>;
  return (
    <div className="lista-mov">
      {movs.map((m) => (
        <LinhaMov key={m.id} m={m} podeExcluir={podeExcluir} onExcluir={onExcluir} />
      ))}
    </div>
  );
}
