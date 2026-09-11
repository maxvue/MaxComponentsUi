# Plano de Implementação: Padronização dos Contratos de Tipagem, Emits Estritos e Eliminação de Bypass de Props

## 1. Objetivo da Refatoração

Restaurar a integridade arquitetural dos contratos de tipagem TypeScript em componentes do design system, alinhando-os integralmente às convenções estritas do GEMINI.md. O objetivo é:
1. Migrar a declaração de eventos emitidos (`defineEmits`) da sintaxe legada em formato de array de strings (`defineEmits(['...'])`) para a assinatura canônica baseada em genéricos com tipos de payload explícitos (`defineEmits<{ ... }>()`).
2. Declarar formalmente interfaces de propriedades (`defineProps<Interface>()`) em componentes que utilizam `useAttrs()` como atalho opaco (`MaxEmptyDiv.vue` e `MaxLoader.vue`), evitando o vazamento indevido de propriedades de controle para o nó DOM HTML.
3. Corrigir o componente órfão `<LoaderIcon />` em [`MaxLoader.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoader.vue), importando explicitamente `MaxLoaderIcon.vue` e corrigindo a coerção booleana da propriedade `:show` / `show="false"`.
4. Eliminar as classes residuais do PrimeVue (`p-menubar-submenu`, `p-menubar-item`, `p-menubar-item-content`, `p-menubar-submenu-nested`) em [`MaxTopToolbarSubmenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue) e substituir a tipagem aberta `items: any[]` por uma interface de dados formal (`MaxTopToolbarSubmenuItem`).
5. Remover casts soltos (`attrs: any` e `system: any`) em `MaxGridCols.vue` e `MaxPageContent.vue`.

---

## 2. Arquivos Afetados

### Componentes Vue:
- [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue) — Tipagem estrita de `defineEmits`.
- [`src/components/MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue) — Tipagem estrita de `defineEmits`.
- [`src/components/MaxInputFileUploadButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadButton.vue) — Tipagem estrita de `defineEmits`.
- [`src/components/MaxInputCheckbox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCheckbox.vue) — Tipagem estrita de `defineEmits`.
- [`src/components/MaxEmptyDiv.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxEmptyDiv.vue) — Introdução de interface `defineProps` e sanitização sem poluição do DOM.
- [`src/components/MaxLoader.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoader.vue) — Importação de `MaxLoaderIcon.vue`, introdução de `defineProps` e coerção booleana.
- [`src/components/MaxGridCols.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxGridCols.vue) — Remoção de `v-bind="attrs"` manual e eliminação de `attrs: any`.
- [`src/components/MaxPageContent.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPageContent.vue) — Remoção do cast `system: any`.
- [`src/components/MaxTopToolbarSubmenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue) — Tipagem com interface formal e eliminação de classes residuais do PrimeVue.

### Arquivos de Teste Unitário:
- [`tests/components/MaxLoader.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxLoader.test.ts)
- [`tests/components/MaxEmptyDiv.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxEmptyDiv.test.ts)
- [`tests/components/MaxTopToolbarSubmenu.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTopToolbarSubmenu.test.ts)

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Migração de Emits para Sintaxe Canônica Genérica
1. Em [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue):
   - Substituir `const emit = defineEmits(['update:modelValue']);` por:
     ```typescript
     const emit = defineEmits<{
         'update:modelValue': [value: string];
     }>();
     ```
2. Em [`src/components/MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue):
   - Substituir `const emit = defineEmits(['update:modelValue']);` por:
     ```typescript
     const emit = defineEmits<{
         'update:modelValue': [coordinates: { latitude: number; longitude: number }];
     }>();
     ```
3. Em [`src/components/MaxInputFileUploadButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadButton.vue):
   - Substituir `const emit = defineEmits(['upload']);` por:
     ```typescript
     const emit = defineEmits<{
         'upload': [files: File[] | any];
     }>();
     ```
4. Em [`src/components/MaxInputCheckbox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCheckbox.vue):
   - Substituir `const emit = defineEmits(['update:modelValue']);` por:
     ```typescript
     const emit = defineEmits<{
         'update:modelValue': [value: any];
     }>();
     ```

### Passo 2: Tipagem e Eliminação de Bypass em `MaxEmptyDiv.vue`
1. Em [`src/components/MaxEmptyDiv.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxEmptyDiv.vue):
   - Definir a interface de propriedades:
     ```typescript
     interface MaxEmptyDivProps {
         /** Mensagem textual ou HTML sanitizado exibido como rótulo */
         label?: string;
         /** Identificador do ícone (Iconify) */
         icon?: string;
         /** Alias para icon */
         i?: string;
         /** Tamanho do ícone */
         iconSize?: number | string;
         /** Renderiza fundo transparente e sem borda */
         transparent?: boolean;
         /** Posiciona o container com posicionamento absoluto no topo */
         nospace?: boolean;
     }
     ```
   - Utilizar `withDefaults`:
     ```typescript
     const props = withDefaults(defineProps<MaxEmptyDivProps>(), {
         label: 'Sem Registros',
         iconSize: 2,
         transparent: false,
         nospace: false
     });
     ```
   - Atualizar a computada `sanitizedLabel`:
     ```typescript
     const sanitizedLabel = computed(() => sanitizeHtml(String(props.label ?? 'Sem Registros')));
     ```
   - No template:
     ```html
     <MaxIcon :icon="String(props.icon ?? props.i ?? 'ph:empty')" :size="Number(props.iconSize ?? 2)" />
     ```
   - Os atributos de controle não mais vazam para a tag HTML raiz.

### Passo 3: Correção de Componente Órfão e Tipagem em `MaxLoader.vue`
1. Em [`src/components/MaxLoader.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoader.vue):
   - Importar explicitamente o componente de ícone:
     ```typescript
     import MaxLoaderIcon from './MaxLoaderIcon.vue';
     ```
   - Declarar as props com validação e defaults:
     ```typescript
     interface MaxLoaderProps {
         /** Controla a visibilidade do loader */
         show?: boolean | string;
         /** Rótulo textual opcional exibido abaixo da animação */
         label?: string;
     }

     const props = withDefaults(defineProps<MaxLoaderProps>(), {
         show: true,
         label: undefined
     });
     ```
   - Implementar computada com coerção booleana segura:
     ```typescript
     const isVisible = computed(() => {
         if (props.show === false || props.show === 'false') return false;
         return Boolean(props.show);
     });
     ```
   - No template:
     ```html
     <template>
         <div v-if="isVisible" class="max-loader-main-div">
             <div class="items">
                 <MaxLoaderIcon />
                 <div v-if="props.label" class="item-label">{{ props.label }}</div>
             </div>
         </div>
     </template>
     ```
   - Remover `v-bind="attrs"` da raiz para evitar duplicação ou vazamento de props operacionais.

### Passo 4: Contrato de Dados e Desacoplamento do PrimeVue em `MaxTopToolbarSubmenu.vue`
1. Em [`src/components/MaxTopToolbarSubmenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue):
   - Declarar e exportar a interface dos itens do submenu:
     ```typescript
     export interface MaxTopToolbarSubmenuItem {
         label?: string;
         subLabel?: string;
         icon?: string;
         icon_size?: number | string;
         divider?: boolean;
         disabled?: boolean;
         tooltip?: string | boolean;
         route?: string | object | null;
         action?: ((...args: any[]) => void);
         data?: any;
         props?: any;
         query?: any;
         items?: MaxTopToolbarSubmenuItem[];
     }

     const props = defineProps<{
         items: MaxTopToolbarSubmenuItem[];
     }>();
     ```
   - Substituir as classes residuais do PrimeVue por classes semânticas:
     - `.p-menubar-submenu` -> `.max-top-toolbar-submenu`
     - `.p-menubar-item` -> `.submenu-item`
     - `.p-menubar-item-content` -> `.submenu-item-content`
     - `.p-menubar-submenu-nested` -> `.max-top-toolbar-submenu-nested`
   - No bloco `<style lang="scss" scoped>`, atualizar os seletores aninhados substituindo referências legadas às classes `.p-menubar-*`.

### Passo 5: Higienização de Casts em `MaxGridCols.vue` e `MaxPageContent.vue`
1. Em [`src/components/MaxGridCols.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxGridCols.vue):
   - Remover `const attrs: any = useAttrs();` e `v-bind="attrs"`. Deixar o mecanismo nativo de fallthrough do Vue 3 repassar atributos e classes ao elemento raiz sem overhead de script.
2. Em [`src/components/MaxPageContent.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPageContent.vue):
   - Substituir `const system: any = useSystemStore();` por `const system = useSystemStore();`, preservando a inferência de tipos da store.

---

## 4. Padrões de Estabilidade e Convenções do GEMINI.md

1. **Independência Total do PrimeVue**: Eliminação de todas as classes com prefixo `.p-` remanescentes em templates e estilos.
2. **Tipagem Estrita**: Proibição de `any[]` em props essenciais e uso de interfaces nomeadas.
3. **Ordem Estrutural**: 1º `<template>`, 2º `<script setup lang="ts">`, 3º `<style lang="scss" scoped>`.
4. **Sem Estilos Inline ou Utilitários**: Estilos 100% contidos na seção `<style lang="scss" scoped>`.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Compilação Estrita de Tipos**:
   ```bash
   npm run type-check
   ```
   Deve executar com sucesso sem nenhum erro de tipagem no `vue-tsc`.
2. **Resolução de Componente no `MaxLoader`**:
   - Montar `MaxLoader` sem mocks de `LoaderIcon`. Não deve haver mensagens de aviso `[Vue warn]: Failed to resolve component: LoaderIcon`.
   - Testar `show="false"` como string: o loader deve estar oculto no DOM (`expect(wrapper.find('.max-loader-main-div').exists()).toBe(false)`).
3. **Inspeção de Atributos no `MaxEmptyDiv`**:
   - Montar `<MaxEmptyDiv label="Vazio" icon="ph:check" />`. O elemento `<div class="max-empty-div">` não deve possuir atributos literais `label="Vazio"` nem `icon="ph:check"` no HTML.
4. **Execução Completa da Suíte de Testes**:
   ```bash
   npm test
   npm run lint
   ```
   Todos os testes e regras de linting devem ser validados com 100% de sucesso.

---

## 6. Mitigação de Riscos de Regressão

1. **Compatibilidade de Templates de Menu**:
   - A substituição das classes `.p-menubar-*` por classes semânticas preserva todas as propriedades visuais de posicionamento absoluto (`left: 100%`), espaçamento e cores definidas no SCSS.
2. **Compatibilidade com Auto-Import**:
   - Manter compatibilidade com componentes que passam `modelValue`, `label`, `icon` ou `show` nos componentes ajustados.
