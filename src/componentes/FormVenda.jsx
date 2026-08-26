// Formulário de venda: 1+ itens (material/descrição + quantidade + valor)
// + ajuste no total. Total ao vivo via calcularVenda. Per esboço aprovado.
// Ao finalizar abre um modal de confirmação com o resumo da venda.
import { useState } from "react";
import { calcularVenda, centavosParaReal, realParaCentavos } from "../dia";
import ModalConfirmar from "./ModalConfirmar";

function itemVazio() {
  return { material: "", quantidade: "", valor: "" };
}

export default function FormVenda({ materiais, onVenda }) {
  const [itens, setItens] = useState([itemVazio()]);
  const [pessoa, setPessoa] = useState("");
  const [ajuste, setAjuste] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [dadosConfirmar, setDadosConfirmar] = useState(null);

  // Cada item: valor é o TOTAL do item (R$), quantidade é texto livre ("80 kg").
  const itensCent = itens.map((i) => {
    const v = realParaCentavos(i.valor);
    return { ...i, valorCentavos: Number.isFinite(v) && v >= 0 ? v : 0 };
  });
  const ajusteCentavos = (() => {
    const v = realParaCentavos(ajuste);
    return Number.isFinite(v) ? v : 0;
  })();
  const totalCentavos = calcularVenda(itensCent, ajusteCentavos);

  const valido = itensCent.some((i) => i.material.trim() !== "" && i.valorCentavos > 0);

  function setItem(idx, campo, valor) {
    setItens((prev) => prev.map((i, k) => (k === idx ? { ...i, [campo]: valor } : i)));
  }

  function pedirConfirmacao() {
    if (!valido) return;
    setDadosConfirmar({
      pessoa,
      itens: itensCent
        .filter((i) => i.material.trim() !== "" && i.valorCentavos > 0)
        .map((i) => ({ material: i.material.trim(), quantidade: i.quantidade.trim(), valorCentavos: i.valorCentavos })),
      ajusteTotalCentavos: ajusteCentavos,
      totalCentavos,
    });
    setConfirmando(true);
  }

  function finalizar() {
    setConfirmando(false);
    onVenda({
      pessoa: dadosConfirmar.pessoa,
      itens: dadosConfirmar.itens,
      ajusteTotalCentavos: dadosConfirmar.ajusteTotalCentavos,
    });
    setItens([itemVazio()]);
    setPessoa("");
    setAjuste("");
    setDadosConfirmar(null);
  }

  return (
    <div>
      <p className="dica">Registre a venda: o material, a quantidade (opcional) e o valor recebido. Para mais de um item, toque em &apos;Adicionar item&apos;.</p>

      <div className="campo">
        <label htmlFor="ven-nome">Nome do comprador (opcional)</label>
        <input
          id="ven-nome"
          className="input-grande"
          placeholder="Ex.: Recicle Bem"
          value={pessoa}
          onChange={(e) => setPessoa(e.target.value)}
        />
      </div>

      {itens.map((item, idx) => (
        <div className="item-venda" key={idx}>
          <div className="item-venda-titulo">
            <span>ITEM {idx + 1}</span>
            <button disabled={itens.length === 1} onClick={() => setItens((prev) => prev.filter((_, k) => k !== idx))}>
              ✕ Remover
            </button>
          </div>

          <div className="campo">
            <label htmlFor={`ven-mat-${idx}`}>Material / descrição</label>
            <input
              id={`ven-mat-${idx}`}
              className="input-grande"
              list="lista-materiais"
              placeholder="Ex.: Papelão"
              value={item.material}
              onChange={(e) => setItem(idx, "material", e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor={`ven-qtd-${idx}`}>Quantidade (opcional)</label>
            <input
              id={`ven-qtd-${idx}`}
              className="input-grande"
              inputMode="text"
              placeholder="Ex.: 80 kg"
              value={item.quantidade}
              onChange={(e) => setItem(idx, "quantidade", e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor={`ven-valor-${idx}`}>Valor (R$)</label>
            <input
              id={`ven-valor-${idx}`}
              className="input-grande"
              inputMode="decimal"
              placeholder="0,00"
              value={item.valor}
              onChange={(e) => setItem(idx, "valor", e.target.value)}
            />
          </div>
        </div>
      ))}

      <button
        className="btn btn-ghost"
        onClick={() => setItens((prev) => [...prev, itemVazio()])}
      >
        + Adicionar item
      </button>

      <datalist id="lista-materiais">
        {materiais.map((m) => (
          <option key={m.nome} value={m.nome} />
        ))}
      </datalist>

      <div className="campo">
        <label htmlFor="ven-ajuste">Ajuste no total (R$) — opcional</label>
        <input
          id="ven-ajuste"
          className="input-grande"
          inputMode="decimal"
          placeholder="0,00 (ou -2,00 de desconto)"
          value={ajuste}
          onChange={(e) => setAjuste(e.target.value)}
        />
      </div>

      <div className="total-ao-vivo">
        <span>TOTAL</span>
        <strong>{centavosParaReal(totalCentavos)}</strong>
      </div>

      <button className="btn btn-primary" disabled={!valido} onClick={pedirConfirmacao}>
        ✔ CONFIRMAR VENDA
      </button>

      {confirmando && dadosConfirmar && (
        <ModalConfirmar
          titulo="Confirmar venda"
          rotuloBotao="✔ CONFIRMAR VENDA"
          onConfirmar={finalizar}
          onCancelar={() => {
            setConfirmando(false);
            setDadosConfirmar(null);
          }}
        >
          {dadosConfirmar.pessoa.trim() !== "" && (
            <div className="modal-resumo-pessoa">
              Venda para <strong>{dadosConfirmar.pessoa}</strong>
            </div>
          )}
          <div className="modal-resumo">
            {dadosConfirmar.itens.map((i, idx) => (
              <div className="modal-resumo-linha" key={idx}>
                <div className="modal-resumo-desc">
                  {i.material}
                  {i.quantidade ? ` — ${i.quantidade}` : ""}
                </div>
                <div className="modal-resumo-valor">{centavosParaReal(i.valorCentavos)}</div>
              </div>
            ))}
            {dadosConfirmar.ajusteTotalCentavos !== 0 && (
              <div className="modal-resumo-linha">
                <div className="modal-resumo-desc">Ajuste no total</div>
                <div className="modal-resumo-valor">{centavosParaReal(dadosConfirmar.ajusteTotalCentavos)}</div>
              </div>
            )}
          </div>
          <div className="total-ao-vivo">
            <span>TOTAL</span>
            <strong>{centavosParaReal(dadosConfirmar.totalCentavos)}</strong>
          </div>
        </ModalConfirmar>
      )}
    </div>
  );
}
