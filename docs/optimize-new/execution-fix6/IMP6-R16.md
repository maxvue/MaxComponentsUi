# Relatório de Implementação — IMP6-R16 (Inventário de Foco Visível & Token --background-650)

## Identificação do Papel
- **Papel**: `IMP6-R16`
- **Requisito**: `R16` / `E10-03, E10-04`
- **Responsável**: Subagente IMP6-R16
- **Data/Hora**: 2026-09-15T20:17:50-03:00
- **Status**: CONCLUÍDO COM ÊXITO (100% PASS)

---

## 1. Escopo e Problema Original
- **Achados originais E10-03 e E10-04**:
  - O inventário aceitava `:disabled` e menções genéricas a `:focus` sem validação de anel de foco canônico.
  - O teste de browser injetava CSS próprio arbitrário (`style` tag ad-hoc) em vez de validar os tokens e mixins reais da biblioteca.
  - Necessidade de associar alvos reais, estados e estilos computados para foco e classificar o uso do token `--background-650` (separação rigorosa entre conteúdo habilitado com contraste >= 4.5:1 e conteúdo disabled/inativo).
  - Validação em Chromium real de: navegação Tab, contraste nos temas claro/escuro, forced-colors, zoom a 200% sem recorte e estilos computados.

---

## 2. Modificações Realizadas

### 2.1 `src/themes/_focus.scss`
- Criada a classe utilitária canônica `.max-focus-visible` que consome o mixin canônico `max-focus-visible(2px)`, eliminando a necessidade de testes ou componentes injetarem declarações CSS privadas.
- Preservada a regra de mídia `@media (forced-colors: active)` impondo `Highlight` e `box-shadow: none`.

### 2.2 `src/components/base/MaxBaseInput.vue`
- Adicionado seletor canônico `&:enabled:focus-visible` com `outline: var(--max-focus-outline)` e `box-shadow: var(--max-focus-ring)`.

### 2.3 `tests/architecture/focusVisibleInventory.test.ts`
- Refinado `hasTabbableTarget`: analisa a estrutura de atributos real de cada nó (descarta `tabindex="-1"` e descarta apenas nós explicitamente desabilitados, não meros textos contendo a palavra).
- Refinado `hasCanonicalFocusPolicy`: exige seletor específico `:focus-visible` ou `:focus-within` associado estritamente aos tokens canônicos `--max-focus-(outline|ring)` ou mixins canônicos.

### 2.4 `tests/browser/FocusVisibleInventory.browser.ts`
- Removido bloco `<style>` injetado com declarações arbitrárias. Os nós de teste passam a utilizar a classe canônica `.max-focus-visible` distribuída pela biblioteca.
- Mantida a suíte dinâmica no Chromium real testando navegação por Tab, tema claro/escuro, forced-colors e zoom 200%.

---

## 3. Evidências de Execução

### Teste Arquitetural de Inventário de Foco:
```bash
$ npx vitest run tests/architecture/focusVisibleInventory.test.ts
 ✓ tests/architecture/focusVisibleInventory.test.ts (4 tests) 7ms
Test Files  1 passed (1)
Tests       4 passed (4)
```

### Testes de Browser no Chromium Real (Blink):
```bash
$ npx vitest run --config vitest.browser.config.ts tests/browser/FocusVisibleInventory.browser.ts
 ✓ |chromium| tests/browser/FocusVisibleInventory.browser.ts (6 tests) 678ms
Test Files  1 passed (1)
Tests       6 passed (6)
```

### Teste de Contraste e Classificação do `--background-650`:
```bash
$ npx vitest run tests/themes/textColorValidation.test.ts
 ✓ tests/themes/textColorValidation.test.ts (27 tests) 74ms
Test Files  1 passed (1)
Tests       27 passed (27)
```

### Linters:
```bash
$ npx eslint tests/architecture/focusVisibleInventory.test.ts tests/browser/FocusVisibleInventory.browser.ts src/components/base/MaxBaseInput.vue
# 0 erros, 0 avisos (exit code 0)
```

---

## 4. Conclusão
O bloco `R16` atende plenamente aos critérios de foco computado, remoção de CSS injetado ad-hoc e segregação semântica do token `--background-650`.
