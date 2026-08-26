# Caixa da Reciclagem

Controle de caixa do galpão de reciclagem: compras por pessoa, vendas, outras
movimentações, fechamento do dia com quebra de caixa e resumo por pessoa.
Substitui a planilha. O glossário do domínio está em [CONTEXT.md](CONTEXT.md).

Roda **inteiro no navegador**: React + Vite, dados no `localStorage` do
aparelho, sem servidor e sem login. Funciona offline (PWA instalável).

## Comandos

| Comando | Pra que |
| --- | --- |
| `npm run dev` | desenvolvimento no PC (http://localhost:5173) |
| `npm run dev:tablet` | idem, exposto na rede local — abrir pelo IP do PC no tablet |
| `npm run build` | gera `dist/` (estático, pronto pra hospedar) |
| `npm run preview` | serve o `dist/` como em produção |
| `npm run preview:tablet` | idem, exposto na rede local |
| `npm run lint` | eslint |

## Testar no tablet

O app é estático: sobe em qualquer hospedagem. O caminho mais curto é
`npm run build` e arrastar a pasta `dist/` em <https://app.netlify.com/drop> —
sai uma URL com HTTPS, que é o que o PWA precisa pra instalar na tela inicial.

**Navegador antigo.** O alvo de build é `es2019` (ver `vite.config.js`) porque o
tablet de teste é um Fire HD 8 7ª geração — Android 5.1, onde o Chrome para na
versão 95 e o Firefox na 143. Isso cobre a sintaxe, não APIs novas: se aparecer
tela branca num navegador muito velho (Silk do Fire OS), o passo seguinte é
adicionar `@vitejs/plugin-legacy` com polyfills.

## Os dados moram só no aparelho

Não existe servidor: cada tablet tem o seu próprio caixa no `localStorage`.
Limpar os dados do navegador apaga tudo. Por isso a tela **Backup · Restaurar**
(perfil Dono) exporta tudo — dias, índice, tabela de materiais — num único JSON,
e restaura a partir dele. **Baixe um backup no fim do dia.**

Restaurar *substitui* o conteúdo do aparelho pelo do arquivo; a tela mostra o
que tem dentro antes de confirmar.
