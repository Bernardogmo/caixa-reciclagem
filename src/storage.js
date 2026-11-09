// ===== Camada de persistência (localStorage, offline-first) =====
// Chaves:
//   dia:YYYY-MM-DD    → registro completo do dia
//   app:meta          → { version:1, diaAberto: "YYYY-MM-DD" | null }
//   indice-dias       → ["YYYY-MM-DD", ...] dias fechados
//   tabela-materiais  → { version:1, atualizadaEm, materiais:[{nome, precoPorKgCentavos}] }
//   coleta:YYYY-MM    → registro mensal da coleta do shopping (separado do caixa)
//   shopping:tabela   → { version:1, atualizadaEm, materiais:[{nome, precoPorKgCentavos}] }
//   contatos          → { version:1, atualizadaEm, contatos:[{id, nome, telefone}] }
import { recalcular } from "./dia";
import { MATERIAIS_PADRAO } from "./materiais";
import { novoMes, recalcularMes } from "./shopping";

const K_DIA = "dia:";
const K_META = "app:meta";
const K_INDICE = "indice-dias";
const K_TABELA = "tabela-materiais";
const K_COLETA = "coleta:";
const K_SHOPPING_TABELA = "shopping:tabela";
const K_CONTATOS = "contatos";

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
  meta.fundoProximoDia = null; // o fundo definido no fechamento foi usado para abrir este dia
  salvarMeta(meta);
}

// ---- Fundo do próximo dia ----
// Definido pelo gestor logo depois do fechamento (dinheiro que fica na bolsa).
// Fica no meta — portanto entra no backup — até o próximo dia ser aberto.

export function carregarFundoProximoDia() {
  return carregarMeta().fundoProximoDia || null;
}

export function salvarFundoProximoDia({ quebra, origemData, definidoPor }) {
  const meta = carregarMeta();
  meta.fundoProximoDia = { quebra, origemData, definidoPor, definidoEm: new Date().toISOString() };
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

// ---- Coleta do shopping (separada do caixa) ----
// A tabela de preços do shopping é de contrato: começa com os mesmos materiais
// do galpão, mas com preço 0 até o gestor preencher.

export function carregarTabelaShopping() {
  const tab = lerJSON(K_SHOPPING_TABELA, null);
  if (tab && Array.isArray(tab.materiais)) return tab;
  return {
    version: 1,
    atualizadaEm: null,
    materiais: MATERIAIS_PADRAO.map((m) => ({ nome: m.nome, precoPorKgCentavos: 0 })),
  };
}

export function salvarTabelaShopping(tabela) {
  const tab = { version: 1, atualizadaEm: new Date().toISOString(), materiais: tabela };
  gravarJSON(K_SHOPPING_TABELA, tab);
}

export function carregarMesColeta(mes) {
  const salvo = lerJSON(K_COLETA + mes, null) || novoMes(mes);
  return recalcularMes(salvo, carregarTabelaShopping().materiais);
}

export function salvarMesColeta(mes) {
  gravarJSON(K_COLETA + mes.mes, mes);
}

// ---- Contatos (catadores e clientes) ----

export function carregarContatos() {
  const salvo = lerJSON(K_CONTATOS, null);
  if (salvo && Array.isArray(salvo.contatos)) return salvo.contatos;
  return [];
}

export function salvarContatos(lista) {
  const dados = { version: 1, atualizadaEm: new Date().toISOString(), contatos: lista };
  gravarJSON(K_CONTATOS, dados);
}

// ---- Boot ----

export function pedirPersistencia() {
  // Pedido opcional pra o navegador não limpar o armazenamento em modo anônimo/estresse de espaço.
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

// ---- Backup / restauração (acesso bruto ao localStorage) ----
// O formato e a validação ficam em backup.js; aqui só entra/sai do storage.

export function lerTudoBruto() {
  const dias = {};
  const mesesColeta = {};
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.indexOf(K_DIA) === 0) {
      const dia = lerJSON(chave, null);
      if (dia) dias[chave.slice(K_DIA.length)] = dia;
    } else if (chave && chave.indexOf(K_COLETA) === 0) {
      const mes = lerJSON(chave, null);
      if (mes) mesesColeta[chave.slice(K_COLETA.length)] = mes;
    }
  }
  return {
    meta: carregarMeta(),
    indiceDias: carregarIndiceDias(),
    tabelaMateriais: carregarTabelaMateriais(),
    dias,
    tabelaShopping: carregarTabelaShopping(),
    mesesColeta,
    contatos: carregarContatos(),
  };
}

// Substitui TODO o conteúdo do app: apaga os dias atuais e grava os do backup.
// Os dados do shopping e os contatos só são mexidos quando o backup os traz —
// backup antigo (sem esses campos) restaura o caixa e deixa o resto como está.
export function gravarTudoBruto({
  meta,
  indiceDias,
  tabelaMateriais,
  dias,
  tabelaShopping,
  mesesColeta,
  contatos,
}) {
  const antigas = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && chave.indexOf(K_DIA) === 0) antigas.push(chave);
    else if (mesesColeta && chave && chave.indexOf(K_COLETA) === 0) antigas.push(chave);
  }
  antigas.forEach((chave) => {
    try {
      localStorage.removeItem(chave);
    } catch (e) {
      console.warn("Falha ao remover", chave, e);
    }
  });
  Object.keys(dias).forEach((data) => gravarJSON(K_DIA + data, dias[data]));
  if (mesesColeta) {
    Object.keys(mesesColeta).forEach((mes) => gravarJSON(K_COLETA + mes, mesesColeta[mes]));
  }
  salvarIndiceDias(indiceDias);
  if (tabelaMateriais) gravarJSON(K_TABELA, tabelaMateriais);
  if (tabelaShopping) gravarJSON(K_SHOPPING_TABELA, tabelaShopping);
  if (contatos) salvarContatos(contatos);
  salvarMeta(meta);
}
