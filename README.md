# Caixa da Reciclagem

Controle de caixa do galpão de reciclagem: compras por pessoa, vendas, outras
movimentações, fechamento do dia com quebra de caixa e resumo por pessoa.
Substitui a planilha. O glossário do domínio está em [CONTEXT.md](CONTEXT.md).

Roda no navegador (React + Vite, PWA instalável) com **login por e-mail e
senha**. O caixa fica num **banco compartilhado no Firebase (Firestore)**:
o tablet e os celulares veem e lançam no **mesmo caixa**, em tempo real, e o
app **funciona sem internet** depois do primeiro acesso de cada aparelho.

## Comandos

| Comando | Pra que |
| --- | --- |
| `npm run dev` | desenvolvimento no PC (http://localhost:5173) |
| `npm run dev:tablet` | idem, exposto na rede local — abrir pelo IP do PC no tablet |
| `npm run build` | gera `dist/` (estático, pronto pra hospedar) |
| `npm run preview` | serve o `dist/` como em produção |
| `npm run preview:tablet` | idem, exposto na rede local |
| `npm run lint` | eslint (hoje acusa `react/prop-types` no repo inteiro) |

## Quem entra e o que vê

- **Funcionário(a)** (`papel: "comum"`): só a tela do funcionário — lança
  compras, vendas e outras movimentações e vê o histórico do dia.
- **Gestor(a)** (`papel: "admin"`): escolhe o modo depois do login. No modo
  funcionário usa a tela simples; no modo gestor tem tudo: fechar o dia,
  materiais, coletas do shopping, contatos, usuários, backup e dias fechados.

O nome de quem lançou, editou ou fechou fica gravado em cada registro.

## Primeira configuração (uma vez, no console do Firebase)

Projeto: **caixa-da-reciclagem**.

1. **Authentication → Sign-in method → Email/Password → ativar.**
2. **Firestore Database → Criar banco → modo produção → região
   `southamerica-east1` (São Paulo).**
3. **Authentication → Users → Add user**: e-mail e senha do gestor. Copiar o UID.
4. **Firestore → coleção `usuarios` → documento com ID = UID** do passo 3, com
   campos `nome` (texto, ex.: "Bernardo"), `email` (texto) e `papel` (texto,
   `admin`).

Depois disso só o gestor cria contas: **Gestor → USUÁRIOS → Criar conta nova**
(nome, e-mail, senha e papel). Tirar o acesso de alguém é remover a conta da
lista — a pessoa sai na hora, em todos os aparelhos. A troca de senha é por
e-mail (botão na mesma tela ou “Esqueci minha senha” no login).

Regras de acesso em `firestore.rules`. Publicar as regras **é obrigatório**
antes de usar o app:

```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

## Funcionamento offline

- O **primeiro acesso de cada aparelho precisa de internet** (login + carga
  inicial do banco). Depois disso o app abre e funciona sem internet.
- Lançar, editar, excluir e consultar o dia atual funcionam offline; ao
  reconectar, tudo sincroniza sozinho. Uma faixa “📴 Sem internet” aparece no
  topo enquanto o aparelho estiver desconectado.
- Dias fechados/dias antigos vistos pela primeira vez ainda precisam de
  internet (ficam no cache do aparelho depois).
- Cada lançamento é gravado como um campo próprio no banco: duas pessoas
  lançando offline ao mesmo tempo não apagam um o lançamento do outro. Se as
  duas mexerem na mesma movimentação (ou fecharem o dia juntas), vale a última
  gravação.

## Dados antigos do app (migração)

O app antes guardava o caixa no `localStorage` de cada aparelho. Na primeira
vez que o gestor entrar num aparelho que ainda tem esses dados, aparece a tela
**“Dados deste aparelho”**, com a opção de enviar tudo para o caixa
compartilhado (ou começar do zero). A cópia antiga **não é apagada** — fica no
aparelho só por segurança.

## Backup

O caixa fica no banco compartilhado, e a tela **Gestor → Backup · Restaurar**
baixa um JSON com tudo (dias, dia aberto, materiais, shopping, contatos).
Baixe um backup de vez em quando. Restaurar *substitui* o caixa de todos os
aparelhos pelo conteúdo do arquivo — a tela mostra o que tem dentro antes de
confirmar.

## Testar no tablet

O app é hospedado em <https://caixa-da-reciclagem.web.app> e instala na tela
inicial como PWA. Para desenvolvimento na rede local, use `npm run dev:tablet`
ou `npm run preview:tablet`.

**Navegador antigo.** O alvo de build é `es2019` (ver `vite.config.js`) porque o
tablet de teste é um Fire HD 8 7ª geração — Android 5.1, onde o Chrome para na
versão 95 e o Firefox na 143. Se o SDK do Firebase 11 der tela branca nesse
aparelho, o plano B é fixar `firebase@9` (build `compat`) antes de seguir.

## Custos

O Firebase no plano Spark (gratuito) cobre com folga o uso de um galpão; não
há cobrança nova. O upload do Hosting é estático e o Firestore inclui
armazenamento e leituras/gravações diárias muito acima do uso normal.
