// Campo de pessoa da compra/venda: digitar o nome OU tocar para abrir a lista
// de contatos cadastrados — a lista filtra conforme vai digitando. Nome digitado
// solto continua valendo e não vira contato. Sem contatos cadastrados, vira o
// campo de texto simples de antes.
import { useState } from "react";

// Compara nomes sem acento e sem diferenciar maiúsculas: "joao" acha "João".
// \p{M} remove os acentos que o NFD separa da letra (ex.: "João" → "joao").
function semAcento(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export default function CampoPessoa({ id, label, placeholder, contatos, inicial = "", onMudar }) {
  const [texto, setTexto] = useState(inicial || "");
  const [aberto, setAberto] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  function digitar(evento) {
    const valor = evento.target.value;
    setTexto(valor);
    setMostrarTodos(false);
    setAberto(true);
    onMudar(valor);
  }

  // Ao tocar no campo mostra a lista inteira (útil pra trocar de nome);
  // digitando, a lista filtra.
  function abrirLista() {
    setAberto(true);
    setMostrarTodos(true);
  }

  function escolher(contato) {
    setTexto(contato.nome);
    setAberto(false);
    setMostrarTodos(false);
    onMudar(contato.nome);
  }

  if (contatos.length === 0) {
    return (
      <div className="campo">
        <label htmlFor={id}>{label}</label>
        <input id={id} className="input-grande" placeholder={placeholder} value={texto} onChange={digitar} />
      </div>
    );
  }

  const busca = semAcento(texto.trim());
  const filtrados =
    mostrarTodos || busca === "" ? contatos : contatos.filter((c) => semAcento(c.nome).includes(busca));

  return (
    <div className="campo pessoa-combo">
      <label htmlFor={id}>{label}</label>
      <div className="pessoa-campo">
        <input
          id={id}
          className="input-grande"
          placeholder={placeholder}
          value={texto}
          autoComplete="off"
          onChange={digitar}
          onFocus={abrirLista}
          onClick={abrirLista}
          onBlur={() => setAberto(false)}
          onKeyDown={(e) => e.key === "Escape" && setAberto(false)}
        />
        <span className="pessoa-campo-seta">▾</span>
      </div>
      {aberto && filtrados.length > 0 && (
        <div className="pessoa-opcoes">
          {/* onMouseDown segura o foco no input até o clique chegar (o onBlur fecharia a lista antes). */}
          {filtrados.map((c) => (
            <button
              type="button"
              key={c.id}
              className="pessoa-opcao"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(c)}
            >
              <span className="pessoa-opcao-nome">{c.nome}</span>
              {c.telefone && <span className="pessoa-opcao-telefone">{c.telefone}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
