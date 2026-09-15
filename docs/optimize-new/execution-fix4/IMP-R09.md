# Relatório de Implementação — Bloco R09 / F11

- **Subagente:** `IMP-R09`
- **ID da Plataforma:** `008449df-94d0-4513-b837-aaf4f0c2098b`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Horário Inicial:** 2026-09-15T09:27:12-03:00
- **Horário Final:** 2026-09-15T10:22:00-03:00
- **Status:** CONCLUÍDO COM SUCESSO

---

## 1. Escopo e Objetivos da Tarefa

Implementação e consolidação do **Bloco R09 / F11** (`escala-z-index-sem-contrato` e `popovers-e-pdf-sem-clamp-mobile`):
1. Migração de todos os z-indexes globais para tokens semânticos (`--max-layer-*` e `--max-z-index-*`), suportando overrides via CSS (inclusive em escopos locais/host) sem colapsar a hierarquia.
2. Suporte completo a `visualViewport` e `safe-area` (`env(safe-area-inset-*)`) para posicionamento e clamp de overlays e popovers.
3. Tratamento de viewports estreitos (280px e 320px), orientação horizontal (landscape) e zoom de 200%.
4. Criação e execução de testes em Chromium real (via Playwright no Vitest Browser Mode) avaliando CSS computado, `elementFromPoint` e clamp responsivo.

---

## 2. Arquivos Modificados e Criados

### Modificados:
- `src/themes/tokens.scss`:
  - Adicionado `--max-layer-floating: 850;` (11 camadas canônicas estritamente ordenadas).
  - Adicionada a família semântica completa `--max-z-index-*` (`--max-z-index-sticky`, `--max-z-index-navigation`, `--max-z-index-floating`, `--max-z-index-dropdown`, `--max-z-index-popover`, `--max-z-index-modal-backdrop`, `--max-z-index-modal`, `--max-z-index-fullscreen`, `--max-z-index-toast`, `--max-z-index-tooltip`, `--max-z-index-screen-block`).
  - Aliases legados (`--z-*`) atualizados para resolver com prioridade a cadeia de tokens semânticos.
- `src/themes/params.scss`:
  - `.max-tooltip` atualizado para `z-index: var(--max-z-index-tooltip, var(--max-layer-tooltip, 1600)) !important;`.
- `src/components/MaxPageMobileLayout.vue`:
  - Migrados os z-index literais/parciais para tokens semânticos:
    - Espaço sticky: `var(--max-z-index-sticky, var(--max-layer-sticky, 100))`.
    - Pseudo-elemento `::before`: `calc(var(--max-z-index-sticky, var(--max-layer-sticky, 100)) - 1)`.
    - Botão de bug flutuante: `var(--max-z-index-floating, var(--max-layer-floating, 850))`.
- `src/components/base/MaxBaseOverlay.vue`:
  - Atualizado para consumir tokens `--max-z-index-*` com fallback para `--max-layer-*`.
  - Atualizado `position()` com suporte a `window.visualViewport`.
- `src/components/MaxPopover.vue`:
  - Integração com `safeArea` no cálculo dinâmico de posicionamento (`useActiveOverlayPosition`).
  - Estilos atualizados com `min(300px, calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px) - 16px))` e `max-height` com safe areas.
  - Seta com posicionamento seguro via `clamp(...)`.
  - Tokens de z-index atualizados para `var(--max-z-index-popover, var(--max-layer-popover, 1200))`.
- `src/components/MaxPopoverConfirm.vue`:
  - Integração com `safeArea` no cálculo dinâmico de posicionamento.
  - Backdrop com `z-index: var(--max-z-index-popover, var(--max-layer-popover, 1200))`.
  - Diálogo e setas com clamp seguro para safe-areas e viewports móveis.
- `src/components/MaxPdfView.vue`:
  - `z-index: var(--max-z-index-fullscreen, var(--max-layer-fullscreen, 1400))`.
  - Barra de ferramentas `.pdf-div-bar-tools` com `max-width: calc(100vw - max(16px, env(safe-area-inset-left, 0px)) - max(16px, env(safe-area-inset-right, 0px)) - 16px)` e z-index `calc(var(--max-z-index-fullscreen, ...) + 1)`.
- `src/components/MaxToast.vue`:
  - `z-index: var(--max-z-index-toast, var(--max-layer-toast, 1500))`.
- `src/components/MaxInputPhone.vue`:
  - Máscara e dropdown atualizados para `--max-z-index-dropdown`.
- `src/components/MaxImage.vue`:
  - Modal lightbox atualizado para `--max-z-index-fullscreen`.
- `src/components/MaxInputCode.vue`:
  - Modo tela cheia atualizado para `--max-z-index-fullscreen`.
- `src/components/MaxInputMarkdown.vue`:
  - Lightbox atualizado para `--max-z-index-fullscreen`.
- `src/components/MaxTopToolbarSubmenu.vue`:
  - Submenu atualizado para `--max-z-index-dropdown`.
- `src/components/MaxLoadScreenTarget.vue`:
  - Bloqueio de tela atualizado para `--max-z-index-screen-block`.
- `src/composables/useActiveOverlayPosition.ts`:
  - Suporte a `SafeAreaInsets` e helper `resolveSafeAreaInsets()`.
  - Suporte a `window.visualViewport` e ouvintes de `resize` e `scroll` quando ativo com cleanup automático.
  - `defaultCompute` com clamp lateral e vertical dinâmico respeitando safe-area e margem mínima de segurança.
- `tests/themes/layers.test.ts`:
  - Atualizado para cobrir todos os 11 tokens canônicos, a família `--max-z-index-*` e override via CSS.
- `tests/components/layerComposition.test.ts`:
  - Atualizado para cobrir a hierarquia completa incluindo sticky, navigation e floating.
- `tests/composables/useActiveOverlayPosition.test.ts`:
  - Adicionado teste específico de observação do `visualViewport` e clamp com safe-area.

### Criados:
- `src/helpers/useActiveOverlayPosition.ts`:
  - Re-export de compatibilidade de `src/composables/useActiveOverlayPosition.ts`.
- `tests/browser/layersMobileClamp.browser.ts`:
  - Suíte completa no Chromium real cobrindo viewports de 280px, landscape (568x320), zoom 200%, hit-testing com `elementFromPoint` e override de tokens CSS.

---

## 3. Comandos Executados e Resultados

| Comando | Escopo / Finalidade | Resultado |
|---|---|---|
| `npx vitest run tests/themes/layers.test.ts` | Validação de tokens e ordem semântica | **Aprovado (6/6 testes)** |
| `npx vitest run tests/components/layerComposition.test.ts` | Validação de composição de camadas | **Aprovado (10/10 testes)** |
| `npx vitest run tests/composables/useActiveOverlayPosition.test.ts` | Validação do composable e visualViewport/safe-area | **Aprovado (6/6 testes)** |
| `npx vitest run tests/components/MaxPopover.test.ts tests/components/MaxPopoverConfirm.test.ts tests/components/MaxPdfView.test.ts` | Testes de regressão dos componentes afetados | **Aprovado (54/54 testes)** |
| `npm run test:browser` | Suíte completa em Chromium real (Playwright) | **Aprovado (8/8 arquivos, 28/28 testes)** |
| `npm run type-check` | Verificação estática de tipos TypeScript | **Aprovado (código de saída 0, 0 erros)** |
| `npx eslint ...` | Verificação estrita de lint dos arquivos do bloco | **Aprovado (0 erros, 0 avisos)** |
| `npx stylelint ...` | Verificação de estilos SCSS/Vue | **Aprovado (0 erros)** |

---

## 4. Análise de Causa Raiz e Solução Implementada

- **Problema 1 (Ausência de contrato global de z-index e valores arbitrários):**
  Componentes usavam valores arbitrários e aliases legados soltos, sem token específico para elementos flutuantes arrastáveis (`850`) e sem suporte claro a overrides via variáveis CSS (`--max-z-index-*`).
  *Solução:* Consolidada a escala de 11 níveis canônicos (`--max-layer-*` e `--max-z-index-*`), com suporte universal a override e hierarquia preservada em cascata.

- **Problema 2 (Falta de clamp responsivo e safe-areas em popovers e overlays móveis):**
  Popovers utilizavam larguras estáticas ou margens fixas sem considerar a área segura de telas com entalhes/recortes (`env(safe-area-inset-*)`) nem o encolhimento dinâmico proporcionado por `visualViewport` (pinch zoom / teclado virtual).
  *Solução:* `useActiveOverlayPosition` agora detecta `visualViewport` e `safeArea`, fornecendo limites dinâmicos para clamp vertical e horizontal. Os SFCs aplicam `min(300px, calc(100vw - safe_areas - gutter))` e posicionamento de seta com `clamp()`.

---

## 5. Riscos e Plano de Rollback

- **Riscos Identificados:** Baixo. Todos os tokens preservam fallbacks compatíveis com os valores numéricos históricos e aliases legados (`--z-*`).
- **Rollback:** Caso necessário reverter, `git checkout` dos arquivos modificados do bloco restaura a implementação anterior sem afetar outros blocos isolados.
