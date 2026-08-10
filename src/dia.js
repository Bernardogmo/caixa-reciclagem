// ===== Núcleo puro do dia de caixa =====
// Sem side-effects, sem import de storage/React. Dinheiro SEMPRE em centavos inteiros.

// Cédulas e moedas da quebra de caixa, em centavos.
export const CEDULAS = [10000, 5000, 2000, 1000, 500, 200];
export const MOEDAS = [100, 50, 25, 10, 5];

const formatadorReal = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// 123456 → "R$ 1.234,56"
export function centavosParaReal(c) {
  return formatadorReal.format(c / 100);
}

// "R$ 70,00" | "70,00" | "70.00" | "70" → 7000. Aceita vazio → NaN.
export function realParaCentavos(str) {
  if (str == null) return NaN;
  const limpo = String(str).replace(/R\$/g, "").trim();
  if (limpo === "") return NaN;
  let valor;
  if (limpo.includes(",")) {
    // formato brasileiro: remove pontos (milhar) e troca vírgula pelo ponto decimal
    valor = parseFloat(limpo.replace(/\./g, "").replace(",", "."));
  } else {
    // ponto (se houver) é separador decimal; número puro também
    valor = parseFloat(limpo);
  }
  return Math.round(valor * 100);
}

// -400 → "R$ -4,00" (Intl gera "-R$ 4,00"; aqui o sinal fica depois do R$)
export function centavosParaRealComSinal(c) {
  return (c < 0 ? "-" : "") + centavosParaReal(Math.abs(c));
}

// "funcionario" → "Funcionário(a)", "dono" → "Dono(a)"
export function rotuloPerfil(p) {
  return p === "dono" ? "Dono(a)" : "Funcionário(a)";
}

// "5,0" | "5.0" → 5.0 (float apenas para exibição/leitura; dinheiro nunca deriva dele direto).
export function parsePeso(str) {
  if (str == null) return NaN;
  const limpo = String(str).replace(",", ".").trim();
  if (limpo === "") return NaN;
  return parseFloat(limpo);
}

export function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// "2026-08-14" → "sexta, 14/08"
export function formatarData(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const d = new Date(ano, mes - 1, dia);
  const nome = d.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${nome}, ${String(dia).padStart(2, "0")}/${String(mes).padStart(2, "0")}`;
}

// "2026-08-14" → "14/08/2026"
export function formatarDataCurta(iso) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

// "2026-08-14" → "sexta" (nome curto do dia da semana)
export function nomeDiaSemana(iso) {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia).toLocaleDateString("pt-BR", { weekday: "long" });
}

// 100 → "100,0" | 12.75 → "12,75" (decimal pt-BR, sempre ≥1 casa)
export function formatarPeso(pesoKg) {
  return pesoKg.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 3 });
}

// timestamp ISO → "08:30"
export function formatarHora(iso) {
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

let contadorId = 0;

// ID estável para key/exclusão: "c-20260814-0830-1"
export function gerarId(tipo, dataISO) {
  const agora = new Date();
  const compacto = dataISO.replace(/-/g, "");
  const hh = String(agora.getHours()).padStart(2, "0");
  const mm = String(agora.getMinutes()).padStart(2, "0");
  contadorId += 1;
  return `${tipo}-${compacto}-${hh}${mm}-${contadorId}`;
}

export function novoDia(data, caixaInicialCentavos, perfil) {
  return {
    version: 1,
    data,
    status: "aberto",
    perfilAbertura: perfil,
    caixaInicialCentavos,
    movimentacoes: [],
    quebraDeCaixa: null,
    abertoEm: new Date().toISOString(),
    abertoPor: perfil,
    fechadoEm: null,
    fechadoPor: null,
  };
}

// peso × preço − desconto, nunca abaixo de zero. Math.round absorve float (0.1*30 = 3.0000000004).
export function calcularCompra({ pesoKg, precoPorKgCentavos, descontoCentavos }) {
  const bruto = Math.round(pesoKg * precoPorKgCentavos);
  return Math.max(0, bruto - (descontoCentavos || 0));
}

// "  João  " → "João"; vazio/undefined → null (anônimo)
function limparNome(nome) {
  const t = String(nome == null ? "" : nome).trim();
  return t === "" ? null : t;
}

// Compra multi-material de uma mesma pessoa (opcional): itens[] com peso/preço/desconto.
// precoPorKgCentavos fotocopiado por item — editar a tabela depois não muda histórico.
export function criarCompra({ pessoa, itens, registradoPor, data }) {
  const itensComValor = itens.map((i) => ({
    material: i.material,
    pesoKg: i.pesoKg,
    precoPorKgCentavos: i.precoPorKgCentavos,
    descontoCentavos: i.descontoCentavos || 0,
    valorCentavos: calcularCompra({ pesoKg: i.pesoKg, precoPorKgCentavos: i.precoPorKgCentavos, descontoCentavos: i.descontoCentavos }),
  }));
  return {
    id: gerarId("c", data),
    tipo: "compra",
    registradoPor,
    timestamp: new Date().toISOString(),
    pessoa: limparNome(pessoa),
    itens: itensComValor,
    totalCentavos: itensComValor.reduce((s, i) => s + i.valorCentavos, 0),
  };
}

export function calcularVenda(itens, ajusteCentavos) {
  const somaItens = itens.reduce((s, i) => s + (i.valorCentavos || 0), 0);
  return Math.max(0, somaItens + (ajusteCentavos || 0));
}

export function criarVenda({ pessoa, itens, ajusteTotalCentavos, registradoPor, data }) {
  const totalCentavos = calcularVenda(itens, ajusteTotalCentavos);
  return {
    id: gerarId("v", data),
    tipo: "venda",
    registradoPor,
    timestamp: new Date().toISOString(),
    pessoa: limparNome(pessoa),
    itens,
    ajusteTotalCentavos: ajusteTotalCentavos || 0,
    totalCentavos,
  };
}

export function criarOutra({ direcao, descricao, valorCentavos, registradoPor, data }) {
  return {
    id: gerarId("o", data),
    tipo: "outra",
    registradoPor,
    timestamp: new Date().toISOString(),
    direcao, // "entrada" | "saida"
    descricao,
    valorCentavos,
  };
}

// caixa inicial + entradas − saídas
export function calcularSaldoEsperado(dia) {
  let saldo = dia.caixaInicialCentavos;
  for (const m of dia.movimentacoes) {
    if (m.tipo === "compra") saldo -= m.totalCentavos ?? m.valorCentavos ?? 0;
    else if (m.tipo === "venda") saldo += m.totalCentavos;
    else if (m.tipo === "outra") saldo += m.direcao === "entrada" ? m.valorCentavos : -m.valorCentavos;
  }
  return saldo;
}

// chaves de quebra em centavos: {cedulas:{10000:2}, moedas:{100:5}}
export function calcularQuebraTotal(quebra) {
  const soma = (obj) =>
    Object.entries(obj || {}).reduce((s, [chave, qtd]) => s + Number(chave) * Number(qtd || 0), 0);
  return soma(quebra?.cedulas) + soma(quebra?.moedas);
}

export function calcularDiferenca(contado, esperado) {
  return contado - esperado;
}

// TOTAIS por material, agrupados e ordenados por valor decrescente.
// Retorna { compras: [{material, pesoKg, valorCentavos}], vendas: [{material, quantidade, valorCentavos}] }
export function totaisPorMaterial(dia) {
  const agrupar = (lista) => {
    const mapa = new Map();
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
      for (const item of m.itens) {
        compras.push({ material: item.material, pesoKg: item.pesoKg, valorCentavos: item.valorCentavos });
      }
    } else if (m.tipo === "venda") {
      for (const item of m.itens) {
        vendas.push({ material: item.material, quantidade: item.quantidade, valorCentavos: item.valorCentavos });
      }
    }
  }
  return { compras: agrupar(compras), vendas: agrupar(vendas) };
}

// Recálculo: retorna clone com os derivados atualizados. NUNCA confia no que está salvo.
// Shim de migração: compra antiga (material/peso no corpo) → forma nova com itens[].
// Idempotente — cobre dias salvos antes da regra multi-material, sem quebrar nada.
function normalizarMov(m) {
  if (m.tipo !== "compra" || m.itens) return m;
  return {
    ...m,
    pessoa: null,
    itens: [
      {
        material: m.material,
        pesoKg: m.pesoKg,
        precoPorKgCentavos: m.precoPorKgCentavos,
        descontoCentavos: m.descontoCentavos || 0,
        valorCentavos: m.valorCentavos,
      },
    ],
    totalCentavos: m.valorCentavos,
  };
}

export function recalcular(dia) {
  const novo = { ...dia, movimentacoes: dia.movimentacoes.map(normalizarMov) };
  novo.saldoEsperadoCentavos = calcularSaldoEsperado(novo);
  if (novo.quebraDeCaixa) {
    novo.quebraDeCaixa = {
      ...novo.quebraDeCaixa,
      totalCentavos: calcularQuebraTotal(novo.quebraDeCaixa),
    };
    novo.diferencaCentavos = calcularDiferenca(novo.quebraDeCaixa.totalCentavos, novo.saldoEsperadoCentavos);
  }
  return novo;
}

export function quebraVazia() {
  const ceds = {};
  CEDULAS.forEach((c) => (ceds[c] = 0));
  const moedas = {};
  MOEDAS.forEach((c) => (moedas[c] = 0));
  return { cedulas: ceds, moedas: moedas, totalCentavos: 0 };
}

// "Papelão 100,0 kg × R$ 0,30 = R$ 30,00 (desconto R$ 2,00 → R$ 48,00)"
function descricaoItemCompra(i) {
  const bruto = i.valorCentavos + i.descontoCentavos;
  return `${i.material} ${formatarPeso(i.pesoKg)} kg × ${centavosParaReal(i.precoPorKgCentavos)} = ${centavosParaReal(bruto)}${i.descontoCentavos ? ` (desconto ${centavosParaReal(i.descontoCentavos)} → ${centavosParaReal(i.valorCentavos)})` : ""}`;
}

function descricaoMov(m) {
  if (m.tipo === "compra") {
    return m.itens.map(descricaoItemCompra).join(" | ");
  }
  if (m.tipo === "venda") {
    return m.itens.map((i) => `${i.material}${i.quantidade ? ` ${i.quantidade}` : ""} = ${centavosParaReal(i.valorCentavos)}`).join(" | ");
  }
  if (m.tipo === "outra") return `${m.direcao === "entrada" ? "Entrada" : "Saída"}: ${m.descricao} ${m.direcao === "entrada" ? "+" : "-"} ${centavosParaReal(m.valorCentavos)}`;
  return "";
}

function linhaDiferenca(dif) {
  if (dif > 0) return `+${centavosParaReal(dif)} (SOBRA)`;
  if (dif < 0) return `−${centavosParaReal(Math.abs(dif))} (FALTA)`;
  return `R$ 0,00 ✔`;
}

// nome trimmed || null; anônimos por último, senão ordem pt-BR
function compararPessoas(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b, "pt-BR");
}

// Agrupa lançamentos por pessoa (null = anônimo). Ordenado por nome pt-BR, anônimo por último.
function agruparPorPessoa(movs) {
  const grupos = new Map();
  for (const m of movs) {
    const pessoa = m.pessoa || null;
    if (!grupos.has(pessoa)) grupos.set(pessoa, []);
    grupos.get(pessoa).push(m);
  }
  return [...grupos.entries()]
    .map(([pessoa, movsDoGrupo]) => ({ pessoa, movs: movsDoGrupo }))
    .sort((a, b) => compararPessoas(a.pessoa, b.pessoa));
}

// Cards do resumo: compras e vendas de cada pessoa (nome | null = anônimo).
export function pessoasDoDia(dia) {
  const porPessoa = new Map();
  for (const m of dia.movimentacoes) {
    if (m.tipo !== "compra" && m.tipo !== "venda") continue;
    const pessoa = m.pessoa || null;
    const atual = porPessoa.get(pessoa) || { pessoa, compras: [], vendas: [], totalComprasCentavos: 0, totalVendasCentavos: 0 };
    if (m.tipo === "compra") {
      atual.compras.push(m);
      atual.totalComprasCentavos += m.totalCentavos;
    } else {
      atual.vendas.push(m);
      atual.totalVendasCentavos += m.totalCentavos;
    }
    porPessoa.set(pessoa, atual);
  }
  return [...porPessoa.values()].sort((a, b) => compararPessoas(a.pessoa, b.pessoa));
}

// Texto PT-BR pronto pro WhatsApp.
export function gerarTextoResumo(dia) {
  const r = recalcular(dia);
  const compras = r.movimentacoes.filter((m) => m.tipo === "compra");
  const vendas = r.movimentacoes.filter((m) => m.tipo === "venda");
  const outras = r.movimentacoes.filter((m) => m.tipo === "outra");
  const totais = totaisPorMaterial(r);

  const soma = (lista, campo) => lista.reduce((s, m) => s + (campo === "outra" ? (m.direcao === "entrada" ? m.valorCentavos : -m.valorCentavos) : m[campo]), 0);

  const linhas = [];
  linhas.push(`*RESUMO DO DIA — ${formatarDataCurta(r.data)} (${nomeDiaSemana(r.data)})*`);
  const abriu = `Aberto às ${formatarHora(r.abertoEm)}`;
  const fechou = r.fechadoEm
    ? ` | Fechado às ${formatarHora(r.fechadoEm)} por ${rotuloPerfil(r.fechadoPor)}`
    : " | (em aberto)";
  linhas.push(`${abriu}${fechou}`);
  linhas.push("");
  linhas.push(`CAIXA INICIAL: ${centavosParaReal(r.caixaInicialCentavos)}`);
  linhas.push("");

  if (compras.length) {
    linhas.push(`*COMPRAS* (${compras.length}) — total ${centavosParaReal(soma(compras, "totalCentavos"))}`);
    for (const g of agruparPorPessoa(compras)) {
      linhas.push(`*${g.pessoa || "Sem nome"}*`);
      for (const m of g.movs) {
        for (const i of m.itens) linhas.push(`- ${descricaoItemCompra(i)}`);
      }
    }
    linhas.push("");
  }
  if (vendas.length) {
    linhas.push(`*VENDAS* (${vendas.length}) — total ${centavosParaReal(soma(vendas, "totalCentavos"))}`);
    for (const g of agruparPorPessoa(vendas)) {
      linhas.push(`*${g.pessoa || "Sem nome"}*`);
      for (const m of g.movs) linhas.push(`- ${descricaoMov(m)}`);
    }
    linhas.push("");
  }
  if (outras.length) {
    linhas.push(`*OUTRAS* (${outras.length}) — total ${centavosParaRealComSinal(soma(outras, "outra"))}`);
    outras.forEach((m) => linhas.push(`- ${formatarHora(m.timestamp)} ${descricaoMov(m)}`));
    linhas.push("");
  }

  if (totais.compras.length || totais.vendas.length) {
    linhas.push(`*TOTAIS POR MATERIAL*`);
    if (totais.compras.length) {
      linhas.push(`Compras: ${totais.compras.map((t) => `${t.material}${t.pesoKg != null ? ` ${t.pesoKg} kg` : ""} ${centavosParaReal(t.valorCentavos)}`).join(" | ")}`);
    }
    if (totais.vendas.length) {
      linhas.push(`Vendas: ${totais.vendas.map((t) => `${t.material}${t.quantidade != null ? ` ${t.quantidade}` : ""} ${centavosParaReal(t.valorCentavos)}`).join(" | ")}`);
    }
    linhas.push("");
  }

  if (r.quebraDeCaixa) {
    linhas.push(`*QUEBRA (CONTADO):* ${centavosParaReal(r.quebraDeCaixa.totalCentavos)}`);
  }
  linhas.push(`*SALDO ESPERADO:* ${centavosParaReal(r.saldoEsperadoCentavos)}`);
  linhas.push(`*DIFERENÇA:* ${linhaDiferenca(r.diferencaCentavos)}`);

  return linhas.join("\n");
}
