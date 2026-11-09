// Resumo do dia + "📋 Copiar texto" (clipboard com fallback execCommand) e os
// PDFs (do dia e, quando fechado, o relatório de fechamento com as contagens).
// Texto gerado por gerarTextoResumo — formato pronto pro WhatsApp.
import { useState } from "react";
import { centavosParaReal, gerarTextoResumo, pessoasDoDia, recalcular } from "../dia";
import { gerarPdfDia, gerarPdfFechamento } from "../pdf";

export default function ResumoDia({ dia, onVoltar }) {
  const texto = gerarTextoResumo(dia);
  const r = recalcular(dia);
  const fechado = r.quebraDeCaixa != null;
  const dif = fechado ? r.diferencaCentavos : null;
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const ta = document.createElement("textarea");
        ta.value = texto;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
      }
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (e) {
      console.warn("Clipboard indisponível", e);
    }
  }

  const difRotulo =
    dif == null
      ? "em aberto"
      : dif === 0
        ? "R$ 0,00 ✔"
        : `${dif > 0 ? "+" : "−"}${centavosParaReal(Math.abs(dif))} ${dif > 0 ? "SOBRA" : "FALTA"}`;

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Resumo do dia</p>
      </div>
      <div className="overlay-corpo">
        <div className={`resumo-destaque ${dif == null ? "" : dif > 0 ? "sobra" : dif < 0 ? "falta" : "dif-zero"}`}>
          <span>DIFERENÇA</span>
          <strong>{difRotulo}</strong>
        </div>

        {/* Cards: compras/vendas de cada pessoa registrada no dia. */}
        {pessoasDoDia(dia).map((p) => (
          <div className="pessoa-card" key={p.pessoa || "__anonimo__"}>
            <div className="pessoa-card-titulo">
              <div className={p.pessoa ? "pessoa-card-nome" : "pessoa-card-anonimo"}>{p.pessoa || "Sem nome"}</div>
              <div className="pessoa-card-totais">
                {p.totalComprasCentavos > 0 && `🛒 Compras ${centavosParaReal(p.totalComprasCentavos)} (${p.compras.length})`}
                {p.totalComprasCentavos > 0 && p.totalVendasCentavos > 0 && " · "}
                {p.totalVendasCentavos > 0 && `💰 Vendas ${centavosParaReal(p.totalVendasCentavos)} (${p.vendas.length})`}
              </div>
            </div>
            {p.compras.map((m) => (
              <div className="pessoa-card-linha" key={m.id}>
                <span>🛒 {m.itens.map((i) => i.material).join(" + ")}</span>
                <span>{centavosParaReal(m.totalCentavos)}</span>
              </div>
            ))}
            {p.vendas.map((m) => (
              <div className="pessoa-card-linha" key={m.id}>
                <span>💰 {m.itens.map((i) => i.material).join(" + ")}</span>
                <span>{centavosParaReal(m.totalCentavos)}</span>
              </div>
            ))}
          </div>
        ))}

        <pre className="resumo-texto">{texto}</pre>
        <p className="dica">Toque em &apos;Copiar texto&apos; para enviar o resumo do dia pelo WhatsApp.</p>
        <button className="btn btn-primary" onClick={copiar}>
          {copiado ? "✔ Copiado!" : "📋 Copiar texto"}
        </button>

        {/* PDFs gerados no aparelho (jsPDF) — funcionam sem internet. */}
        <button className="btn btn-secondary" onClick={() => gerarPdfDia(r)}>
          📄 PDF do dia
        </button>
        {fechado && (
          <button className="btn btn-secondary" onClick={() => gerarPdfFechamento(r)}>
            📄 Relatório de fechamento
          </button>
        )}
        <p className="dica">
          O PDF é salvo nos arquivos do aparelho.
          {fechado ? " O relatório de fechamento inclui a contagem das cédulas e moedas." : ""}
        </p>
      </div>
    </div>
  );
}
