// ===== Núcleo puro da Coleta do Shopping =====
// Módulo separado do caixa: registra kg por material recolhidos no shopping e
// fecha por mês (kg × preço de contrato). Mês fechado fica travado — não reabre.
// Sem side-effects, sem import de storage/React. Dinheiro em centavos inteiros.
import { gerarId, hojeISO } from "./dia";

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function mesAtualISO() {
  return hojeISO().slice(0, 7);
}

// "2026-11" → "Novembro de 2026"
export function rotuloMes(mes) {
  const [ano, m] = mes.split("-").map(Number);
  const nome = MESES[m - 1] || "";
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${ano}`;
}

// "2026-01" → "2025-12" | "2026-12" → "2027-01"
export function mesAnterior(mes) {
  const [ano, m] = mes.split("-").map(Number);
  const a = m === 1 ? ano - 1 : ano;
  const mm = m === 1 ? 12 : m - 1;
  return `${a}-${String(mm).padStart(2, "0")}`;
}

export function mesSeguinte(mes) {
  const [ano, m] = mes.split("-").map(Number);
  const a = m === 12 ? ano + 1 : ano;
  const mm = m === 12 ? 1 : m + 1;
  return `${a}-${String(mm).padStart(2, "0")}`;
}

export function primeiroDiaDoMes(mes) {
  return `${mes}-01`;
}

// "2026-02" → "2026-02-28"
export function ultimoDiaDoMes(mes) {
  const [ano, m] = mes.split("-").map(Number);
  const d = new Date(ano, m, 0).getDate(); // dia 0 do mês seguinte
  return `${mes}-${String(d).padStart(2, "0")}`;
}

// Mês ainda sem nenhum dado salvo.
export function novoMes(mes) {
  return {
    version: 1,
    mes,
    status: "aberto",
    coletas: [],
    fechadoEm: null,
    fechadoPor: null,
    // Preços de contrato congelados no fechamento: mudar a tabela depois não
    // altera um mês já fechado.
    precosCongelados: null,
  };
}

// Itens do formulário → registros de coleta. Mesmo timestamp para o lote.
export function criarColetas(itens, registradoPor) {
  const agora = new Date().toISOString();
  return itens.map((i) => ({
    id: gerarId("sh", i.data),
    data: i.data,
    material: i.material,
    pesoKg: i.pesoKg,
    registradoPor,
    registradoEm: agora,
  }));
}

// Coletas em ordem cronológica (data e depois hora do registro).
export function coletasOrdenadas(mes) {
  return [...mes.coletas].sort((a, b) =>
    `${a.data}${a.registradoEm}`.localeCompare(`${b.data}${b.registradoEm}`)
  );
}

function precosDoMes(mes, tabela) {
  if (mes.status === "fechado" && mes.precosCongelados && typeof mes.precosCongelados === "object") {
    return mes.precosCongelados;
  }
  const mapa = {};
  for (const m of tabela || []) mapa[m.nome] = m.precoPorKgCentavos;
  return mapa;
}

// Deriva totais por material, kg total e valor a pagar. O mês fechado usa os
// preços congelados no fechamento; o aberto usa a tabela atual do shopping.
export function recalcularMes(mes, tabela) {
  const base = { ...novoMes(mes.mes), ...mes };
  const coletas = Array.isArray(base.coletas)
    ? base.coletas.filter((c) => c && c.material && Number.isFinite(c.pesoKg) && c.pesoKg > 0)
    : [];

  const precos = precosDoMes(base, tabela);
  const kgPorMaterial = new Map();
  for (const c of coletas) {
    kgPorMaterial.set(c.material, (kgPorMaterial.get(c.material) || 0) + c.pesoKg);
  }

  // Ordem da tabela de preços; material que saiu da tabela vai para o fim.
  const ordem = (tabela || []).map((m) => m.nome);
  const nomes = [...kgPorMaterial.keys()].sort((a, b) => {
    const ia = ordem.indexOf(a);
    const ib = ordem.indexOf(b);
    if (ia !== ib) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.localeCompare(b);
  });

  const totais = nomes.map((material) => {
    const pesoKg = kgPorMaterial.get(material);
    const precoPorKgCentavos = precos[material] ?? 0;
    return { material, pesoKg, precoPorKgCentavos, valorCentavos: Math.round(pesoKg * precoPorKgCentavos) };
  });

  return {
    ...base,
    coletas,
    totais,
    kgTotal: totais.reduce((s, t) => s + t.pesoKg, 0),
    valorTotalCentavos: totais.reduce((s, t) => s + t.valorCentavos, 0),
  };
}

// Fecha o mês: congela os preços da tabela atual e trava as edições.
export function fecharMes(mes, por, tabela) {
  const precosCongelados = {};
  for (const m of tabela || []) precosCongelados[m.nome] = m.precoPorKgCentavos;
  return recalcularMes(
    {
      ...mes,
      status: "fechado",
      precosCongelados,
      fechadoEm: new Date().toISOString(),
      fechadoPor: por,
    },
    tabela
  );
}
