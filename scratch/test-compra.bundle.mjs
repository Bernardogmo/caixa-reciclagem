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

// scratch/test-compra.mjs
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
var d0 = recalcular(novoDia(data, 1e4, "dono"));
abrirDia(d0);
checa("dia aberto com saldo 10000", d0.saldoEsperadoCentavos === 1e4, `saldo=${d0.saldoEsperadoCentavos}`);
var compra = criarCompra({
  material: "Papel\xE3o",
  pesoKg: 100,
  precoPorKgCentavos: 30,
  descontoCentavos: 0,
  registradoPor: "dono",
  data
});
checa("compra valor = 3000 (100\xD730)", compra.valorCentavos === 3e3, `valor=${compra.valorCentavos}`);
var d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, compra] });
salvarDia(d1);
checa("saldo ap\xF3s compra = 7000", d1.saldoEsperadoCentavos === 7e3, `saldo=${d1.saldoEsperadoCentavos}`);
var recarregado = carregarDiaAberto();
checa("reload mant\xE9m dia aberto", recarregado != null && recarregado.data === data);
checa("reload recalcula saldo = 7000", recarregado?.saldoEsperadoCentavos === 7e3, `saldo=${recarregado?.saldoEsperadoCentavos}`);
checa("reload mant\xE9m 1 movimenta\xE7\xE3o", recarregado?.movimentacoes.length === 1, `n=${recarregado?.movimentacoes.length}`);
var recMov = recarregado?.movimentacoes[0];
checa("mov \xE9 compra de Papel\xE3o", recMov?.material === "Papel\xE3o" && recMov?.tipo === "compra");
checa("pre\xE7o fotocopiado na compra", recMov?.precoPorKgCentavos === 30);
var direto = carregarDia(data);
checa("carregarDia recalcula saldo = 7000", direto?.saldoEsperadoCentavos === 7e3, `saldo=${direto?.saldoEsperadoCentavos}`);
console.log(falhas === 0 ? "\nTUDO OK" : `
${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
