# FIX5-TESTS-ACCESS — correção focal do gate unitário

- Papel: `fix5_tests_access`.
- Escopo: falhas determinísticas de contraste, nome acessível e teclado do TagSelect reportadas por `GATE5-UNIT-ASYNC`.
- Status: corrigido e validado localmente; sem commit por instrução do coordenador.

## Reprodução

O comando abaixo falhava em quatro asserções:

```bash
npx vitest run tests/components/MaxDarkModeContrast.test.ts tests/components/MaxModal.test.ts tests/components/MaxPopover.test.ts tests/components/MaxTagSelect.test.ts --reporter=verbose
```

1. `MaxButton` não possuía a cadeia de fallback da rampa `danger`.
2. `MaxModal` e `MaxPopover` aceitavam referências `aria-labelledby` explicitamente removidas da árvore de acessibilidade ou sem texto.
3. No modo `isButton`, `MaxIconButton` não retransmitia `keydown`; assim o `MaxTagSelect` não recebia Enter, Espaço ou Escape.

## Correção de causa raiz

- `MaxButton` usa `--max-danger-surface` e, quando indisponível, a cadeia compatível `--max-danger-500` → `--danger-500`.
- `MaxModal` e `MaxPopover` aplicam uma política local de diálogo para descartar IDREFs `hidden`, `aria-hidden`, `inert` ou sem texto e ativar o fallback. O resolvedor canônico de R08 não foi alterado: referências somente ocultas por CSS continuam preservadas pelo algoritmo genérico AccName.
- `MaxIconButton` passa a emitir `keydown` do botão nativo; `MaxTagSelect` consome o evento no mesmo handler já usado pelo combobox. Isso preserva o clique como única ativação por ponteiro e evita duplicidade.

## Validação

```text
npx vitest run tests/components/MaxDarkModeContrast.test.ts tests/components/MaxModal.test.ts tests/components/MaxPopover.test.ts tests/components/MaxTagSelect.test.ts tests/helpers/useAccessibleName.test.ts tests/components/MaxIconButton.test.ts --reporter=dot
6 arquivos aprovados; 192 testes aprovados.

npm run type-check
vue-tsc --noEmit: aprovado.

git diff --check
aprovado.
```

As suítes de R08 e F15 foram incluídas explicitamente na validação para assegurar que a correção focal não as regressa.
