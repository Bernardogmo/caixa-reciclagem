// Primeira entrada do gestor num aparelho que já usava o app antigo (dados no
// localStorage). Mostra o que foi encontrado e deixa escolher entre enviar tudo
// para o caixa compartilhado ou começar do zero. Os dados locais nunca são
// apagados — ficam como cópia de segurança.
import { useState } from "react";
import { marcarMigrado, migrarDados } from "../migracao";
import { formatarData } from "../dia";

function linha(rotulo, valor) {
  return (
    <div className="confere-linha">
      <span>{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  );
}

export default function MigracaoDados({ resumo, onPronto }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviado, setEnviado] = useState(null); // resultado da migração

  async function enviar() {
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await migrarDados();
      setEnviado(resultado);
    } catch (erroMigracao) {
      console.error("Migração: não deu para enviar os dados:", erroMigracao);
      setErro("Não deu para enviar os dados para o caixa. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  function comecarDoZero() {
    if (enviando) return;
    marcarMigrado();
    onPronto();
  }

  if (enviado) {
    return (
      <main className="app-main">
        <h1 className="tela-titulo">Dados enviados</h1>
        <p className="vazio">Pronto! Os dados deste aparelho já fazem parte do caixa compartilhado.</p>
        <div className="confere">
          {linha("Dias no caixa", enviado.dias)}
          {linha("Meses do shopping", enviado.mesesShopping)}
          {linha("Contatos", enviado.contatos)}
        </div>
        <p className="dica">
          A cópia antiga continua guardada neste aparelho, só por segurança. Ela não é mais usada.
        </p>
        <button className="btn btn-primary" onClick={onPronto}>
          ✔ CONTINUAR
        </button>
      </main>
    );
  }

  return (
    <main className="app-main">
      <h1 className="tela-titulo">Dados deste aparelho</h1>
      <p className="vazio">Este aparelho já usava o caixa antes do login. Encontramos dados guardados nele:</p>

      <div className="confere">
        {linha("Dias guardados", resumo.dias)}
        {resumo.diaAberto && linha("Dia em aberto", formatarData(resumo.diaAberto))}
        {linha("Meses do shopping", resumo.mesesShopping)}
        {linha("Contatos", resumo.contatos)}
        {linha("Tabela de materiais própria", resumo.temMateriais ? "sim" : "não")}
      </div>

      <p className="dica">
        Enviar para o caixa compartilhado? Depois disso todo mundo vê os mesmos dados, em todos os
        aparelhos.
      </p>
      <button className="btn btn-primary" onClick={enviar} disabled={enviando}>
        {enviando ? "ENVIANDO…" : "📤 ENVIAR PARA O CAIXA"}
      </button>
      <button className="btn btn-ghost" onClick={comecarDoZero} disabled={enviando}>
        COMEÇAR DO ZERO
      </button>
      <p className="dica">
        “Começar do zero” não apaga nada: os dados antigos continuam guardados neste aparelho, mas ficam
        de fora do caixa compartilhado.
      </p>
      {erro && <p className="aviso-erro">{erro}</p>}
    </main>
  );
}
