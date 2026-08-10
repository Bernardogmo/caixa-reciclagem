// src/dia.js
var CEDULAS = [1e4, 5e3, 2e3, 1e3, 500, 200];
var MOEDAS = [100, 50, 25, 10, 5];
var formatadorReal = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
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
function calcularCompra({ pesoKg, precoPorKgCentavos, descontoCentavos }) {
  const bruto = Math.round(pesoKg * precoPorKgCentavos);
  return Math.max(0, bruto - (descontoCentavos || 0));
}
function criarCompra({ material, pesoKg, precoPorKgCentavos, descontoCentavos, registradoPor, data: data2 }) {
  return {
    id: gerarId("c", data2),
    tipo: "compra",
    registradoPor,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    material,
    pesoKg,
    precoPorKgCentavos,
    // fotocopiado na hora — editar tabela depois não muda histórico
    descontoCentavos: descontoCentavos || 0,
    valorCentavos: calcularCompra({ pesoKg, precoPorKgCentavos, descontoCentavos })
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
function quebraVazia() {
  const ceds = {};
  CEDULAS.forEach((c) => ceds[c] = 0);
  const moedas = {};
  MOEDAS.forEach((c) => moedas[c] = 0);
  return { cedulas: ceds, moedas, totalCentavos: 0 };
}

// src/storage.js
var K_DIA = "dia:";
var K_META = "app:meta";
var K_INDICE = "indice-dias";
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
function abrirDia(dia) {
  salvarDia(dia);
  const meta = carregarMeta();
  meta.diaAberto = dia.data;
  salvarMeta(meta);
}
function fecharDia(dia) {
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
function reabrirDia(data2) {
  const indice = carregarIndiceDias();
  salvarIndiceDias(indice.filter((d2) => d2 !== data2));
  const meta = carregarMeta();
  meta.diaAberto = data2;
  salvarMeta(meta);
}
function carregarIndiceDias() {
  return lerJSON(K_INDICE, []);
}
function salvarIndiceDias(arr) {
  gravarJSON(K_INDICE, arr);
}

// scratch/test-reabrir.mjs
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
var data = "2026-08-09";
var d = recalcular(novoDia(data, 1e4, "dono"));
abrirDia(d);
var c1 = criarCompra({ material: "Papel\xE3o", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c1] });
var v1 = criarVenda({
  itens: [
    { material: "Papel\xE3o", quantidade: "80", valorCentavos: 4e3 },
    { material: "Sucata mista", quantidade: "", valorCentavos: 1200 }
  ],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, v1] });
salvarDia(d);
checa("saldo antes de fechar = 12200", d.saldoEsperadoCentavos === 12200, `saldo=${d.saldoEsperadoCentavos}`);
var q = quebraVazia();
q.cedulas[1e4] = 1;
q.cedulas[2e3] = 1;
q.moedas[100] = 2;
var fechado = recalcular({ ...d, status: "fechado", quebraDeCaixa: q, fechadoEm: (/* @__PURE__ */ new Date()).toISOString(), fechadoPor: "dono" });
fecharDia(fechado);
checa("fechou com dif 0", fechado.diferencaCentavos === 0);
checa("dia est\xE1 no indice-dias", carregarIndiceDias().includes(data));
reabrirDia(data);
var base = carregarDia(data);
var reaberto = recalcular({ ...base, status: "reaberto", quebraDeCaixa: null, fechadoEm: null, fechadoPor: null });
salvarDia(reaberto);
checa("reabrir tira do indice", !carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));
checa("reabrir volta pra diaAberto", carregarMeta().diaAberto === data);
checa("status = reaberto (habilita excluir)", reaberto.status === "reaberto");
checa("quebra limpa no reaberto", reaberto.quebraDeCaixa === null);
checa("saldo mantido ap\xF3s reabrir", reaberto.saldoEsperadoCentavos === 12200, `saldo=${reaberto.saldoEsperadoCentavos}`);
var semVenda = recalcular({ ...reaberto, movimentacoes: reaberto.movimentacoes.filter((m) => m.id !== v1.id) });
salvarDia(semVenda);
checa("excluir venda \u2192 saldo 7000", semVenda.saldoEsperadoCentavos === 7e3, `saldo=${semVenda.saldoEsperadoCentavos}`);
var q2 = quebraVazia();
q2.cedulas[5e3] = 1;
q2.cedulas[2e3] = 1;
var refechado = recalcular({ ...semVenda, status: "fechado", quebraDeCaixa: q2, fechadoEm: (/* @__PURE__ */ new Date()).toISOString(), fechadoPor: "dono" });
fecharDia(refechado);
checa("re-fechou com dif 0", refechado.diferencaCentavos === 0, `dif=${refechado.diferencaCentavos}`);
checa("dia volta pro indice-dias", carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));
var lista = carregarIndiceDias().map((d2) => carregarDia(d2)).filter(Boolean).sort((a, b) => b.data.localeCompare(a.data));
checa("lista tem o dia com diferencaCentavos", lista.length === 1 && lista[0].diferencaCentavos === 0, JSON.stringify(lista.map((x) => x.data)));
console.log(falhas === 0 ? "\nTUDO OK" : `
${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
