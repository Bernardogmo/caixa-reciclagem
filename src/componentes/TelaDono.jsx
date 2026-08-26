// Tela do dono: grid 2×2 (COMPRAS/VENDAS/OUTRAS/MATERIAIS), ações do dia
// (fechar/dias fechados/reabrir/resumo) e o histórico do dia com exclusão.
// Per esboço aprovado. COMPRAS/VENDAS/OUTRAS trocam a view para o formulário.
import { useState } from "react";
import FormCompra from "./FormCompra";
import FormVenda from "./FormVenda";
import FormOutras from "./FormOutras";
import HistoricoDia from "./HistoricoDia";

export default function TelaDono({
  dia,
  materiais,
  podeExcluir,
  onCompra,
  onVenda,
  onOutra,
  onExcluir,
  onAbrirFechamento,
  onAbrirResumo,
  onAbrirDiasFechados,
  onAbrirMateriais,
  onAbrirBackup,
}) {
  const [view, setView] = useState("grid"); // 'grid' | 'compra' | 'venda' | 'outras'
  const lista = materiais.materiais;

  // Depois de confirmar uma movimentação, volta pra tela inicial (grid de botões).
  function registrarCompra(dados) {
    onCompra(dados);
    setView("grid");
  }
  function registrarVenda(dados) {
    onVenda(dados);
    setView("grid");
  }
  function registrarOutra(dados) {
    onOutra(dados);
    setView("grid");
  }

  if (view === "compra") {
    return (
      <>
        <nav className="abas">
          <button onClick={() => setView("grid")}>← VOLTAR</button>
          <button className="ativa">COMPRA</button>
        </nav>
        <FormCompra materiais={lista} onCompra={registrarCompra} />
      </>
    );
  }

  if (view === "venda") {
    return (
      <>
        <nav className="abas">
          <button onClick={() => setView("grid")}>← VOLTAR</button>
          <button className="ativa">VENDA</button>
        </nav>
        <FormVenda materiais={lista} onVenda={registrarVenda} />
      </>
    );
  }

  if (view === "outras") {
    return (
      <>
        <nav className="abas">
          <button onClick={() => setView("grid")}>← VOLTAR</button>
          <button className="ativa">OUTRAS</button>
        </nav>
        <FormOutras onOutra={registrarOutra} />
      </>
    );
  }

  return (
    <>
      <p className="dica">Escolha o que fazer:</p>
      <div className="grid-acoes">
        <button className="btn btn-primary" onClick={() => setView("compra")}>
          <span className="btn-grande-emoji">🛒</span>
          COMPRAS
        </button>
        <button className="btn btn-primary" onClick={() => setView("venda")}>
          <span className="btn-grande-emoji">💰</span>
          VENDAS
        </button>
        <button className="btn btn-secondary" onClick={() => setView("outras")}>
          <span className="btn-grande-emoji">📋</span>
          OUTRAS
        </button>
        <button className="btn btn-secondary" onClick={onAbrirMateriais}>
          <span className="btn-grande-emoji">🏷️</span>
          MATERIAIS
        </button>
      </div>

      <button className="btn btn-success" onClick={onAbrirFechamento}>
        ✔ FECHAR O DIA
      </button>
      <button className="btn btn-ghost" onClick={onAbrirResumo}>
        📝 Resumo do dia
      </button>
      <button className="btn btn-ghost" onClick={onAbrirDiasFechados}>
        📂 Dias fechados · 🔁 Reabrir
      </button>
      <button className="btn btn-ghost" onClick={onAbrirBackup}>
        💾 Backup · Restaurar
      </button>

      <h2 className="tela-titulo">Histórico do dia</h2>
      <HistoricoDia dia={dia} podeExcluir={podeExcluir} onExcluir={onExcluir} />
    </>
  );
}
