// src/dia.js
var CEDULAS = [1e4, 5e3, 2e3, 1e3, 500, 200];
var MOEDAS = [100, 50, 25, 10, 5];
var formatadorReal = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});
function centavosParaReal(c) {
  return formatadorReal.format(c / 100);
}
function centavosParaRealComSinal(c) {
  return (c < 0 ? "-" : "") + centavosParaReal(Math.abs(c));
}
function rotuloPerfil(p) {
  return p === "dono" ? "Dono(a)" : "Funcion\xE1rio(a)";
}
function formatarDataCurta(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}
function nomeDiaSemana(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long" });
}
function formatarPeso(pesoKg) {
  return pesoKg.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
}
function formatarHora(iso) {
  const d2 = new Date(iso);
  return String(d2.getHours()).padStart(2, "0") + ":" + String(d2.getMinutes()).padStart(2, "0");
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
function calcularDiferenca(contado3, esperado) {
  return contado3 - esperado;
}
function totaisPorMaterial(dia) {
  const agrupar = (lista) => {
    const mapa = /* @__PURE__ */ new Map();
    for (const item of lista) {
      const chave = item.material || item.descricao || "(sem nome)";
      const atual = mapa.get(chave) || { material: chave, valorCentavos: 0 };
      atual.valorCentavos += item.valorCentavos || 0;
      if (item.pesoKg != null) atual.pesoKg = (atual.pesoKg || 0) + item.pesoKg;
      if (item.quantidade != null) atual.quantidade = (atual.quantidade || 0) + item.quantidade;
      mapa.set(chave, atual);
    }
    return [...mapa.values()].sort((a, b) => b.valorCentavos - a.valorCentavos);
  };
  const compras = [];
  const vendas = [];
  for (const m of dia.movimentacoes) {
    if (m.tipo === "compra") {
      compras.push({ material: m.material, pesoKg: m.pesoKg, valorCentavos: m.valorCentavos });
    } else if (m.tipo === "venda") {
      for (const item of m.itens) {
        vendas.push({ material: item.material, quantidade: item.quantidade, valorCentavos: item.valorCentavos });
      }
    }
  }
  return { compras: agrupar(compras), vendas: agrupar(vendas) };
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
function descricaoMov(m) {
  if (m.tipo === "compra") {
    const bruto = m.valorCentavos + m.descontoCentavos;
    return `${m.material} ${formatarPeso(m.pesoKg)} kg \xD7 ${centavosParaReal(m.precoPorKgCentavos)} = ${centavosParaReal(bruto)}${m.descontoCentavos ? ` (desconto ${centavosParaReal(m.descontoCentavos)} \u2192 ${centavosParaReal(m.valorCentavos)})` : ""}`;
  }
  if (m.tipo === "venda") {
    return m.itens.map((i) => `${i.material}${i.quantidade ? ` ${i.quantidade}` : ""} = ${centavosParaReal(i.valorCentavos)}`).join(" | ");
  }
  if (m.tipo === "outra") return `${m.direcao === "entrada" ? "Entrada" : "Sa\xEDda"}: ${m.descricao} ${m.direcao === "entrada" ? "+" : "-"} ${centavosParaReal(m.valorCentavos)}`;
  return "";
}
function linhaDiferenca(dif) {
  if (dif > 0) return `+${centavosParaReal(dif)} (SOBRA)`;
  if (dif < 0) return `\u2212${centavosParaReal(Math.abs(dif))} (FALTA)`;
  return `R$ 0,00 \u2714`;
}
function gerarTextoResumo(dia) {
  const r = recalcular(dia);
  const compras = r.movimentacoes.filter((m) => m.tipo === "compra");
  const vendas = r.movimentacoes.filter((m) => m.tipo === "venda");
  const outras = r.movimentacoes.filter((m) => m.tipo === "outra");
  const totais = totaisPorMaterial(r);
  const soma = (lista, campo) => lista.reduce((s, m) => s + (campo === "outra" ? m.direcao === "entrada" ? m.valorCentavos : -m.valorCentavos : m[campo]), 0);
  const linhas = [];
  linhas.push(`*RESUMO DO DIA \u2014 ${formatarDataCurta(r.data)} (${nomeDiaSemana(r.data)})*`);
  const abriu = `Aberto \xE0s ${formatarHora(r.abertoEm)}`;
  const fechou = r.fechadoEm ? ` | Fechado \xE0s ${formatarHora(r.fechadoEm)} por ${rotuloPerfil(r.fechadoPor)}` : " | (em aberto)";
  linhas.push(`${abriu}${fechou}`);
  linhas.push("");
  linhas.push(`CAIXA INICIAL: ${centavosParaReal(r.caixaInicialCentavos)}`);
  linhas.push("");
  if (compras.length) {
    linhas.push(`*COMPRAS* (${compras.length}) \u2014 total ${centavosParaReal(soma(compras, "valorCentavos"))}`);
    compras.forEach((m) => linhas.push(`- ${formatarHora(m.timestamp)} ${descricaoMov(m)}`));
    linhas.push("");
  }
  if (vendas.length) {
    linhas.push(`*VENDAS* (${vendas.length}) \u2014 total ${centavosParaReal(soma(vendas, "totalCentavos"))}`);
    vendas.forEach((m) => linhas.push(`- ${formatarHora(m.timestamp)} ${descricaoMov(m)}`));
    linhas.push("");
  }
  if (outras.length) {
    linhas.push(`*OUTRAS* (${outras.length}) \u2014 total ${centavosParaRealComSinal(soma(outras, "outra"))}`);
    outras.forEach((m) => linhas.push(`- ${formatarHora(m.timestamp)} ${descricaoMov(m)}`));
    linhas.push("");
  }
  if (totais.compras.length || totais.vendas.length) {
    linhas.push(`*TOTAIS POR MATERIAL*`);
    if (totais.compras.length) {
      linhas.push(`Compras: ${totais.compras.map((t2) => `${t2.material}${t2.pesoKg != null ? ` ${t2.pesoKg} kg` : ""} ${centavosParaReal(t2.valorCentavos)}`).join(" | ")}`);
    }
    if (totais.vendas.length) {
      linhas.push(`Vendas: ${totais.vendas.map((t2) => `${t2.material}${t2.quantidade != null ? ` ${t2.quantidade}` : ""} ${centavosParaReal(t2.valorCentavos)}`).join(" | ")}`);
    }
    linhas.push("");
  }
  if (r.quebraDeCaixa) {
    linhas.push(`*QUEBRA (CONTADO):* ${centavosParaReal(r.quebraDeCaixa.totalCentavos)}`);
  }
  linhas.push(`*SALDO ESPERADO:* ${centavosParaReal(r.saldoEsperadoCentavos)}`);
  linhas.push(`*DIFEREN\xC7A:* ${linhaDiferenca(r.diferencaCentavos)}`);
  return linhas.join("\n");
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
function carregarIndiceDias() {
  return lerJSON(K_INDICE, []);
}
function salvarIndiceDias(arr) {
  gravarJSON(K_INDICE, arr);
}

// scratch/test-fechamento.mjs
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
checa("caixa inicial R$ 100 \u2192 saldo 10000", d.saldoEsperadoCentavos === 1e4);
var c1 = criarCompra({ material: "Papel\xE3o", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c1] });
salvarDia(d);
checa("compra Papel\xE3o 100kg\xD730 \u2192 saldo 7000", d.saldoEsperadoCentavos === 7e3, `saldo=${d.saldoEsperadoCentavos}`);
var c2 = criarCompra({ material: "Latinha", pesoKg: 10, precoPorKgCentavos: 500, descontoCentavos: 200, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c2] });
salvarDia(d);
checa("compra Latinha 48 \u2192 saldo 2200", d.saldoEsperadoCentavos === 2200 && c2.valorCentavos === 4800, `saldo=${d.saldoEsperadoCentavos}`);
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
checa("venda R$ 52 \u2192 saldo 7400", d.saldoEsperadoCentavos === 7400 && v1.totalCentavos === 5200, `saldo=${d.saldoEsperadoCentavos}`);
var o1 = criarOutra({ direcao: "saida", descricao: "frete at\xE9 o comprador", valorCentavos: 1e3, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o1] });
var o2 = criarOutra({ direcao: "entrada", descricao: "devolu\xE7\xE3o", valorCentavos: 600, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o2] });
salvarDia(d);
checa("sa\xEDda 10 + entrada 6 \u2192 saldo 7000", d.saldoEsperadoCentavos === 7e3, `saldo=${d.saldoEsperadoCentavos}`);
var q = quebraVazia();
q.cedulas[5e3] = 1;
q.cedulas[2e3] = 1;
var contado = calcularQuebraTotal(q);
checa("quebra 1\xD750 + 1\xD720 = 7000", contado === 7e3, `contado=${contado}`);
checa("diferen\xE7a = 0", calcularDiferenca(contado, d.saldoEsperadoCentavos) === 0);
var fechado = recalcular({ ...d, status: "fechado", quebraDeCaixa: q, fechadoEm: (/* @__PURE__ */ new Date()).toISOString(), fechadoPor: "dono" });
checa("fechado.quebra.totalCentavos = 7000", fechado.quebraDeCaixa.totalCentavos === 7e3);
checa("fechado.diferencaCentavos = 0", fechado.diferencaCentavos === 0, `dif=${fechado.diferencaCentavos}`);
fecharDia(fechado);
checa("fecharDia limpa diaAberto", carregarMeta().diaAberto === null);
checa("dia vai pro indice-dias", carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));
var texto = gerarTextoResumo(fechado);
var t = texto.replace(/[  ]/g, " ");
checa("cabe\xE7alho RESUMO DO DIA", t.includes("*RESUMO DO DIA \u2014 09/08/2026 (domingo)*"), t.split("\n")[0]);
checa("tem COMPRAS total R$ 78,00", t.includes("*COMPRAS* (2) \u2014 total R$ 78,00"));
checa("tem VENDAS total R$ 52,00", t.includes("*VENDAS* (1) \u2014 total R$ 52,00"));
checa("tem OUTRAS total -R$ 4,00", t.includes("*OUTRAS* (2) \u2014 total -R$ 4,00"));
checa("linha da diferen\xE7a R$ 0,00 \u2714", t.includes("*DIFEREN\xC7A:* R$ 0,00 \u2714"));
checa("DESCONTO aparece na compra", t.includes("(desconto R$ 2,00 \u2192 R$ 48,00)"));
var q2 = quebraVazia();
q2.cedulas[5e3] = 1;
q2.cedulas[1e3] = 1;
q2.moedas[100] = 9;
var contado2 = calcularQuebraTotal(q2);
var fechado2 = recalcular({ ...fechado, quebraDeCaixa: q2 });
checa("troco real: 6900 contado, FALTA R$ 1,00", fechado2.diferencaCentavos === -100, `dif=${fechado2.diferencaCentavos}`);
console.log(falhas === 0 ? "\nTUDO OK" : `
${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
