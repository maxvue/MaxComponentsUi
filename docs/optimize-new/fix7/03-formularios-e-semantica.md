# Lote 03 — Formulários e semântica acessível

## Escopo

Blocos `R04`, `F14` e `R14`.

- `R04`: 25 famílias, Birthday separado, para label, owner, submit/FormData, autofill, required e disabled em Chromium.
- `F14`: fechar contrato de role/nome, rejeitar valor inválido no limite e provar listbox real com axe, teclado e `aria-activedescendant` durante scroll.
- `R14`: um único submit nativo em MaxAuthCard, sem prevent/actions duplicadas/guard por tick; Enter/autofill e uma live region por mensagem.

Auxiliares sugeridos: matriz InputBase/AuthCard e listbox/VirtualScroller. O líder reserva contratos compartilhados. Crie `tests/browser/MaxBaseVirtualScroller.browser.ts` se a prova browser específica ainda não existir.

```bash
npx vitest run tests/architecture/inputBaseAccessibility.test.ts tests/components/InputBase.accessibility.test.ts tests/components/inputBaseAttributesSeparation.test.ts tests/components/inputSharedValidationMatrix.test.ts tests/components/MaxListBox.test.ts tests/components/base/MaxBaseVirtualScroller.test.ts tests/components/MaxAuthCard.test.ts
npx vitest run --config vitest.browser.config.ts tests/browser/inputBaseMatrix.browser.ts tests/browser/MaxBaseVirtualScroller.browser.ts
```

Não troque rejeição de contrato inválido por warning nem remova fixtures/browser difíceis para obter verde.
