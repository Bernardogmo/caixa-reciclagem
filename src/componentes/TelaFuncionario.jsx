// Tela do funcionário: abas HOJE (histórico do dia) / COMPRA / VENDA.
// Saldo fica sempre no header, acima das abas. Sem OUTRAS/MATERIAIS/FECHAR.
import { useState } from "react";
import HistoricoDia from "./HistoricoDia";
import FormCompra from "./FormCompra";
import FormVenda from "./FormVenda";

export default function TelaFuncionario({ dia, materiais, podeExcluir, onCompra, onVenda, onExcluir }) {
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
      </nav>

      {aba === "hoje" && <HistoricoDia dia={dia} podeExcluir={podeExcluir} onExcluir={onExcluir} />}
      {aba === "compra" && <FormCompra materiais={lista} onCompra={onCompra} />}
      {aba === "venda" && <FormVenda materiais={lista} onVenda={onVenda} />}
    </>
  );
}
