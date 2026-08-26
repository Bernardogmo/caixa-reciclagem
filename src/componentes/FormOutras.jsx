// Outras movimentações (dono e funcionário): SAÍDA/ENTRADA + descrição livre + valor.
// Per esboço aprovado: botões Sai / Entra, descrição e valor.
import { useState } from "react";
import { centavosParaReal, realParaCentavos } from "../dia";

export default function FormOutras({ onOutra }) {
  const [direcao, setDirecao] = useState("saida");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

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
      <p className="dica">Use para dinheiro que sai ou entra por outro motivo (frete, pagamento, insumos). Escolha &apos;Saída&apos; ou &apos;Entrada&apos; e escreva o motivo.</p>

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
        CONFIRMAR {direcao === "saida" ? "SAÍDA" : "ENTRADA"}
      </button>
    </div>
  );
}
