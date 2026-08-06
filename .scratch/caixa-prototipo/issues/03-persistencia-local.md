# Persistência local confiável no protótipo

Type: research
Status: open
Blocked by:

## Question

Fatos para escolher a persistência do protótipo (offline, um aparelho Android): num navegador de tablet/celular **sem internet**, qual é a forma mais confiável e simples de guardar os dados do dia?

Cobrir: **localStorage vs IndexedDB vs PWA/service worker**; limites de armazenamento; o que acontece se a aba fechar, o navegador reiniciar ou os dados do navegador forem limpos; como não perder um dia aberto; e um **layout de dados recomendado** (um registro por dia, com suas movimentações e quebra de caixa).

Entregar: arquivo de descobertas em `.scratch/caixa-prototipo/findings/persistencia-local.md` + resumo.

## Descobertas (pesquisa capturada)

📄 **Ponteiro**: `.scratch/caixa-prototipo/findings/persistencia-local.md`

**Recomendação curta:** `localStorage`, uma chave por dia (`dia:YYYY-MM-DD`), persistindo a cada alteração (nunca confiar em `beforeunload` — o Android pode matar a aba sem dispará-lo). Sem IndexedDB, sem service worker/PWA neste protótipo (tamanho dos dados é KB). Dinheiro em **centavos inteiros** para evitar erro de float — crítico porque a validação depende de "diferença = R$ 0". Layout por dia com `caixaInicial`, `movimentacoes[]`, `quebraDeCaixa` e `saldoEsperado`/`diferenca` derivados (recalculados ao carregar).

Resolução formal (fechar o ticket) fica para a sessão de trabalho do mapa.
