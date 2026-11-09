// ===== Contatos (catadores e clientes) =====
// Cadastro simples do gestor: nome + telefone (opcional). Na compra/venda o
// nome pode vir daqui ou ser digitado solto. Nome digitado solto NÃO vira
// contato — só entra na lista o que o gestor cadastrar.
import { gerarId, hojeISO } from "./dia";

export function novoContato(nome, telefone = "") {
  return { id: gerarId("ct", hojeISO()), nome: String(nome).trim(), telefone: String(telefone).trim() };
}

// Lista em ordem alfabética — usada nos seletores de compra e venda.
export function contatosOrdenados(lista) {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// gerarId conta por sessão: depois de recarregar o app, dois contatos criados
// no mesmo minuto ganhariam o mesmo id. Aqui o segundo vira "…-2".
export function comIdsUnicos(lista) {
  const vistos = new Set();
  return lista.map((c) => {
    if (!vistos.has(c.id)) {
      vistos.add(c.id);
      return c;
    }
    let n = 2;
    while (vistos.has(`${c.id}-${n}`)) n += 1;
    const id = `${c.id}-${n}`;
    vistos.add(id);
    return { ...c, id };
  });
}
