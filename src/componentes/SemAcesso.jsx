// A pessoa entrou com uma conta válida, mas o gestor ainda não liberou o
// acesso (ou tirou). Sem o cadastro em usuarios/{uid} nada é liberado.
export default function SemAcesso({ email, onSair }) {
  return (
    <main className="app-main">
      <h1 className="tela-titulo">Sem acesso ao caixa</h1>
      <p className="dica">
        A conta {email ? <strong>{email}</strong> : "que entrou"} não tem acesso ao caixa deste galpão.
      </p>
      <p className="dica">Peça ao gestor para liberar o seu acesso.</p>
      <button className="btn btn-ghost" onClick={onSair}>
        Sair da conta
      </button>
    </main>
  );
}
