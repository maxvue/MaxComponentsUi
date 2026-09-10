# Plano de Implementação: Violações de Aninhamento Estrito SCSS e Discrepâncias na Hierarquia DOM

## 1. Diagnóstico e Objetivo

A auditoria de UI & Design identificou violações generalizadas da regra de aninhamento estrito estabelecida na Seção 3 do `GEMINI.md` ("Aninhamento Obrigatório Conforme a Hierarquia do Template"):
1. **Desconexão Total do Template em [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L52-L74):**
   O bloco `<style lang="scss" scoped>` não possui nenhum seletor com o nome da classe raiz declarada no template (`.max-input-search` ou `.input-search-main-div`). O arquivo é uma coleção desordenada de seletores planos e regras `:deep(.p-autocomplete*)` herdadas de um componente legado de busca que não existe mais ali, acompanhadas de classes de rascunho mortas (`.tst1`, `.tst2`).
2. **Pulo de Nós Intermediários do DOM em [`MaxTitle1.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle1.vue#L6-L10) e [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L7-L10):**
   Ambos os templates possuem um container `<div>` intermediário anônimo envolvendo título e subtítulo. No entanto, no SCSS, os seletores de texto são declarados como filhos diretos da raiz (`.max-title-1 { .t1-main-text { ... } }`), quebrando o espelhamento fiel da árvore DOM.
3. **Seletores Órfãos e Código Morto em [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L302-L306):**
   No fim do bloco de estilos reside `.icon-button-b` desaninhado no nível zero contendo propriedades comentadas esquecidas.
4. **Fragmentação de Blocos em [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L132-L280):**
   O arquivo espalha 8 blocos de nível zero independentes (`.search-top-bar`, `.search-top-bar-mobile`, `.mobile-search-overlay`, `.mobile-search-panel`, `.mobile-search-header`, etc.), destruindo a hierarquia visual e aninhada do componente.
5. **Classes de Transição e Overlays Desaninhados:**
   [`MaxDrawer.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue) e [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue) possuem classes soltas fora da raiz do componente.

**Objetivo:** Reestruturar o SCSS de todos os componentes com aninhamento estrito espelhando 1:1 a árvore do template, atribuir classes semânticas aos nós anônimos da DOM, eliminar classes mortas e consolidar seletores planos em nós raiz canônicos.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue) — Eliminar regras de autocomplete e classes `.tst*`; aninhar sob `.max-input-search`.
- [`src/components/MaxTitle1.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle1.vue) — Adicionar classe semântica `.title-text-group` ao `<div>` intermediário e aninhar o SCSS correspondente.
- [`src/components/MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue) — Adicionar `.title-text-group` no template e aninhar os títulos no SCSS.
- [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L300-L308) — Remover o seletor órfão `.icon-button-b` e comentários residuais.
- [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L130-L280) — Reestruturar os 8 seletores de nível zero em aninhamento estrito sob `.mobile-search-overlay`.
- [`src/components/MaxDrawer.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue) — Reaninhamento das regras de transição sob a raiz `.max-drawer`.
- [`tests/components/MaxScssHierarchy.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxScssHierarchy.test.ts) — Teste estático de linting e validação da árvore DOM dos componentes refatorados.

---

## 3. Especificação Técnica Cirúrgica

### A. [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue)

Substituir completamente o template e o bloco SCSS para refletir a estrutura real do componente:

```html
<template>
    <InputBase 
        class="max-input-search input-search-main-div" 
        :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'"
    >
        <input 
            type="text" 
            class="max-input-native" 
            v-bind="attrs" 
            :value="temp_value" 
            @input="onInput" 
        />
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, watch, useAttrs, onUnmounted } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            isLoading?: boolean;
        }>(),
        { modelValue: '', isLoading: false }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: string): void;
        (e: 'search', value: string): void;
    }>();

    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => (temp_value.value = val));

    let debounceTimer: ReturnType<typeof setTimeout>;

    const onInput = (event: Event) => {
        temp_value.value = (event.target as HTMLInputElement).value;
        clearTimeout(debounceTimer);

        if (temp_value.value === '') {
            emit('search', '');
            return;
        }

        debounceTimer = setTimeout(() => {
            if (temp_value.value && temp_value.value.length > 1) {
                emit('search', temp_value.value);
            }
        }, 300);
    };

    onUnmounted(() => clearTimeout(debounceTimer));
</script>

<style lang="scss" scoped>
    .max-input-search {
        :deep(.max-input-field-div) {
            .max-input-native {
                width: 100%;
                border: none;
                outline: none;
                background-color: transparent;
                color: var(--background-800);
                font-family: inherit;
            }
        }
    }
</style>
```

### B. [`MaxTitle1.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle1.vue)

Adicionar a classe semântica `.title-text-group` no nó intermediário e aninhar o SCSS correspondente:

```html
<template>
    <div class="max-title-1 max-title-2" :class="{ center: center }">
        <MaxIcon :i="resolvedIcon" v-if="resolvedIcon" :size="resolvedIconSize" class="title-icon" />
        <div class="title-text-group">
            <div v-if="resolvedTitle" class="t1-main-text">{{ resolvedTitle }}</div>
            <div v-if="resolvedSubtitle" class="t2-main-text" v-html="resolvedSubtitle"></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .max-title-1 {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 8px;
        place-items: center start;
        padding: 10px 0 0;
        width: 100%;
        color: var(--background-700);

        &.center {
            place-items: center;
        }

        .title-icon {
            margin-bottom: 0.5rem;
        }

        .title-text-group {
            display: flex;
            flex-direction: column;

            .t1-main-text {
                font-weight: 500;
                font-size: 1.125rem;
                text-transform: uppercase;
                padding: 0 !important;
                color: var(--background-775);
            }

            .t2-main-text {
                font-size: 0.875rem;
                font-weight: 400;
                padding: 0 !important;
                color: var(--background-750) !important;
            }
        }
    }
</style>
```

### C. [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue)

Adicionar `.title-text-group` e substituir as classes de tipografia helper por classes semânticas:

```html
<template>
    <div class="max-title-2">
        <MaxIcon :i="resolvedIcon" v-if="resolvedIcon" :size="resolvedIconSize" class="title-icon" />
        <div class="title-text-group">
            <div v-if="resolvedTitle" class="title-heading">{{ resolvedTitle }}</div>
            <div v-if="resolvedSubtitle" class="subtitle-heading" v-html="resolvedSubtitle"></div>
        </div>
    </div>
</template>

<style scoped lang="scss">
    .max-title-2 {
        user-select: none;
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 8px;
        padding: 1rem 0 5px;
        width: 100%;
        place-items: center start;

        .title-icon {
            margin-bottom: 0.5rem;
        }

        .title-text-group {
            display: flex;
            flex-direction: column;

            .title-heading {
                font-weight: 500;
                text-transform: uppercase;
                font-size: 0.9rem;
                color: var(--background-775);
            }

            .subtitle-heading {
                font-weight: 300;
                font-size: 0.85rem;
                color: var(--background-750);
            }
        }
    }
</style>
```

### D. [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L302-L308)

Remover o bloco desaninhado `.icon-button-b`:

```scss
// Excluir as linhas 302-306 de src/components/MaxButton.vue:
// .icon-button-b {
//     /* min-width: 15px; */
//     /* min-height: 15px; */
// }
```

### E. [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue)

Reagrupar os 8 nós soltos em aninhamento estrito espelhando a árvore:

```scss
// Em src/components/MaxTopMenuSearchBar.vue:
.search-top-bar {
    // ... estilos do desktop ...
    .search-top-bar-input {
        // ...
    }
}

.search-top-bar-mobile {
    // ...
}

.mobile-search-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgb(0 0 0 / 50%);
    backdrop-filter: blur(4px);

    .mobile-search-panel {
        background: var(--background-0);
        width: 100%;
        padding: 16px;

        .mobile-search-header {
            display: flex;
            align-items: center;
            gap: 8px;

            .mobile-search-input {
                flex: 1;
            }

            .mobile-search-checkbox {
                display: flex;
                align-items: center;
            }
        }

        .mobile-search-results {
            margin-top: 12px;
            max-height: 60vh;
            overflow-y: auto;
        }
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

- **Compatibilidade de Layout e Estilos:** A inclusão de `.title-text-group` com `display: flex; flex-direction: column;` reproduz exatamente o comportamento do `<div>` de bloco padrão nos navegadores, sem qualquer alteração dimensional ou quebra de layout.
- **Limpeza Segura em `MaxButton.vue`:** O seletor `.icon-button-b` possuía apenas propriedades comentadas. Sua remoção é 100% inócua para a renderização de qualquer botão do sistema.
- **Suporte a Buscas e Props Existentes:** [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue) mantém integralmente a interface de props (`modelValue`, `isLoading`), o evento `update:modelValue` e o evento customizado `search` com debounce de 300ms.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação

1. **Aninhamento SCSS 100% Estrito:** Todo arquivo SCSS modificado deve ter apenas os seletores raiz representativos da sua marcação de topo.
2. **Zero Seletores Órfãos:** Ausência completa de classes não declaradas no template ou comentários de regras abandonadas no CSS final.
3. **Eliminação de Classes Mortas:** `.tst1`, `.tst2` e `:deep(.p-autocomplete-*)` completamente ausentes de `MaxInputSearch.vue`.
4. **Espelhamento DOM-SCSS:** Cada regra CSS interna de títulos, overlays e formulários deve refletir a hierarquia de tags exata do template.

### Comandos de Validação

```bash
# 1. Verificação de Tipos TypeScript
npm run type-check

# 2. Execução dos Testes Unitários de Título, Busca e Botão
npx vitest run tests/components/MaxTitle1.test.ts tests/components/MaxTitle2.test.ts tests/components/MaxInputSearch.test.ts tests/components/MaxButton.test.ts

# 3. Linter e Stylelint de Aninhamento
npm run lint

# 4. Auditoria de Classes de Teste Mortas
git grep -nE "\.tst1|\.tst2|icon-button-b" src/components/
```
