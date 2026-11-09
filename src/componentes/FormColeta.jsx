// Formulário de coleta do shopping: dia + material + peso (kg), monta a lista
// e confirma. Não mostra dinheiro — o valor do contrato é calculado no fechamento
// do mês. Usado só em mês aberto.
import { useState } from "react";
import { formatarPeso, hojeISO, parsePeso } from "../dia";
import { primeiroDiaDoMes, ultimoDiaDoMes } from "../shopping";
import ModalConfirmar from "./ModalConfirmar";

function dataPadraoNoMes(mes) {
  const hoje = hojeISO();
  return hoje.slice(0, 7) === mes ? hoje : primeiroDiaDoMes(mes);
}

export default function FormColeta({ mes, materiais, onRegistrar, onCancelar }) {
  const [data, setData] = useState(() => dataPadraoNoMes(mes));
  const [materialNome, setMaterialNome] = useState(materiais[0]?.nome || "");
  const [peso, setPeso] = useState("");
  const [pendentes, setPendentes] = useState([]);
  const [confirmando, setConfirmando] = useState(false);

  const pesoKg = parsePeso(peso);
  const itemValido = pesoKg > 0 && materialNome !== "" && data !== "";
  const kgLista = pendentes.reduce((s, p) => s + p.pesoKg, 0);

  function adicionarItem() {
    if (!itemValido) return;
    setPendentes((prev) => [...prev, { data, material: materialNome, pesoKg }]);
    // mantém o material selecionado — a coleta do shopping costuma repetir
    setPeso("");
  }

  function pedirConfirmacao() {
    if (pendentes.length === 0) return;
    setConfirmando(true);
  }

  function finalizar() {
    setConfirmando(false);
    onRegistrar(pendentes);
  }

  return (
    <div>
      <p className="dica">Registrar uma coleta: escolha o dia, o material e o peso. Não precisa de valor.</p>

      <div className="campo">
        <label htmlFor="sh-data">Dia da coleta</label>
        <input
          id="sh-data"
          className="input-grande"
          type="date"
          value={data}
          min={primeiroDiaDoMes(mes)}
          max={ultimoDiaDoMes(mes)}
          onChange={(e) => setData(e.target.value)}
        />
      </div>

      <div className="campo">
        <label htmlFor="sh-mat">Material</label>
        <select
          id="sh-mat"
          className="select-grande"
          value={materialNome}
          onChange={(e) => setMaterialNome(e.target.value)}
        >
          {materiais.map((m) => (
            <option key={m.nome} value={m.nome}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="sh-peso">Peso (kg)</label>
        <input
          id="sh-peso"
          className="input-grande"
          inputMode="decimal"
          placeholder="Ex.: 12,5"
          value={peso}
          onChange={(e) => setPeso(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && adicionarItem()}
        />
      </div>

      <button className="btn btn-secondary" disabled={!itemValido} onClick={adicionarItem}>
        + ADICIONAR À LISTA
      </button>
      <p className="dica">Adicione os materiais um a um. Quando terminar, toque em &apos;Confirmar coleta&apos;.</p>

      {pendentes.map((p, idx) => (
        <div className="item-compra" key={idx}>
          <div className="item-compra-desc">{p.material}</div>
          <div className="item-compra-valor">{formatarPeso(p.pesoKg)} kg</div>
          <div className="item-compra-sub">{p.data.split("-").reverse().join("/")}</div>
          <button
            className="item-compra-remover"
            onClick={() => setPendentes((prev) => prev.filter((_, k) => k !== idx))}
          >
            ✕ Remover
          </button>
        </div>
      ))}

      <div className="total-ao-vivo">
        <span>TOTAL DE KG</span>
        <strong>{formatarPeso(kgLista)} kg</strong>
      </div>

      <button className="btn btn-primary" disabled={pendentes.length === 0} onClick={pedirConfirmacao}>
        ✔ CONFIRMAR COLETA
      </button>
      <button className="btn btn-ghost" onClick={onCancelar}>
        Cancelar
      </button>

      {confirmando && (
        <ModalConfirmar
          titulo="Confirmar coleta"
          rotuloBotao="✔ CONFIRMAR COLETA"
          onConfirmar={finalizar}
          onCancelar={() => setConfirmando(false)}
        >
          <div className="modal-resumo">
            {pendentes.map((p, idx) => (
              <div className="modal-resumo-linha" key={idx}>
                <div className="modal-resumo-desc">
                  {p.data.split("-").reverse().join("/")} — {p.material}
                </div>
                <div className="modal-resumo-valor">{formatarPeso(p.pesoKg)} kg</div>
              </div>
            ))}
          </div>
          <div className="total-ao-vivo">
            <span>TOTAL DE KG</span>
            <strong>{formatarPeso(kgLista)} kg</strong>
          </div>
        </ModalConfirmar>
      )}
    </div>
  );
}
