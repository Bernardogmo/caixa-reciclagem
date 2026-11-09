// ===== Repositório: toda a conversa com o Firestore =====
// A tela nunca fala com o Firestore direto. Aqui ficam:
//  - os conversores mapa↔array (o app continua vendo `movimentacoes` como
//    lista; no banco cada lançamento é um campo do mapa `movimentacoes.<id>`,
//    para dois aparelhos offline não sobrescreverem um ao outro);
//  - as assinaturas em tempo real (onSnapshot);
//  - as escritas, sempre por caminho de campo (nunca reescrevendo o mapa);
//  - o backup bruto (mesmo formato do storage.js antigo).
// Derivados (saldo, quebra, totais) nunca são gravados com confiança: são
// recalculados na leitura pela própria tela (recalcular/recalcularMes).
import {
  arrayUnion,
  collection,
  deleteField,
  doc,
  FieldPath,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import { recalcular } from "./dia";
import { MATERIAIS_PADRAO } from "./materiais";
import { fecharMes, novoMes } from "./shopping";

const agoraISO = () => new Date().toISOString();

// Tamanho conservador: o limite do Firestore é 500 operações por batch.
const TAMANHO_LOTE = 400;

// ------------------------------------------------- conversores mapa ↔ array

function idParaChave(m) {
  return m && m.id ? m.id : null;
}

// Lista → mapa por id (é o formato gravado no banco).
function listaParaMapa(lista) {
  const mapa = {};
  for (const item of lista || []) {
    const chave = idParaChave(item);
    if (chave) mapa[chave] = item;
  }
  return mapa;
}

// Mapa por id → lista ordenada por hora e id (é o formato que a tela usa).
function mapaParaLista(mapa) {
  if (!mapa) return [];
  const lista = Array.isArray(mapa) ? mapa.slice() : Object.values(mapa);
  lista.sort((a, b) => {
    const ta = String(a?.timestamp || "");
    const tb = String(b?.timestamp || "");
    if (ta !== tb) return ta < tb ? -1 : 1;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
  return lista;
}

// Documento dias/{data} (mapa) → dia como a tela conhece (lista + derivados).
export function docParaDia(data, bruto) {
  const base = {
    ...bruto,
    data: bruto?.data || data,
    movimentacoes: mapaParaLista(bruto?.movimentacoes),
  };
  return recalcular(base);
}

// Dia da tela → documento completo (usado na restauração de backup).
function diaParaDoc(dia) {
  const d = recalcular(dia);
  return {
    version: 1,
    data: d.data,
    status: d.status,
    perfilAbertura: d.perfilAbertura ?? null,
    caixaInicialCentavos: d.caixaInicialCentavos ?? 0,
    quebraInicial: d.quebraInicial ?? null,
    movimentacoes: listaParaMapa(d.movimentacoes),
    quebraDeCaixa: d.quebraDeCaixa ?? null,
    abertoEm: d.abertoEm ?? null,
    abertoPor: d.abertoPor ?? null,
    fechadoEm: d.fechadoEm ?? null,
    fechadoPor: d.fechadoPor ?? null,
  };
}

// Documento coletas/{mes} (mapa) → mês bruto; os totais a tela recalcula.
export function docParaMes(mes, bruto) {
  const coletas = Array.isArray(bruto?.coletas) ? bruto.coletas : mapaParaLista(bruto?.coletas);
  return { ...novoMes(mes), ...bruto, mes: bruto?.mes || mes, coletas };
}

function mesParaDoc(mes) {
  return {
    version: 1,
    mes: mes.mes,
    status: mes.status,
    coletas: listaParaMapa(mes.coletas),
    fechadoEm: mes.fechadoEm ?? null,
    fechadoPor: mes.fechadoPor ?? null,
    precosCongelados: mes.precosCongelados ?? null,
  };
}

// Tabelas padrão quando o gestor ainda não salvou nada.
function tabelaMateriaisPadrao() {
  return { version: 1, atualizadaEm: null, materiais: MATERIAIS_PADRAO };
}

function tabelaShoppingPadrao() {
  return {
    version: 1,
    atualizadaEm: null,
    materiais: MATERIAIS_PADRAO.map((m) => ({ nome: m.nome, precoPorKgCentavos: 0 })),
  };
}

// ------------------------------------------------------------- assinaturas

// meta/geral: qual dia está aberto, fundo do próximo dia e índice de fechados.
export function assinarMeta(aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, "meta", "geral"),
    (snap) => {
      const d = snap.exists() ? snap.data() : {};
      aoMudar({
        version: 1,
        existe: snap.exists(),
        diaAberto: d.diaAberto || null,
        fundoProximoDia: d.fundoProximoDia || null,
        indiceDias: Array.isArray(d.indiceDias) ? d.indiceDias : [],
      });
    },
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

// dias/{data}. Chame com a data de meta.diaAberto.
export function assinarDia(data, aoMudar, aoFalhar) {
  if (!data) return () => {};
  return onSnapshot(
    doc(db, "dias", data),
    (snap) => aoMudar(snap.exists() ? docParaDia(data, snap.data()) : null),
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

export function assinarTabelaMateriais(aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, "tabelas", "materiais"),
    (snap) => {
      const d = snap.exists() ? snap.data() : null;
      if (d && Array.isArray(d.materiais) && d.materiais.length) {
        aoMudar({ version: 1, atualizadaEm: d.atualizadaEm ?? null, materiais: d.materiais });
      } else {
        aoMudar(tabelaMateriaisPadrao());
      }
    },
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

export function assinarTabelaShopping(aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, "tabelas", "shopping"),
    (snap) => {
      const d = snap.exists() ? snap.data() : null;
      if (d && Array.isArray(d.materiais)) {
        aoMudar({ version: 1, atualizadaEm: d.atualizadaEm ?? null, materiais: d.materiais });
      } else {
        aoMudar(tabelaShoppingPadrao());
      }
    },
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

export function assinarContatos(aoMudar, aoFalhar) {
  return onSnapshot(
    doc(db, "contatos", "lista"),
    (snap) => {
      const d = snap.exists() ? snap.data() : null;
      aoMudar(Array.isArray(d?.contatos) ? d.contatos : []);
    },
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

// coletas/{mes}: devolve o mês bruto (coletas em lista). Quem mostra recalcula.
export function assinarMesColeta(mes, aoMudar, aoFalhar) {
  if (!mes) return () => {};
  return onSnapshot(
    doc(db, "coletas", mes),
    (snap) => aoMudar(snap.exists() ? docParaMes(mes, snap.data()) : novoMes(mes)),
    (erro) => aoFalhar && aoFalhar(erro),
  );
}

// ------------------------------------------------------------------ escrita
// Nenhuma escrita espera a resposta do servidor para a tela mudar: o cache
// local do Firestore aplica na hora (funciona offline) e a fila sincroniza
// sozinha. Por isso os handlers chamam estas funções sem `await` de UI.

// Cria meta/geral se ainda não existir (só o admin pode — as regras barram o resto).
export async function garantirMeta() {
  await setDoc(doc(db, "meta", "geral"), { version: 1 }, { merge: true });
}

export async function abrirDia(dia) {
  const d = recalcular(dia);
  const lote = writeBatch(db);
  // Sem `movimentacoes` no merge: se outro aparelho já abriu o dia e lançou
  // algo, o mapa existente fica intacto.
  lote.set(
    doc(db, "dias", d.data),
    {
      version: 1,
      data: d.data,
      status: "aberto",
      perfilAbertura: d.perfilAbertura ?? null,
      caixaInicialCentavos: d.caixaInicialCentavos,
      quebraInicial: d.quebraInicial ?? null,
      quebraDeCaixa: null,
      abertoEm: d.abertoEm ?? null,
      abertoPor: d.abertoPor ?? null,
      fechadoEm: null,
      fechadoPor: null,
    },
    { merge: true },
  );
  // O fundo definido no fechamento foi usado para abrir este dia.
  lote.set(
    doc(db, "meta", "geral"),
    { version: 1, diaAberto: d.data, fundoProximoDia: null },
    { merge: true },
  );
  await lote.commit();
}

// Um lançamento novo entra como campo do mapa — não reescreve os outros.
export async function adicionarMovimentacao(data, mov) {
  await updateDoc(doc(db, "dias", data), new FieldPath("movimentacoes", mov.id), mov);
}

export async function substituirMovimentacao(data, mov) {
  await updateDoc(doc(db, "dias", data), new FieldPath("movimentacoes", mov.id), mov);
}

export async function removerMovimentacao(data, id) {
  await updateDoc(doc(db, "dias", data), new FieldPath("movimentacoes", id), deleteField());
}

export async function fecharDia(dia, quebra, por) {
  const fechado = recalcular({
    ...dia,
    status: "fechado",
    quebraDeCaixa: quebra,
    fechadoEm: agoraISO(),
    fechadoPor: por,
  });
  const lote = writeBatch(db);
  // Só os campos do fechamento: movimentações que chegaram de outro aparelho
  // (até offline, antes do fechamento) continuam intactas.
  lote.set(
    doc(db, "dias", dia.data),
    {
      status: "fechado",
      quebraDeCaixa: fechado.quebraDeCaixa ?? null,
      fechadoEm: fechado.fechadoEm,
      fechadoPor: fechado.fechadoPor ?? null,
    },
    { merge: true },
  );
  lote.set(
    doc(db, "meta", "geral"),
    { diaAberto: null, indiceDias: arrayUnion(dia.data) },
    { merge: true },
  );
  await lote.commit();
}

// Dinheiro que fica na bolsa para o dia seguinte (fica no meta até abrir o dia).
export async function definirFundoProximoDia({ quebra, origemData, definidoPor }) {
  await setDoc(
    doc(db, "meta", "geral"),
    { fundoProximoDia: { quebra, origemData, definidoPor, definidoEm: agoraISO() } },
    { merge: true },
  );
}

export async function salvarMateriais(lista) {
  await setDoc(doc(db, "tabelas", "materiais"), {
    version: 1,
    atualizadaEm: agoraISO(),
    materiais: lista,
  });
}

export async function salvarTabelaShopping(lista) {
  await setDoc(doc(db, "tabelas", "shopping"), {
    version: 1,
    atualizadaEm: agoraISO(),
    materiais: lista,
  });
}

export async function salvarContatos(lista) {
  await setDoc(doc(db, "contatos", "lista"), {
    version: 1,
    atualizadaEm: agoraISO(),
    contatos: lista,
  });
}

// Coletas novas do mês entram como campos do mapa (merge de mapa aninhado).
export async function adicionarColetas(mes, coletas) {
  if (!mes || !coletas || coletas.length === 0) return;
  await setDoc(
    doc(db, "coletas", mes),
    { version: 1, mes, coletas: listaParaMapa(coletas) },
    { merge: true },
  );
}

export async function removerColeta(mes, id) {
  await updateDoc(doc(db, "coletas", mes), new FieldPath("coletas", id), deleteField());
}

export async function fecharMesColeta(mes, por, tabela) {
  const fechado = fecharMes(mes, por, tabela);
  await setDoc(
    doc(db, "coletas", mes.mes),
    {
      status: "fechado",
      precosCongelados: fechado.precosCongelados ?? null,
      fechadoEm: fechado.fechadoEm ?? null,
      fechadoPor: fechado.fechadoPor ?? null,
    },
    { merge: true },
  );
}

// ------------------------------------------------------- leituras sob demanda

export async function carregarDia(data) {
  const snap = await getDoc(doc(db, "dias", data));
  return snap.exists() ? docParaDia(data, snap.data()) : null;
}

async function datasFechadas() {
  const snap = await getDoc(doc(db, "meta", "geral"));
  const indice = snap.exists() && Array.isArray(snap.data().indiceDias) ? snap.data().indiceDias : [];
  return [...new Set(indice)].map(String).sort((a, b) => b.localeCompare(a));
}

// Lista completa dos dias fechados, mais novo primeiro.
export async function carregarDiasFechados() {
  const datas = await datasFechadas();
  const resultados = await Promise.allSettled(datas.map((data) => carregarDia(data)));
  const dias = [];
  for (const r of resultados) {
    if (r.status === "fulfilled" && r.value) dias.push(r.value);
  }
  return dias.sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

// Contagem física do último fechamento — sugestão para o fundo do próximo dia.
export async function ultimaContagemFechada() {
  const datas = await datasFechadas();
  for (const data of datas) {
    const d = await carregarDia(data).catch(() => null);
    if (d && d.quebraDeCaixa) return { quebra: d.quebraDeCaixa, data: d.data };
  }
  return null;
}

// ------------------------------------------------------- backup / restauração
// Mesmo formato do backup antigo (versão 1): dias e meses com `movimentacoes`
// e `coletas` em lista. Backup velho restaura normalmente.

export async function lerTudoBruto() {
  const [metaSnap, matSnap, shopSnap, contatosSnap, diasSnap, coletasSnap] = await Promise.all([
    getDoc(doc(db, "meta", "geral")),
    getDoc(doc(db, "tabelas", "materiais")),
    getDoc(doc(db, "tabelas", "shopping")),
    getDoc(doc(db, "contatos", "lista")),
    getDocs(collection(db, "dias")),
    getDocs(collection(db, "coletas")),
  ]);

  const dias = {};
  diasSnap.forEach((d) => {
    dias[d.id] = docParaDia(d.id, d.data());
  });
  const mesesColeta = {};
  coletasSnap.forEach((d) => {
    mesesColeta[d.id] = docParaMes(d.id, d.data());
  });

  const meta = metaSnap.exists() ? metaSnap.data() : { version: 1, diaAberto: null };
  const contatosDoc = contatosSnap.exists() ? contatosSnap.data() : null;

  return {
    meta,
    indiceDias: Array.isArray(meta.indiceDias) ? meta.indiceDias : [],
    tabelaMateriais: matSnap.exists() ? matSnap.data() : tabelaMateriaisPadrao(),
    dias,
    tabelaShopping: shopSnap.exists() ? shopSnap.data() : tabelaShoppingPadrao(),
    mesesColeta,
    contatos: Array.isArray(contatosDoc?.contatos) ? contatosDoc.contatos : [],
  };
}

async function executarEmLotes(operacoes) {
  for (let i = 0; i < operacoes.length; i += TAMANHO_LOTE) {
    const lote = writeBatch(db);
    for (const op of operacoes.slice(i, i + TAMANHO_LOTE)) {
      if (op.tipo === "apagar") lote.delete(op.ref);
      else lote.set(op.ref, op.dados);
    }
    await lote.commit();
  }
}

// Substitui TODO o caixa: apaga os dias (e meses, quando o backup os traz) que
// não estão no backup e grava os que estão. `null`/ausente = não mexer.
export async function gravarTudoBruto({
  meta,
  indiceDias,
  tabelaMateriais,
  dias,
  tabelaShopping,
  mesesColeta,
  contatos,
}) {
  const [diasAtuais, coletasAtuais] = await Promise.all([
    getDocs(collection(db, "dias")),
    mesesColeta ? getDocs(collection(db, "coletas")) : Promise.resolve(null),
  ]);

  const operacoes = [];
  for (const d of diasAtuais.docs) {
    if (!dias || !(d.id in dias)) operacoes.push({ tipo: "apagar", ref: doc(db, "dias", d.id) });
  }
  if (mesesColeta && coletasAtuais) {
    for (const d of coletasAtuais.docs) {
      if (!(d.id in mesesColeta)) operacoes.push({ tipo: "apagar", ref: doc(db, "coletas", d.id) });
    }
  }
  Object.keys(dias || {}).forEach((data) => {
    const dia = dias[data];
    operacoes.push({
      tipo: "gravar",
      ref: doc(db, "dias", dia.data || data),
      dados: diaParaDoc({ ...dia, data: dia.data || data }),
    });
  });
  if (mesesColeta) {
    Object.keys(mesesColeta).forEach((mes) => {
      const m = mesesColeta[mes];
      operacoes.push({ tipo: "gravar", ref: doc(db, "coletas", mes), dados: mesParaDoc({ ...m, mes }) });
    });
  }
  const metaFinal = { ...(meta || { version: 1 }) };
  metaFinal.indiceDias = Array.isArray(indiceDias)
    ? indiceDias
    : Array.isArray(metaFinal.indiceDias)
      ? metaFinal.indiceDias
      : [];
  operacoes.push({ tipo: "gravar", ref: doc(db, "meta", "geral"), dados: metaFinal });
  if (tabelaMateriais) {
    operacoes.push({ tipo: "gravar", ref: doc(db, "tabelas", "materiais"), dados: tabelaMateriais });
  }
  if (tabelaShopping) {
    operacoes.push({ tipo: "gravar", ref: doc(db, "tabelas", "shopping"), dados: tabelaShopping });
  }
  if (contatos) {
    operacoes.push({
      tipo: "gravar",
      ref: doc(db, "contatos", "lista"),
      dados: { version: 1, atualizadaEm: agoraISO(), contatos },
    });
  }
  await executarEmLotes(operacoes);
}
