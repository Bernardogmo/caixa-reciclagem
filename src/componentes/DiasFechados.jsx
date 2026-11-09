// Lista de dias fechados (data + diferença). O dia inteiro é o alvo de toque
// pra abrir o resumo. Dia fechado não reabre: é registro definitivo.
import { centavosParaReal, formatarData } from "../dia";

export default function DiasFechados({ dias, onAbrir, onVoltar }) {
  function rotulo(d) {
    const dif = d.diferencaCentavos;
    if (dif == null) return "—";
    if (dif === 0) return "R$ 0,00 ✔";
    return `${dif > 0 ? "+" : "−"}${centavosParaReal(Math.abs(dif))} ${dif > 0 ? "SOBRA" : "FALTA"}`;
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Dias fechados</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">Toque em um dia para ver o resumo.</p>
        {dias.length === 0 && <p className="vazio">Nenhum dia fechado ainda.</p>}
        {dias.map((d) => (
          <div className="dia-fechado" key={d.data}>
            <button className="dia-fechado-abrir" onClick={() => onAbrir(d.data)}>
              <span className="dia-fechado-data">{formatarData(d.data)}</span>
              <span
                className={`dia-fechado-dif ${
                  d.diferencaCentavos == null ? "" : d.diferencaCentavos === 0 ? "dif-zero" : d.diferencaCentavos > 0 ? "sobra" : "falta"
                }`}
              >
                {rotulo(d)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
