// Cadastro de contatos (só gestor): catadores e clientes com nome + telefone
// opcional. A lista serve de atalho na compra/venda; nome digitado solto lá
// não entra aqui — só o que for cadastrado nesta tela.
import { useState } from "react";
import { novoContato } from "../contatos";

function semNomesRepetidos(linhas) {
  const nomes = linhas.map((l) => l.nome.trim().toLowerCase()).filter(Boolean);
  return new Set(nomes).size === nomes.length;
}

export default function Contatos({ contatos, onSalvar, onVoltar }) {
  const [linhas, setLinhas] = useState(() => contatos.map((c) => ({ ...c })));

  function setLinha(idx, campo, valor) {
    setLinhas((prev) => prev.map((l, k) => (k === idx ? { ...l, [campo]: valor } : l)));
  }

  const todosComNome = linhas.every((l) => l.nome.trim() !== "");
  const nomesUnicos = semNomesRepetidos(linhas);
  const valido = todosComNome && nomesUnicos;

  function salvar() {
    if (!valido) return;
    onSalvar(
      linhas.map((l) =>
        l.id
          ? { id: l.id, nome: l.nome.trim(), telefone: l.telefone.trim() }
          : novoContato(l.nome, l.telefone)
      )
    );
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Contatos</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">
          Cadastre os catadores e clientes que mais aparecem. Na compra e na venda dá para escolher o nome daqui.
        </p>

        {linhas.length === 0 && <p className="vazio">Nenhum contato cadastrado.</p>}

        {linhas.map((l, idx) => (
          <div className="mat-linha contato-linha" key={idx}>
            <input
              value={l.nome}
              onChange={(e) => setLinha(idx, "nome", e.target.value)}
              placeholder="Nome"
            />
            <input
              inputMode="tel"
              value={l.telefone}
              onChange={(e) => setLinha(idx, "telefone", e.target.value)}
              placeholder="Telefone"
            />
            <button className="mat-excluir" onClick={() => setLinhas((prev) => prev.filter((_, k) => k !== idx))}>
              ✕
            </button>
          </div>
        ))}

        {!todosComNome && <p className="backup-alerta">Todo contato precisa de um nome.</p>}
        {todosComNome && !nomesUnicos && (
          <p className="backup-alerta">Tem dois contatos com o mesmo nome — mude um deles.</p>
        )}

        <button className="btn btn-ghost" onClick={() => setLinhas((prev) => [...prev, { nome: "", telefone: "" }])}>
          + ADICIONAR CONTATO
        </button>
        <button className="btn btn-primary" disabled={!valido} onClick={salvar}>
          SALVAR
        </button>
        <p className="dica">
          O telefone é opcional. Nome digitado na hora da compra ou da venda não entra nesta lista.
        </p>
      </div>
    </div>
  );
}
