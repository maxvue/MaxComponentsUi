# Plano de Migração — MaxTopToolbar

> Plano autossuficiente. Uma IA futura ou auditor deve conseguir entender esta migração lendo **apenas**
> este arquivo + `src/components/MaxTopToolbar.vue` (+ `src/components/MaxTopToolbarSubmenu.vue` e `src/stores/useTopToolbar.Store.ts`).
> Preserva a API pública, os estilos e o comportamento do componente.

---

## 1. Componente

- **Nome:** `MaxTopToolbar`
- **Caminho:** `src/components/MaxTopToolbar.vue`
- **Nível de dificuldade:** `media`
- **Objetivo da migração:** remover a dependência direta do PrimeVue substituindo o componente `Menubar` (`primevue/menubar`) por uma implementação própria baseada em navegação semântica HTML (`nav`, `ul`, `li`), mantendo suporte a:
  - barra horizontal de navegação principal com slots e ações,
  - renderização de itens com ícone, label, subLabel e divider,
  - acionamento de submenus (`MaxTopToolbarSubmenu`) no hover com debounce/delay de fechamento (`SUBMENU_CLOSE_DELAY_MS = 1000`),
  - execução de ações de item (`action()`, `command({ item })`, ou navegação por rota via `toolbar.route`),
  - preservação do contrato reativo com a store Pinia `useTopToolbarStore` e slot público `plus`.

---

## 2. Dependências do PrimeVue (trechos originais)

Originalmente o componente importava e utilizava o componente `Menubar` do PrimeVue:

```ts
// script setup original
import Menubar from 'primevue/menubar';
```

```vue
<!-- template original -->
<Menubar :model="toolbar.items" class="menu_bar_project_top">
    <!-- custom templates e itens -->
</Menubar>
```

Além disso, a árvore DOM gerada pelo PrimeVue utilizava as classes:
- `.p-menubar-root-list`
- `.p-menubar-item`
- `.p-menubar-item-content`
- `.p-menubar-item-active`
- `.p-menubar-submenu`

A diretiva `v-tooltip` já é nativa do ecossistema Max (`src/directives/tooltip.ts`) e não constitui dependência do PrimeVue.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação na migração |
|-------------|--------|-------|------------------|
| `MaxIconButton` | `./MaxIconButton.vue` | Botão com ícone para itens sem label ou botões de ação direta. | Preservar integralmente. |
| `MaxTopToolbarSubmenu` | `./MaxTopToolbarSubmenu.vue` | Componente filho recursivo que renderiza os submenus aninhados. | Criado/preservado para substituir o submenu nativo do PrimeVue. |
| `useTopToolbarStore` | `../stores/useTopToolbar.Store.ts` | Store Pinia que governa `items`, `show` e ação `route()`. | Preservar integralmente. |
| `hasContent` | `@maxvue/max-use` | Helper para verificação de conteúdo em arrays e strings. | Preservar integralmente. |

---

## 4. API pública a preservar

- **Props / Atributos:**
  - `attrs.plus` — quando `true`, renderiza em modo estrito `onlyOne` e mantém exibição mesmo se `toolbar.show` estiver `false`.
- **Slots:**
  - `#plus` — renderizado logo após a barra para adições externas customizadas.
- **Store contract (`useTopToolbarStore`):**
  - `toolbar.items`: lista de nós da barra contendo:
    - `label`: texto principal
    - `subLabel`: texto complementar
    - `icon`: nome do ícone do Iconify
    - `icon_size`: tamanho do ícone
    - `divider`: booleano indicando divisor
    - `tooltip`: texto/configuração do tooltip
    - `route`: rota para navegação
    - `action`: callback de clique
    - `command`: compatibilidade de callback (`command({ item })`)
    - `items`: array de itens filhos para submenu
- **Comportamento observável:**
  - Abrir submenu ao passar o mouse (`mouseenter`) e programar fechamento com 1s de tolerância (`scheduleCloseSubmenu`).
  - Limpar timer se o ponteiro permanecer sobre o submenu (`clearCloseTimer`).

---

## 5. Estratégia de substituição

1. **Remoção do PrimeVue:**
   - Eliminar `import Menubar from 'primevue/menubar'`.
2. **Estrutura HTML Nativa:**
   - `<nav role="menubar" class="menu_bar_project_top">`
   - `<ul class="p-menubar-root-list">`
   - `<li class="p-menubar-item" role="none">`
3. **Submenus:**
   - Implementar componente auxiliar `MaxTopToolbarSubmenu.vue` para menus suspensos posicionados de forma absoluta.
4. **Despacho de Eventos:**
   - Handler `handleItemClick(item)` unificado para tratar `action`, `command` e navegação `toolbar.route`.

---

## 6. Passos de implementação

1. Substituir `<Menubar>` por marcação semântica `<nav role="menubar">` e `<ul>`/`<li>`.
2. Encapsular a recursão de submenus no componente `MaxTopToolbarSubmenu.vue`.
3. Adicionar controle de estado local `activeSubmenu` com timer de tolerância de 1000ms para fechamento suave.
4. Manter as classes de layout `.p-menubar-*` durante o período de convivência da biblioteca (para não quebrar estilos do tema até a Fase 2 de sweep).
5. Garantir limpeza de timers no lifecycle hook `onBeforeUnmount`.

---

## 7. Estilos

- O SCSS scoped estiliza o container `.tool-bar-top-main-div` e a barra `.menu_bar_project_top`.
- Transições de hover em cores (`var(--layout-shell-text-muted)` para `var(--layout-shell-text)`).
- As classes `.p-menubar-*` mantidas estruturam o flexbox da barra raiz e o posicionamento absoluto dos submenus.
- Na Fase 2 de independência do PrimeVue, essas classes deverão ser renomeadas para `.max-menubar-*` no sweep geral.

---

## 8. Testes / verificação

- **Arquivo de teste:** `tests/components/MaxTopMenu.test.ts` e suíte de navegação.
- **Verificações mínimas:**
  - Renderização dos itens principais da store.
  - Disparo de `action()` no clique do item.
  - Disparo de `command({ item })` para itens que utilizavam o padrão PrimeVue.
  - Abertura e fechamento de submenus no hover.
  - Funcionamento do slot `#plus`.

---

## 9. Skills necessárias

- `.claude/skills/vue-max-components-ui-development-best-practices` — Convenções e arquitetura da biblioteca MaxComponentsUi.
- `.claude/skills/vue-typescript-best-practices` — Tipagem rigorosa em `<script setup lang="ts">`.
- `.claude/skills/vue-pinia-state-management-best-practices` — Integração reativa com `useTopToolbarStore`.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — Padrões de código ESLint/Stylelint.
- `.claude/skills/vue-vitest-testing-best-practices` — Validação da suíte de testes com Vitest.

---

## 10. Riscos e pontos de atenção

- **Fechamento acidental de submenus:** A transição do ponteiro entre o item pai e o popup requer delay (`SUBMENU_CLOSE_DELAY_MS`) para não fechar antes que o usuário consiga mover o cursor.
- **Compatibilidade de `command` vs `action`:** O PrimeVue expõe `command({ item })`, enquanto componentes nativos Max priorizam `action({ event, data })`. O handler deve dar suporte aos dois formatos para máxima retrocompatibilidade.
