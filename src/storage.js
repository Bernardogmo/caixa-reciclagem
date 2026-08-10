// ===== Camada de persistência (localStorage, offline-first) =====
// Chaves:
//   dia:YYYY-MM-DD   → registro completo do dia
//   app:meta         → { version:1, diaAberto: "YYYY-MM-DD" | null }
//   indice-dias      → ["YYYY-MM-DD", ...] dias fechados
//   tabela-materiais → { version:1, atualizadaEm, materiais:[{nome, precoPorKgCentavos}] }
import { recalcular } from "./dia";
import { MATERIAIS_PADRAO } from "./materiais";

const K_DIA = "dia:";
const K_META = "app:meta";
const K_INDICE = "indice-dias";
const K_TABELA = "tabela-materiais";

function lerJSON(chave, fallback) {
  try {
    const bruto = localStorage.getItem(chave);
    if (bruto == null) return fallback;
    return JSON.parse(bruto);
  } catch (e) {
    console.warn("Falha ao ler", chave, e);
    return fallback;
  }
}

function gravarJSON(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (e) {
    console.warn("Falha ao gravar", chave, e);
  }
}

// ---- Meta ----

export function carregarMeta() {
  return lerJSON(K_META, { version: 1, diaAberto: null });
}

export function salvarMeta(meta) {
  gravarJSON(K_META, meta);
}

// ---- Dia ----

export function carregarDia(data) {
  const dia = lerJSON(K_DIA + data, null);
  return dia ? recalcular(dia) : null;
}

export function salvarDia(dia) {
  gravarJSON(K_DIA + dia.data, dia);
}

export function removerDia(data) {
  try {
    localStorage.removeItem(K_DIA + data);
  } catch (e) {
    console.warn("Falha ao remover", data, e);
  }
}

export function carregarDiaAberto() {
  const meta = carregarMeta();
  if (!meta.diaAberto) return null;
  return carregarDia(meta.diaAberto);
}

// ---- Ciclo de vida do dia ----

export function abrirDia(dia) {
  salvarDia(dia);
  const meta = carregarMeta();
  meta.diaAberto = dia.data;
  salvarMeta(meta);
}

export function fecharDia(dia) {
  salvarDia(dia);
  const meta = carregarMeta();
  meta.diaAberto = null;
  salvarMeta(meta);
  const indice = carregarIndiceDias();
  if (!indice.includes(dia.data)) {
    indice.push(dia.data);
    salvarIndiceDias(indice);
  }
}

export function reabrirDia(data) {
  const indice = carregarIndiceDias();
  salvarIndiceDias(indice.filter((d) => d !== data));
  const meta = carregarMeta();
  meta.diaAberto = data;
  salvarMeta(meta);
}

// ---- Índice de dias fechados ----

export function carregarIndiceDias() {
  return lerJSON(K_INDICE, []);
}

export function salvarIndiceDias(arr) {
  gravarJSON(K_INDICE, arr);
}

// ---- Tabela de materiais ----

export function carregarTabelaMateriais() {
  const tab = lerJSON(K_TABELA, null);
  if (tab && Array.isArray(tab.materiais) && tab.materiais.length) return tab;
  return { version: 1, atualizadaEm: null, materiais: MATERIAIS_PADRAO };
}

export function salvarTabelaMateriais(tabela) {
  const tab = { version: 1, atualizadaEm: new Date().toISOString(), materiais: tabela };
  gravarJSON(K_TABELA, tab);
}

// ---- Boot ----

export function pedirPersistencia() {
  // Pedido opcional pra o navegador não limpar o armazenamento em modo anônimo/estresse de espaço.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}
