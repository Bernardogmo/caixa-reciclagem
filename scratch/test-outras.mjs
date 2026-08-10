// Verificação do fluxo de OUTRAS (roteiro passo 5) + round-trip da tabela.
// Saída frete R$10 → saldo cai; entrada devolução R$6 → saldo sobe.
// Replica o padrão do App.jsx: criarOutra → recalcular → salvarDia.
import { criarOutra, novoDia, recalcular, hojeISO } from "../src/dia";
import {
  abrirDia,
  carregarDiaAberto,
  carregarTabelaMateriais,
  salvarDia,
  salvarTabelaMateriais,
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

const data = hojeISO();
const d0 = recalcular(novoDia(data, 7000, "dono"));
abrirDia(d0);

// Saída: frete R$ 10,00.
const saida = criarOutra({ direcao: "saida", descricao: "frete até o comprador", valorCentavos: 1000, registradoPor: "dono", data });
const d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, saida] });
salvarDia(d1);
checa("saída frete → saldo 6000", d1.saldoEsperadoCentavos === 6000, `saldo=${d1.saldoEsperadoCentavos}`);

// Entrada: devolução R$ 6,00.
const entrada = criarOutra({ direcao: "entrada", descricao: "devolução", valorCentavos: 600, registradoPor: "dono", data });
const d2 = recalcular({ ...d1, movimentacoes: [...d1.movimentacoes, entrada] });
salvarDia(d2);
checa("entrada devolução → saldo 6600", d2.saldoEsperadoCentavos === 6600, `saldo=${d2.saldoEsperadoCentavos}`);

// Recarrega do storage.
const rec = carregarDiaAberto();
checa("reload tem 2 outras", rec?.movimentacoes.length === 2);
checa("reload recalcula saldo = 6600", rec?.saldoEsperadoCentavos === 6600, `saldo=${rec?.saldoEsperadoCentavos}`);

// Tabela de materiais: edita preço, adiciona material, persiste e recarrega.
salvarTabelaMateriais([
  { nome: "Papelão", precoPorKgCentavos: 30 },
  { nome: "Vidro", precoPorKgCentavos: 25 },
]);
const tab = carregarTabelaMateriais();
checa("tabela salva+recarrega com Vidro", tab.materiais.length === 2 && tab.materiais.some((m) => m.nome === "Vidro"));
checa("preço editado persistido", tab.materiais.find((m) => m.nome === "Papelão")?.precoPorKgCentavos === 30);

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
