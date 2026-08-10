// Verificação do fechamento do dia (roteiro passos 1–7, números do plano aprovado).
// 100 − 78 − 20 + 40 + 12 − 10 + 6 = 50 → quebra 1×R$50 = R$ 50,00 → DIFERENÇA R$ 0,00.
// Com pessoas: João (2 materiais numa compra), Maria, Recicle Bem. Texto do resumo por pessoa.
import {
  calcularDiferenca,
  calcularQuebraTotal,
  criarCompra,
  criarOutra,
  criarVenda,
  gerarTextoResumo,
  novoDia,
  quebraVazia,
  recalcular,
} from "../src/dia";
import { abrirDia, carregarIndiceDias, carregarMeta, fecharDia, salvarDia } from "../src/storage";

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
let d = recalcular(novoDia(data, 10000, "dono")); // caixa inicial R$ 100,00
abrirDia(d);
checa("caixa inicial R$ 100 → saldo 10000", d.saldoEsperadoCentavos === 10000);

// 2. COMPRA João: Papelão 100,0 kg × R$ 0,30 = R$ 30,00 + Latinha 10,0 kg × R$ 5,00 desc. R$ 2,00 = R$ 48,00 → total 78,00
const c1 = criarCompra({
  pessoa: "João",
  itens: [
    { material: "Papelão", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0 },
    { material: "Latinha", pesoKg: 10, precoPorKgCentavos: 500, descontoCentavos: 200 },
  ],
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c1] });
salvarDia(d);
checa("compra João 2 itens = 7800", c1.totalCentavos === 7800 && c1.itens.length === 2, `total=${c1.totalCentavos}`);
checa("saldo após João = 2200", d.saldoEsperadoCentavos === 2200, `saldo=${d.saldoEsperadoCentavos}`);

// 3. COMPRA Maria: Sucata 20,0 kg × R$ 1,00 = R$ 20,00
const c2 = criarCompra({
  pessoa: "Maria",
  itens: [{ material: "Sucata", pesoKg: 20, precoPorKgCentavos: 100, descontoCentavos: 0 }],
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, c2] });
salvarDia(d);
checa("compra Maria = 2000 → saldo 200", c2.totalCentavos === 2000 && d.saldoEsperadoCentavos === 200, `saldo=${d.saldoEsperadoCentavos}`);

// 4. VENDA Recicle Bem: Papelão 80 = R$ 40,00 (1 lançamento) → saldo 4200
const v1 = criarVenda({
  pessoa: "Recicle Bem",
  itens: [{ material: "Papelão", quantidade: "80", valorCentavos: 4000 }],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, v1] });
salvarDia(d);
checa("venda Recicle Bem = 4000 → saldo 4200", v1.totalCentavos === 4000 && v1.pessoa === "Recicle Bem", `saldo=${d.saldoEsperadoCentavos}`);

// 5. VENDA Recicle Bem: Sucata mista = R$ 12,00 → saldo 5400
const v2 = criarVenda({
  pessoa: "Recicle Bem",
  itens: [{ material: "Sucata mista", quantidade: "", valorCentavos: 1200 }],
  ajusteTotalCentavos: 0,
  registradoPor: "dono",
  data,
});
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, v2] });
salvarDia(d);
checa("venda Sucata mista = 1200 → saldo 5400", d.saldoEsperadoCentavos === 5400, `saldo=${d.saldoEsperadoCentavos}`);

// 6. OUTRAS: saída frete R$ 10 → entrada devolução R$ 6 → R$ 50,00
const o1 = criarOutra({ direcao: "saida", descricao: "frete até o comprador", valorCentavos: 1000, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o1] });
const o2 = criarOutra({ direcao: "entrada", descricao: "devolução", valorCentavos: 600, registradoPor: "dono", data });
d = recalcular({ ...d, movimentacoes: [...d.movimentacoes, o2] });
salvarDia(d);
checa("saída 10 + entrada 6 → saldo 5000", d.saldoEsperadoCentavos === 5000, `saldo=${d.saldoEsperadoCentavos}`);

// 7. Quebra: 1×R$50 = R$ 50,00 → diferença R$ 0,00
const q = quebraVazia();
q.cedulas[5000] = 1;
const contado = calcularQuebraTotal(q);
checa("quebra 1×50 = 5000", contado === 5000, `contado=${contado}`);
checa("diferença = 0", calcularDiferenca(contado, d.saldoEsperadoCentavos) === 0);

// Fecha: recalcular seta totalCentavos + diferencaCentavos, fecharDia move pro índice.
const fechado = recalcular({ ...d, status: "fechado", quebraDeCaixa: q, fechadoEm: new Date().toISOString(), fechadoPor: "dono" });
checa("fechado.quebra.totalCentavos = 5000", fechado.quebraDeCaixa.totalCentavos === 5000);
checa("fechado.diferencaCentavos = 0", fechado.diferencaCentavos === 0, `dif=${fechado.diferencaCentavos}`);
fecharDia(fechado);
checa("fecharDia limpa diaAberto", carregarMeta().diaAberto === null);
checa("dia vai pro indice-dias", carregarIndiceDias().includes(data), JSON.stringify(carregarIndiceDias()));

// 8. Texto do resumo no formato aprovado (WhatsApp), agrupado por pessoa.
// Intl pt-BR emite espaço fino (U+202F/U+00A0) depois de "R$" — normaliza pra espaço comum.
const texto = gerarTextoResumo(fechado);
const t = texto.replace(/[  ]/g, " ");
checa("cabeçalho RESUMO DO DIA", t.includes("*RESUMO DO DIA — 09/08/2026 (domingo)*"), t.split("\n")[0]);
checa("tem COMPRAS total R$ 98,00", t.includes("*COMPRAS* (2) — total R$ 98,00"));
checa("tem VENDAS total R$ 52,00", t.includes("*VENDAS* (2) — total R$ 52,00"));
checa("tem OUTRAS total -R$ 4,00", t.includes("*OUTRAS* (2) — total -R$ 4,00"));
checa("bloco *João*", t.includes("*João*"));
checa("bloco *Maria*", t.includes("*Maria*"));
checa("bloco *Recicle Bem*", t.includes("*Recicle Bem*"));
checa("linha do Papelão do João", t.includes("- Papelão 100,0 kg × R$ 0,30 = R$ 30,00"));
checa("linha da Latinha com desconto", t.includes("- Latinha 10,0 kg × R$ 5,00 = R$ 50,00 (desconto R$ 2,00 → R$ 48,00)"));
checa("linha de venda com quantidade", t.includes("- Papelão 80 = R$ 40,00"));
checa("linha da diferença R$ 0,00 ✔", t.includes("*DIFERENÇA:* R$ 0,00 ✔"));

// Fecha com diferença real (troco) também fecha com 0 de problema: R$ 49 contado → FALTA R$ 1.
const q2 = quebraVazia();
q2.cedulas[2000] = 2;
q2.cedulas[500] = 1;
q2.cedulas[200] = 1;
q2.moedas[100] = 2;
const contado2 = calcularQuebraTotal(q2);
const fechado2 = recalcular({ ...fechado, quebraDeCaixa: q2 });
checa("troco real: 4900 contado, FALTA R$ 1,00", contado2 === 4900 && fechado2.diferencaCentavos === -100, `dif=${fechado2.diferencaCentavos}`);

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
