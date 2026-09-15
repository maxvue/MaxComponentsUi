# REV5-R07 — refutação independente de E04-04

- **Papel:** REV5-R07 — foco, Escape e pointer em overlays
- **Agente:** `/root/rev5_r07`
- **Parent:** `/root`
- **Início:** `2026-09-15T14:40:00-03:00`
- **Fim:** `2026-09-15T14:42:31-03:00`
- **HEAD auditado:** `927560b08ec668df322b9c62a33e1559e7a5318a`
- **Referência adversarial:** `aac16bca`
- **Modo:** somente leitura; nenhuma fonte ou teste de produto foi alterado.

## Caso adversarial exigido

O aceite de R07 exige Chromium usando **IconPicker, Markdown e Popover reais**, em pilha aninhada, para provar conjuntamente Tab, Shift+Tab, Escape e pointer externo. O caso é capaz de distinguir a referência: em `aac16bca`, `MaxPopover.vue` acrescenta `pointerdown` e `click` diretamente ao `document` (linhas 294--323 da versão), enquanto `useFocusTrap.ts` mantém somente a pilha/listener de `keydown`. Portanto, pointer não é decidido pelo mesmo topo que Tab/Escape.

No HEAD, a inspeção confirma a alteração estrutural: `useFocusTrap.ts` registra `keydown`, `pointerdown` e `click` em uma única pilha e `MaxPopover.vue` passa `outsideElements`/`onOutsidePointer`, sem seus listeners locais. Esta é evidência estática favorável, mas não substitui o cenário adversarial real solicitado.

## Execuções independentes

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)
Duration  2.18s

$ npx vitest run tests/helpers/useFocusTrap.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts
Test Files  4 passed (4)
Tests  74 passed (74)
Duration  4.09s

$ git diff --check
exit 0
```

## Refutação

O único teste Chromium de stack (`MaxFocusStack.browser.ts`) monta um `MaxPopover` real como camada A, mas a camada B é uma `div` sintética criada por `h('div', ...)` e um `useFocusTrap` chamado diretamente. Ele não monta `MaxInputIconPicker` nem `MaxInputMarkdown`, e tampouco cria a pilha real IconPicker → Markdown → Popover. Os 74 testes unitários focais executam cada componente de forma isolada; não cobrem a interoperação nem pointer externo nessa pilha.

Assim, não há execução independente que prove o requisito central de E04-04. A evidência atual também não demonstra, no navegador, que um Escape/pointer no topo real não alcance os demais overlays durante Teleport, nem que Tab/Shift+Tab atravesse apenas os focáveis da camada superior real.

## Revalidação independente pós-retry

- **Executor:** `/root/rev5_r07_retry`
- **Parent:** `/root`
- **Início:** `2026-09-15T16:19:00-03:00`
- **Fim:** `2026-09-15T16:19:46-03:00`
- **HEAD auditado:** `bac90d8c`
- **Modo:** somente leitura; nenhuma fonte ou teste de produto foi alterado.

O cenário agora monta no Chromium os três componentes reais: `MaxPopover`,
`MaxInputMarkdown` com o lightbox real e `MaxInputIconPicker` com drawer/backdrop.
Ele abre a pilha de três traps, verifica Tab e Shift+Tab dentro do drawer do
IconPicker, despacha `pointerdown` e `click` no backdrop (externo ao drawer) e
confirma que somente o topo fecha, sem click-through para lightbox/Popover. Em
seguida fecha cada camada por Escape e comprova o retorno de foco ao gatilho do
Popover e a pilha vazia.

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts
Test Files  1 passed (1)
Tests  3 passed (3)
Duration  2.82s
```

O runner imprimiu um warning conhecido do Tiptap (`Duplicate extension names:
['link', 'underline']`). Ele é emitido pela configuração do editor carregada
pela fixture e não representa listener concorrente, falha de foco ou falha de
pointer deste bloco; permanece sujeito ao gate global de política de warnings.

## Veredito

**ACEITO.** O caso adversarial obrigatório dos três componentes reais foi
executado independentemente em Chromium no HEAD `bac90d8c`. Tab/Shift+Tab,
pointer externo no topo sem click-through, Escape por camada, retorno de foco e
limpeza da pilha foram comprovados.
