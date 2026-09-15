# IMP5-F14 — E06-01 e E06-02

## Identidade e manifesto

- Papel: `IMP5-F14` (implementação exclusiva da semântica de listas/combobox).
- Agente: `/root/imp5_f14`.
- Início: `2026-09-15T14:20:14-03:00`.
- Fim: `2026-09-15T14:25:27-03:00`.
- HEAD auditado: `b44e6b744d4940bb5a05afa7f8c02d04ba1802ed`.
- Arquivos sob ownership: `src/components/base/MaxBaseVirtualScroller.vue`, `tests/components/base/MaxBaseVirtualScroller.test.ts`, `tests/browser/MaxBaseVirtualScroller.browser.ts`, este relatório e a linha correspondente da matriz.
- Fora do ownership: `MaxTagSelect`, `package.json`, CI e scripts de gate.

## Reprodução antes da alteração

O teste focal, após trocar as expectativas permissivas por contrato estrito, falhou em quatro cenários:

```text
tests/components/base/MaxBaseVirtualScroller.test.ts (38 tests | 4 failed)
× rejeita listbox sem nome acessível como erro de contrato
× rejeita combinações incompatíveis de papel no container e nos itens
× rejeita itemRole sem um papel compatível no container
× rejeita papéis fora do contrato tipado em chamadas JavaScript
```

O estado anterior mantinha `role?: VirtualScrollerRole | string` e `itemRole?: VirtualScrollerItemRole | string`; além disso, normalizava uma combinação inválida e somente registrava `console.warn` quando um listbox não tinha nome.

## Alteração

- Removidos os dois `| string` das props do componente.
- Adicionada validação de runtime para consumidores JavaScript/templates dinâmicos: aceita somente os pares neutro, `list`/`listitem` e `listbox`/`option`.
- Listbox sem `aria-label` ou `aria-labelledby` não é mais renderizado: lança `TypeError` de contrato.
- Mantida a garantia de `aria-activedescendant`: só é exposto quando o item ativo está montado.
- Criado cenário Chromium com 10.000 itens que usa `getByRole('listbox', { name })`, foca a opção inicial, rola até desmontá-la e exige a remoção imediata de `aria-activedescendant`.

## Verificação

```text
$ npx vitest run tests/components/base/MaxBaseVirtualScroller.test.ts
Test Files  1 passed (1)
Tests  38 passed (38)

$ npm run type-check:test
vue-tsc -p tsconfig.test.json --noEmit
exit 0

$ git diff --check
exit 0
```

O teste real de Chromium foi incluído, porém este checkout não contém o executável exigido pelo Playwright:

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxBaseVirtualScroller.browser.ts
Error: browserType.launch: Executable doesn't exist at
.../.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

`axe-core` não está declarado no `package.json` nem no lockfile. Como `package.json` é serializado para IMP5-R01, não foi adicionada dependência fora do ownership. O cenário browser fica pronto para execução após provisionar Chromium; o gate `GATE5-BROWSER-AXE` deve acrescentar/executar a auditoria axe real.

O ESLint focal também não pôde iniciar porque a instalação local resolve `@stylistic/eslint-plugin/index.js` para um arquivo ausente. Isso é um defeito de dependência do checkout, independente destes arquivos.

## Veredito

**IMPLEMENTADO — aguardando refutação independente e execução do gate browser/axe em ambiente com Chromium e axe-core.**
