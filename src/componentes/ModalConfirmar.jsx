// Modal de confirmação: mostra o resumo do que vai ser registrado e pede um
// toque final em CONFIRMAR antes de gravar. Usado por compra e venda.
// Reusa o padrão .overlay do app; o conteúdo do resumo vem via children.
export default function ModalConfirmar({ titulo, rotuloBotao, onConfirmar, onCancelar, children }) {
  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onCancelar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">{titulo}</p>
      </div>
      <div className="overlay-corpo">
        <p className="dica">Confira o resumo antes de confirmar.</p>
        {children}
        <button className="btn btn-success" onClick={onConfirmar}>
          {rotuloBotao}
        </button>
        <button className="btn btn-ghost" onClick={onCancelar}>
          ✕ CANCELAR
        </button>
      </div>
    </div>
  );
}
