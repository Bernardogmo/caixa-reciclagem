// Quem está usando o app? Dois botões grandes, sem senha.
// Funcionário: só compras/vendas/histórico (sem OUTRAS/MATERIAIS/FECHAR).
// Dono: tudo, inclusive fechar o dia.
export default function SeletorPerfil({ onEscolher }) {
  return (
    <main className="app-main">
      <h1 className="tela-titulo">Caixa da Reciclagem</h1>
      <p className="vazio">Quem vai usar agora?</p>
      <button className="btn btn-primary btn-perfil" onClick={() => onEscolher("funcionario")}>
        🧑‍🔧 Funcionário(a)
      </button>
      <button className="btn btn-secondary btn-perfil" onClick={() => onEscolher("dono")}>
        👨‍🌾 Dono(a)
      </button>
    </main>
  );
}
