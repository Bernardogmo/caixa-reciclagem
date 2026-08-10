// Verificação do fluxo de compra write-through (roteiro do plano, passo 2):
// abre dia R$100 → COMPRA João [Papelão 100 kg × R$0,30 = R$30,00] → saldo R$70,00.
// Nova assinatura: criarCompra({ pessoa, itens: [...] }) → totalCentavos por soma de itens.
import {
  criarCompra,
  novoDia,
  recalcular,
  hojeISO,
} from "../src/dia";
import {
  abrirDia,
  carregarDiaAberto,
  carregarDia,
  pedirPersistencia,
  salvarDia,
} from "../src/storage";

// ---- mock de localStorage + persistência ----
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

// 1) Abre o dia com R$ 100,00 (mesmo handler abrirDia do App).
const data = hojeISO();
const d0 = recalcular(novoDia(data, 10000, "dono"));
abrirDia(d0);
checa("dia aberto com saldo 10000", d0.saldoEsperadoCentavos === 10000, `saldo=${d0.saldoEsperadoCentavos}`);

// 2) Compra de João: Papelão 100 kg × R$ 0,30 (preco fotocopiado por item), sem desconto.
const compra = criarCompra({
  pessoa: "João",
  itens: [{ material: "Papelão", pesoKg: 100, precoPorKgCentavos: 30, descontoCentavos: 0 }],
  registradoPor: "dono",
  data,
});
checa("compra total = 3000 (100×30)", compra.totalCentavos === 3000, `total=${compra.totalCentavos}`);
checa("item 0 é Papelão com valor 3000", compra.itens[0].material === "Papelão" && compra.itens[0].valorCentavos === 3000);
checa("pessoa da compra = João", compra.pessoa === "João");
checa("pessoa em branco → null", criarCompra({ pessoa: "   ", itens: compra.itens, registradoPor: "dono", data }).pessoa === null);
const d1 = recalcular({ ...d0, movimentacoes: [...d0.movimentacoes, compra] });
salvarDia(d1);
checa("saldo após compra = 7000", d1.saldoEsperadoCentavos === 7000, `saldo=${d1.saldoEsperadoCentavos}`);

// 3) Recarrega do storage (simula reload) e confere que derivado recalcula + shape itens[] preservado.
const recarregado = carregarDiaAberto();
checa("reload mantém dia aberto", recarregado != null && recarregado.data === data);
checa("reload recalcula saldo = 7000", recarregado?.saldoEsperadoCentavos === 7000, `saldo=${recarregado?.saldoEsperadoCentavos}`);
checa("reload mantém 1 movimentação", recarregado?.movimentacoes.length === 1, `n=${recarregado?.movimentacoes.length}`);
const recMov = recarregado?.movimentacoes[0];
checa("mov é compra com itens[]", recMov?.tipo === "compra" && recMov?.itens?.[0]?.material === "Papelão");
checa("preço fotocopiado no item", recMov?.itens?.[0]?.precoPorKgCentavos === 30);
checa("pessoa mantida no reload", recMov?.pessoa === "João");

// 4) carregarDia direto também recalcula.
const direto = carregarDia(data);
checa("carregarDia recalcula saldo = 7000", direto?.saldoEsperadoCentavos === 7000, `saldo=${direto?.saldoEsperadoCentavos}`);

console.log(falhas === 0 ? "\nTUDO OK" : `\n${falhas} FALHA(S)`);
process.exit(falhas === 0 ? 0 : 1);
