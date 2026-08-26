// Abertura do dia: a mesma quebra de caixa do fechamento. Conta cédula e moeda,
// o total vira o caixa inicial. Guardar a quebra deixa registrado o que ficou na
// bolsa — dá pra conferir depois de que notas era o dinheiro do início.
import { useState } from "react";
import { calcularQuebraTotal, centavosParaReal, quantidadesVazias, quebraDeQuantidades } from "../dia";
import QuebraDeCaixa from "./QuebraDeCaixa";

export default function AberturaDia({ onAbrir }) {
  const [qtds, setQtds] = useState(quantidadesVazias);

  const quebra = quebraDeQuantidades(qtds);
  const total = calcularQuebraTotal(quebra);

  return (
    <main className="app-main">
      <h1 className="tela-titulo">Abrir o dia</h1>
      <p className="dica">Conte o dinheiro da bolsa e lance quantas de cada.</p>
      <p className="dica">Assim o aplicativo sabe quanto dinheiro tem no caixa no começo do dia.</p>

      <QuebraDeCaixa qtds={qtds} onMudar={(denom, valor) => setQtds((prev) => ({ ...prev, [denom]: valor }))} />

      <div className="confere">
        <div className="confere-linha">
          <span>CAIXA INICIAL</span>
          <strong>{centavosParaReal(total)}</strong>
        </div>
      </div>

      <button className="btn btn-success" onClick={() => onAbrir(total, quebra)}>
        ✔ ABRIR O DIA — {centavosParaReal(total)}
      </button>
    </main>
  );
}
