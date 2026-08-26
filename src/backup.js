// ===== Backup / restauração =====
// Existe porque o localStorage do tablet é a ÚNICA cópia dos dados: limpar os
// dados do navegador, trocar de navegador ou perder o tablet apaga o caixa.
// Exporta tudo (dias + índice + tabela de materiais + meta) num JSON só.
import { gravarTudoBruto, lerTudoBruto } from "./storage";

export const VERSAO_BACKUP = 1;
const ASSINATURA = "caixa-reciclagem";

export function montarBackup() {
  const bruto = lerTudoBruto();
  return {
    app: ASSINATURA,
    versaoBackup: VERSAO_BACKUP,
    exportadoEm: new Date().toISOString(),
    meta: bruto.meta,
    indiceDias: bruto.indiceDias,
    tabelaMateriais: bruto.tabelaMateriais,
    dias: bruto.dias,
  };
}

export function backupParaTexto(backup) {
  return JSON.stringify(backup, null, 2);
}

// → "caixa-reciclagem-2026-08-24.json"
export function nomeArquivo(backup) {
  const dia = String(backup.exportadoEm || "").slice(0, 10) || "sem-data";
  return ASSINATURA + "-" + dia + ".json";
}

// Resumo humano do conteúdo — mostrado antes de restaurar, pra conferir.
export function resumirBackup(backup) {
  const datas = backup && backup.dias ? Object.keys(backup.dias).sort() : [];
  const tabela = backup ? backup.tabelaMateriais : null;
  return {
    dias: datas.length,
    primeiro: datas.length ? datas[0] : null,
    ultimo: datas.length ? datas[datas.length - 1] : null,
    diaAberto: backup && backup.meta ? backup.meta.diaAberto : null,
    materiais: tabela && Array.isArray(tabela.materiais) ? tabela.materiais.length : 0,
  };
}

// Texto do arquivo → { ok: true, backup } | { ok: false, erro }
export function lerBackupDeTexto(texto) {
  let obj;
  try {
    obj = JSON.parse(texto);
  } catch (e) {
    console.warn("JSON inválido no backup", e);
    return { ok: false, erro: "O arquivo não é um JSON válido." };
  }
  if (!obj || typeof obj !== "object") return { ok: false, erro: "Conteúdo inesperado no arquivo." };
  if (obj.app !== ASSINATURA) return { ok: false, erro: "Este JSON não é um backup do Caixa da Reciclagem." };
  if (obj.versaoBackup > VERSAO_BACKUP) {
    return { ok: false, erro: "Backup da versão " + obj.versaoBackup + "; este app lê até a " + VERSAO_BACKUP + ". Atualize o app." };
  }
  if (!obj.dias || typeof obj.dias !== "object") return { ok: false, erro: "Backup sem a lista de dias." };
  return { ok: true, backup: obj };
}

export function restaurarBackup(backup) {
  gravarTudoBruto({
    meta: backup.meta || { version: 1, diaAberto: null },
    indiceDias: Array.isArray(backup.indiceDias) ? backup.indiceDias : [],
    tabelaMateriais: backup.tabelaMateriais || null,
    dias: backup.dias || {},
  });
}

// Dispara o download. Retorna false se o navegador não deixou (aí resta copiar
// o texto na mão — ver o botão "Mostrar o texto" na tela de backup).
export function baixarBackup(backup) {
  try {
    const blob = new Blob([backupParaTexto(backup)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo(backup);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) {
    console.warn("Falha ao baixar backup", e);
    return false;
  }
}
