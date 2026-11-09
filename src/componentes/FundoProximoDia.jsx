// Saldo remanescente do dia anterior: definido pelo gestor depois do fechamento —
// o dinheiro que vai ficar na bolsa para começar o próximo dia. A grade já vem
// preenchida com a contagem do fechamento; o gestor ajusta se quiser deixar outra
// quantia.
import { useState } from "react";
import {
  calcularQuebraTotal,
  centavosParaReal,
  formatarDataCurta,
  quantidadesDeQuebra,
  quebraDeQuantidades,
} from "../dia";
import QuebraDeCaixa from "./QuebraDeCaixa";

export default function FundoProximoDia({ quebraInicial, origemData, onDefinir, onPular }) {
  const [qtds, setQtds] = useState(() => quantidadesDeQuebra(quebraInicial));

  const quebra = quebraDeQuantidades(qtds);
  const total = calcularQuebraTotal(quebra);

  return (
    <div className="overlay">
      <div className="overlay-header">
        <p className="overlay-titulo">Saldo remanescente do dia anterior</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">O dia foi fechado. Confirme o saldo remanescente que vai ficar na bolsa para começar o próximo dia.</p>
        <p className="dica">
          Já vem preenchido com a contagem do fechamento{origemData ? ` de ${formatarDataCurta(origemData)}` : ""}. Ajuste se
          quiser deixar outra quantia.
        </p>

        <QuebraDeCaixa qtds={qtds} onMudar={(denom, valor) => setQtds((prev) => ({ ...prev, [denom]: valor }))} />

        <div className="confere">
          <div className="confere-linha">
            <span>SALDO REMANESCENTE DO DIA ANTERIOR</span>
            <strong>{centavosParaReal(total)}</strong>
          </div>
        </div>

        <button className="btn btn-success" onClick={() => onDefinir(quebra)}>
          ✔ TRANSFERIR SALDO — {centavosParaReal(total)}
        </button>
        <button className="btn btn-ghost" onClick={onPular}>
          ✕ AGORA NÃO
        </button>
      </div>
    </div>
  );
}
