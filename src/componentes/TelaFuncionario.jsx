// Tela do funcionário: abas HOJE (histórico do dia) / COMPRA / VENDA / OUTRAS.
// Saldo fica sempre no header, acima das abas. Sem MATERIAIS nem FECHAR O DIA —
// tabela de preços e fechamento continuam só com o dono.
import { useState } from "react";
import HistoricoDia from "./HistoricoDia";
import FormCompra from "./FormCompra";
import FormVenda from "./FormVenda";
import FormOutras from "./FormOutras";

export default function TelaFuncionario({ dia, materiais, podeExcluir, onCompra, onVenda, onOutra, onExcluir }) {
  const [aba, setAba] = useState("hoje");
  const lista = materiais.materiais;

  return (
    <>
      <nav className="abas">
        <button className={aba === "hoje" ? "ativa" : ""} onClick={() => setAba("hoje")}>
          HOJE
        </button>
        <button className={aba === "compra" ? "ativa" : ""} onClick={() => setAba("compra")}>
          COMPRA
        </button>
        <button className={aba === "venda" ? "ativa" : ""} onClick={() => setAba("venda")}>
          VENDA
        </button>
        <button className={aba === "outras" ? "ativa" : ""} onClick={() => setAba("outras")}>
          OUTRAS
        </button>
      </nav>

      {aba === "hoje" && <HistoricoDia dia={dia} podeExcluir={podeExcluir} onExcluir={onExcluir} />}
      {aba === "compra" && <FormCompra materiais={lista} onCompra={onCompra} />}
      {aba === "venda" && <FormVenda materiais={lista} onVenda={onVenda} />}
      {aba === "outras" && <FormOutras onOutra={onOutra} />}
    </>
  );
}
