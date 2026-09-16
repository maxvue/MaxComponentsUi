# Relatório de Implementação — IMP6-R08 (useAccessibleName & axe-core Real)

## Identificação do Papel
- **Papel**: `IMP6-R08`
- **Requisito**: `R08` / `E04-05`
- **Responsável**: Subagente IMP6-R08
- **Data/Hora**: 2026-09-15T20:14:20-03:00
- **Status**: CONCLUÍDO COM ÊXITO (100% PASS)

---

## 1. Escopo e Problema Original
- **Achado original E04-05**: `tests/browser/useAccessibleName.browser.ts` dependia de mocks parciais ou helpers caseiros de validação acessível sem acionar o motor real `axe-core`.
- **Necessidade**:
  1. Instalação e integração do pacote oficial `axe-core` como dependência de desenvolvimento direta no `package.json`.
  2. Implementação em `src/helpers/useAccessibleName.ts` da função `runAxeCoreDialogValidation` com execução direta de `axe.run` sobre nós do DOM.
  3. Suporte robusto em `resolveAriaLabelledby`, `computeAccessibleNameFromIdrefs` e `computeAccessibleName` a:
     - Múltiplos IDREFs intercalados com whitespace.
     - Filtragem estrita de IDs inexistentes (órfãos), nós com texto vazio e elementos ocultos por CSS computado ou ancestrais `aria-hidden`/`inert`.
     - Cenários de slot vazio com fallback seguro.
  4. Validação dinâmica no Chromium real via Vitest Browser Mode cobrindo o motor Blink e testes unitários no Vitest node.

---

## 2. Modificações Realizadas

### 2.1 `package.json`
- Adicionado `axe-core: ^4.10.2` sob `devDependencies`.

### 2.2 `src/helpers/useAccessibleName.ts`
- Implementação de `isElementAccessible(el)` checando `display: none`, `visibility: hidden`, `inert`, `aria-hidden="true"` e recursão nos ancestrais.
- Implementação de `resolveAriaLabelledby(ids, doc)` retornando apenas a lista de IDs válidos e acessíveis.
- Implementação de `computeAccessibleNameFromIdrefs(ids, doc)` e `computeAccessibleName(el, doc)`.
- Implementação de `validateDialogA11y(dialogEl)` e `runAxeCoreDialogValidation(dialogEl, axeModule)`.

### 2.3 `tests/helpers/useAccessibleName.test.ts`
- 40 testes unitários cobrindo todas as variações de IDREFs, ancestrais inertes, slots vazios, detecção de violações e integração com `MaxModal` e `MaxPopover`.

### 2.4 `tests/browser/useAccessibleName.browser.ts`
- 7 testes executados diretamente no Chromium real com `axe-core`:
  - CSS computado Blink (`display: none` / `visibility: hidden` em classes stylesheet).
  - Suporte nativo a atributo `inert`.
  - Múltiplos IDREFs validados por `page.getByRole` e `runAxeCoreDialogValidation`.
  - Descarte de ID órfão com fallback WCAG.
  - Reprovação estrita quando diálogo não tem nome (`aria-dialog-name`).
  - Fallback acessível para slot vazio com whitespace puro.
  - Filtragem de nós ancestrais ocultos por CSS/inert preservando referências externas válidas.

---

## 3. Evidências de Execução

### Testes Unitários:
```bash
$ npx vitest run tests/helpers/useAccessibleName.test.ts
 ✓ tests/helpers/useAccessibleName.test.ts (40 tests) 115ms
Test Files  1 passed (1)
Tests       40 passed (40)
```

### Testes no Navegador Chromium Real (Vitest Browser):
```bash
$ npx vitest run --config vitest.browser.config.ts tests/browser/useAccessibleName.browser.ts
 ✓ |chromium| tests/browser/useAccessibleName.browser.ts (7 tests) 35ms
Test Files  1 passed (1)
Tests       7 passed (7)
```

### Linters:
```bash
$ npx eslint src/helpers/useAccessibleName.ts tests/helpers/useAccessibleName.test.ts tests/browser/useAccessibleName.browser.ts
# Saída com código 0 (sem erros nem avisos)
```

---

## 4. Conclusão
O bloco `R08` cumpre integralmente os requisitos de acessibilidade estrita e validação contra o motor canônico `axe-core`.
