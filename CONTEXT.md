# CONTEXT.md — Glossário do domínio

Glossário do domínio do controle de caixa da reciclagem. Somente linguagem do domínio; nenhum detalhe de implementação.

## A operação

- **Galpão**: o negócio. Compra materiais recicláveis de quem traz, separa/seleciona, e revende.
- **Dia**: o período de operação. Abre com um **caixa inicial** em espécie e fecha com um **fechamento do dia**.

## Pessoas e papéis

- **Gestor**: gerencia o negócio. Faz o **caixa inicial**, o **fechamento do dia**, administra a **tabela de materiais** e corrige registros errados.
- **Funcionário(a)**: registra **compras**, **vendas** e **outras movimentações**, vê o **histórico do dia** e o **saldo esperado**.

## Movimentações

- **Compra**: material recebido no galpão. Valor = **peso** (kg) × **preço tabelado**, podendo sofrer **desconto** (ex.: saco de latinha com peso inflado por areia/pedra — a funcionária desconta do valor pago). **Sai** do caixa.
- **Venda**: negócio de saída de material, com **um ou mais itens** (material ou descrição livre + quantidade + valor). O valor é o combinado com o comprador. **Entra** no caixa.
- **Outra movimentação**: entrada ou saída de dinheiro por outros fins (frete, insumos, pagamentos, devoluções…), com descrição livre.

## Caixa e conferência

- **Caixa inicial**: dinheiro em espécie deixado no início do dia, contado por **quebra de caixa** — a mesma contagem por cédula e moeda do fechamento.
- **Saldo esperado**: caixa inicial + entradas − saídas. Deriva das movimentações; é o valor que "deveria" estar na bolsa.
- **Contagem física**: dinheiro efetivamente contado na bolsa no fechamento, registrado por **quebra de caixa** (quantidade por cédula/moeda). O total é calculado a partir da quebra.
- **Cédulas e moedas**: as cédulas são de R$ 100, 50, 20, 10, 5 e 2; as moedas de R$ 1, 0,50, 0,25, 0,10 e 0,05. Mesma lista usada na **quebra de caixa**.
- **Sobra / Falta**: diferença entre a **contagem física** e o **saldo esperado**. Sobra quando contado > esperado; falta quando contado < esperado.
- **Fechamento do dia**: ato do gestor ao fim do dia — registra a **quebra de caixa**, calcula a diferença (**sobra/falta**) e gera o **resumo do dia**.

## Registros

- **Resumo do dia**: o que substitui a planilha — caixa inicial, movimentações (compras, vendas, outras), contagem física, diferença e totais por material.
- **Tabela de materiais**: preço por kg de compra de cada material. Administrada pelo gestor.
