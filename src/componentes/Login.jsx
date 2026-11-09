// Tela de entrada: e-mail e senha. Cada pessoa tem a sua conta e o nome dela
// fica registrado em tudo o que lançar. Depois do primeiro acesso, o aparelho
// continua logado — e funcionando sem internet.
import { useState } from "react";
import { entrar, recuperarSenha, traduzirErroAuth } from "../usuarios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function aoEntrar(evento) {
    evento.preventDefault();
    if (ocupado) return;
    setErro("");
    setAviso("");
    if (email.trim() === "") {
      setErro("Digite o e-mail.");
      return;
    }
    if (senha === "") {
      setErro("Digite a senha.");
      return;
    }
    setOcupado(true);
    try {
      await entrar(email, senha);
      // Quem entra muda de tela sozinho: o App acompanha a sessão.
    } catch (e) {
      setErro(traduzirErroAuth(e));
    } finally {
      setOcupado(false);
    }
  }

  async function esqueci() {
    if (ocupado) return;
    setErro("");
    setAviso("");
    if (email.trim() === "") {
      setErro("Digite o e-mail acima e toque em “Esqueci minha senha”.");
      return;
    }
    setOcupado(true);
    try {
      await recuperarSenha(email);
      setAviso(`Enviamos um e-mail para ${email.trim()} com o passo a passo para trocar a senha.`);
    } catch (e) {
      setErro(traduzirErroAuth(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <main className="app-main login-tela">
      <div className="login-logo">♻️</div>
      <h1 className="tela-titulo">Caixa da Reciclagem</h1>
      <p className="dica login-dica">Entre com o e-mail e a senha da sua conta.</p>

      <form onSubmit={aoEntrar}>
        <div className="campo">
          <label htmlFor="login-email">E-mail</label>
          <input
            id="login-email"
            className="input-grande"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={ocupado}
          />
        </div>

        <div className="campo">
          <label htmlFor="login-senha">Senha</label>
          <div className="senha-campo">
            <input
              id="login-senha"
              className="input-grande"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={ocupado}
            />
            <button
              type="button"
              className="senha-olho"
              aria-label={mostrarSenha ? "Esconder a senha" : "Mostrar a senha"}
              onClick={() => setMostrarSenha((v) => !v)}
            >
              {mostrarSenha ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {erro && <p className="aviso-erro">{erro}</p>}
        {aviso && <p className="aviso-ok">{aviso}</p>}

        <button type="submit" className="btn btn-primary" disabled={ocupado}>
          {ocupado ? "ENTRANDO..." : "✔ ENTRAR"}
        </button>
      </form>

      <button type="button" className="btn btn-ghost" onClick={esqueci} disabled={ocupado}>
        Esqueci minha senha
      </button>

      <p className="dica login-dica">
        Na primeira vez em cada aparelho é preciso internet para entrar. Depois o app funciona sem internet.
      </p>
    </main>
  );
}
