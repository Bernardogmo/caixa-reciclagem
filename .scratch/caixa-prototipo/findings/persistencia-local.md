# Persistência local confiável no protótipo

Type: research (issue `03-persistencia-local.md`)
Status: resolvido
Data: 2026-08-05

## Recomendação (resumo)

**Usar `localStorage` com um registro por dia e escrita imediata (write-through) a cada mutação.** Sem IndexedDB, sem service worker e sem PWA neste protótipo.

- **Por quê:** é o mecanismo mais simples que existe (sincrônico, sem biblioteca, sem transação assíncrona), e o dado do dia é pequeno (KB). O dado sobrevive a fechar a aba e a reiniciar o navegador. A perda só acontece se o usuário limpar os dados do navegador ou (raro) sob pressão extrema de disco — risco que um `navigator.storage.persist()` reduz ainda mais.
- **Padrão do "dia em andamento":** persistir **a cada mudança** (gravar o objeto do dia inteiro), e **não** depender de `beforeunload`/`pagehide`. Assim fechar a aba no meio do dia não perde nada além do último campo digitado antes do último commit.
- **Uma chave por dia** (`dia:YYYY-MM-DD`) + uma chave-índice dos dias fechados + a tabela de materiais. Valores em **centavos (inteiros)** para evitar erro de ponto flutuante — importante porque o critério de validação é "diferença = R$ 0".
- **PWA/service worker não é necessário** para guardar dados. Ele só serve para o app *carregar* offline (código), exige HTTPS em produção (localhost é exceção) e é opcional neste protótipo (o galpão tem sinal móvel para carregar o app).

---

## Por que localStorage (e não IndexedDB nem PWA)

### 1. O que cada um é, de fato

| Mecanismo | Para que serve | Persiste dados do dia? |
|---|---|---|
| **localStorage** | pares chave→string, por origem, ~10 MiB | Sim. Sobrevive a fechar aba e reiniciar navegador. |
| **IndexedDB** | banco orientado a objetos, assíncrono, transacional, cota baseada em % do disco | Sim. Mesmo comportamento de persistência que o localStorage. |
| **Service worker + Cache Storage** | interceptar rede e cachear **assets do app** (HTML/JS/CSS) para carregar offline | **Não** — é cache de código, não de dados de usuário. Dados ficam em localStorage/IndexedDB de qualquer forma. |

Fontes: MDN Web Storage API; MDN IndexedDB Basic Terminology; MDN Service Worker API.

- **localStorage** "persiste mesmo quando o navegador é fechado e reaberto", é **síncrono** e limitado a **10 MiB por origem** (todos os navegadores). [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) · [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- **IndexedDB** "persiste dados dentro do navegador" em disco, atravessa sessões; só é apagado por: usuário limpando dados do site, navegação privada, cota/limite de disco, corrupção ou mudança incompatível. API **assíncrona e transacional**. [MDN IndexedDB Basic Terminology](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology)
- **Service worker** só existe em **contexto seguro (HTTPS)**; `http://localhost` é tratado como seguro para desenvolvimento. Ele não guarda dados — usa Cache Storage/IndexedDB. [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### 2. Cotas de armazenamento (Chrome/Android)

- **localStorage:** ~10 MiB por origem, fixo, independente do disco. Se estourar, `QuotaExceededError` (trate com try/catch). [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- **IndexedDB/Cache:** em Chrome (inclusive Android), uma origem pode usar **até 60% do disco**; o navegador inteiro até **80%**. [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) · [web.dev Storage for the web](https://web.dev/articles/storage-for-the-web)
- **Para este app a cota é irrelevante:** um dia com dezenas de movimentações é **poucos KB**; até um ano de dias fechados fica bem abaixo de 10 MiB. Não há cenário real de estouro.

### 3. O que sobrevive a quê

| Evento | localStorage | IndexedDB | Cache (service worker) |
|---|---|---|---|
| Fechar a aba | sobrevive | sobrevive | sobrevive |
| Reiniciar o navegador | sobrevive | sobrevive | sobrevive |
| "Limpar dados de navegação" → **cookies e dados de sites** | **apagado** | **apagado** | apagado (dados de site) |
| Modo anônimo/privado (fim da sessão) | **apagado** (tratado como sessionStorage) | apagado | apagado |
| Pressão de disco (eviction) | raro (LRU; dado pequeno e usado diariamente dificilmente é alvo) | possível (LRU; dados grandes são alvo primeiro) | possível |

- Ao limpar dados, **localStorage e IndexedDB são apagados juntos** sob "cookies e dados de sites" — o Google lista "Web Storage data" e "Indexed Database data" explicitamente. [Central de Ajuda do Chrome](https://support.google.com/chrome/answer/2392709) Portanto, "limpar dados do navegador" **não diferencia** os dois.
- **Nada** sobrevive a "limpar dados de navegação". A proteção real é o usuário **não limpar** os dados e a **exportação do resumo** (já prevista no projeto) para fora do aparelho.
- Na eviction, o navegador apaga **a origem inteira de uma vez** (tudo ou nada), por LRU, e "dados são muito raramente deletados pelo navegador" para sites visitados com frequência. [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)

### 4. O risco real de perder um "dia em andamento"

O risco **não** vem da escolha localStorage vs IndexedDB — os dois sobrevivem a fechar aba/reiniciar. O risco vem de **quando se grava**:

- **Padrão seguro (recomendado): write-through.** A cada mutação (nova compra/venda/outra, editar, quebra de caixa, abrir/fechar dia), gravar o objeto do dia inteiro em `localStorage`. O `setItem` é **uma operação síncrona e atômica**: ou grava o valor inteiro, ou lança exceção — nunca fica um JSON "pela metade". Fechar a aba no meio do dia perde no máximo o campo que estava sendo digitado **desde o último commit** (segundos).
- **Padrão inseguro:** confiar em `beforeunload`/`pagehide` para gravar no fechamento. No Android o navegador/OS pode matar a aba **sem disparar o evento**; isso é um "flush de último recurso", não a persistência principal.
- **IndexedDB não é inerentemente mais seguro aqui.** A diferença prática a favor dele é só o sinal de "commit concluído" (await na transação) e atomicidade multi-chave — irrelevante para gravar **uma chave** por vez num app de KB.
- Chamar `navigator.storage.persist()` na inicialização é uma linha que **protege o localStorage da eviction por pressão de disco**: com persistência, os dados "só são apagados se o usuário escolher" e, em Chrome, "não sofrerão eviction". [web.dev Persistent storage](https://web.dev/articles/persistent-storage) · [Storage Standard (WHATWG)](https://storage.spec.whatwg.org/) O Chrome resolve o pedido automaticamente (sem prompt), concedendo para sites "importantes" (instalados/marcados/com engajamento); não é garantido em 100% dos casos, então é reforço opcional, não dependência.

### 5. Por que não IndexedDB *agora*

- É a escolha certa para dados **grandes, consultáveis ou multi-chave atômicos** — nenhum destes se aplica a um registro de dia com alguns KB.
- O custo é real num protótipo: API assíncrona, transações, schema/versão, `loading state` no React para leitura inicial (enquanto localStorage lê **sincronamente** no boot).
- Decisão registrada: começar com localStorage (simples); se o app crescer (muitos meses de histórico, precisar de consultas ou migração multi-chave), migrar o módulo de persistência para IndexedDB **sem mudar o layout de dados** — o layout abaixo é agnóstico de mecanismo.

### 6. Gotchas (armadilhas)

1. **Modo anônimo:** em modo privado, o localStorage é tratado como sessionStorage e é **apagado ao fechar a aba/navegador**. Um dia aberto no anônimo se perde no fim da sessão. No tablet compartilhado, usar sempre o modo normal (e não há detecção confiável de anônimo — orientar no treinamento).
2. **"Limpar dados de navegação" apaga tudo** (localStorage, IndexedDB e cache juntos). É a única forma real de perder o dia além de pressão de disco. Exportar o resumo diariamente (fora do aparelho) é a proteção de negócio.
3. **Service worker exige HTTPS** em produção; `localhost` é a única exceção. Se um dia for adicionar PWA (carregar o app offline), o host precisará ser HTTPS (ex.: Firebase Hosting, Netlify) — o `vite preview`/`vite dev` servem de `localhost` e funcionam em desenvolvimento. [MDN Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
4. **Manifest/service worker não são necessários** para persistir dados. Só valem a pena se quiserem: instalar o app na tela inicial (modo tela cheia, mais kiosk) e carregar o app com **zero sinal**. Como o galpão tem sinal móvel, o app recarrega da rede; fica para depois.
5. **`navigator.storage.persist()`** só está disponível em contexto seguro (HTTPS); em `http://localhost` funciona; num host HTTP puro falha silenciosamente — ok, é opcional.
6. **Dinheiro em float quebra a conferência.** `0.1 + 0.2 !== 0.3` faria o saldo esperado divergir da quebra. Guardar valores em **centavos (inteiros)**; peso/quantidade podem ser float de exibição.
7. **JSON é string:** serializar com `JSON.stringify`/`parse` e tratar `QuotaExceededError` com try/catch em toda escrita (não deve ocorrer neste tamanho, mas é o comportamento correto).
8. **Safari** tem eviction de 7 dias para dados de script em sites não-instalados — **irrelevante** aqui (alvo é só Android/Chrome).
9. **Campos derivados:** `saldoEsperado`, `total` da quebra e `diferenca` devem ser **recalculados ao carregar** a partir das movimentações (decisão do mapa: "saldo esperado é sempre derivado"); o que está salvo é um cache, não fonte da verdade.

---

## Layout de dados recomendado

### Chaves em `localStorage`

| Chave | Conteúdo |
|---|---|
| `dia:YYYY-MM-DD` | registro completo de um dia (aberto, reaberto ou fechado) — **1 registro por dia** |
| `indice-dias` | array de datas (`["2026-08-05", ...]`) para listar os dias fechados sem varrer todas as chaves |
| `tabela-materiais` | tabela de materiais (preço/kg por material), editável pelo dono |
| `app:meta` | metadados do app (ex.: `version` do schema, último perfil usado — opcional) |

### Registro de um dia (`dia:2026-08-05`)

```json
{
  "version": 1,
  "data": "2026-08-05",
  "status": "aberto",
  "perfilAbertura": "funcionario",
  "caixaInicialCentavos": 15000,
  "movimentacoes": [
    {
      "id": "c-20260805-0830-1",
      "tipo": "compra",
      "registradoPor": "funcionario",
      "timestamp": "2026-08-05T08:30:00-03:00",
      "material": "latinha",
      "pesoKg": 12.75,
      "precoPorKgCentavos": 600,
      "descontoCentavos": 200,
      "valorCentavos": 7450
    },
    {
      "id": "v-20260805-1030-1",
      "tipo": "venda",
      "registradoPor": "funcionario",
      "timestamp": "2026-08-05T10:30:00-03:00",
      "itens": [
        { "material": "aluminio", "descricao": "", "quantidade": 100, "valorCentavos": 15000 },
        { "material": "", "descricao": "sucata mista", "quantidade": 1, "valorCentavos": 4000 }
      ],
      "ajusteTotalCentavos": 0,
      "totalCentavos": 19000
    },
    {
      "id": "o-20260805-1130-1",
      "tipo": "outra",
      "registradoPor": "dono",
      "timestamp": "2026-08-05T11:30:00-03:00",
      "direcao": "saida",
      "descricao": "frete ate o comprador",
      "valorCentavos": 8000
    }
  ],
  "quebraDeCaixa": {
    "cedulas": { "100": 3, "50": 1, "20": 2, "10": 4, "5": 3, "2": 5 },
    "moedas": { "100": 10, "50": 4, "25": 6, "10": 20, "5": 15, "1": 12 },
    "totalCentavos": 58250
  },
  "saldoEsperadoCentavos": 58000,
  "diferencaCentavos": 250,
  "abertoEm": "2026-08-05T07:00:00-03:00",
  "abertoPor": "dono",
  "fechadoEm": null,
  "fechadoPor": null
}
```

Notas do layout:

- **Campos por tipo de movimentação** (objetos com forma distinta, mesmo array):
  - `compra`: `material`, `pesoKg`, `precoPorKgCentavos`, `descontoCentavos`, `valorCentavos` (peso×preço−desconto). Sai do caixa.
  - `venda`: `itens[]` (1+ itens com `material|descricao` + `quantidade` + `valorCentavos`), `ajusteTotalCentavos`, `totalCentavos` (soma dos itens + ajuste). Entra no caixa.
  - `outra`: `direcao` (`entrada`|`saida`), `descricao`, `valorCentavos`.
- **Campos derivados** (`saldoEsperadoCentavos`, `quebraDeCaixa.totalCentavos`, `diferencaCentavos`) são salvos como cache de exibição e **recalculados no load**.
- **`id`** estável (ex.: `{tipo}-{data compacta}-{hhmm}-{seq}`) para edição/correção e para o React usar como key.
- **`fechadoEm`/`fechadoPor`** nulos enquanto o dia está aberto; preenchidos no fechamento; um dia fechado pode virar `status: "reaberto"` (correção pelo dono) sem perder o histórico.
- **Moeda em centavos (inteiro)** em todos os campos `*Centavos`. **Peso/quantidade** em float de exibição.

### Índice de dias fechados

```json
"indice-dias": ["2026-08-05", "2026-08-04"]
```

Atualizar (push da data, sem duplicar) quando o dia é fechado. O dia corrente não entra no índice até fechar.

### Tabela de materiais (dono)

```json
"tabela-materiais": {
  "version": 1,
  "atualizadaEm": "2026-08-01T10:00:00-03:00",
  "materiais": [
    { "nome": "latinha", "precoPorKgCentavos": 600 },
    { "nome": "aluminio", "precoPorKgCentavos": 550 }
  ]
}
```

---

## Fontes

- MDN — Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
- MDN — Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- MDN — IndexedDB Basic Terminology: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Basic_Terminology
- MDN — Service Worker API: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
- MDN — StorageManager.persist(): https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist
- web.dev — Persistent storage: https://web.dev/articles/persistent-storage
- web.dev — Storage for the web: https://web.dev/articles/storage-for-the-web
- Storage Standard (WHATWG): https://storage.spec.whatwg.org/
- Central de Ajuda do Chrome — limpar dados de navegação: https://support.google.com/chrome/answer/2392709
