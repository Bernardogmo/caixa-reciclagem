// Outras movimentações (dono e funcionário): SAÍDA/ENTRADA + descrição livre + valor.
// Per esboço aprovado: botões Sai / Entra, descrição e valor.
// Em modo edição (dia de hoje) vem preenchido com a movimentação original.
import { useState } from "react";
import { centavosParaReal, realParaCentavos } from "../dia";

// 1250 → "12,50" (campo de texto em reais, o oposto do realParaCentavos)
function centavosParaCampo(c) {
  return (c / 100).toFixed(2).replace(".", ",");
}

export default function FormOutras({ onOutra, inicial = null, modoEdicao = false }) {
  const [direcao, setDirecao] = useState(inicial?.direcao || "saida");
  const [descricao, setDescricao] = useState(inicial?.descricao || "");
  const [valor, setValor] = useState(inicial ? centavosParaCampo(inicial.valorCentavos) : "");

  const valorCentavos = realParaCentavos(valor);
  const valido = descricao.trim() !== "" && Number.isFinite(valorCentavos) && valorCentavos > 0;

  function confirmar() {
    if (!valido) return;
    onOutra({ direcao, descricao: descricao.trim(), valorCentavos });
    setDescricao("");
    setValor("");
  }

  return (
    <div>
      <p className="dica">
        {modoEdicao
          ? "Editar a movimentação: ajuste a direção, o motivo e o valor."
          : "Use para dinheiro que sai ou entra por outro motivo (frete, pagamento, insumos). Escolha 'Saída' ou 'Entrada' e escreva o motivo."}
      </p>

      <div className="abas">
        <button className={direcao === "saida" ? "ativa" : ""} onClick={() => setDirecao("saida")}>
          ⬆ SAÍDA
        </button>
        <button className={direcao === "entrada" ? "ativa" : ""} onClick={() => setDirecao("entrada")}>
          ⬇ ENTRADA
        </button>
      </div>

      <div className="campo">
        <label htmlFor="out-desc">Descrição</label>
        <input
          id="out-desc"
          className="input-grande"
          placeholder="Ex.: frete até o comprador"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="out-valor">Valor (R$)</label>
        <input
          id="out-valor"
          className="input-grande"
          inputMode="decimal"
          placeholder="0,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />
      </div>

      <div className="total-ao-vivo">
        <span>{direcao === "saida" ? "SAI DO CAIXA" : "ENTRA NO CAIXA"}</span>
        <strong>
          {Number.isFinite(valorCentavos) && valorCentavos > 0
            ? `${direcao === "saida" ? "− " : "+ "}${centavosParaReal(valorCentavos)}`
            : "—"}
        </strong>
      </div>

      <button className="btn btn-primary" disabled={!valido} onClick={confirmar}>
        {modoEdicao ? "✔ SALVAR ALTERAÇÃO" : `CONFIRMAR ${direcao === "saida" ? "SAÍDA" : "ENTRADA"}`}
      </button>
    </div>
  );
}
