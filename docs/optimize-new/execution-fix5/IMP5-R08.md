# IMP5-R08 — E04-05

## Identidade e manifesto

- Papel: `IMP5-R08` (helper e testes de nomes acessíveis).
- Agente: `/root/imp5_r08`.
- Início: `2026-09-15T14:41:00-03:00`.
- Fim: `2026-09-15T14:48:00-03:00`.
- HEAD auditado: `927560b08ec668df322b9c62a33e1559e7a5318a`.
- Arquivos sob ownership: `src/helpers/useAccessibleName.ts`, `tests/helpers/useAccessibleName.test.ts`, `tests/browser/useAccessibleName.browser.ts`, este relatório e a linha correspondente da matriz.
- Fora do ownership: `package.json`, lockfile e integração do gate `axe-core` (serializados para `IMP5-R01`).

## Reprodução (red)

As expectativas adversariais que mantêm IDREFs existentes, inclusive rótulos ocultos por CSS ou ancestrais `aria-hidden`/`inert`, falharam antes da correção:

```text
$ npx vitest run tests/helpers/useAccessibleName.test.ts
Test Files  1 failed (1)
Tests  4 failed | 36 passed (40)

Expected: "id-oculto-css id-visivel-css"
Received: "id-visivel-css"
Expected: "id-filho-aria-hidden id-filho-inert id-valido-fora"
Received: "id-valido-fora"
```

O helper removia IDREFs válidos por estilo, acessibilidade de ancestrais ou texto vazio. Isso altera uma relação explícita de `aria-labelledby`; o algoritmo AccName ainda permite que o conteúdo referenciado e oculto componha o nome.

## Correção

- `resolveAriaLabelledby` agora remove somente IDs inexistentes; preserva ordem, múltiplos IDREFs, referências sob CSS/ancestrais ocultos e alvos momentaneamente sem texto.
- `computeAccessibleNameFromIdrefs` continua concatenando os textos de todos os IDs resolvidos.
- `validateDialogA11y` deixou de reprovar um ID existente apenas por estar oculto. Sua documentação e os testes agora afirmam corretamente que é validação estrutural local, não substituto de `axe-core`.
- Cobertura unitária e Chromium foi atualizada para CSS computado, `inert`, múltiplos IDREFs, integração real de `MaxPopover` e auditoria `axe-core` real.

## Verificação executada

```text
$ npx vitest run tests/helpers/useAccessibleName.test.ts
Test Files  1 passed (1)
Tests  40 passed (40)

$ npx eslint src/helpers/useAccessibleName.ts tests/helpers/useAccessibleName.test.ts tests/browser/useAccessibleName.browser.ts
exit 0

$ npm run type-check:test
vue-tsc -p tsconfig.test.json --noEmit
exit 0

$ npx vitest run --config vitest.browser.config.ts tests/browser/useAccessibleName.browser.ts
Test Files  1 passed (1)
Tests  5 passed (5)
```

## Auditoria axe-core real

O contrato de E04-05 exige `axe-core` real, e uma validação caseira não conta. No início deste papel a dependência não existia e o bloqueio foi comunicado a `IMP5-R01`. R01 provisionou `axe-core@4.11.0`; então o cenário Chromium deste papel passou a importar e executar o motor real diretamente.

```text
$ node -e "const p=require('./package.json'); console.log(p.devDependencies['axe-core'])"
4.11.0
```

O cenário verifica que um diálogo cujo nome vem de dois IDREFs — um alvo `display: none` e outro dentro de ancestral `inert` — não produz violações nas regras `aria-dialog-name` e `aria-valid-attr-value`. Em seguida, uma mutação remove o nome de um botão no mesmo DOM; `axe-core` identifica a violação `button-name`. Não há helper caseiro no caminho dessa verificação.

Não alterei `package.json` nem lockfile: eles continuam sob ownership de `IMP5-R01`.

## Veredito

**IMPLEMENTADO — E04-05 está pronto para refutação independente (`REV5-R08`).**
