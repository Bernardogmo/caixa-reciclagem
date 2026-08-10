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
function calcularVenda(itens, ajusteCentavos) {
  const somaItens = itens.reduce((s, i) => s + (i.valorCentavos || 0), 0);
  return Math.max(0, somaItens + (ajusteCentavos || 0));
}
function criarVenda({ itens, ajusteTotalCentavos, registradoPor, data: data2 }) {
  const totalCentavos = calcularVenda(itens, ajusteTotalCentavos);
  return {
    id: gerarId("v", data2),
    tipo: "venda",
    registradoPor,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    itens,
    ajusteTotalCentavos: ajusteTotalCentavos || 0,
    totalCentavos
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

// src/storage.js
var K_DIA = "dia:";
var K_META = "app:meta";
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

// scratch/test-venda.mjs
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
var d0 = recalcular(novoDia(data, 1e4, "funcionario"));
abrirDia(d0);
var venda = criarVenda({
  itens: [
    { material: "Papel\xE3o", quantidade: "80 kg", valorCentavos: 4e3 },
    { material: "Sucata mista", quantidade: "", valorCentavos: 1200 }
  ],
  ajusteTotalCentavos: 0,
  registradoPor: "funcionario",
  data
});
checa("venda total = 5200 (40+12)", venda.totalCentavos === 5200, `total=${venda.totalCentavos}`);
checa("venda guarda quantidade e valorCentavos", venda.itens[0].quantidade === "80 kg" && venda.itens[0].valorCentavos === 4e3);
var d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, venda] });
salvarDia(d1);
checa("saldo ap\xF3s venda = 15200", d1.saldoEsperadoCentavos === 15200, `saldo=${d1.saldoEsperadoCentavos}`);
var venda2 = criarVenda({
  itens: [{ material: "Metal", quantidade: "", valorCentavos: 1e3 }],
  ajusteTotalCentavos: -200,
  registradoPor: "funcionario",
  data
});
checa("venda com ajuste -200 \u2192 total 800", venda2.totalCentavos === 800, `total=${venda2.totalCentavos}`);
var venda3 = criarVenda({
  itens: [],
  ajusteTotalCentavos: -500,
  registradoPor: "funcionario",
  data
});
checa("calcularVenda clamp em 0", venda3.totalCentavos === 0, `total=${venda3.totalCentavos}`);
var rec = carregarDiaAberto();
checa("reload mant\xE9m venda", rec?.movimentacoes.length === 1 && rec?.movimentacoes[0].tipo === "venda");
checa("reload recalcula saldo = 15200", rec?.saldoEsperadoCentavos === 15200, `saldo=${rec?.saldoEsperadoCentavos}`);
console.log(falhas === 0 ? "\nTUDO OK" : `
${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
