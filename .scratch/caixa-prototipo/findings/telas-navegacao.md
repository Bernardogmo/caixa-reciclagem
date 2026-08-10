# Telas e navegação — resolução (ticket 01)

Veredito do ticket 01, aprovado pelo usuário em 2026-08-09 via HITL. Fonte primária para implementar o protótipo.

## Decisões

- **Tela do funcionário**: variante **B — abas em uma tela só**. Saldo esperado sempre visível no topo; abas `HOJE | COMPRA | VENDA` trocam o conteúdo sem navegação extra. A aba HOJE é o histórico do dia (compras e vendas). Funcionário NÃO vê outras movimentações.
- **Tabela de materiais**: tela no app, administrada pelo dono (editar preço/kg e adicionar material). Sem edição em código no protótipo.
- **Caixa inicial**: valor único em R$ na abertura do dia (sem quebra no protótipo).
- **Cédulas e moedas da quebra**: R$ 100, 50, 20, 10, 5, 2 (cédulas) e R$ 1, 0,50, 0,25, 0,10, 0,05 (moedas).
- **UX do funcionário**: campos de preenchimento e leitura grandes, toque fácil, o mais intuitivo possível.

## Fluxo

1. **Seletor de perfil** (abertura): funcionário(a) / dono(a), sem senha.
2. **Funcionário**: tela do dia em abas (HOJE/COMPRA/VENDA) → formulários de compra e venda.
3. **Dono**: tela do dono → compras, vendas, outras movimentações, materiais, fechamento, dias fechados, reabertura.

## Esboços aprovados

### Seletor de perfil

```
┌──────────────────────────────────┐
│  ♻  CONTROLE DE CAIXA            │
│  Quem está usando?               │
│  ┌────────────────────────────┐  │
│  │   👷  FUNCIONÁRIO(A)       │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │   🧑  DONO(A)              │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Tela do funcionário (variante B — abas)

```
┌──────────────────────────────────┐
│  SEXTA, 14/08          👷 [trocar]│
│  SALDO ESPERADO: R$ 1.234,56     │
│  ┌──────┬──────┬──────┬─────────┐ │
│  │ HOJE │COMPRA│VENDA │ [editar]│ │
│  └──────┴──────┴──────┴─────────┘ │
│  (aba HOJE ativa: histórico)      │
│  COMPRA 14:23  Latinha  R$25,00 │
│  VENDA  13:10  Papelão  R$40,00 │
│  COMPRA 11:45  PET      R$12,00 │
│  VENDA  10:02  Metal    R$60,00 │
└──────────────────────────────────┘
```

Nota: no esboço original apareceu uma 4ª coluna `[editar]`; no protótipo a aba de edição/correção é só do dono. A aba `[trocar]` no topo troca o perfil.

### Formulário de compra

```
┌──────────────────────────────────┐
│  ‹ Voltar        COMPRAR         │
│  MATERIAL                         │
│  ┌────────────────────────────┐  │
│  │  Latinha          R$5/kg   ▾ │  │
│  └────────────────────────────┘  │
│  PESO (kg)                       │
│  ┌────────────────────────────┐  │
│  │          5,0               │  │
│  └────────────────────────────┘  │
│  DESCONTO (R$) — só se tiver     │
│  ┌────────────────────────────┐  │
│  │                           │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │  TOTAL A PAGAR: R$ 25,00   │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │   ✔  CONFIRMAR COMPRA      │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Formulário de venda (1+ itens)

```
┌──────────────────────────────────┐
│  ‹ Voltar        VENDER          │
│  ┌─ ITEM 1 ────────────────────┐ │
│  │ Material/descrição [Papelão ]│ │
│  │ Quantidade      [ 500 ]  kg │ │
│  │ Valor           [ 40,00 ]   │ │
│  └─────────────────────────────┘ │
│  [ + adicionar item ]            │
│  TOTAL: R$ 40,00                 │
│  AJUSTE NO TOTAL: R$ [      ]    │
│  ┌────────────────────────────┐  │
│  │   ✔  CONFIRMAR VENDA       │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Tela do dono

```
┌──────────────────────────────────┐
│  SEXTA, 14/08          🧑  [trocar]│
│  SALDO ESPERADO: R$ 1.234,56     │
│  ┌────────┐  ┌────────┐          │
│  │COMPRAS │  │ VENDAS │          │
│  └────────┘  └────────┘          │
│  ┌────────┐  ┌────────┐          │
│  │ OUTRAS │  │MATERIAIS│          │
│  └────────┘  └────────┘          │
│  ────────────────────────────    │
│  [ ✔ FECHAR O DIA ]              │
│  [ 📂 Dias fechados ]            │
│  [ 🔁 Reabrir o dia (correção) ] │
└──────────────────────────────────┘
```

Outras movimentações (dono): tipo **Sai / Entra**, descrição livre e valor.

### Abertura do dia (dono) — caixa inicial

```
┌──────────────────────────────────┐
│  ABRIR O DIA                     │
│  Quanto vai na bolsa pra começar?│
│  ┌────────────────────────────┐  │
│  │        R$ 100,00           │  │
│  └────────────────────────────┘  │
│  ┌────────────────────────────┐  │
│  │    ✔  ABRIR O DIA          │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

### Fechamento do dia (dono) — quebra de caixa

```
┌──────────────────────────────────┐
│  FECHAR O DIA — conta a bolsa    │
│  CÉDULAS       QTD               │
│  R$ 100,00   [ 2 ]               │
│  R$ 50,00    [ 1 ]               │
│  R$ 20,00    [ 1 ]               │
│  R$ 10,00    [ 1 ]               │
│  R$ 5,00     [ 3 ]               │
│  R$ 2,00     [ 1 ]               │
│  MOEDAS       QTD                │
│  R$ 1,00     [ 5 ]               │
│  R$ 0,50     [ 3 ]               │
│  R$ 0,25     [ 1 ]               │
│  R$ 0,10     [ 2 ]               │
│  R$ 0,05     [ 1 ]               │
│  ┌────────────────────────────┐  │
│  │ CONTADO:     R$ 301,00     │  │
│  │ ESPERADO:    R$ 296,00     │  │
│  │ SOBRA:       + R$ 5,00     │  │
│  └────────────────────────────┘  │
│  [✏ Corrigir]  [✔ FECHAR DIA]    │
└──────────────────────────────────┘
```

### Dias fechados (dono)

```
┌──────────────────────────────────┐
│  ‹ Voltar      DIAS FECHADOS     │
│  SEG 10/08    diferença R$ 0,00  │
│  TER 11/08    diferença +R$ 2,50 │
│  QUA 12/08    diferença −R$ 1,00 │
│  QUI 13/08    diferença R$ 0,00  │
│  (tocar num dia abre o resumo)   │
└──────────────────────────────────┘
```

### Tabela de materiais (dono)

```
┌──────────────────────────────────┐
│  ‹ Voltar   TABELA DE MATERIAIS  │
│  Preço de COMPRA por kg          │
│  Latinha              R$ 5,00 ✎ │
│  PET                  R$ 1,00 ✎ │
│  Papelão              R$ 0,30 ✎ │
│  Metal                R$ 10,00 ✎ │
│  ┌────────────────────────────┐  │
│  │   + ADICIONAR MATERIAL     │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

## Decisões em aberto (encaminhadas a outros tickets)

- **Resumo do dia** e formato do texto exportado (WhatsApp) → ticket 02. A aba HOJE e a tela de fechamento mostram os números, mas o texto/arquivo de exportação afina lá.
- **Persistência** (localStorage, dinheiro em centavos) → ticket 03 (pesquisa já concluída).
