# Plano de Implementação: Classes Utilitárias, Atributos de Estilo e CSS Inline nos Templates

## 1. Diagnóstico e Objetivo

A auditoria de UI & Design comprovou a violação das duas principais regras de estilização definidas nas Seções 1 e 2 do `GEMINI.md` ("Proibição Absoluta de Classes Utilitárias e Atributos de Estilo no Template" e "O Único Meio Permitido: Seção `<style lang="scss" scoped>`"):
1. **Injeção de Classes Utilitárias em Templates via Interpolação:**
   Em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L2), o template concatena classes utilitárias `text-center` e `text-right` através de template string:
   ```html
   :class="`${...} ${textCenter ? 'text-center' : ''} ${textRight ? 'text-right' : ''} ...`"
   ```
2. **Atributos Utilitários de Estilo (Pseudo-Attributify):**
   O SCSS de [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L515-L545) implementa seletores de atributos utilitários (`&[full]`, `&[flex]`, `&[slim]`, `&[input-click]`). Esses atributos funcionam exatamente como o modo Attributify do UnoCSS, contornando a regra que proíbe dimensionamento direto no template do consumidor (ex.: `<InputBase full flex />`).
3. **Classes de Tipografia Helper no Template:**
   Em [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L8-L9), utilizam-se classes com nomes utilitários (`text-h1` e `text-h2`) em vez de seletores semânticos.
4. **Propriedades CSS Inline nos Templates (`style` e `:style`):**
   - [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L10): `:style="'letter-spacing: 2.5px;'"` inline no elemento `<input>`.
   - [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L7): `style="display: none;"` inline no `<input type="file">`.
   - [`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L15-L24): `style="height: 300px; width: 300px;" background="red"` inline no player Lottie.
   - [`MaxLoaderAi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue#L5): `style="height: 400px; width: 400px;"` inline no player Lottie.
   - [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L97-L101): `:style="{ width: '30px' }"` e `style="display: grid; white-space: nowrap;"` inline.
   - [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L91-L122): `:style="{ width: '30px' }"` inline em nós de ícone.

**Objetivo:** Expurgar 100% dos estilos inline e das classes utilitárias dos templates, migrando todas as propriedades para `<style lang="scss" scoped>` com classes semânticas descritivas, adotar bindings tipados de classes em `InputBase.vue` e suportar modificadores semânticos de classe (`.is-fluid`, `.is-slim`).

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) — Substituir concatenação por binding tipado e modernizar seletores utilitários.
- [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L3-L12) — Remover `:style` e encapsular o `letter-spacing` em classe semântica no SCSS scoped.
- [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L3-L13) — Remover `style="display: none;"` e aplicar no SCSS sob `.max-file-native-input`.
- [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L10-L30) — Mover dimensões fixas do Lottie para o SCSS scoped.
- [`src/components/MaxLoaderAi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue#L3-L10) — Mover dimensões do player Lottie para o SCSS scoped sob classe semântica.
- [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L95-L105) — Eliminar `:style` e `style` de layout das opções.
- [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L90-L125) — Eliminar `:style="{ width: '30px' }"` e encapsular na classe do ícone.
- [`src/components/MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L8-L9) — Substituir `.text-h1` / `.text-h2` por `.title-heading` / `.subtitle-heading`.

---

## 3. Especificação Técnica Cirúrgica

### A. [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue)

1. **Template:** Substituir interpolação bruta de strings por binding tipado:

```html
<template>
    <div 
        class="max-input-base max-input-main-div" 
        :class="[
            {
                'is-floating': props.float !== undefined,
                'is-done': done,
                'is-caution': !noStatus && caution,
                'is-error': !noStatus && isError,
                'is-inline': inLine,
                'is-text-center': textCenter,
                'is-text-right': textRight,
                // Classes de retrocompatibilidade mantidas:
                'float': props.float !== undefined,
                'done': done,
                'caution': !noStatus && caution,
                'error': !noStatus && isError,
                'in-line': inLine,
                'text-center': textCenter,
                'text-right': textRight,
            },
            props.class
        ]"
    >
        <!-- ... restante do template preservado ... -->
```

2. **SCSS Scoped:** Atualizar seletores em `src/components/InputBase.vue`:

```scss
// Alinhamentos de texto semânticos:
&.is-text-center,
&.text-center {
    :deep(input) {
        text-align: center;
    }
}

&.is-text-right,
&.text-right {
    :deep(input) {
        text-align: right;
    }
}

// Modificadores de dimensionamento (aceita classes semânticas e preserva atributos legados):
&.is-full,
&.is-flex,
&[full],
&[flex] {
    width: 100% !important;
    height: 100% !important;

    :deep(input) {
        width: 100% !important;
        height: 100% !important;
        max-width: 100% !important;
        max-height: 100% !important;
        padding: 0 10px !important;
    }
}

&.is-slim,
&[slim],
&[input-click] {
    grid-template-rows: 20px;
    height: 20px;

    :deep(div),
    :deep(span),
    :deep(input),
    :deep(select),
    :deep(.max-select),
    :deep(.p-select),
    :deep(.value-div),
    :deep(.value-text) {
        height: 20px !important;
        max-height: 20px !important;
        font-size: 0.8rem;
    }
}
```

### B. [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue)

1. **Template:**
```html
<template>
    <InputBase class="max-input-cpf-cnpj" v-bind="props" :error="error_msg ?? undefined" :caution="caution" :done="done ?? undefined">
        <input
            type="text"
            class="max-input-native max-cpf-cnpj-input"
            :value="masked_value"
            v-maska="maskValue"
            :disabled="props.disabled"
            @input="onUserInput"
        />
    </InputBase>
</template>
```

2. **SCSS Scoped:**
```scss
<style lang="scss" scoped>
    .max-input-cpf-cnpj {
        :deep(.max-cpf-cnpj-input) {
            letter-spacing: 2.5px;
        }
    }
</style>
```

### C. [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue)

1. **Template:**
```html
<input
    ref="nativeInputRef"
    type="file"
    class="max-file-native-input"
    :name="(attrs.name as string) ?? 'file'"
    :accept="(attrs.accept as string) ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'"
    :multiple="(attrs.multiple as boolean) ?? true"
    :disabled="attrs.disabled ?? false"
    @change="onNativeInputChange"
/>
```

2. **SCSS Scoped:**
```scss
// Em src/components/MaxInputFileUpload.vue:
.max-input-file-upload {
    .max-file-native-input {
        display: none;
    }
}
```

### D. [`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue)

1. **Template:**
```html
<div v-else-if="uploading" class="upload-state">
    <slot name="uploading">
        <div class="screen-animation">
            <DotLottieVue 
                class="screen-animation-lottie" 
                autoplay 
                loop 
                src="https://lottie.host/1c897063-7dec-4b92-b8db-ecd2cd67f48e/ofrND79jXr.lottie" 
            />
        </div>
    </slot>
</div>

<div v-else-if="showError" class="upload-state">
    <slot name="error">
        <div class="screen-animation">
            <DotLottieVue 
                class="screen-animation-lottie" 
                autoplay 
                src="https://lottie.host/b1aebee5-5e8b-4008-acd5-fc651795bbf6/ghW5oHG5ml.lottie" 
            />
            <div class="screen-animation-label">
                Erro ao enviar o arquivo.
            </div>
        </div>
    </slot>
</div>
```

2. **SCSS Scoped:**
```scss
.screen-animation {
    display: flex;
    justify-content: center;
    align-items: center;

    .screen-animation-lottie {
        width: 300px;
        height: 300px;
    }
}
```

### E. [`MaxLoaderAi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue)

1. **Template:**
```html
<template>
    <div v-bind="attrs" v-if="attrs.show !== undefined ? attrs.show : true" class="max-loader-ai loader-main-div-ai">
        <div class="items">
            <DotLottieVue class="loader-ai-animation" autoplay loop src="https://lottie.host/c6ad8a06-43b7-4f0e-876e-634d1f4bb58d/o6vjcixeiy.lottie" />
            <div v-if="attrs.label" class="item-label">{{ attrs.label }}</div>
        </div>
        <div class="background-ai"></div>
    </div>
</template>
```

2. **SCSS Scoped:**
```scss
.max-loader-ai {
    .items {
        .loader-ai-animation {
            width: 400px;
            height: 400px;
        }
    }
}
```

### F. [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue) e [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue)

1. **Template:**
Substituir `:style="{ width: '30px' }"` por classe semântica `.option-icon-fixed`:
```html
<MaxIcon 
    class="option-icon-fixed"
    :icon="option['icon']" 
    v-if="option['icon']" 
    :size="option?.['iconSize'] ?? '1'" 
/>
```
E substituir `style="display: grid; white-space: nowrap;"` por classe semântica `.label-tag-text`:
```html
<div class="label-tag">
    <div class="label-tag-text" v-text="option[props.optionLabel] ?? option.label"></div>
</div>
```

2. **SCSS Scoped:**
```scss
.option-icon-fixed {
    width: 30px;
}

.label-tag {
    .label-tag-text {
        display: grid;
        white-space: nowrap;
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

- **Dupla Emissão de Classes no InputBase:** O componente base continua emitindo tanto as classes antigas (`text-center`, `text-right`, `done`, `caution`, `error`) quanto as semânticas (`is-text-center`, `is-text-right`, `is-done`, etc.). Código consumidor legado que faça asserções em testes com `hasEmittedClass('text-center')` continuará verde sem modificação.
- **Suporte Contínuo aos Seletores de Atributo:** Seletores como `&[full]` e `&[slim]` permanecem válidos no SCSS, assegurando que componentes que instanciam `<InputBase full />` não sofram regressão visual.
- **Isolamento de Estilos via Scoped:** Nenhuma classe transferida dos atributos `style` para `<style lang="scss" scoped>` vaza para o escopo global.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação

1. **Zero Atributos `style` Estáticos:** Não deve haver nenhum atributo `style="..."` estático nos componentes modificados (`MaxInputFileUpload`, `MaxInputFileUploadBig`, `MaxLoaderAi`, `MaxTagSelect`).
2. **Eliminação de `:style` Estáticos em Inputs:** Propriedades como `letter-spacing` devem ser geridas puramente via classes SCSS.
3. **Template Sem Interpolações Frágeis:** `InputBase.vue` utiliza binding de objeto ou array tipado em vez de interpolações literais de strings.
4. **Passagem sem Erros em Type-check e Testes Unitários:** Todos os testes dos componentes afetados passam sem falhas.

### Comandos de Validação

```bash
# 1. Verificação de Tipos TypeScript
npm run type-check

# 2. Execução dos Testes Unitários dos Componentes Modificados
npx vitest run tests/components/MaxInputCpfCnpj.test.ts tests/components/MaxLoaderAi.test.ts tests/components/MaxTitle2.test.ts tests/components/SelectionInputs.test.ts

# 3. Auditoria de Atributos Style Estáticos Proibidos
# Deve retornar zero resultados para os arquivos alterados:
git grep -nE 'style="display: none|style="height: 300px|style="height: 400px|letter-spacing: 2.5px' src/components/

# 4. Linting
npm run lint
```
