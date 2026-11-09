// Formulário de compra — uma tela só: nome (opcional) → material + peso →
// monta a lista de materiais pesados → confirmar ou cancelar. Per regra nova.
// O valor a pagar é calculado ao vivo (peso × preço/kg). Compra NÃO tem desconto.
// Ao finalizar abre um modal de confirmação com o resumo da compra.
// Em modo edição (dia de hoje) vem preenchido com a compra original.
// A pessoa pode vir dos contatos cadastrados ou ser digitada na hora.
import { useState } from "react";
import { centavosParaReal, formatarPeso, parsePeso } from "../dia";
import CampoPessoa from "./CampoPessoa";
import ModalConfirmar from "./ModalConfirmar";

export default function FormCompra({ materiais, contatos = [], onCompra, inicial = null, modoEdicao = false }) {
  const [nome, setNome] = useState(inicial?.pessoa || "");
  const [materialNome, setMaterialNome] = useState(inicial?.itens?.[0]?.material || materiais[0]?.nome || "");
  const [peso, setPeso] = useState("");
  const [pendentes, setPendentes] = useState(() => (inicial ? inicial.itens.map((i) => ({ ...i })) : []));
  const [confirmando, setConfirmando] = useState(false);

  const material = materiais.find((m) => m.nome === materialNome);
  const pesoKg = parsePeso(peso);
  const itemValido = pesoKg > 0 && material != null;
  const totalLista = pendentes.reduce((s, p) => s + p.valorCentavos, 0);

  // Valor exibido ao vivo: peso × preço/kg.
  const valorCentavos =
    material != null && pesoKg > 0 ? Math.round(pesoKg * material.precoPorKgCentavos) : null;

  function adicionarItem() {
    if (!itemValido) return;
    setPendentes((prev) => [
      ...prev,
      {
        material: material.nome,
        pesoKg,
        precoPorKgCentavos: material.precoPorKgCentavos,
        valorCentavos: Math.round(pesoKg * material.precoPorKgCentavos),
      },
    ]);
    // mantém o material selecionado — o mesmo catador costuma trazer vários
    setPeso("");
  }

  function pedirConfirmacao() {
    if (pendentes.length === 0) return;
    setConfirmando(true);
  }

  function finalizar() {
    setConfirmando(false);
    onCompra({ pessoa: nome, itens: pendentes });
    // limpa tudo para a próxima pessoa (na edição o formulário é fechado)
    setNome("");
    setPeso("");
    setPendentes([]);
  }

  return (
    <div>
      <p className="dica">
        {modoEdicao
          ? "Editar a compra: ajuste o nome, os materiais e os pesos. O valor é recalculado sozinho."
          : "Registrar uma compra: digite quem trouxe (opcional), o material e o peso. O valor é calculado sozinho."}
      </p>

      <CampoPessoa
        id="cp-nome"
        label="Nome da pessoa (opcional)"
        placeholder="Ex.: João"
        contatos={contatos}
        inicial={inicial?.pessoa || ""}
        onMudar={setNome}
      />

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
        <strong>{valorCentavos != null ? centavosParaReal(valorCentavos) : "—"}</strong>
        {valorCentavos != null && (
          <div className="valor-calculado-sub">
            = {formatarPeso(pesoKg)} kg × {centavosParaReal(material.precoPorKgCentavos)}/kg
          </div>
        )}
      </div>

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
        {modoEdicao ? "✔ SALVAR COMPRA" : "✔ CONFIRMAR COMPRA"}
      </button>

      {confirmando && (
        <ModalConfirmar
          titulo={modoEdicao ? "Salvar compra" : "Confirmar compra"}
          rotuloBotao={modoEdicao ? "✔ SALVAR COMPRA" : "✔ CONFIRMAR COMPRA"}
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
