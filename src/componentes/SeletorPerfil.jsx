// Quem está usando o app? Dois botões grandes, sem senha.
// Funcionário: só compras/vendas/histórico (sem OUTRAS/MATERIAIS/FECHAR).
// Gestor: tudo, inclusive fechar o dia.
export default function SeletorPerfil({ onEscolher }) {
  return (
    <main className="app-main">
      <h1 className="tela-titulo">Caixa da Reciclagem</h1>
      <p className="vazio">Quem vai usar agora?</p>
      <p className="dica">Escolha quem está usando o aplicativo agora.</p>
      <button className="btn btn-primary btn-perfil" onClick={() => onEscolher("funcionario")}>
        <span>🧑‍🔧 Funcionário(a)</span>
        <span className="btn-perfil-sub">Registra compras e vendas</span>
      </button>
      <button className="btn btn-secondary btn-perfil" onClick={() => onEscolher("dono")}>
        <span>👨‍🌾 Gestor(a)</span>
        <span className="btn-perfil-sub">Administra tudo e fecha o dia</span>
      </button>
    </main>
  );
}
