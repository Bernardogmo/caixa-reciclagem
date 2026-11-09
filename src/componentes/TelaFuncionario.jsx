// Tela do funcionário: botões grandes (COMPRAS/VENDAS/OUTRAS) como na tela do
// gestor, e o histórico do dia logo abaixo (com edição/exclusão do dia de hoje).
// Sem MATERIAIS/FECHAR O DIA — tabela de preços e fechamento continuam só com o gestor.
import { useState } from "react";
import HistoricoDia from "./HistoricoDia";
import FormCompra from "./FormCompra";
import FormVenda from "./FormVenda";
import FormOutras from "./FormOutras";

export default function TelaFuncionario({
  dia,
  materiais,
  contatos = [],
  onCompra,
  onVenda,
  onOutra,
  onEditar,
  onExcluir,
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
        <FormCompra materiais={lista} contatos={contatos} onCompra={registrarCompra} />
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
        <FormVenda materiais={lista} contatos={contatos} onVenda={registrarVenda} />
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
      </div>

      <h2 className="tela-titulo">Histórico de hoje</h2>
      <HistoricoDia dia={dia} onEditar={onEditar} onExcluir={onExcluir} />
    </>
  );
}
