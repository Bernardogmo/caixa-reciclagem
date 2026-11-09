// Área de contas (só gestor): quem pode entrar no caixa, criar conta e tirar
// acesso. O login é do Firebase Auth; o que libera o acesso é o documento
// usuarios/{uid} — apagar o documento tira o acesso na hora, em todos os
// aparelhos (a conta do Auth continua existindo, só fica sem permissão).
import { useEffect, useState } from "react";
import {
  criarUsuario,
  observarTodosUsuarios,
  recuperarSenha,
  removerAcesso,
  traduzirErroAuth,
} from "../usuarios";

const FORM_VAZIO = { nome: "", email: "", senha: "", papel: "comum" };

function rotuloPapel(papel) {
  return papel === "admin" ? "Gestor(a)" : "Funcionário(a)";
}

export default function Usuarios({ meuUid, onVoltar }) {
  const [usuarios, setUsuarios] = useState(null); // null = carregando
  const [form, setForm] = useState(FORM_VAZIO);
  const [criando, setCriando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [erro, setErro] = useState(null);
  const [confirmando, setConfirmando] = useState(null); // uid que vai perder o acesso

  useEffect(
    () =>
      observarTodosUsuarios(setUsuarios, (erroBanco) => {
        console.error("Usuários: não deu para carregar:", erroBanco);
        setErro("Não deu para carregar as contas. Confira a internet.");
        setUsuarios([]);
      }),
    [],
  );

  function setCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    if (criando) return;
    setErro(null);
    setAviso(null);
    if (!form.nome.trim() || !form.email.trim() || form.senha.length < 6) {
      setErro("Preencha nome, e-mail e uma senha com pelo menos 6 letras ou números.");
      return;
    }
    setCriando(true);
    try {
      await criarUsuario(form);
      setAviso(`Conta de ${form.nome.trim()} criada. A pessoa já pode entrar no app.`);
      setForm(FORM_VAZIO);
    } catch (erroCriacao) {
      console.error("Usuários: não deu para criar a conta:", erroCriacao);
      setErro(
        erroCriacao?.code
          ? traduzirErroAuth(erroCriacao)
          : "Não deu para criar a conta. Confira a internet e tente de novo.",
      );
    } finally {
      setCriando(false);
    }
  }

  async function enviarTrocaSenha(email) {
    setErro(null);
    setAviso(null);
    try {
      await recuperarSenha(email);
      setAviso(`E-mail de troca de senha enviado para ${email}.`);
    } catch (erroSenha) {
      console.error("Usuários: não deu para enviar a troca de senha:", erroSenha);
      setErro(traduzirErroAuth(erroSenha));
    }
  }

  async function confirmarRemocao(uid) {
    setErro(null);
    setAviso(null);
    try {
      await removerAcesso(uid);
      setAviso("Acesso removido. A pessoa não entra mais no caixa.");
    } catch (erroRemocao) {
      console.error("Usuários: não deu para remover o acesso:", erroRemocao);
      setErro("Não deu para tirar o acesso. Confira a internet e tente de novo.");
    } finally {
      setConfirmando(null);
    }
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Usuários</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">
          Quem está nesta lista pode entrar no caixa. Para tirar o acesso de alguém, remova a conta da
          lista.
        </p>

        {usuarios === null && <p className="dica">Carregando as contas…</p>}
        {usuarios !== null && usuarios.length === 0 && <p className="vazio">Nenhuma conta cadastrada.</p>}

        {(usuarios || []).map((u) => (
          <div className="usuario-card" key={u.uid}>
            <div className="usuario-nome">
              {u.nome || "(sem nome)"}
              {u.uid === meuUid && <span className="usuario-eu"> · você</span>}
            </div>
            <div className="usuario-info">
              {u.email} · {rotuloPapel(u.papel)}
            </div>
            {confirmando === u.uid ? (
              <div className="backup-confirma">
                <p className="backup-confirma-titulo">Tirar o acesso de {u.nome || u.email}?</p>
                <p className="dica">A pessoa sai do caixa na hora e não consegue mais entrar.</p>
                <button className="btn btn-danger" onClick={() => confirmarRemocao(u.uid)}>
                  SIM, TIRAR O ACESSO
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmando(null)}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="usuario-acoes">
                <button className="btn btn-ghost" onClick={() => enviarTrocaSenha(u.email)}>
                  🔑 Enviar troca de senha
                </button>
                {u.uid !== meuUid && (
                  <button className="btn btn-ghost usuario-remover" onClick={() => setConfirmando(u.uid)}>
                    🗑️ Tirar o acesso
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        <h2 className="tela-titulo backup-secao">Criar conta nova</h2>
        <p className="dica">
          Funcionário(a): registra compras, vendas e outras. Gestor(a): faz tudo, inclusive fechar o dia
          e criar contas.
        </p>
        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="usuario-nome">Nome da pessoa</label>
            <input
              id="usuario-nome"
              className="input-grande"
              value={form.nome}
              onChange={(e) => setCampo("nome", e.target.value)}
              placeholder="Ex.: Maria"
              autoComplete="off"
            />
          </div>
          <div className="campo">
            <label htmlFor="usuario-email">E-mail</label>
            <input
              id="usuario-email"
              className="input-grande"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              value={form.email}
              onChange={(e) => setCampo("email", e.target.value)}
              placeholder="nome@exemplo.com"
              autoComplete="off"
            />
          </div>
          <div className="campo">
            <label htmlFor="usuario-senha">Senha</label>
            <input
              id="usuario-senha"
              className="input-grande"
              type="password"
              value={form.senha}
              onChange={(e) => setCampo("senha", e.target.value)}
              placeholder="Pelo menos 6 letras ou números"
              autoComplete="new-password"
            />
          </div>
          <div className="campo">
            <label htmlFor="usuario-papel">O que a pessoa pode fazer</label>
            <select
              id="usuario-papel"
              className="select-grande"
              value={form.papel}
              onChange={(e) => setCampo("papel", e.target.value)}
            >
              <option value="comum">Funcionário(a) — só lança compras e vendas</option>
              <option value="admin">Gestor(a) — administra tudo</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={criando}>
            {criando ? "CRIANDO..." : "✔ CRIAR CONTA"}
          </button>
        </form>

        {aviso && <p className="backup-ok">{aviso}</p>}
        {erro && <p className="backup-alerta">{erro}</p>}

        <p className="dica">
          A pessoa entra com o e-mail e a senha que você cadastrou aqui. Para trocar a senha, ela usa o
          “Esqueci minha senha” na tela de entrada (ou o botão acima envia o e-mail).
        </p>
      </div>
    </div>
  );
}
