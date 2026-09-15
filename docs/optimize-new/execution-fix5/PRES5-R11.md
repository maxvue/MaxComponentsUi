# Preservação — R11 / F16

- **Papel:** `PRES5-R11`
- **Escopo exclusivo:** R11/F16 — contraste computado e virtualização do `MaxTagSelect`.
- **HEAD auditado:** `f16437fd4f4ef74d05ca4c536c3aa359ee454fe3`
- **Início:** `2026-09-15T17:50:05-03:00`
- **Fim:** `2026-09-15T17:50:25-03:00`
- **Veredito:** **ACEITO**

## Evidências

1. Chromium real preserva o primeiro paint, virtualização para lista com mais de 500 itens, contraste WCAG AA calculado de CSS computado nos estados default/hover/focus/selecionado em light e dark, scroll/reciclagem, seleção e `aria-activedescendant` montado.
2. A matriz unitária agrupada confirma 612 entradas achatadas (600 opções e 12 cabeçalhos), janela virtual com menos de 100 opções DOM, `scrollTop` positivo após navegação, item ativo montado e seleção correta por Enter.
3. O teste browser também preserva contraste de tags customizadas e indicador não cromático da seleção.

## Comandos e saída relevante

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxTagSelect.browser.ts --reporter=verbose
Test Files  1 passed (1)
Tests       5 passed (5)
Duration    2.85s
```

```text
$ npx vitest run tests/components/MaxTagSelect.test.ts -t 'lista agrupada com mais de 500 itens valida virtualização' --reporter=verbose
Test Files  1 passed (1)
Tests       1 passed | 47 skipped (48)
Duration    2.00s
```

Não foram alterados arquivos de produção nem testes pelo auditor.
