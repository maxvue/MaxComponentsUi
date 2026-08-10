# Diretiva `v-tooltip` com `escape: false` injeta HTML sem sanitização

- **Categoria:** segurança
- **Severidade:** alta
- **Arquivo(s):** `src/directives/tooltip.ts:91-97`
- **Domínio:** helpers-composables

## Problema

```ts
// src/directives/tooltip.ts:91-97
const renderText = (tooltipEl: HTMLElement, options: TooltipOptions) => {
    const textEl = tooltipEl.querySelector('.max-tooltip-text') as HTMLElement | null;
    if (!textEl) return;
    const value = options.value ?? '';
    if (options.escape === false) textEl.innerHTML = value;
    else textEl.textContent = value;
};
```

Com `escape: false`, o valor do binding é atribuído direto a `innerHTML`, sem passar por nenhum sanitizador. O projeto **já tem** `DOMPurify` como dependência e um helper de sanitização em uso (`src/helpers/sanitizeSvg.ts:1`, `:23-25`), aplicado justamente ao conteúdo que vai para `v-html`. A diretiva de tooltip não usa nada disso.

O comportamento está coberto por teste como se fosse a especificação desejada (`tests/directives/tooltip.test.ts:158`, `'escape false: HTML e interpretado'`), o que consolida o risco em vez de sinalizá-lo.

Detalhe agravante: `renderText` é chamada tanto em `createTooltip` (linha 123) quanto no hook `updated` (linha 204). Ou seja, uma atualização reativa do binding com dados vindos de API reinjeta HTML não confiável a cada mudança.

Note que `innerHTML` não executa `<script>` inline, mas executa handlers como `<img src=x onerror=...>` — o vetor clássico. É o mesmo vetor que `sanitizeSvg.ts:7` (`DANGEROUS_CONTENT_REGEX = /<script|\son\w+\s*=/i`) explicitamente considera perigoso no outro caminho da lib.

## Impacto

Qualquer app consumidora que use `v-tooltip="{ value: dadoDaApi, escape: false }"` — um uso natural para tooltips com `<br>` ou `<strong>` — abre um XSS armazenado se o conteúdo vier do backend com input de usuário. A inconsistência com `sanitizeSvg` significa que a lib aplica dois padrões de segurança diferentes para o mesmo tipo de operação.

## Plano de correção

1. Criar (ou generalizar) um helper `sanitizeHtml(raw: string): string` usando `DOMPurify.sanitize` com uma allowlist restrita de tags de formatação (`b`, `strong`, `i`, `em`, `br`, `span`, `small`) e nenhum atributo de evento.
2. Em `renderText`, no ramo `escape === false`, passar o valor por `sanitizeHtml` antes de atribuir a `innerHTML`.
3. Documentar no JSDoc da opção `escape` (interface `TooltipOptions`, linha 6) que o HTML é sanitizado e qual é a allowlist.
4. Ajustar o teste `'escape false: HTML e interpretado'` (`tests/directives/tooltip.test.ts:158`) para usar uma tag permitida, e adicionar um caso comprovando que `<img src=x onerror=alert(1)>` é neutralizado.

## Verificação

- Testes a criar/ajustar: `tests/directives/tooltip.test.ts` (ajustar `:158`, adicionar caso de payload malicioso)
- Comandos: `npx vitest run tests/directives/tooltip.test.ts`, `npm run type-check`, `npm run lint`
