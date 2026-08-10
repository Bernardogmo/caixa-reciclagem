# Telas e navegação do protótipo

Type: prototype
Status: resolved
Blocked by:

## Veredito

Resolvido em 2026-08-09 via HITL. Tela do funcionário em **abas** (HOJE/COMPRA/VENDA), saldo sempre visível; materiais como tela no app para o dono; caixa inicial por valor único; cédulas/moedas: R$ 100, 50, 20, 10, 5, 2 e R$ 1, 0,50, 0,25, 0,10, 0,05. Esboços aprovados e fonte primária em `findings/telas-navegacao.md`.

## Question

Quais telas o protótipo tem, em que ordem de uso, e o que cada papel (funcionário vs dono) vê em cada uma? Resolver com um **esboço rústico** (layout ASCII de baixa fidelidade) que o usuário reaja, via `/prototype`.

Pontos a desenhar:
- **Seletor de perfil** na abertura (funcionário / dono), sem senha.
- **Tela do dia**: seções ou abas para **compras**, **vendas**, **outras movimentações** e **resumo**; saldo esperado sempre visível.
- **Abertura do dia** (dono): define o caixa inicial em espécie.
- **Fechamento do dia** (dono): **quebra de caixa** — quantidade por cédula/moeda, total automático, sobra/falta.
- **Reabertura do dia** (dono) para correção.
- **Lista de dias fechados** e visão do resumo de cada um.
- **Tabela de materiais** (dono): decidir se é tela no app (ajustar preço/kg, adicionar material) ou edição em código no protótipo.
