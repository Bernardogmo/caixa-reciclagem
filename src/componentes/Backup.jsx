// Overlay de backup (só o dono chega aqui): baixa um JSON com TUDO que está no
// caixa compartilhado e restaura a partir de um arquivo. Restaurar SUBSTITUI o
// conteúdo de todos os aparelhos, então passa por uma confirmação que mostra o
// que tem dentro do arquivo. Lê e grava no Firestore — por isso é assíncrono.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  backupParaTexto,
  baixarBackup,
  lerBackupDeTexto,
  montarBackup,
  nomeArquivo,
  restaurarBackup,
  resumirBackup,
} from "../backup";
import { formatarData } from "../dia";

export default function Backup({ onVoltar }) {
  const [backup, setBackup] = useState(null); // foto do caixa no banco
  const [tentativa, setTentativa] = useState(0); // "tentar de novo"
  const [carregando, setCarregando] = useState(true);
  const [carregandoErro, setCarregandoErro] = useState(null);
  const [texto, setTexto] = useState(null); // JSON à mostra pra copiar na mão
  const [aviso, setAviso] = useState(null);
  const [erro, setErro] = useState(null);
  const [pendente, setPendente] = useState(null); // { backup, resumo } lido do arquivo
  const [salvando, setSalvando] = useState(false); // restauração em andamento
  const inputArquivo = useRef(null);

  // Monta a foto uma vez ao abrir (e de novo se pedirem "tentar de novo").
  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    setCarregandoErro(null);
    montarBackup()
      .then((novo) => {
        if (!ativo) return;
        setBackup(novo);
        setCarregando(false);
      })
      .catch((erroBanco) => {
        console.error("Backup: não deu para ler o caixa:", erroBanco);
        if (!ativo) return;
        setCarregandoErro("Não deu para ler o caixa do banco. Confira a internet.");
        setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);

  const resumo = useMemo(() => (backup ? resumirBackup(backup) : null), [backup]);

  function baixar() {
    setErro(null);
    if (!backup) return;
    if (baixarBackup(backup)) {
      setAviso("Baixado: " + nomeArquivo(backup) + " (pasta Downloads do aparelho).");
      return;
    }
    setAviso(null);
    setTexto(backupParaTexto(backup));
    setErro("O navegador não deixou baixar. Copie o texto abaixo e guarde num lugar seguro.");
  }

  function escolherArquivo(evento) {
    const arquivo = evento.target.files && evento.target.files[0];
    evento.target.value = ""; // permite reescolher o mesmo arquivo depois
    if (!arquivo) return;
    setErro(null);
    setAviso(null);
    setPendente(null);
    const leitor = new FileReader();
    leitor.onload = () => {
      const lido = lerBackupDeTexto(String(leitor.result));
      if (!lido.ok) {
        setErro(lido.erro);
        return;
      }
      setPendente({ backup: lido.backup, resumo: resumirBackup(lido.backup) });
    };
    leitor.onerror = () => setErro("Não deu pra ler o arquivo.");
    leitor.readAsText(arquivo);
  }

  async function confirmarRestauracao() {
    if (!pendente || salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await restaurarBackup(pendente.backup);
      // Os dados novos chegam pelos snapshots; recarregar garante a tela limpa.
      window.location.reload();
    } catch (erroBanco) {
      console.error("Backup: não deu para restaurar:", erroBanco);
      setErro("Não deu para gravar a restauração no banco. Confira a internet e tente de novo.");
      setSalvando(false);
    }
  }

  function linha(rotulo, valor) {
    return (
      <div className="confere-linha">
        <span>{rotulo}</span>
        <strong>{valor}</strong>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="overlay">
        <div className="overlay-header">
          <button className="btn-voltar" onClick={onVoltar}>
            ← Voltar
          </button>
          <p className="overlay-titulo">Backup do caixa</p>
        </div>
        <div className="overlay-corpo">
          <p className="dica">Lendo o caixa do banco…</p>
        </div>
      </div>
    );
  }

  if (carregandoErro || !backup) {
    return (
      <div className="overlay">
        <div className="overlay-header">
          <button className="btn-voltar" onClick={onVoltar}>
            ← Voltar
          </button>
          <p className="overlay-titulo">Backup do caixa</p>
        </div>
        <div className="overlay-corpo">
          <p className="backup-alerta">{carregandoErro || "Não deu para ler o caixa."}</p>
          <button className="btn btn-primary" onClick={() => setTentativa((n) => n + 1)}>
            TENTAR DE NOVO
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Backup do caixa</p>
      </div>

      <div className="overlay-corpo">
        <p className="dica">
          O caixa fica no banco compartilhado. Baixe um backup de vez em quando para ter uma cópia em mãos.
        </p>

        <div className="confere">
          {linha("Dias guardados", resumo.dias)}
          {resumo.primeiro && linha("Mais antigo", formatarData(resumo.primeiro))}
          {resumo.ultimo && linha("Mais recente", formatarData(resumo.ultimo))}
          {linha("Dia em aberto", resumo.diaAberto ? formatarData(resumo.diaAberto) : "nenhum")}
          {linha("Materiais na tabela", resumo.materiais)}
          {linha("Meses do shopping", resumo.mesesShopping)}
          {linha("Contatos cadastrados", resumo.contatos)}
        </div>

        <button className="btn btn-primary" onClick={baixar}>
          ⬇ BAIXAR BACKUP
        </button>
        <button className="btn btn-ghost" onClick={() => setTexto(texto ? null : backupParaTexto(backup))}>
          {texto ? "Ocultar o texto" : "📋 Mostrar o texto pra copiar"}
        </button>
        {texto && (
          <textarea className="backup-json" readOnly value={texto} onFocus={(e) => e.target.select()} />
        )}

        {aviso && <p className="backup-ok">{aviso}</p>}
        {erro && !pendente && <p className="backup-alerta">{erro}</p>}

        <h2 className="tela-titulo backup-secao">Restaurar de um arquivo</h2>
        <p className="dica">
          Isto APAGA o caixa atual (em todos os aparelhos) e coloca o conteúdo do arquivo no lugar.
        </p>
        <input
          ref={inputArquivo}
          className="backup-arquivo"
          type="file"
          accept="application/json,.json"
          onChange={escolherArquivo}
        />
        <button className="btn btn-secondary" onClick={() => inputArquivo.current && inputArquivo.current.click()}>
          📂 ESCOLHER ARQUIVO
        </button>

        {pendente && (
          <div className="backup-confirma">
            <p className="backup-confirma-titulo">Conferir antes de restaurar</p>
            {linha("Dias no arquivo", pendente.resumo.dias)}
            {pendente.resumo.primeiro && linha("Mais antigo", formatarData(pendente.resumo.primeiro))}
            {pendente.resumo.ultimo && linha("Mais recente", formatarData(pendente.resumo.ultimo))}
            {linha("Exportado em", String(pendente.backup.exportadoEm || "").slice(0, 10) || "—")}
            {pendente.resumo.mesesShopping > 0 ? (
              linha("Meses do shopping no arquivo", pendente.resumo.mesesShopping)
            ) : (
              <p className="dica">
                Este arquivo não tem dados do shopping — a coleta do shopping atual fica como está.
              </p>
            )}
            {pendente.resumo.contatos > 0 ? (
              linha("Contatos no arquivo", pendente.resumo.contatos)
            ) : (
              <p className="dica">Este arquivo não tem contatos — a lista de contatos atual fica como está.</p>
            )}
            <p className="backup-alerta">
              Hoje o caixa tem {resumo.dias} dia(s). Ao restaurar, eles somem e ficam os {pendente.resumo.dias} do
              arquivo.
            </p>
            {erro && <p className="backup-alerta">{erro}</p>}
            <button className="btn btn-danger" onClick={confirmarRestauracao} disabled={salvando}>
              {salvando ? "RESTAURANDO…" : "SIM, RESTAURAR"}
            </button>
            <button className="btn btn-ghost" onClick={() => setPendente(null)} disabled={salvando}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
