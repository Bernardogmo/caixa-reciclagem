// Depois do login, o gestor escolhe como vai usar o aparelho agora:
// modo funcionário (só compras, vendas e histórico) ou modo gestor (tudo,
// inclusive fechar o dia e administrar). O funcionário comum não vê esta tela:
// entra direto no modo funcionário.
export default function SeletorModo({ nome, onEscolher, onSair }) {
  return (
    <main className="app-main">
      <h1 className="tela-titulo">Caixa da Reciclagem</h1>
      <p className="vazio">{nome ? `Olá, ${nome}!` : "Olá!"} Quem vai usar agora?</p>
      <p className="dica">Escolha o modo de uso deste aparelho.</p>
      <button className="btn btn-primary btn-perfil" onClick={() => onEscolher("funcionario")}>
        <span>🧑‍🔧 Funcionário(a)</span>
        <span className="btn-perfil-sub">Registra compras e vendas</span>
      </button>
      <button className="btn btn-secondary btn-perfil" onClick={() => onEscolher("dono")}>
        <span>👨‍🌾 Gestor(a)</span>
        <span className="btn-perfil-sub">Administra tudo e fecha o dia</span>
      </button>
      <button className="btn btn-ghost" onClick={onSair}>
        Sair da conta
      </button>
    </main>
  );
}
