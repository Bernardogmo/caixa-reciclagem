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
- **Compra**: peso × preço tabelado − desconto (ex.: peso inflado por areia/pedra). Sai do caixa.
- **Venda**: negócio com 1+ itens (material/descrição + quantidade + valor); total = soma das linhas com campo de **ajuste no total**. Entra no caixa.
- **Outras movimentações**: entram e saem, descrição livre.
- **Fechamento**: quebra de caixa (contagem única por cédula/moeda, total automático, feita pelo dono) → **sobra/falta** vs saldo esperado.
- **Dia**: abre explicitamente com caixa inicial em espécie; pode **reabrir** (só dono) para correção; dias fechados ficam guardados no aparelho.
- **Saldo esperado é sempre derivado** das movimentações — corrigir/editar recalcula, nunca "conserta" o saldo à mão.
- **Correção**: só dono, só registros do dia corrente.
- **Resumo do dia** com totais por material (compra e venda) — substitui a planilha.

## Decisions so far

<!-- vazio — nenhum ticket resolvido ainda -->

## Not yet specified

- Formato exato do texto/arquivo exportado do resumo (como fica ao colar no WhatsApp) — afina na resolução de **Resumo do dia e exportação**.
- Lista exata de cédulas/moedas da quebra de caixa e detalhes da tela de fechamento — afina na resolução de **Telas e navegação**.
- Gestão da tabela de materiais no protótipo (tela do dono vs edição em código) — afina na resolução de **Telas e navegação**.

## Out of scope

- Multi-dispositivo / sincronização em tempo real — produção.
- Backup em nuvem automático — produção (caminho já esboçado no `firebaseConfig.js` existente).
- Integração com balança (peso automático) — hardware além do protótipo.
- Login/autenticação — substituído pelo seletor de perfil.
- Contagem dupla na quebra de caixa — decidido contagem única no protótipo.
