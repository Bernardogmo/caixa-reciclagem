// Histórico do dia (mais novo primeiro), compartilhado entre funcionário e gestor.
// Regra do plano: no dia de hoje os dois perfis podem editar e excluir, sempre
// com confirmação. Dia fechado é somente leitura (não passa por aqui).
import { useState } from "react";
import {
  centavosParaReal,
  descricaoMovimentacao,
  formatarHora,
  formatarPeso,
  nomeDeQuemFez,
} from "../dia";
import ModalConfirmar from "./ModalConfirmar";

function LinhaMov({ m, onEditar, onExcluir }) {
  const isSai = m.tipo === "compra" || (m.tipo === "outra" && m.direcao === "saida");
  const rotulo =
    m.tipo === "compra" ? "COMPRA" : m.tipo === "venda" ? "VENDA" : m.direcao === "entrada" ? "ENTRADA" : "SAÍDA";
  const classeTipo =
    m.tipo === "compra" ? "compra" : m.tipo === "venda" ? "venda" : m.direcao === "entrada" ? "outra-entra" : "outra-sai";

  let desc, sub, valor;
  if (m.tipo === "compra") {
    desc = m.pessoa || "Sem nome";
    sub = m.itens
      .map((i) => `${i.material} ${formatarPeso(i.pesoKg)} kg × ${centavosParaReal(i.precoPorKgCentavos)}`)
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
        {m.alteradoEm && (
          <div className="mov-sub">alterado por {nomeDeQuemFez(m.alteradoPor) || "—"}</div>
        )}
      </div>
      <div className={`mov-valor ${isSai ? "sai" : "entra"}`}>
        {isSai ? "− " : "+ "}
        {centavosParaReal(valor)}
      </div>
      <div className="mov-acoes">
        <button className="mov-editar" onClick={() => onEditar(m)}>
          ✏️ Editar
        </button>
        <button className="mov-excluir" onClick={() => onExcluir(m)}>
          ✕ Excluir
        </button>
      </div>
    </div>
  );
}

export default function HistoricoDia({ dia, onEditar, onExcluir }) {
  const [excluindo, setExcluindo] = useState(null);
  const movs = [...dia.movimentacoes].reverse();

  function confirmarExclusao() {
    onExcluir(excluindo.id);
    setExcluindo(null);
  }

  if (!movs.length)
    return <p className="vazio">Quando você registrar uma compra, venda ou outra movimentação, ela aparece aqui.</p>;
  return (
    <div className="lista-mov">
      {movs.map((m) => (
        <LinhaMov key={m.id} m={m} onEditar={onEditar} onExcluir={setExcluindo} />
      ))}

      {excluindo && (
        <ModalConfirmar
          titulo="Excluir movimentação?"
          rotuloBotao="✕ EXCLUIR"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        >
          <div className="modal-resumo">
            <div className="modal-resumo-linha">
              <div className="modal-resumo-desc">
                <strong>{excluindo.pessoa || (excluindo.tipo === "outra" ? excluindo.descricao : "Sem nome")}</strong>
                <br />
                {descricaoMovimentacao(excluindo)}
              </div>
              <div className="modal-resumo-valor">
                {centavosParaReal(excluindo.tipo === "outra" ? excluindo.valorCentavos : excluindo.totalCentavos)}
              </div>
            </div>
          </div>
          <p className="dica">Essa ação não pode ser desfeita.</p>
        </ModalConfirmar>
      )}
    </div>
  );
}
