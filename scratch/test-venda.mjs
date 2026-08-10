// Verificação do fluxo de venda write-through (roteiro do plano, passo 4):
// VENDA 2 itens (Papelão 80 = R$40 + Sucata mista R$12 = R$52) → saldo sobe.
// Replica o padrão do App.jsx: criarVenda → recalcular → salvarDia.
import { criarVenda, novoDia, recalcular, hojeISO } from "../src/dia";
import { abrirDia, carregarDiaAberto, salvarDia } from "../src/storage";

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

const data = hojeISO();
const d0 = recalcular(novoDia(data, 10000, "funcionario"));
abrirDia(d0);

// Venda com 2 itens + ajuste zero.
const venda = criarVenda({
  itens: [
    { material: "Papelão", quantidade: "80 kg", valorCentavos: 4000 },
    { material: "Sucata mista", quantidade: "", valorCentavos: 1200 },
  ],
  ajusteTotalCentavos: 0,
  registradoPor: "funcionario",
  data,
});
checa("venda total = 5200 (40+12)", venda.totalCentavos === 5200, `total=${venda.totalCentavos}`);
checa("venda guarda quantidade e valorCentavos", venda.itens[0].quantidade === "80 kg" && venda.itens[0].valorCentavos === 4000);

const d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, venda] });
salvarDia(d1);
checa("saldo após venda = 15200", d1.saldoEsperadoCentavos === 15200, `saldo=${d1.saldoEsperadoCentavos}`);

// Venda com ajuste (desconto): item R$10 + ajuste -R$2 → total R$8.
const venda2 = criarVenda({
  itens: [{ material: "Metal", quantidade: "", valorCentavos: 1000 }],
  ajusteTotalCentavos: -200,
  registradoPor: "funcionario",
  data,
});
checa("venda com ajuste -200 → total 800", venda2.totalCentavos === 800, `total=${venda2.totalCentavos}`);

// Clamp: itens 0 + ajuste negativo não pode dar total negativo.
const venda3 = criarVenda({
  itens: [],
  ajusteTotalCentavos: -500,
  registradoPor: "funcionario",
  data,
});
checa("calcularVenda clamp em 0", venda3.totalCentavos === 0, `total=${venda3.totalCentavos}`);

// Recarrega do storage e confere derivado recalculado.
const rec = carregarDiaAberto();
checa("reload mantém venda", rec?.movimentacoes.length === 1 && rec?.movimentacoes[0].tipo === "venda");
checa("reload recalcula saldo = 15200", rec?.saldoEsperadoCentavos === 15200, `saldo=${rec?.saldoEsperadoCentavos}`);

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
