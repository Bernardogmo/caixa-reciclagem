# Resumo do dia e exportação

Type: prototype
Status: resolved
Blocked by:

## Veredito

Resolvido em 2026-08-09 via HITL. O resumo do dia tem **cards por pessoa** (compras/vendas de cada pessoa registrada no dia) acima do texto exportável, e o **texto prato pra colar no WhatsApp** agrupa as seções COMPRAS e VENDAS em blocos `*Nome*` (anônimos → `*Sem nome*`), com linha por item (`- Papelão 100,0 kg × R$ 0,30 = R$ 30,00`; venda `- Papelão 80 = R$ 40,00`). Formato de exportação: **texto + botão "📋 Copiar"** (clipboard, com fallback) — arquivo salvo no aparelho fica fora do protótipo. Exemplo aprovado em `test-fechamento.mjs` (seção 8) e pelo roteiro do plano.

## Question

Qual o **conteúdo e formato** do resumo do dia — o que substitui a planilha? Resolver com um **rascunho concreto** (texto/modelo) para o dono reagir, via `/prototype`.

Conteúdo provável (a confirmar): cabeçalho (data, quem fechou), caixa inicial, movimentações do dia — compras (com totais por material), vendas, outras —, contagem física (quebra), saldo esperado, diferença (sobra/falta), totais por material.

Decidir também o **formato de exportação**: texto pronto pra copiar/colar no WhatsApp, arquivo salvo no aparelho, ou ambos.

## Ampliado (regra nova, 2026-08-09)

- Resumo agrupa por **pessoa** (nome opcional) — compras E vendas (ex.: "vendemos para a Recicle Bem").
- Cards por pessoa no app; texto exportado com blocos por pessoa.
