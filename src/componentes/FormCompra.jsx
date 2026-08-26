// Formulário de compra — uma tela só: nome (opcional) → material/peso/desconto
// → monta a lista de materiais pesados → confirmar ou cancelar. Per regra nova.
// O valor a pagar é calculado ao vivo (peso × preço/kg); o desconto é opcional.
// Ao finalizar abre um modal de confirmação com o resumo da compra.
import { useState } from "react";
import { calcularCompra, centavosParaReal, formatarPeso, parsePeso, realParaCentavos } from "../dia";
import ModalConfirmar from "./ModalConfirmar";

export default function FormCompra({ materiais, onCompra }) {
  const [nome, setNome] = useState("");
  const [materialNome, setMaterialNome] = useState(materiais[0]?.nome || "");
  const [peso, setPeso] = useState("");
  const [desconto, setDesconto] = useState("");
  const [pendentes, setPendentes] = useState([]);
  const [confirmando, setConfirmando] = useState(false);

  const material = materiais.find((m) => m.nome === materialNome);
  const pesoKg = parsePeso(peso);
  const descCentavos = realParaCentavos(desconto);
  const descontoValido = Number.isFinite(descCentavos) ? descCentavos : 0;
  const itemValido = pesoKg > 0 && material != null;
  const totalLista = pendentes.reduce((s, p) => s + p.valorCentavos, 0);

  // Valor bruto exibido ao vivo, sem desconto — o desconto abate depois.
  const valorBrutoCentavos =
    material != null && pesoKg > 0 ? Math.round(pesoKg * material.precoPorKgCentavos) : null;

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

  function pedirConfirmacao() {
    if (pendentes.length === 0) return;
    setConfirmando(true);
  }

  function finalizar() {
    setConfirmando(false);
    onCompra({ pessoa: nome, itens: pendentes });
    // limpa tudo para a próxima pessoa
    setNome("");
    setPeso("");
    setDesconto("");
    setPendentes([]);
  }

  return (
    <div>
      <p className="dica">Registrar uma compra: digite quem trouxe (opcional), o material e o peso. O valor é calculado sozinho.</p>

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

      <div className="valor-calculado">
        <div className="valor-calculado-rotulo">VALOR A PAGAR</div>
        <strong>{valorBrutoCentavos != null ? centavosParaReal(valorBrutoCentavos) : "—"}</strong>
        {valorBrutoCentavos != null && (
          <div className="valor-calculado-sub">
            = {formatarPeso(pesoKg)} kg × {centavosParaReal(material.precoPorKgCentavos)}/kg
          </div>
        )}
      </div>

      {/* Campo de desconto oculto por enquanto — analisar a função depois.
          A lógica continua ativa (adicionarItem aplica descontoCentavos); com o campo
          escondido o valor fica sempre 0. Para voltar a exibir, é só descomentar. */}
      {/* <div className="campo">
        <label htmlFor="cp-desc">Desconto (opcional)</label>
        <input
          id="cp-desc"
          className="input-grande"
          inputMode="decimal"
          placeholder="0,00"
          value={desconto}
          onChange={(e) => setDesconto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionarItem()}
        />
      </div> */}

      <button className="btn btn-secondary" disabled={!itemValido} onClick={adicionarItem}>
        + ADICIONAR À LISTA
      </button>
      <p className="dica">Adicione os materiais um a um. Quando terminar, toque em &apos;Confirmar compra&apos;.</p>

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

      <button className="btn btn-primary" disabled={pendentes.length === 0} onClick={pedirConfirmacao}>
        ✔ CONFIRMAR COMPRA
      </button>

      {confirmando && (
        <ModalConfirmar
          titulo="Confirmar compra"
          rotuloBotao="✔ CONFIRMAR COMPRA"
          onConfirmar={finalizar}
          onCancelar={() => setConfirmando(false)}
        >
          {nome.trim() !== "" && (
            <div className="modal-resumo-pessoa">
              Compra de <strong>{nome}</strong>
            </div>
          )}
          <div className="modal-resumo">
            {pendentes.map((p, idx) => (
              <div className="modal-resumo-linha" key={idx}>
                <div className="modal-resumo-desc">
                  {p.material} — {formatarPeso(p.pesoKg)} kg × {centavosParaReal(p.precoPorKgCentavos)}/kg
                  {p.descontoCentavos ? ` (desconto ${centavosParaReal(p.descontoCentavos)})` : ""}
                </div>
                <div className="modal-resumo-valor">{centavosParaReal(p.valorCentavos)}</div>
              </div>
            ))}
          </div>
          <div className="total-ao-vivo">
            <span>TOTAL</span>
            <strong>{centavosParaReal(totalLista)}</strong>
          </div>
        </ModalConfirmar>
      )}
    </div>
  );
}
