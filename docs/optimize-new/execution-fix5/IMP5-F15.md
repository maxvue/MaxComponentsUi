# IMP5-F15 — E06-03 e E08-04

## Manifesto

- `src/components/MaxTagSelect.vue`
- `src/components/MaxTopToolbar.vue`
- `src/components/MaxTopToolbarSubmenu.vue`
- `src/components/MaxTableFields.vue`
- `tests/browser/MaxTagSelect.browser.ts`
- `tests/unit/MaxTopToolbar.spec.ts`
- `tests/components/MaxTopToolbarSubmenu.test.ts`
- `tests/components/MaxTableFields.test.ts`
- `docs/optimize-new/execution-fix5/MATRIZ_ORQUESTRACAO.md`
- `docs/optimize-new/execution-fix5/IMP5-F15.md`

## Reprodução e correção

No modo `isButton`, o contêiner de `MaxTagSelect` interceptava `keydown` e `click`, embora o foco estivesse no botão nativo interno. Enter e Espaço podiam, assim, combinar a abertura pelo teclado com o clique sintético do navegador. O acionamento passou a ser exclusivamente o evento `click` emitido pelo `MaxIconButton`; o contêiner mantém os atalhos somente no modo combobox.

O inventário de botões de ícone dinâmicos encontrou três coleções: barra superior, submenu da barra e ações de `MaxTableFields`. Todas agora priorizam os metadados do item e, se ausentes, recebem um nome contextual e posicional. Portanto, nenhum desses caminhos produz `undefined` ou o fallback genérico anterior.

## Evidências

```text
npx vitest run tests/unit/MaxTagSelect.spec.ts tests/unit/MaxIconButton.spec.ts tests/unit/MaxTopToolbar.spec.ts tests/components/MaxTopToolbarSubmenu.test.ts tests/components/MaxTableFields.test.ts --reporter=dot
Test Files  5 passed (5)
Tests  98 passed (98)

npm run test:browser -- tests/browser/MaxTagSelect.browser.ts
Test Files  1 passed (1)
Tests  5 passed (5)

npx vue-tsc --noEmit --pretty false
exit 0

git diff --check
exit 0
```

O cenário Chromium novo usa Tab para foco, Enter e Espaço para abertura, Escape para retorno, contabiliza `before-show` uma vez por ativação e confirma que o botão `disabled` não abre a lista.
