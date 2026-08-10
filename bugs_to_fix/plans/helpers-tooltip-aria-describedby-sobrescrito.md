# Diretiva `v-tooltip` sobrescreve e apaga um `aria-describedby` pré-existente do gatilho

- **Categoria:** falha
- **Severidade:** baixa
- **Arquivo(s):** `src/directives/tooltip.ts:121`, `:131`
- **Domínio:** helpers-composables

## Problema

Na criação, a diretiva atribui o atributo sem consultar o valor anterior:

```ts
// src/directives/tooltip.ts:121
el.setAttribute('aria-describedby', state.tooltipId);
```

e na destruição remove o atributo por inteiro:

```ts
// src/directives/tooltip.ts:131
el.removeAttribute('aria-describedby');
```

`aria-describedby` aceita uma **lista de IDs separados por espaço**. Um elemento que já tenha uma descrição associada — cenário comum em inputs de formulário desta lib, onde `InputBase` (`src/components/InputBase.vue`) renderiza linha de mensagem/feedback abaixo do campo — perde essa associação assim que o tooltip é exibido, e nunca a recupera: o `removeAttribute` da linha 131 apaga também o ID original.

O teste existente (`tests/directives/tooltip.test.ts:245-253`) monta um `<button>` sem `aria-describedby` prévio, então cobre apenas o caso trivial.

## Impacto

Leitores de tela deixam de anunciar a mensagem de validação/ajuda do campo enquanto o tooltip está visível — e, após o primeiro hover, permanentemente, já que o atributo original foi removido. É uma regressão de acessibilidade silenciosa, restrita a elementos que combinem tooltip com descrição própria.

## Plano de correção

1. Em `createTooltip` (linha 121), ler o valor atual, guardá-lo no `state` (novo campo `previous_describedby: string | null`) e escrever a concatenação: `[previous, state.tooltipId].filter(Boolean).join(' ')`.
2. Em `destroyTooltip` (linha 131), remover apenas o próprio ID da lista; restaurar o valor original quando ele existia, e só usar `removeAttribute` quando a lista resultante ficar vazia.
3. Garantir a simetria mesmo com `create`/`destroy` chamados múltiplas vezes (hover repetido) — o ID não pode ser acumulado em duplicata.

## Verificação

- Testes a criar/ajustar: `tests/directives/tooltip.test.ts` — montar um gatilho com `aria-describedby="msg-1"` e assertar: durante o hover o atributo vale `'msg-1 max-tooltip-N'`; após o `mouseleave` volta a valer exatamente `'msg-1'`; após três ciclos de hover não há IDs duplicados.
- Comandos: `npx vitest run tests/directives/tooltip.test.ts`, `npm run type-check`, `npm run lint`
