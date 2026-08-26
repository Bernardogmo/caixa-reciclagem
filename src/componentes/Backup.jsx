// Overlay de backup (só o dono chega aqui): baixa um JSON com TUDO que está no
// tablet e restaura a partir de um arquivo. Restaurar SUBSTITUI o conteúdo atual,
// então passa por uma confirmação que mostra o que tem dentro do arquivo.
import { useMemo, useRef, useState } from "react";
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
  // Foto do storage na abertura da tela; não muda enquanto o overlay está aberto.
  const backup = useMemo(() => montarBackup(), []);
  const resumo = useMemo(() => resumirBackup(backup), [backup]);
  const [texto, setTexto] = useState(null); // JSON à mostra pra copiar na mão
  const [aviso, setAviso] = useState(null);
  const [erro, setErro] = useState(null);
  const [pendente, setPendente] = useState(null); // { backup, resumo } lido do arquivo
  const inputArquivo = useRef(null);

  function baixar() {
    setErro(null);
    if (baixarBackup(backup)) {
      setAviso("Baixado: " + nomeArquivo(backup) + " (pasta Downloads do tablet).");
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

  function confirmarRestauracao() {
    restaurarBackup(pendente.backup);
    // Todo o estado do app nasce do storage: recarregar é a forma honesta de aplicar.
    window.location.reload();
  }

  function linha(rotulo, valor) {
    return (
      <div className="confere-linha">
        <span>{rotulo}</span>
        <strong>{valor}</strong>
      </div>
    );
  }

  return (
    <div className="overlay">
      <div className="overlay-header">
        <button className="btn-voltar" onClick={onVoltar}>
          ← Voltar
        </button>
        <p className="overlay-titulo">Backup</p>
      </div>

      <div className="overlay-corpo">
        <p className="mat-dica">Os dados moram só neste tablet. Baixe um backup no fim do dia.</p>

        <div className="confere">
          {linha("Dias guardados", resumo.dias)}
          {resumo.primeiro && linha("Mais antigo", formatarData(resumo.primeiro))}
          {resumo.ultimo && linha("Mais recente", formatarData(resumo.ultimo))}
          {linha("Dia em aberto", resumo.diaAberto ? formatarData(resumo.diaAberto) : "nenhum")}
          {linha("Materiais na tabela", resumo.materiais)}
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
        {erro && <p className="backup-alerta">{erro}</p>}

        <h2 className="tela-titulo backup-secao">Restaurar de um arquivo</h2>
        <p className="mat-dica">Isto APAGA o que está neste tablet e coloca o conteúdo do arquivo no lugar.</p>
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
            <p className="backup-alerta">
              Hoje o tablet tem {resumo.dias} dia(s). Ao restaurar, eles somem e ficam os {pendente.resumo.dias} do
              arquivo.
            </p>
            <button className="btn btn-danger" onClick={confirmarRestauracao}>
              SIM, RESTAURAR
            </button>
            <button className="btn btn-ghost" onClick={() => setPendente(null)}>
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
