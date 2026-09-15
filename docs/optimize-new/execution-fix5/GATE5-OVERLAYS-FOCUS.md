# GATE5-OVERLAYS-FOCUS — overlays e foco

## Revalidação no estado integrado — 2026-09-15

- Papel: `GATE5-OVERLAYS-FOCUS` (somente leitura de código).
- Agente de revalidação: `/root/rev5_r04_chrome151`; parent: `/root`.
- Início: `2026-09-15T18:39:00-03:00`; fim: `2026-09-15T18:40:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com alterações locais
  integradas de bootstrap/browser, motion e package.

### Evidência reproduzida

```text
$ npm run type-check -- --pretty false
exit 0

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts --reporter=verbose
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  3.14s

$ npx vitest run tests/helpers/useFocusTrap.test.ts tests/helpers/useOutsidePointer.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts --reporter=verbose
Test Files  5 passed (5)
Tests  88 passed (88)
Duration  7.70s

$ git diff --check
exit 0
```

O cenário Chromium concreto prova o stack IconPicker + lightbox Markdown +
Popover: Tab e Shift+Tab são confinados no topo, Escape fecha uma camada por
vez, pointer/backdrop não faz click-through, o foco retorna ao gatilho certo e
unmount de camada intermediária limpa a pilha/listeners. As suítes unitárias
preservam a mesma política para focus trap, outside pointer, Popover,
IconPicker e Markdown.

Não houve warnings Vue/tooltip após a correção dos bootstraps, nem mensagens
de Tiptap (`Duplicate extension names`/`tiptap warn`), Lottie/`AbortError` ou
erros de console na saída dessa revalidação.

### Veredito da revalidação

**ACEITO.** O comportamento de foco e overlays e a política de warnings
permanecem corretos no estado integrado atual.

- **Papel:** GATE5-OVERLAYS-FOCUS
- **Agente:** `/root/gate5_overlays_focus`
- **Parent:** `/root`
- **Início:** `2026-09-15T17:43:00-03:00`
- **Fim:** `2026-09-15T17:43:29-03:00`
- **HEAD auditado:** `cabb5d710f452a8a27e34d92210a28261491f8ac`
- **Modo:** somente leitura da implementação; este relatório e a matriz são evidências do gate.

## Escopo e casos executados

O cenário Chromium monta componentes reais: `MaxPopover`, `MaxInputMarkdown`
com seu lightbox de imagem e `MaxInputIconPicker` com drawer/backdrop. A pilha
concreta valida Tab e Shift+Tab no topo, `pointerdown` e clique no backdrop sem
click-through, Escape de uma camada por vez, retorno ao gatilho e limpeza da
pilha. A inspeção do motor confirma que os listeners globais de `keydown`,
`pointerdown` e `click` são centralizados em `useFocusTrap`.

## Execuções

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  2.84s
```

```text
$ npx vitest run tests/helpers/useFocusTrap.test.ts tests/helpers/useOutsidePointer.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts
Test Files  5 passed (5)
Tests  88 passed (88)
Duration  7.28s
```

```text
$ git diff --check
exit 0
```

## Avisos e veredito

O browser retornou, de modo reproduzível ao montar o Markdown real:

```text
[tiptap warn]: Duplicate extension names found: ['link', 'underline'].
This can lead to issues.
```

Não ocorreram falhas de Tab, Shift+Tab, Escape, ponteiro, retorno de foco ou
limpeza de listeners/pilha. Apesar disso, a Etapa 15 exige política explícita
sem warnings inesperados. O aviso é emitido pela aplicação, não foi classificado
como inevitável e pode indicar configuração duplicada do editor. Portanto o
veredito é **REJEITADO** até que o warning seja eliminado ou legitimamente
classificado pelo gate global de política de warnings.
