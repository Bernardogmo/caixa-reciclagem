// Fechamento do dia: quebra de caixa (qtd por cédula/moeda), CONTADO/ESPERADO/
// DIFERENÇA ao vivo e FECHAR O DIA. Per esboço aprovado.
import { useState } from "react";
import { CEDULAS, MOEDAS, calcularQuebraTotal, centavosParaReal, quebraVazia } from "../dia";

export default function FechamentoDia({ dia, onFechar, onVoltar }) {
  // Qtds digitadas por denominação (chave = centavos); string pro input.
  const [qtds, setQtds] = useState(() => {
    const m = {};
    for (const c of CEDULAS) m[c] = "";
    for (const mo of MOEDAS) m[mo] = "";
    return m;
  });

  const num = (chave) => {
    const n = Number(qtds[chave]);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };

  const quebra = {
    cedulas: Object.fromEntries(CEDULAS.map((c) => [c, num(c)])),
    moedas: Object.fromEntries(MOEDAS.map((m) => [m, num(m)])),
  };
  const contado = calcularQuebraTotal(quebra);
  const esperado = dia.saldoEsperadoCentavos;
  const dif = contado - esperado;

  function grupo(titulo, lista) {
    return (
      <div className="grupo-quebra" key={titulo}>
        <h3>{titulo}</h3>
        {lista.map((denom) => (
          <div className="quebra-linha" key={denom}>
            <span>{centavosParaReal(denom)}</span>
            <input
              inputMode="numeric"
              value={qtds[denom]}
              onChange={(e) => setQtds((prev) => ({ ...prev, [denom]: e.target.value }))}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    );
  }

  const difRotulo =
    dif === 0
      ? "R$ 0,00 ✔"
      : `${dif > 0 ? "+" : "−"}${centavosParaReal(Math.abs(dif))} ${dif > 0 ? "SOBRA" : "FALTA"}`;

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Fechamento do dia</p>
      </div>
      <div className="overlay-corpo">
        <div className="saldo">
          <p className="saldo-rotulo">Saldo esperado</p>
          <p className="saldo-valor">{centavosParaReal(esperado)}</p>
        </div>

        {grupo("CÉDULAS", CEDULAS)}
        {grupo("MOEDAS", MOEDAS)}

        <div className="confere">
          <div className="confere-linha">
            <span>CONTADO</span>
            <strong>{centavosParaReal(contado)}</strong>
          </div>
          <div className="confere-linha">
            <span>ESPERADO</span>
            <strong>{centavosParaReal(esperado)}</strong>
          </div>
          <div className={`confere-linha ${dif > 0 ? "sobra" : dif < 0 ? "falta" : "dif-zero"}`}>
            <span>DIFERENÇA</span>
            <strong>{difRotulo}</strong>
          </div>
        </div>

        <button className="btn btn-success" onClick={() => onFechar(quebra)}>
          ✔ FECHAR O DIA
        </button>
      </div>
    </div>
  );
}
