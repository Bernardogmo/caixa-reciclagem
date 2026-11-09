// Abertura do dia: a mesma quebra de caixa do fechamento. Conta cédula e moeda,
// o total vira o caixa inicial. Guardar a quebra deixa registrado o que ficou na
// bolsa — dá pra conferir depois de que notas era o dinheiro do início.
// Se o gestor transferiu o saldo remanescente do dia anterior no fechamento,
// a grade já vem preenchida com ele (e com a dica de onde veio).
import { useState } from "react";
import {
  calcularQuebraTotal,
  centavosParaReal,
  formatarDataCurta,
  quantidadesDeQuebra,
  quantidadesVazias,
  quebraDeQuantidades,
} from "../dia";
import QuebraDeCaixa from "./QuebraDeCaixa";

export default function AberturaDia({ onAbrir, fundo, sugestaoFundo, onDefinirFundo }) {
  const [qtds, setQtds] = useState(() => (fundo ? quantidadesDeQuebra(fundo.quebra) : quantidadesVazias()));

  const quebra = quebraDeQuantidades(qtds);
  const total = calcularQuebraTotal(quebra);

  return (
    <main className="app-main">
      <h1 className="tela-titulo">Abrir o dia</h1>
      {fundo ? (
        <p className="dica">
          Saldo transferido do fechamento{fundo.origemData ? ` de ${formatarDataCurta(fundo.origemData)}` : ""}. Confira
          as quantidades e abra o dia.
        </p>
      ) : (
        <>
          <p className="dica">Conte o dinheiro da bolsa e lance quantas de cada.</p>
          <p className="dica">Assim o aplicativo sabe quanto dinheiro tem no caixa no começo do dia.</p>
        </>
      )}

      {sugestaoFundo && !fundo && (
        <button className="btn btn-secondary" onClick={onDefinirFundo}>
          <span className="btn-grande-emoji">💵</span>
          TRANSFERIR O SALDO REMANESCENTE DO DIA ANTERIOR
        </button>
      )}

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
