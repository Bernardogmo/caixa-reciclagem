// Grade de quantidade por cédula e moeda. Usada na abertura do dia (conta o que
// entrou na bolsa) e no fechamento (conta o que sobrou) — mesma cara nas duas.
// Controlado: quem chama é dono do estado das quantidades.
import { CEDULAS, MOEDAS, centavosParaReal } from "../dia";

export default function QuebraDeCaixa({ qtds, onMudar }) {
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
              onChange={(e) => onMudar(denom, e.target.value)}
              placeholder="0"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {grupo("CÉDULAS", CEDULAS)}
      {grupo("MOEDAS", MOEDAS)}
    </>
  );
}
