// Tabela de materiais (só dono): editar nome e preço de COMPRA por kg,
// adicionar e remover. Salvar persiste via onSalvar(lista).
import { useState } from "react";
import { realParaCentavos } from "../dia";

// "5,00" pra edição — centavos → string pt-BR sem R$/espaços.
function centavosParaEdicao(c) {
  return (c / 100).toFixed(2).replace(".", ",");
}

export default function TabelaMateriais({ tabela, onSalvar, onVoltar }) {
  const [linhas, setLinhas] = useState(() =>
    tabela.materiais.map((m) => ({ nome: m.nome, precoStr: centavosParaEdicao(m.precoPorKgCentavos) }))
  );

  function setLinha(idx, campo, valor) {
    setLinhas((prev) => prev.map((l, k) => (k === idx ? { ...l, [campo]: valor } : l)));
  }

  const valido = linhas.every((l) => {
    const c = realParaCentavos(l.precoStr);
    return l.nome.trim() !== "" && Number.isFinite(c) && c >= 0;
  });

  function salvar() {
    if (!valido) return;
    onSalvar(linhas.map((l) => ({ nome: l.nome.trim(), precoPorKgCentavos: realParaCentavos(l.precoStr) })));
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Tabela de materiais</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">Defina o preço (R$) que o galpão paga por 1 kg de cada material.</p>
        {linhas.map((l, idx) => (
          <div className="mat-linha" key={idx}>
            <input value={l.nome} onChange={(e) => setLinha(idx, "nome", e.target.value)} placeholder="Material" />
            <input
              inputMode="decimal"
              value={l.precoStr}
              onChange={(e) => setLinha(idx, "precoStr", e.target.value)}
              placeholder="0,00"
            />
            <button
              className="mat-excluir"
              disabled={linhas.length === 1}
              onClick={() => setLinhas((prev) => prev.filter((_, k) => k !== idx))}
            >
              ✕
            </button>
          </div>
        ))}
        <button className="btn btn-ghost" onClick={() => setLinhas((prev) => [...prev, { nome: "", precoStr: "" }])}>
          + ADICIONAR MATERIAL
        </button>
        <button className="btn btn-primary" disabled={!valido} onClick={salvar}>
          SALVAR
        </button>
      </div>
    </div>
  );
}
