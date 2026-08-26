// Fechamento do dia: quebra de caixa (qtd por cédula/moeda), CONTADO/ESPERADO/
// DIFERENÇA ao vivo e FECHAR O DIA. A grade é a mesma da abertura do dia.
import { useState } from "react";
import { calcularQuebraTotal, centavosParaReal, quantidadesVazias, quebraDeQuantidades } from "../dia";
import QuebraDeCaixa from "./QuebraDeCaixa";

export default function FechamentoDia({ dia, onFechar, onVoltar }) {
  // Qtds digitadas por denominação (chave = centavos); string pro input.
  const [qtds, setQtds] = useState(quantidadesVazias);

  const quebra = quebraDeQuantidades(qtds);
  const contado = calcularQuebraTotal(quebra);
  const esperado = dia.saldoEsperadoCentavos;
  const dif = contado - esperado;

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
        <p className="dica">Conte o dinheiro que está na bolsa agora e lance a quantidade de cada cédula e moeda. O aplicativo compara com o que deveria ter.</p>

        <div className="saldo">
          <p className="saldo-rotulo">Saldo esperado</p>
          <p className="saldo-valor">{centavosParaReal(esperado)}</p>
        </div>

        <QuebraDeCaixa qtds={qtds} onMudar={(denom, valor) => setQtds((prev) => ({ ...prev, [denom]: valor }))} />

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

        <p className="dica">Sobra: tem mais do que deveria. Falta: tem menos.</p>

        <button className="btn btn-success" onClick={() => onFechar(quebra)}>
          ✔ FECHAR O DIA
        </button>
      </div>
    </div>
  );
}
