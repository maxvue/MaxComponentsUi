# Relatório de implementação — IMP5-R07

- **Papel:** IMP5-R07 — E04-04 (foco, Escape e pointer de overlays)
- **Agente:** `/root/imp5_r07`
- **Parent:** `/root`
- **Início:** 2026-09-15T14:37:00-03:00
- **Fim:** 2026-09-15T14:40:00-03:00
- **HEAD auditado:** `41c526941508ddb72c72f1bf31f86d2d2e99bbb4`
- **Referência adversarial:** `aac16bca`

## Manifesto e limite de ownership

Arquivos próprios: `src/helpers/useFocusTrap.ts`, `src/components/MaxPopover.vue`, `tests/helpers/useFocusTrap.test.ts`, este relatório e a linha IMP5-R07 da matriz.

`src/helpers/useOutsidePointer.ts` pertence ao F07 e não foi alterado. Foram preservados os mecanismos dele para seus consumidores; o Popover deixou de instalar seu par local concorrente de listeners e passou a registrar ponteiro externo no coordenador de foco canônico.

## Reprodução e causa

O `MaxPopover` tinha `onDocPointerDown`/`onDocClick` e registrava ambos diretamente no `document`, enquanto `useFocusTrap` mantinha a pilha de Tab/Escape. Assim, a mesma instância tinha duas fontes de ownership global e a decisão de pointer não era topmost na mesma pilha que foco e Escape.

## Correção

- `useFocusTrap` agora coordena `keydown`, `pointerdown` e `click` com uma única `trapStack` e instala/remove exatamente um conjunto global desses listeners.
- A opção `outsideElements` permite incluir a âncora; `onOutsidePointer` recebe apenas cliques iniciados e terminados fora da camada superior.
- `MaxPopover` registra seu trigger e `hide()` nessa API e removeu os listeners/document state locais.
- IconPicker e Markdown já usam exclusivamente `useFocusTrap` para Tab/Escape e não mantêm listeners próprios concorrentes; seus testes reais de componente continuam aprovados.

## Evidências executadas

```text
$ npx vitest run tests/helpers/useFocusTrap.test.ts tests/components/MaxPopover.test.ts tests/components/MaxInputIconPicker.test.ts tests/components/MaxInputMarkdown.test.ts
Test Files  4 passed (4)
Tests  74 passed (74)

$ npx eslint src/helpers/useFocusTrap.ts src/components/MaxPopover.vue tests/helpers/useFocusTrap.test.ts
sucesso (0 erros, 0 avisos)

$ npx vue-tsc --noEmit --pretty false
sucesso (exit 0)

$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxFocusStack.browser.ts
Test Files  1 passed (1)
Tests  2 passed (2)

$ git diff --check
sucesso
```

O cenário Chromium exercita `MaxPopover` real em pilha aninhada, com Tab, Shift+Tab, Escape e retorno A → B → A → gatilho. Os testes dos componentes reais IconPicker e Markdown cobrem a integração deles ao mesmo trap para Escape.

## Rollback

Reverter somente as alterações nos três arquivos de código/teste listados no manifesto; não há alteração no helper de F07.
