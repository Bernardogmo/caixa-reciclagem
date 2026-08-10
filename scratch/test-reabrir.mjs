// Verificação de REABRIR + EXCLUIR (roteiro passo 8) e da lista de dias fechados.
// Fecha com quebra certa → reabre → exclui a venda → re-fecha com a quebra nova → R$ 0 de novo.
// Assinatura nova: compra com itens[]+pessoa, venda com pessoa.
import {
  criarCompra,
  criarVenda,
  novoDia,
  quebraVazia,
  recalcular,
} from "../src/dia";
import {
  abrirDia,
  carregarDia,
  carregarIndiceDias,
  carregarMeta,
  fecharDia,
  reabrirDia,
  salvarDia,
} from "../src/storage";

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
Object.defineProperty(globalThis, "navigator", {
  value: { storage: { persist: async () => true } },
  configurable: true,
});

let falhas = 0;
function checa(nome, cond, detalhe) {
  console.log(`${cond ? "OK " : "FALHOU"} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  if (!cond) falhas++;
}

const data = "2026-08-09";
let d = recalcular(novoDia(data, 10000, "dono"));
abrirDia(d);

// Compra João R$ 30 → saldo 7000; venda Recicle Bem R$ 52 → saldo 12200.
const c1 = criarCompra({
  pessoa: "João",
  itens: [{ material: "Papelão", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0 }],
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c1] });
const v1 = criarVenda({
  pessoa: "Recicle Bem",
  itens: [
    { material: "Papelão", quantidade: "80", valorCentavos: 4000 },
    { material: "Sucata mista", quantidade: "", valorCentavos: 1200 },
  ],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, v1] });
salvarDia(d);
checa("saldo antes de fechar = 12200", d.saldoEsperadoCentavos === 12200, `saldo=${d.saldoEsperadoCentavos}`);

// Fecha com quebra 10000+2000+100+100 = 12200 → dif 0.
const q = quebraVazia();
q.cedulas[10000] = 1;
q.cedulas[2000] = 1;
q.moedas[100] = 2;
const fechado = recalcular({ ...d, status: "fechado", quebraDeCaixa: q, fechadoEm: new Date().toISOString(), fechadoPor: "dono" });
fecharDia(fechado);
checa("fechou com dif 0", fechado.diferencaCentavos === 0);
checa("dia está no indice-dias", carregarIndiceDias().includes(data));

// Reabre (mesma sequência do App.jsx: reabrirDia + status reaberto + quebra limpa).
reabrirDia(data);
const base = carregarDia(data);
const reaberto = recalcular({ ...base, status: "reaberto", quebraDeCaixa: null, fechadoEm: null, fechadoPor: null });
salvarDia(reaberto);
checa("reabrir tira do indice", !carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));
checa("reabrir volta pra diaAberto", carregarMeta().diaAberto === data);
checa("status = reaberto (habilita excluir)", reaberto.status === "reaberto");
checa("quebra limpa no reaberto", reaberto.quebraDeCaixa === null);
checa("saldo mantido após reabrir", reaberto.saldoEsperadoCentavos === 12200, `saldo=${reaberto.saldoEsperadoCentavos}`);

// Exclui a venda (a de Sucata mista: total R$ 52 inteiro) → saldo 7000.
const semVenda = recalcular({ ...reaberto, movimentacoes: reaberto.movimentacoes.filter((m) => m.id !== v1.id) });
salvarDia(semVenda);
checa("excluir venda → saldo 7000", semVenda.saldoEsperadoCentavos === 7000, `saldo=${semVenda.saldoEsperadoCentavos}`);

// Re-fecha com quebra 5000+2000 = 7000 → dif 0 de novo.
const q2 = quebraVazia();
q2.cedulas[5000] = 1;
q2.cedulas[2000] = 1;
const refechado = recalcular({ ...semVenda, status: "fechado", quebraDeCaixa: q2, fechadoEm: new Date().toISOString(), fechadoPor: "dono" });
fecharDia(refechado);
checa("re-fechou com dif 0", refechado.diferencaCentavos === 0, `dif=${refechado.diferencaCentavos}`);
checa("dia volta pro indice-dias", carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));

// Lista de dias fechados (o que o overlay DiasFechados renderiza): cada data → dia com diferença.
const lista = carregarIndiceDias().map((d2) => carregarDia(d2)).filter(Boolean).sort((a, b) => b.data.localeCompare(a.data));
checa("lista tem o dia com diferencaCentavos", lista.length === 1 && lista[0].diferencaCentavos === 0, JSON.stringify(lista.map((x) => x.data)));

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
