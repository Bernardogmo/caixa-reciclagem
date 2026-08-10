// Formulário de compra — uma tela só: nome (opcional) → material/peso/desconto
// → monta a lista de materiais pesados → confirmar ou cancelar. Per regra nova.
import { useState } from "react";
import { calcularCompra, centavosParaReal, formatarPeso, parsePeso, realParaCentavos } from "../dia";

export default function FormCompra({ materiais, onCompra }) {
  const [nome, setNome] = useState("");
  const [materialNome, setMaterialNome] = useState(materiais[0]?.nome || "");
  const [peso, setPeso] = useState("");
  const [desconto, setDesconto] = useState("");
  const [pendentes, setPendentes] = useState([]);

  const material = materiais.find((m) => m.nome === materialNome);
  const pesoKg = parsePeso(peso);
  const descCentavos = realParaCentavos(desconto);
  const descontoValido = Number.isFinite(descCentavos) ? descCentavos : 0;
  const itemValido = pesoKg > 0 && material != null;
  const totalLista = pendentes.reduce((s, p) => s + p.valorCentavos, 0);

  function adicionarItem() {
    if (!itemValido) return;
    setPendentes((prev) => [
      ...prev,
      {
        material: material.nome,
        pesoKg,
        precoPorKgCentavos: material.precoPorKgCentavos,
        descontoCentavos: descontoValido,
        valorCentavos: calcularCompra({ pesoKg, precoPorKgCentavos: material.precoPorKgCentavos, descontoCentavos: descontoValido }),
      },
    ]);
    // mantém o material selecionado — o mesmo catador costuma trazer vários
    setPeso("");
    setDesconto("");
  }

  function confirmar() {
    if (pendentes.length === 0) return;
    onCompra({ pessoa: nome, itens: pendentes });
    // limpa tudo para a próxima pessoa
    setNome("");
    setPeso("");
    setDesconto("");
    setPendentes([]);
  }

  function cancelar() {
    setNome("");
    setPeso("");
    setDesconto("");
    setPendentes([]);
  }

  return (
    <div>
      <div className="campo">
        <label htmlFor="cp-nome">Nome da pessoa (opcional)</label>
        <input
          id="cp-nome"
          className="input-grande"
          placeholder="Ex.: João"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="cp-mat">Material</label>
        <select
          id="cp-mat"
          className="select-grande"
          value={materialNome}
          onChange={(e) => setMaterialNome(e.target.value)}
        >
          {materiais.map((m) => (
            <option key={m.nome} value={m.nome}>
              {m.nome} — {centavosParaReal(m.precoPorKgCentavos)}/kg
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="cp-peso">Peso (kg)</label>
        <input
          id="cp-peso"
          className="input-grande"
          inputMode="decimal"
          placeholder="Ex.: 2,3"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionarItem()}
        />
      </div>

      <div className="campo">
        <label htmlFor="cp-desc">Desconto (R$) — opcional</label>
        <input
          id="cp-desc"
          className="input-grande"
          inputMode="decimal"
          placeholder="0,00"
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionarItem()}
        />
      </div>

      <button className="btn btn-secondary" disabled={!itemValido} onClick={adicionarItem}>
        + ADICIONAR À LISTA
      </button>

      {pendentes.map((p, idx) => (
        <div className="item-compra" key={idx}>
          <div className="item-compra-desc">{p.material}</div>
          <div className="item-compra-valor">{centavosParaReal(p.valorCentavos)}</div>
          <div className="item-compra-sub">
            {formatarPeso(p.pesoKg)} kg × {centavosParaReal(p.precoPorKgCentavos)}/kg
            {p.descontoCentavos ? ` (desconto ${centavosParaReal(p.descontoCentavos)})` : ""}
          </div>
          <button
            className="item-compra-remover"
            onClick={() => setPendentes((prev) => prev.filter((_, k) => k !== idx))}
          >
            ✕ Remover
          </button>
        </div>
      ))}

      <div className="total-ao-vivo">
        <span>TOTAL</span>
        <strong>{centavosParaReal(totalLista)}</strong>
      </div>

      <button className="btn btn-primary" disabled={pendentes.length === 0} onClick={confirmar}>
        ✔ CONFIRMAR COMPRA
      </button>
      <button className="btn btn-ghost" onClick={cancelar}>
        ✕ CANCELAR
      </button>
    </div>
  );
}
