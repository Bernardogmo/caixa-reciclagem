// Migração do caixa antigo (localStorage) para o banco compartilhado.
// Aparece uma única vez por aparelho, no primeiro login do gestor, quando o
// navegador ainda tem dados do app antigo. Os dados locais NÃO são apagados:
// ficam guardados como cópia de segurança.
//
// Se o caixa compartilhado já tiver conteúdo (outro aparelho migrou antes), os
// dados são somados em vez de substituídos — nada que já está no banco é
// apagado pela migração.
import * as storage from "./storage";
import * as dados from "./repositorio";

const CHAVE_MIGRADO = "app:migrado";

function lerLocal() {
  try {
    return storage.lerTudoBruto();
  } catch (erro) {
    console.warn("Migração: não deu para ler os dados antigos:", erro);
    return null;
  }
}

function temTabelaPropria(tabela) {
  // A tabela padrão vem com atualizadaEm null; se tem data, alguém já editou.
  return Boolean(tabela && tabela.atualizadaEm);
}

// O que existe neste aparelho, para a tela de migração mostrar antes de enviar.
export function resumoDadosAntigos() {
  const bruto = lerLocal();
  if (!bruto) return null;
  const dias = Object.values(bruto.dias || {});
  return {
    dias: dias.length,
    diasFechados: dias.filter((d) => d && d.status === "fechado").length,
    diaAberto: bruto.meta && bruto.meta.diaAberto ? bruto.meta.diaAberto : null,
    mesesShopping: Object.keys(bruto.mesesColeta || {}).length,
    contatos: Array.isArray(bruto.contatos) ? bruto.contatos.length : 0,
    temMateriais: temTabelaPropria(bruto.tabelaMateriais),
    temPrecosShopping: temTabelaPropria(bruto.tabelaShopping),
  };
}

// Há dados antigos que valem a migração e este aparelho ainda não foi migrado?
export function temDadosAntigos() {
  try {
    if (localStorage.getItem(CHAVE_MIGRADO)) return false;
  } catch (erro) {
    // Sem localStorage acessível não há dados antigos para migrar.
    return false;
  }
  const resumo = resumoDadosAntigos();
  if (!resumo) return false;
  return (
    resumo.dias > 0 ||
    resumo.mesesShopping > 0 ||
    resumo.contatos > 0 ||
    resumo.temMateriais ||
    resumo.temPrecosShopping
  );
}

// Marca o aparelho como já migrado (ou como "começar do zero"). Os dados
// locais continuam no localStorage como cópia de segurança.
export function marcarMigrado() {
  try {
    localStorage.setItem(CHAVE_MIGRADO, new Date().toISOString());
  } catch (erro) {
    console.warn("Migração: não deu para marcar o aparelho como migrado:", erro);
  }
}

function chaveContato(contato) {
  const nome = String((contato && contato.nome) || "")
    .trim()
    .toLowerCase();
  const telefone = String((contato && contato.telefone) || "").replace(/\D/g, "");
  return `${nome}|${telefone}`;
}

// Mesmo nome+telefone = mesmo contato. Os do banco entram por último e vencem.
function unirContatos(locais, remotos) {
  const mapa = new Map();
  [...(locais || []), ...(remotos || [])].forEach((contato) => {
    if (contato) mapa.set(chaveContato(contato), contato);
  });
  return [...mapa.values()];
}

function unirIndice(remoto, local, dias) {
  const conjunto = new Set([...(Array.isArray(remoto) ? remoto : []), ...(Array.isArray(local) ? local : [])]);
  Object.values(dias).forEach((dia) => {
    if (dia && dia.status === "fechado" && dia.data) conjunto.add(dia.data);
  });
  return [...conjunto].sort();
}

// Envia os dados deste aparelho para o caixa compartilhado. Lança erro se o
// banco não puder ser lido (aí a tela oferece "tentar de novo").
export async function migrarDados() {
  const local = lerLocal();
  if (!local) throw new Error("sem-dados-locais");

  // Lê o que já está no banco para juntar sem apagar nada.
  const remoto = await dados.lerTudoBruto();

  // Em caso de mesma data/mês, o que já está no banco vence.
  const dias = { ...(local.dias || {}), ...(remoto.dias || {}) };
  const mesesColeta = { ...(local.mesesColeta || {}), ...(remoto.mesesColeta || {}) };
  const contatos = unirContatos(local.contatos, remoto.contatos);
  const tabelaMateriais = temTabelaPropria(remoto.tabelaMateriais)
    ? remoto.tabelaMateriais
    : local.tabelaMateriais;
  const tabelaShopping = temTabelaPropria(remoto.tabelaShopping)
    ? remoto.tabelaShopping
    : local.tabelaShopping;
  const meta = remoto.meta && remoto.meta.diaAberto ? remoto.meta : local.meta;
  const indiceDias = unirIndice(remoto.indiceDias, local.indiceDias, dias);

  await dados.gravarTudoBruto({
    meta,
    indiceDias,
    tabelaMateriais,
    dias,
    tabelaShopping,
    mesesColeta,
    contatos,
  });
  marcarMigrado();
  return {
    dias: Object.keys(dias).length,
    mesesShopping: Object.keys(mesesColeta).length,
    contatos: contatos.length,
  };
}
