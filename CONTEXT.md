# CONTEXT.md — Glossário do domínio

Glossário do domínio do controle de caixa e da coleta do shopping da reciclagem. Somente linguagem do domínio; nenhum detalhe de implementação.

## A operação

- **Galpão**: o negócio. Compra materiais recicláveis de quem traz, separa/seleciona e revende.
- **Shopping**: contrato de coleta de material reciclável fora do galpão. O material recolhido é medido em kg e pago por contrato no **fechamento mensal do shopping**. É um controle **separado do caixa**.
- **Dia**: o período de operação do caixa. Abre com um **fundo de caixa** em espécie e fecha com um **fechamento do dia**.

## Pessoas e papéis

- **Gestor** (também chamado de **Admin** ou **Dono**): gerencia o negócio. Registra o **fundo de caixa**, faz o **fechamento do dia**, define o **fundo do dia seguinte**, administra o **catálogo de materiais**, os **contatos**, a **coleta do shopping** e corrige registros do **dia aberto**. No protótipo, **dia fechado fica fechado**; reabertura fica para depois. Mantém também o **backup de dados**.
- **Funcionário(a)**: registra **compras**, **vendas** e **outras movimentações** do dia, consulta o **histórico** e pode **editar ou excluir** movimentações do **dia de hoje**, sempre com confirmação. De dias anteriores, só visualiza.
- **Catador**: pessoa que traz material para o galpão. Pode ser escolhido na **compra**.
- **Cliente**: pessoa ou empresa que compra material do galpão. Pode ser escolhido na **venda**.

## Movimentações

- **Compra**: material recebido no galpão. Valor = **peso** (kg) × **preço tabelado**. **Sai** do caixa. Não há desconto no valor.
- **Venda**: negócio de saída de material, com o **valor** combinado (obrigatório), **descrição do que foi vendido** e **peso** opcionais, e **comprador** opcional. **Entra** no caixa.
- **Outra movimentação**: entrada ou saída de dinheiro por outros fins (frete, insumos, pagamentos, devoluções, retiradas e aportes…), com descrição livre **obrigatória**.

## Caixa e conferência

- **Fundo de caixa** (termo antigo: **caixa inicial**): dinheiro em espécie deixado no início do dia, contado por **quebra de caixa** — a mesma contagem por cédula e moeda do fechamento. É sempre registrado pelo gestor e **nunca informado como um total digitado**: só vale a contagem por cédula e moeda. Dinheiro colocado ou retirado durante o dia entra como **outra movimentação**. O fundo do dia seguinte é definido depois do **fechamento do dia**, numa tela já preenchida com as quantidades contadas, que o gestor pode ajustar.
- **Saldo esperado**: fundo de caixa + entradas − saídas. Deriva das movimentações; é o valor que "deveria" estar na bolsa.
- **Contagem física**: dinheiro efetivamente contado na bolsa no fechamento, registrado por **quebra de caixa** (quantidade por cédula/moeda). O total é calculado a partir da quebra.
- **Cédulas e moedas**: as cédulas são de R$ 100, 50, 20, 10, 5 e 2; as moedas de R$ 1, 0,50, 0,25, 0,10 e 0,05. Mesma lista usada na **quebra de caixa**.
- **Sobra / Falta**: diferença entre a **contagem física** e o **saldo esperado**. Sobra quando contado > esperado; falta quando contado < esperado.
- **Fechamento do dia**: ato do gestor ao fim do dia — registra a **quebra de caixa** e calcula a diferença (**sobra/falta**). Em seguida, o gestor define o **fundo do próximo dia**, já preenchido com a contagem final e ajustável. No protótipo, o dia fechado fica fechado; não há reabertura.
- **Resumo do dia**: o que substitui a planilha — fundo de caixa, movimentações (compras, vendas, outras), contagem física, diferença e totais por material.

## Relatórios

- **PDF do dia**: documento gerado pelo gestor a qualquer momento — cabeçalho, resumo (fundo de caixa, entradas, saídas, saldo esperado) e tabela de movimentações (uma linha por movimentação).
- **Relatório de fechamento do dia**: PDF oficial no padrão da planilha do caixa — o mesmo conteúdo do **PDF do dia** mais a contagem por cédula/moeda no início e no fim (quantidade e total).
- **Backup de dados**: arquivo JSON com todos os dados do aplicativo, exportável e importável pelo gestor, para recuperar as informações se os dados do navegador forem apagados.

## Catálogo e contatos

- **Catálogo de materiais**: lista de materiais ativos e o **preço de compra por kg** no galpão. Administrado pelo gestor. Aqui, "gestão de estoque" significa apenas escolher os materiais ativos e seus preços: o app **não** mantém saldo de quantidade.
- **Contato**: cadastro de **catador** e/ou **cliente**, com nome e telefone (opcional). Só o gestor cadastra. Na compra e na venda, o funcionário pode escolher um contato cadastrado ou digitar um nome avulso (os dois opcionais); o nome avulso fica só no registro, não vira contato.

## Coleta do Shopping

- **Coleta**: registro dos materiais recolhidos no shopping, medido em **kg por material**. Não movimenta o caixa.
- **Tabela de preços do shopping**: preços de contrato por kg, próprios do shopping e separados dos preços do galpão. Administrada pelo gestor.
- **Fechamento mensal do shopping**: cálculo do **valor a pagar** no mês — kg total de cada material × preço de contrato — com a data de fechamento. Pede confirmação e, depois de fechado, o mês fica travado: não há reabertura. Não há controle de "pago".
- **Relatório mensal do shopping**: PDF com a relação das coletas do mês, totais por material e valor a pagar.
