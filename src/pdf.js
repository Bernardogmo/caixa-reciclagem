// ===== PDFs de fechamento (jsPDF, gerados no aparelho — funciona offline) =====
// Dois relatórios:
//  - "PDF do dia": cabeçalho, resumo (fundo de caixa/entradas/saídas/saldo) e
//    uma linha por movimentação.
//  - "Relatório de fechamento": o mesmo + contagem de cédulas/moedas no início
//    e no fim do dia (quantidade e total por denominação).
//  - "Coleta do Shopping": relatório mensal (kg por material, valor a pagar).
// Texto do PDF é ASCII + acentos latinos (WinAnsi do jsPDF): sem −, ✔ ou emoji.
import { jsPDF } from "jspdf";
import {
  CEDULAS,
  MOEDAS,
  calcularQuebraTotal,
  centavosParaReal,
  formatarDataCurta,
  formatarHora,
  formatarPeso,
} from "./dia";
import { coletasOrdenadas, rotuloMes } from "./shopping";

const M = 14; // margem (mm)
const DIREITA = 196; // borda direita do texto (210 - margem)
const FUNDO = 282; // limite vertical antes de pular página
const CINZA = 110;

function totaisDoDia(dia) {
  let entradas = 0;
  let saidas = 0;
  for (const m of dia.movimentacoes) {
    if (m.tipo === "compra") saidas += m.totalCentavos;
    else if (m.tipo === "venda") entradas += m.totalCentavos;
    else if (m.tipo === "outra") {
      if (m.direcao === "entrada") entradas += m.valorCentavos;
      else saidas += m.valorCentavos;
    }
  }
  const fundo = dia.caixaInicialCentavos;
  return { fundo, entradas, saidas, saldo: fundo + entradas - saidas };
}

// "+ R$ 10,00 (sobra)" | "- R$ 10,00 (falta)" | "R$ 0,00 (sem diferença)"
function rotuloDiferenca(dif) {
  if (dif === 0) return "R$ 0,00 (sem diferença)";
  return `${dif > 0 ? "+ " : "- "}${centavosParaReal(Math.abs(dif))} ${dif > 0 ? "(sobra)" : "(falta)"}`;
}

function descricaoItemCompra(i) {
  return `${i.material} ${formatarPeso(i.pesoKg)} kg x ${centavosParaReal(i.precoPorKgCentavos)}`;
}

// Uma movimentação vira uma linha: hora | descrição | valor com sinal.
function linhaMov(m) {
  const saida = m.tipo === "compra" || (m.tipo === "outra" && m.direcao === "saida");
  let desc;
  if (m.tipo === "compra") {
    desc = `Compra${m.pessoa ? ` - ${m.pessoa}` : ""}: ${m.itens.map(descricaoItemCompra).join(" | ")}`;
  } else if (m.tipo === "venda") {
    desc = `Venda${m.pessoa ? ` - ${m.pessoa}` : ""}: ${m.itens
      .map((i) => `${i.material}${i.quantidade ? ` ${i.quantidade}` : ""} = ${centavosParaReal(i.valorCentavos)}`)
      .join(" | ")}`;
  } else {
    desc = `${m.direcao === "entrada" ? "Entrada" : "Saída"}: ${m.descricao}`;
  }
  const valor = m.tipo === "outra" ? m.valorCentavos : m.totalCentavos;
  return {
    hora: formatarHora(m.timestamp),
    desc,
    valor: `${saida ? "- " : "+ "}${centavosParaReal(valor)}`,
  };
}

// Linha de status do dia para o cabeçalho: "Dia fechado em ..." | "Dia aberto".
function statusDia(dia) {
  const status = dia.status === "fechado" ? "Dia fechado" : "Dia aberto";
  const quando = dia.fechadoEm ? ` em ${new Date(dia.fechadoEm).toLocaleString("pt-BR")}` : "";
  return `${status}${quando}`;
}

function statusMes(mes) {
  if (mes.status === "fechado") {
    const quando = mes.fechadoEm ? ` em ${new Date(mes.fechadoEm).toLocaleString("pt-BR")}` : "";
    return `Mês fechado${quando}`;
  }
  return "Mês aberto (valores previstos)";
}

// Construtor do relatório: cursor vertical y com quebra de página automática.
class Relatorio {
  constructor(titulo, sub, status) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.y = 16;
    this.cabecalho(titulo, sub, status);
  }

  quebra(altura) {
    if (this.y + altura > FUNDO) {
      this.doc.addPage();
      this.y = 16;
    }
  }

  linha() {
    this.doc.setDrawColor(200);
    this.doc.setLineWidth(0.25);
    this.doc.line(M, this.y, DIREITA, this.y);
  }

  cabecalho(titulo, sub, status) {
    const doc = this.doc;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("Caixa da Reciclagem", M, this.y);
    this.y += 7;
    doc.setFontSize(12.5);
    doc.text(`${titulo} - ${sub}`, M, this.y);
    this.y += 5.5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(CINZA);
    if (status) doc.text(status, M, this.y);
    doc.setTextColor(20);
    this.y += 4;
    this.linha();
    this.y += 7;
  }

  secao(titulo) {
    this.quebra(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(11.5);
    this.doc.text(titulo, M, this.y);
    this.y += 6.5;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10.5);
  }

  par(rotulo, valor, negrito = false) {
    this.quebra(6.5);
    this.doc.setFont("helvetica", negrito ? "bold" : "normal");
    this.doc.setFontSize(negrito ? 11 : 10.5);
    this.doc.text(rotulo, M, this.y);
    this.doc.text(valor, DIREITA, this.y, { align: "right" });
    this.y += 6;
  }

  resumo(dia) {
    const t = totaisDoDia(dia);
    this.secao("Resumo do caixa");
    this.par("Fundo de caixa (início do dia)", centavosParaReal(t.fundo));
    this.par("Entradas (vendas e outras)", centavosParaReal(t.entradas));
    this.par("Saídas (compras e outras)", centavosParaReal(t.saidas));
    this.par("Saldo esperado", centavosParaReal(t.saldo), true);
    this.y += 3;
  }

  movimentacoes(dia) {
    const doc = this.doc;
    this.secao("Movimentações");

    doc.setFontSize(9);
    doc.setTextColor(CINZA);
    doc.text("HORA", M, this.y);
    doc.text("MOVIMENTAÇÃO", M + 17, this.y);
    doc.text("VALOR", DIREITA, this.y, { align: "right" });
    this.y += 2;
    this.linha();
    this.y += 5;
    doc.setTextColor(20);
    doc.setFontSize(10);

    if (!dia.movimentacoes.length) {
      doc.text("Nenhuma movimentação registrada.", M, this.y);
      this.y += 6;
      return;
    }

    for (const m of dia.movimentacoes) {
      const { hora, desc, valor } = linhaMov(m);
      const linhas = doc.splitTextToSize(desc, 126);
      const altura = linhas.length * 4.6;
      this.quebra(altura + 3);
      doc.text(hora, M, this.y);
      doc.text(linhas, M + 17, this.y);
      doc.setFont("helvetica", "bold");
      doc.text(valor, DIREITA, this.y, { align: "right" });
      doc.setFont("helvetica", "normal");
      this.y += altura + 2.4;
    }
    this.y += 3;
  }

  // Contagem de cédulas/moedas: quantidade e total por denominação.
  contagem(titulo, quebra) {
    this.secao(titulo);
    if (!quebra) {
      this.doc.setFontSize(10);
      this.doc.text("Não registrada.", M, this.y);
      this.y += 8;
      return;
    }

    const doc = this.doc;
    doc.setFontSize(9);
    doc.setTextColor(CINZA);
    doc.text("CÉDULA / MOEDA", M, this.y);
    doc.text("QTD", 120, this.y, { align: "right" });
    doc.text("TOTAL", DIREITA, this.y, { align: "right" });
    this.y += 2;
    this.linha();
    this.y += 5;
    doc.setTextColor(20);
    doc.setFontSize(10);

    const linhas = [
      ...CEDULAS.map((c) => ({ rotulo: `Cédula de ${centavosParaReal(c)}`, c, qtd: quebra.cedulas?.[c] })),
      ...MOEDAS.map((c) => ({ rotulo: `Moeda de ${centavosParaReal(c)}`, c, qtd: quebra.moedas?.[c] })),
    ];
    for (const { rotulo, c, qtd } of linhas) {
      this.quebra(5.5);
      const q = Number(qtd || 0);
      doc.text(rotulo, M, this.y);
      doc.text(String(q), 120, this.y, { align: "right" });
      doc.text(centavosParaReal(q * c), DIREITA, this.y, { align: "right" });
      this.y += 5;
    }

    this.linha();
    this.y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", M, this.y);
    doc.text(centavosParaReal(calcularQuebraTotal(quebra)), DIREITA, this.y, { align: "right" });
    doc.setFont("helvetica", "normal");
    this.y += 8;
  }

  // ---- Coleta do Shopping ----

  totaisMes(mes) {
    this.secao("Resumo do mês");
    this.par("Kg coletados", `${formatarPeso(mes.kgTotal)} kg`);
    this.par("Valor a pagar", centavosParaReal(mes.valorTotalCentavos), true);
    this.quebra(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(CINZA);
    this.doc.text(
      mes.status === "fechado"
        ? "Preços de contrato congelados no fechamento do mês."
        : "Mês ainda aberto: valores previstos com a tabela de preços atual.",
      M,
      this.y
    );
    this.doc.setTextColor(20);
    this.y += 8;
  }

  totaisPorMaterial(mes) {
    const doc = this.doc;
    this.secao("Totais por material");

    doc.setFontSize(9);
    doc.setTextColor(CINZA);
    doc.text("MATERIAL", M, this.y);
    doc.text("KG", 112, this.y, { align: "right" });
    doc.text("PREÇO/KG", 158, this.y, { align: "right" });
    doc.text("VALOR", DIREITA, this.y, { align: "right" });
    this.y += 2;
    this.linha();
    this.y += 5;
    doc.setTextColor(20);
    doc.setFontSize(10);

    if (!mes.totais.length) {
      doc.text("Nenhuma coleta registrada no mês.", M, this.y);
      this.y += 8;
      return;
    }

    for (const t of mes.totais) {
      this.quebra(5.5);
      doc.text(t.material, M, this.y);
      doc.text(`${formatarPeso(t.pesoKg)} kg`, 112, this.y, { align: "right" });
      doc.text(centavosParaReal(t.precoPorKgCentavos), 158, this.y, { align: "right" });
      doc.text(centavosParaReal(t.valorCentavos), DIREITA, this.y, { align: "right" });
      this.y += 5;
    }

    this.linha();
    this.y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", M, this.y);
    doc.text(`${formatarPeso(mes.kgTotal)} kg`, 112, this.y, { align: "right" });
    doc.text(centavosParaReal(mes.valorTotalCentavos), DIREITA, this.y, { align: "right" });
    doc.setFont("helvetica", "normal");
    this.y += 8;
  }

  coletasDoMes(mes) {
    const doc = this.doc;
    this.secao("Coletas do mês");

    doc.setFontSize(9);
    doc.setTextColor(CINZA);
    doc.text("DATA", M, this.y);
    doc.text("MATERIAL", M + 32, this.y);
    doc.text("PESO", DIREITA, this.y, { align: "right" });
    this.y += 2;
    this.linha();
    this.y += 5;
    doc.setTextColor(20);
    doc.setFontSize(10);

    const lista = coletasOrdenadas(mes);
    if (!lista.length) {
      doc.text("Nenhuma coleta registrada.", M, this.y);
      this.y += 6;
      return;
    }

    for (const c of lista) {
      this.quebra(5.5);
      doc.text(formatarDataCurta(c.data), M, this.y);
      doc.text(c.material, M + 32, this.y);
      doc.text(`${formatarPeso(c.pesoKg)} kg`, DIREITA, this.y, { align: "right" });
      this.y += 5;
    }
    this.y += 3;
  }

  salvar(nomeArquivo) {
    // Rodapé em todas as páginas: quando foi gerado + número da página.
    const total = this.doc.getNumberOfPages();
    for (let p = 1; p <= total; p += 1) {
      this.doc.setPage(p);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(CINZA);
      this.doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, M, 291);
      this.doc.text(`Página ${p} de ${total}`, DIREITA, 291, { align: "right" });
    }
    this.doc.save(nomeArquivo);
  }
}

// PDF do dia: resumo + movimentações. Serve para dia aberto e fechado.
export function gerarPdfDia(dia) {
  const rel = new Relatorio("Controle do dia", formatarDataCurta(dia.data), statusDia(dia));
  rel.resumo(dia);
  rel.movimentacoes(dia);
  rel.salvar(`caixa-${dia.data}.pdf`);
}

// Relatório de fechamento: resumo + movimentações + contagem inicial e final.
export function gerarPdfFechamento(dia) {
  const rel = new Relatorio("Relatório de fechamento", formatarDataCurta(dia.data), statusDia(dia));
  rel.resumo(dia);
  rel.movimentacoes(dia);
  rel.contagem("Contagem no início do dia (fundo de caixa)", dia.quebraInicial);
  rel.contagem("Contagem no fechamento", dia.quebraDeCaixa);
  if (dia.quebraDeCaixa) {
    const t = totaisDoDia(dia);
    const dif = dia.quebraDeCaixa.totalCentavos - t.saldo;
    rel.par("Contado no fechamento", centavosParaReal(dia.quebraDeCaixa.totalCentavos), true);
    rel.par("Diferença (contado - esperado)", rotuloDiferenca(dif), true);
  }
  rel.salvar(`fechamento-${dia.data}.pdf`);
}

// Relatório mensal da coleta do shopping: resumo, totais por material e coletas.
export function gerarPdfShopping(mes) {
  const rel = new Relatorio("Coleta do Shopping", rotuloMes(mes.mes), statusMes(mes));
  rel.totaisMes(mes);
  rel.totaisPorMaterial(mes);
  rel.coletasDoMes(mes);
  rel.salvar(`shopping-${mes.mes}.pdf`);
}
