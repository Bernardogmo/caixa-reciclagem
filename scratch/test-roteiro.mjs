// Roteiro E2E do plano, com os números EXATOS aprovados, passando pela camada real.
// 100 − 78 − 20 + 40 + 12 − 10 + 6 = 50 → quebra 1×R$50 → dif R$ 0,00.
// REABRIR → excluir venda de Sucata (12,00) → 38,00 → quebra 20+10+5+2+1 → dif R$ 0,00 de novo.
// Venda em 2 lançamentos (pessoa "Recicle Bem") para o passo de exclusão usar a regra do app (movimentação por id).
import { criarCompra, criarOutra, criarVenda, novoDia, quebraVazia, recalcular } from "../src/dia";
import { abrirDia, carregarDia, carregarIndiceDias, carregarMeta, fecharDia, reabrirDia, salvarDia } from "../src/storage";

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
};
Object.defineProperty(globalThis, "navigator", { value: { storage: { persist: async () => true } }, configurable: true });

let falhas = 0;
function checa(nome, cond, detalhe) {
  console.log(`${cond ? "OK " : "FALHOU"} ${nome}${detalhe ? ` — ${detalhe}` : ""}`);
  if (!cond) falhas++;
}

const data = "2026-08-09";
let d = recalcular(novoDia(data, 10000, "dono"));
abrirDia(d);
checa("1. caixa inicial R$ 100,00 → saldo 10000", d.saldoEsperadoCentavos === 10000, `saldo=${d.saldoEsperadoCentavos}`);

// 2. COMPRA João: Papelão 100×0,30=30,00 + Latinha 10×5,00 desc.2,00=48,00 → total 78,00
const cJoao = criarCompra({
  pessoa: "João",
  itens: [
    { material: "Papelão", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0 },
    { material: "Latinha", pesoKg: 10, precoPorKgCentavos: 500, descontoCentavos: 200 },
  ],
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, cJoao] });
checa("2. compra João 2 itens = 7800 → saldo 2200", cJoao.totalCentavos === 7800 && d.saldoEsperadoCentavos === 2200, `total=${cJoao.totalCentavos} saldo=${d.saldoEsperadoCentavos}`);

// 3. COMPRA Maria: Sucata 20×1,00 = 20,00 → saldo 200
const cMaria = criarCompra({
  pessoa: "Maria",
  itens: [{ material: "Sucata", pesoKg: 20, precoPorKgCentavos: 100, descontoCentavos: 0 }],
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, cMaria] });
checa("3. compra Maria = 2000 → saldo 200", cMaria.totalCentavos === 2000 && d.saldoEsperadoCentavos === 200, `saldo=${d.saldoEsperadoCentavos}`);

// 4. VENDA Recicle Bem: Papelão 80 = 40,00 → saldo 4200
const vPapelao = criarVenda({
  pessoa: "Recicle Bem",
  itens: [{ material: "Papelão", quantidade: "80", valorCentavos: 4000 }],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, vPapelao] });
checa("4. venda Papelão 80 = 4000 → saldo 4200", d.saldoEsperadoCentavos === 4200, `saldo=${d.saldoEsperadoCentavos}`);

// 5. VENDA Recicle Bem: Sucata mista = 12,00 → saldo 5400
const vSucata = criarVenda({
  pessoa: "Recicle Bem",
  itens: [{ material: "Sucata mista", quantidade: "", valorCentavos: 1200 }],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, vSucata] });
checa("5. venda Sucata mista = 1200 → saldo 5400", d.saldoEsperadoCentavos === 5400, `saldo=${d.saldoEsperadoCentavos}`);

// 6. OUTRAS: saída frete 10,00 → 4400; entrada devolução 6,00 → 5000
const o1 = criarOutra({ direcao: "saida", descricao: "frete até o comprador", valorCentavos: 1000, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o1] });
const o2 = criarOutra({ direcao: "entrada", descricao: "devolução", valorCentavos: 600, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o2] });
salvarDia(d);
checa("6. saldo = 5000 (100−78−20+40+12−10+6)", d.saldoEsperadoCentavos === 5000, `saldo=${d.saldoEsperadoCentavos}`);

// 7. FECHAR quebra 1×R$50 = 5000 → dif R$ 0,00
const q = quebraVazia();
q.cedulas[5000] = 1;
const fechado = recalcular({ ...d, status: "fechado", quebraDeCaixa: q, fechadoEm: new Date().toISOString(), fechadoPor: "dono" });
fecharDia(fechado);
checa("7. quebra 50,00 → dif R$ 0,00", fechado.diferencaCentavos === 0, `dif=${fechado.diferencaCentavos}`);
checa("7. dia no indice-dias", carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));

// 8. REABRIR → excluir venda de Sucata (12,00) → saldo 3800 → re-fechar quebra 20+10+5+2+1 = 38,00 → dif 0
reabrirDia(data);
const base = carregarDia(data);
const reaberto = recalcular({ ...base, status: "reaberto", quebraDeCaixa: null, fechadoEm: null, fechadoPor: null });
salvarDia(reaberto);
checa("8. reaberto, quebra limpa", reaberto.status === "reaberto" && reaberto.quebraDeCaixa === null);
const semSucata = recalcular({ ...reaberto, movimentacoes: reaberto.movimentacoes.filter((m) => m.id !== vSucata.id) });
salvarDia(semSucata);
checa("8. excluir venda de Sucata → saldo 3800", semSucata.saldoEsperadoCentavos === 3800, `saldo=${semSucata.saldoEsperadoCentavos}`);
const q2 = quebraVazia();
q2.cedulas[2000] = 1;
q2.cedulas[1000] = 1;
q2.cedulas[500] = 1;
q2.cedulas[200] = 1;
q2.moedas[100] = 1;
const refechado = recalcular({ ...semSucata, status: "fechado", quebraDeCaixa: q2, fechadoEm: new Date().toISOString(), fechadoPor: "dono" });
fecharDia(refechado);
checa("8. re-fechou com quebra 38,00 → dif R$ 0,00", refechado.diferencaCentavos === 0 && refechado.quebraDeCaixa.totalCentavos === 3800, `dif=${refechado.diferencaCentavos}`);
checa("8. dia volta ao indice, diaAberto limpo", carregarIndiceDias().includes(data) && carregarMeta().diaAberto === null);

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
