# Degradação dos Contratos de Tipagem com Emits Despadronizados, Bypassing de Props via useAttrs e Inconformidades de Template

## Severidade: Alta

## Componentes Impactados
- [`MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue)
- [`MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue)
- [`MaxInputFileUploadButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadButton.vue)
- [`MaxInputCheckbox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCheckbox.vue)
- [`MaxEmptyDiv.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxEmptyDiv.vue)
- [`MaxLoader.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoader.vue)
- [`MaxGridCols.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxGridCols.vue)
- [`MaxPageContent.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxPageContent.vue)
- [`MaxTopToolbarSubmenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue)

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Perda de Tipagem em Eventos Emitidos**: Emits de formulário fundamentais como `update:modelValue` e `upload` não possuem assinatura de tipos no TypeScript, impedindo o compilador (`vue-tsc`) e o IDE (Volar/VSCode) de alertar quando callbacks de escuta recebem argumentos incorretos.
2. **Propriedades Ocultas e Fallthrough Indesejado no DOM**: Componentes como `MaxEmptyDiv.vue` e `MaxLoader.vue` aceitam propriedades operacionais (como `show`, `label`, `icon`, `iconSize`), porém não declaram `defineProps`. Os valores são lidos dinamicamente de `useAttrs()`, o que faz o Vue injetar todos esses dados diretamente como atributos literais no nó DOM HTML (`<div class="..." label="Sem Registros" icon="ph:empty">`), poluindo o markup.
3. **Quebra de Coerção Booleana**: Em `MaxLoader.vue`, ao passar `show="false"` como atributo em vez de `:show="false"`, o valor em `attrs.show` é a string `"false"`. No JavaScript, strings não-vazias são verdadeiras, forçando o componente a permanecer visível e quebrando o comportamento esperado.
4. **Dependência de Componente Órfão**: No template de `MaxLoader.vue`, a tag `<LoaderIcon />` é utilizada sem que o componente tenha sido importado no `<script setup>`, gerando avisos de `[Vue warn]: Failed to resolve component: LoaderIcon` em aplicações consumidoras que não registram o ícone globalmente.

### Causa Raiz Profunda
- **Adoção Inconsistente das Diretrizes do GEMINI.md**: Embora o projeto estabeleça o uso obrigatório de TypeScript com `defineProps<Interface>()` e `defineEmits<{...}>()` estritamente tipados, resíduos legados de Composition API inicial foram deixados em 4 componentes na forma de arrays de strings (`defineEmits(['...'])`).
- **Abuso de `useAttrs()` como Atalho**: Desenvolvedores evitaram a definição formal de interfaces para componentes menores, consumindo `useAttrs()` de forma cega. Isso desativa a validação de props em tempo de compilação e bypassa o sistema de tipos do TypeScript.
- **Testes com Mocks que Ocultam Erros Reais**: O teste unitário em `tests/components/IconsAndLoaders.test.ts` adicionou um stub explícito para `LoaderIcon`, mascarando o fato de que `MaxLoader.vue` nunca importou seu subcomponente.

---

## Evidência Técnica

### 1. Emits sem tipagem TypeScript (sintaxe de array)
- Em [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue#L20):
  ```typescript
  const emit = defineEmits(['update:modelValue']);
  ```
- Em [`src/components/MaxMaps.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxMaps.vue#L42):
  ```typescript
  const emit = defineEmits(['update:modelValue']);
  ```
- Em [`src/components/MaxInputFileUploadButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFileUploadButton.vue#L24):
  ```typescript
  const emit = defineEmits(['upload']);
  ```
- Em [`src/components/MaxInputCheckbox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCheckbox.vue#L52):
  ```typescript
  const emit = defineEmits(['update:modelValue']);
  ```
Todos os casos deveriam utilizar generic types estritos com assinatura de parâmetros:
```typescript
const emit = defineEmits<{
    'update:modelValue': [value: boolean | string | any];
}>();
```

### 2. Omissão de `defineProps` e bypass via `useAttrs()`
Em [`src/components/MaxEmptyDiv.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxEmptyDiv.vue#L18-L27):
```typescript
<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeHtml } from '../helpers/sanitizeHtml';

    const attrs = useAttrs();
    const sanitizedLabel = computed(() => {
        const raw = attrs.label ?? 'Sem Registros';
        return sanitizeHtml(String(raw));
    });
</script>
```
E no template correspondente:
```html
<MaxIcon :icon="String(attrs.icon ?? attrs.i ?? 'ph:empty')" :size="Number(attrs.iconSize ?? 2)" />
```
O componente opera inteiramente no escuro em relação ao compilador TypeScript. IDEs como VS Code / WebStorm não fornecem autocompletar para `label`, `icon` ou `iconSize`.

### 3. Componente órfão e coerção quebrado no MaxLoader
Em [`src/components/MaxLoader.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxLoader.vue#L1-L15):
```html
<template>
    <div v-bind="attrs" v-if="attrs.show !== undefined ? attrs.show : true" class="max-loader-main-div">
        <div class="items">
            <LoaderIcon />
            <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { useAttrs } from 'vue';

    const attrs: any = useAttrs();
</script>
```
1. `<LoaderIcon />` não foi importado (`import MaxLoaderIcon from './MaxLoaderIcon.vue';`).
2. `attrs.show !== undefined ? attrs.show : true` não converte a string `"false"` em booleano falso, renderizando o loader mesmo quando o consumidor instrui para ocultar.
3. `v-bind="attrs"` injeta as propriedades internas no nó HTML raiz.

### 4. Classes residuais do PrimeVue e tipagem `any[]`
Em [`src/components/MaxTopToolbarSubmenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue#L2-L7) e [`linha 63`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue#L63):
```html
<ul class="max-top-toolbar-submenu p-menubar-submenu" role="menu" ...>
    <li ... class="p-menubar-item" ...>
```
```typescript
const props = defineProps<{
    items: any[];
}>();
```
O componente mantém nomenclaturas legadas do PrimeVue (`p-menubar-submenu`, `p-menubar-item`), em desacordo com as diretrizes de independência total do PrimeVue, e utiliza `any[]` sem modelar o contrato dos itens do menu.

---

## Impacto na Estabilidade e Manutenibilidade do Ecossistema

1. **Fragilidade nos Apps Consumidores**: Erros de digitação de propriedades não são capturados em tempo de desenvolvimento pelo TypeScript, gerando bugs que só aparecem em produção.
2. **Poluição do DOM e Conflitos de Acessibilidade**: Atributos repassados sem filtro ao elemento raiz podem interferir em leitores de tela ou colidir com atributos HTML padrão.
3. **Inconformidade Arquitetural**: Desrespeita os princípios de tipagem estrita da biblioteca e atrasa a independência total da arquitetura em relação ao ecossistema legado.
