// Abertura do dia: valor único do caixa inicial + ABRIR O DIA.
// inputMode="decimal" — teclado numérico no tablet. realParaCentavos aceita "100", "100,00", "100.00".
import { useState } from "react";
import { centavosParaReal, realParaCentavos } from "../dia";

export default function AberturaDia({ onAbrir }) {
  const [valor, setValor] = useState("");
  const centavos = realParaCentavos(valor);
  const valido = Number.isFinite(centavos) && centavos >= 0;

  function confirmar() {
    if (!valido) return;
    onAbrir(centavos);
  }

  return (
    <main className="app-main">
      <h1 className="tela-titulo">Abrir o dia</h1>

      <div className="campo">
        <label htmlFor="caixa-inicial">Caixa inicial (R$)</label>
        <input
          id="caixa-inicial"
          className="input-grande"
          inputMode="decimal"
          autoFocus
          placeholder="Ex.: 100,00"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
        />
      </div>

      <button className="btn btn-success" disabled={!valido} onClick={confirmar}>
        ABRIR O DIA {valido ? `— ${centavosParaReal(centavos)}` : ""}
      </button>
    </main>
  );
}
