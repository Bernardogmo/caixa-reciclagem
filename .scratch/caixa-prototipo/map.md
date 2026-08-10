# Mapa — Protótipo do controle de caixa da reciclagem

> Mapa wayfinder. Tickets filhos em `.scratch/caixa-prototipo/issues/`.

## Destination

Um **protótipo funcional** do controle de caixa do galpão, usado num dia real de ponta a ponta, validando a substituição da apostila + planilha por registro digital + controle de caixa em tempo real. Validado quando o fechamento acusa **R$ 0 de diferença** (ou apenas a diferença real de troco) e o **dono aprova** registrar pelo app sem voltar à apostila.

## Notes

**Domínio**: reciclagem — galpão que compra, separa e revende materiais recicláveis. Glossário em `CONTEXT.md`; consultar antes de qualquer trabalho.

**Skills por ticket**: HITL → `/grilling` + `/domain-modeling`; protótipos → `/prototype`; pesquisa → `/research`.

**Decisões de contexto já assentadas** (fase de grilling):
- Um dispositivo Android (tablet ou celular); um funcionário; dono normalmente presente.
- Offline-first: sem wifi, sinal móvel presente. Dado fica **no aparelho** + **exportação manual** do resumo. Sem nuvem no protótipo.
- Sem login/senha: **seletor de perfil** (funcionário vs dono) na tela inicial.
- **Funcionário**: registra compra/venda, vê histórico do dia e saldo esperado. **Dono**: tudo + abrir/fechar o dia, quebra de caixa, outras movimentações, tabela de materiais, correção de registros.
- **Compra**: peso × preço tabelado − desconto (ex.: peso inflado por areia/pedra). Sai do caixa. **Pode registrar vários materiais/valores para uma mesma pessoa numa tela só** (nome opcional → material/peso/desconto → monta a lista → confirmar/cancelar).
- **Nome da pessoa (opcional)**: campo nas compras E nas vendas; vazio → `Sem nome`. O resumo do dia agrupa por pessoa (cards + texto exportado).
- **Venda**: negócio com 1+ itens (material/descrição + quantidade + valor); total = soma das linhas com campo de **ajuste no total**. Entra no caixa.
- **Outras movimentações**: entram e saem, descrição livre.
- **Fechamento**: quebra de caixa (contagem única por cédula/moeda, total automático, feita pelo dono) → **sobra/falta** vs saldo esperado.
- **Dia**: abre explicitamente com caixa inicial em espécie; pode **reabrir** (só dono) para correção; dias fechados ficam guardados no aparelho.
- **Saldo esperado é sempre derivado** das movimentações — corrigir/editar recalcula, nunca "conserta" o saldo à mão.
- **Correção**: só dono, só registros do dia corrente.
- **Resumo do dia** com totais por material (compra e venda) e **cards por pessoa** (nome opcional) — substitui a planilha.
- **Paleta do app**: padrão verde (fundo verde-claro, botão principal `#16a34a`); vermelho `#dc2626` só para perigo (excluir / FALTA / remover).

## Decisions so far

- **Lista de cédulas/moedas da quebra de caixa**: R$ 100, 50, 20, 10, 5, 2 (cédulas) e R$ 1, 0,50, 0,25, 0,10, 0,05 (moedas). Informada pelo usuário em 2026-08-09.
- **UX do funcionário é prioridade**: interface o mais intuitiva possível, campos de preenchimento e leitura grandes (letra/teclado grandes). Vale para todas as telas do funcionário.
- **Tela do funcionário mostra o histórico de compras e vendas do dia** (além do saldo esperado) — o histórico do dia é parte central da tela do funcionário, não uma aba escondida.

## Decisions so far (ticket 01 — Telas e navegação, resolvido)

- **Tela do funcionário**: abas em uma tela só (`HOJE | COMPRA | VENDA`), saldo esperado sempre visível no topo. Aba HOJE = histórico do dia. Formulários de compra/venda embutidos nas abas. Esboço aprovado em `findings/telas-navegacao.md`.
- **Tabela de materiais**: tela no app, administrada pelo dono (editar preço/kg, adicionar material).
- **Caixa inicial**: valor único em R$ (sem quebra).
- **Perfil**: seletor na abertura, sem senha. Funcionário só vê compras/vendas/histórico; dono vê tudo (outras movimentações, materiais, fechamento, dias fechados, reabertura).

## Decisions so far (ticket 02 — Resumo do dia e exportação, resolvido)

- **Formato de exportação**: texto pronto pra colar no WhatsApp + botão **📋 Copiar** (clipboard com fallback). Arquivo salvo no aparelho fica fora do protótipo.
- **Resumo por pessoa**: cards por pessoa no app + texto agrupado em blocos `*Nome*` (COMPRAS e VENDAS). Formato concreto em `test-fechamento.mjs`.

## Not yet specified

- (vazio — o formato do texto do resumo foi resolvido com o ticket 02)

## Out of scope

- Multi-dispositivo / sincronização em tempo real — produção.
- Backup em nuvem automático — produção (caminho já esboçado no `firebaseConfig.js` existente).
- Integração com balança (peso automático) — hardware além do protótipo.
- Login/autenticação — substituído pelo seletor de perfil.
- Contagem dupla na quebra de caixa — decidido contagem única no protótipo.
