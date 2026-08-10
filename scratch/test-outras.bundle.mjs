// src/dia.js
var formatadorReal = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
function hojeISO() {
  const d = /* @__PURE__ */ new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}
var contadorId = 0;
function gerarId(tipo, dataISO) {
  const agora = /* @__PURE__ */ new Date();
  const compacto = dataISO.replace(/-/g, "");
  const hh = String(agora.getHours()).padStart(2, "0");
  const mm = String(agora.getMinutes()).padStart(2, "0");
  contadorId += 1;
  return `${tipo}-${compacto}-${hh}${mm}-${contadorId}`;
}
function novoDia(data2, caixaInicialCentavos, perfil) {
  return {
    version: 1,
    data: data2,
    status: "aberto",
    perfilAbertura: perfil,
    caixaInicialCentavos,
    movimentacoes: [],
    quebraDeCaixa: null,
    abertoEm: (/* @__PURE__ */ new Date()).toISOString(),
    abertoPor: perfil,
    fechadoEm: null,
    fechadoPor: null
  };
}
function criarOutra({ direcao, descricao, valorCentavos, registradoPor, data: data2 }) {
  return {
    id: gerarId("o", data2),
    tipo: "outra",
    registradoPor,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    direcao,
    // "entrada" | "saida"
    descricao,
    valorCentavos
  };
}
function calcularSaldoEsperado(dia) {
  let saldo = dia.caixaInicialCentavos;
  for (const m of dia.movimentacoes) {
    if (m.tipo === "compra") saldo -= m.valorCentavos;
    else if (m.tipo === "venda") saldo += m.totalCentavos;
    else if (m.tipo === "outra") saldo += m.direcao === "entrada" ? m.valorCentavos : -m.valorCentavos;
  }
  return saldo;
}
function calcularQuebraTotal(quebra) {
  const soma = (obj) => Object.entries(obj || {}).reduce((s, [chave, qtd]) => s + Number(chave) * Number(qtd || 0), 0);
  return soma(quebra?.cedulas) + soma(quebra?.moedas);
}
function calcularDiferenca(contado, esperado) {
  return contado - esperado;
}
function recalcular(dia) {
  const novo = { ...dia, movimentacoes: [...dia.movimentacoes] };
  novo.saldoEsperadoCentavos = calcularSaldoEsperado(novo);
  if (novo.quebraDeCaixa) {
    novo.quebraDeCaixa = {
      ...novo.quebraDeCaixa,
      totalCentavos: calcularQuebraTotal(novo.quebraDeCaixa)
    };
    novo.diferencaCentavos = calcularDiferenca(novo.quebraDeCaixa.totalCentavos, novo.saldoEsperadoCentavos);
  }
  return novo;
}

// src/materiais.jsx
var MATERIAIS_PADRAO = [
  { nome: "Papel\xE3o", precoPorKgCentavos: 30 },
  { nome: "PET", precoPorKgCentavos: 100 },
  { nome: "Latinha", precoPorKgCentavos: 500 },
  { nome: "Metal", precoPorKgCentavos: 1e3 }
];

// src/storage.js
var K_DIA = "dia:";
var K_META = "app:meta";
var K_TABELA = "tabela-materiais";
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
function carregarMeta() {
  return lerJSON(K_META, { version: 1, diaAberto: null });
}
function salvarMeta(meta) {
  gravarJSON(K_META, meta);
}
function carregarDia(data2) {
  const dia = lerJSON(K_DIA + data2, null);
  return dia ? recalcular(dia) : null;
}
function salvarDia(dia) {
  gravarJSON(K_DIA + dia.data, dia);
}
function carregarDiaAberto() {
  const meta = carregarMeta();
  if (!meta.diaAberto) return null;
  return carregarDia(meta.diaAberto);
}
function abrirDia(dia) {
  salvarDia(dia);
  const meta = carregarMeta();
  meta.diaAberto = dia.data;
  salvarMeta(meta);
}
function carregarTabelaMateriais() {
  const tab2 = lerJSON(K_TABELA, null);
  if (tab2 && Array.isArray(tab2.materiais) && tab2.materiais.length) return tab2;
  return { version: 1, atualizadaEm: null, materiais: MATERIAIS_PADRAO };
}
function salvarTabelaMateriais(tabela) {
  const tab2 = { version: 1, atualizadaEm: (/* @__PURE__ */ new Date()).toISOString(), materiais: tabela };
  gravarJSON(K_TABELA, tab2);
}

// scratch/test-outras.mjs
var mem = /* @__PURE__ */ new Map();
globalThis.localStorage = {
  getItem: (k) => mem.has(k) ? mem.get(k) : null,
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k)
};
Object.defineProperty(globalThis, "navigator", {
  value: { storage: { persist: async () => true } },
  configurable: true
});
var falhas = 0;
function checa(nome, cond, detalhe) {
  console.log(`${cond ? "OK " : "FALHOU"} ${nome}${detalhe ? ` \u2014 ${detalhe}` : ""}`);
  if (!cond) falhas++;
}
var data = hojeISO();
var d0 = recalcular(novoDia(data, 7e3, "dono"));
abrirDia(d0);
var saida = criarOutra({ direcao: "saida", descricao: "frete at\xE9 o comprador", valorCentavos: 1e3, registradoPor: "dono", data });
var d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, saida] });
salvarDia(d1);
checa("sa\xEDda frete \u2192 saldo 6000", d1.saldoEsperadoCentavos === 6e3, `saldo=${d1.saldoEsperadoCentavos}`);
var entrada = criarOutra({ direcao: "entrada", descricao: "devolu\xE7\xE3o", valorCentavos: 600, registradoPor: "dono", data });
var d2 = recalcular({ ...d1, movimentacoes: [...d1.movimentacoes, entrada] });
salvarDia(d2);
checa("entrada devolu\xE7\xE3o \u2192 saldo 6600", d2.saldoEsperadoCentavos === 6600, `saldo=${d2.saldoEsperadoCentavos}`);
var rec = carregarDiaAberto();
checa("reload tem 2 outras", rec?.movimentacoes.length === 2);
checa("reload recalcula saldo = 6600", rec?.saldoEsperadoCentavos === 6600, `saldo=${rec?.saldoEsperadoCentavos}`);
salvarTabelaMateriais([
  { nome: "Papel\xE3o", precoPorKgCentavos: 30 },
  { nome: "Vidro", precoPorKgCentavos: 25 }
]);
var tab = carregarTabelaMateriais();
checa("tabela salva+recarrega com Vidro", tab.materiais.length === 2 && tab.materiais.some((m) => m.nome === "Vidro"));
checa("pre\xE7o editado persistido", tab.materiais.find((m) => m.nome === "Papel\xE3o")?.precoPorKgCentavos === 30);
console.log(falhas === 0 ? "\nTUDO OK" : `
${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
