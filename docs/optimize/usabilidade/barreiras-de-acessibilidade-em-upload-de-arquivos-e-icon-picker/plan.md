# Plano de Implementação: Barreiras de Acessibilidade em Upload de Arquivos e Icon Picker

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L1-L19):**
   - A dropzone principal de arrastar e soltar arquivos é uma `<div>` com manipulador `@click="onAreaClick"`, desprovida de `tabindex="0"`, `role="button"` e ouvintes de teclado (`Enter`/`Espaço`).
   - Usuários dependentes de teclado não conseguem focar a área nem abrir a caixa de diálogo nativa do sistema operacional para envio de arquivos (WCAG 2.1.1 - Acessível por Teclado).
   - Falta atributo `aria-label` descritivo na zona de drop.
2. **[`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L16-L39,L77-L85):**
   - Os botões `.p-fileupload-choose` e de envio exibem apenas ícones gráficos sem texto ou `aria-label`, sendo lidos apenas como "Botão" sem contexto (WCAG 4.1.2).
   - As miniaturas de arquivos já selecionados (`.files-icons .file-icon`) disparam `@click="$emit('file-click', file)"`, mas são tags `<div>` sem `tabindex="0"`, sem papel semântico de botão e sem nome acessível informando o nome do arquivo anexado.
3. **[`MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L10-L19,L66-L82):**
   - O gatilho que abre a gaveta de ícones (`.icon-picker-trigger`) é uma `<div>` clicável sem `role="button"`, sem `tabindex="0"` e sem `aria-haspopup="dialog"`.
   - A grade de exibição de ícones gera centenas de células `.icon-cell` com `@click.stop="selectIcon(icon.name)"` em elementos `<div>` sem `tabindex`, sem foco e sem navegação direcional por teclado.

### Objetivo
- Permitir que a área de upload grande (`MaxInputFileUploadBig`) seja operável por teclado via foco `Tab` e acionamento com `Enter`/`Espaço`.
- Adicionar rótulos acessíveis explícitos nos botões de upload e tornar as miniaturas de arquivos anexados focáveis e acionáveis via teclado.
- Tornar o gatilho e as células da grade do `MaxInputIconPicker` operáveis por teclado e compatíveis com leitores de tela.

---

## 2. Arquivos a Modificar

- [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue)
- [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue)
- [`src/components/MaxInputIconPicker.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue)
- [`tests/unit/MaxInputFileUploadBig.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputFileUploadBig.spec.ts)
- [`tests/unit/MaxInputFileUpload.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputFileUpload.spec.ts)
- [`tests/unit/MaxInputIconPicker.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputIconPicker.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxInputFileUploadBig.vue`

#### Alterações no Template
Transformar a área de drop em um botão acessível:
```html
<template>
    <div
        ref="drop_zone_ref"
        :class="`max-input-file-upload-big input-upload-file-big-main-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'} ${props.disabled ? 'is-disabled' : ''}`"
        role="button"
        :tabindex="props.disabled ? -1 : 0"
        :aria-label="ariaLabelComputed"
        :aria-disabled="props.disabled ? 'true' : undefined"
        @click="onAreaClick"
        @keydown.enter.prevent="onAreaClick"
        @keydown.space.prevent="onAreaClick"
    >
        <!-- Área principal clicável -->
        <div class="upload-area" v-if="!uploading && !showError">
            <slot>
                <MaxIcon i="lets-icons:upload-light" size="3" />
                <div v-if="label">{{ label }}</div>
            </slot>
        </div>
        <!-- Estados uploading e error mantidos -->
    </div>
</template>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const ariaLabelComputed = computed(() => {
    if (props.label && props.label.trim()) {
        return `${props.label}. Pressione Enter ou Espaço para escolher arquivos`;
    }
    return 'Área de envio de arquivos. Pressione Enter ou Espaço para escolher arquivos para upload';
});
```

#### Alterações no SCSS Scoped
```scss
.input-upload-file-big-main-div {
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 2px;
    }

    &.is-disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}
```

---

### 3.2. `MaxInputFileUpload.vue`

#### Alterações no Template
1. Botões de escolha e envio com `aria-label`:
```html
<button
    type="button"
    class="p-button p-fileupload-choose"
    :disabled="attrs.disabled ?? false"
    :aria-label="uploading ? 'Carregando arquivos' : 'Escolher arquivos para envio'"
    @click.stop="triggerChoose"
>
    <div class="chose-icon-div">
        <Icon icon="line-md:loading-loop" size="2" v-if="uploading" />
        <Icon icon="quill:folder-open" size="2" v-else />
    </div>
</button>

<button
    type="button"
    class="p-button"
    v-if="showUploadButton"
    v-tooltip="'Enviar arquivo'"
    aria-label="Enviar arquivos selecionados"
    @click.stop="startUpload(files)"
>
    <div class="chose-icon-div">
        <Icon icon="ic:baseline-file-upload" size="2" />
    </div>
</button>
```

2. Miniaturas de arquivos acessíveis com semântica de botão:
```html
<div class="file-upload-content-div" :disabled="attrs.disabled ?? false">
    <div class="files-icons" v-if="modelValue.length > 0">
        <button
            v-for="(file, index) in modelValue"
            :key="file.id || index"
            type="button"
            class="file-icon"
            :aria-label="`Visualizar arquivo ${file?.file_name || file?.name || 'anexo ' + (index + 1)}`"
            @click="$emit('file-click', file)"
        >
            <Icon icon="ph:file-pdf-light" v-if="getFileExtension(file?.file_name || '') === 'pdf'" size="1.8" />
            <Icon icon="ph:file-jpg-light" v-if="['jpg', 'jpeg'].includes(getFileExtension(file?.file_name || ''))" size="1.8" />
            <Icon icon="ph:file-png-light" v-if="getFileExtension(file?.file_name || '') === 'png'" size="1.8" />
            <Icon icon="fa:check-circle" class="file-check" size="0.7" />
            <img :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src" alt="Thumbnail" v-show="!file.file_name" />
        </button>
    </div>
</div>
```

#### SCSS Scoped
```scss
.file-icon {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 2px;
        border-radius: 4px;
    }
}
```

---

### 3.3. `MaxInputIconPicker.vue`

#### Alterações no Gatilho e Células
1. Gatilho acessível:
```html
<div
    class="icon-picker-trigger p-inputtext"
    :class="{ 'is-disabled': props.disabled }"
    role="button"
    :tabindex="props.disabled ? -1 : 0"
    aria-haspopup="dialog"
    :aria-expanded="visible"
    :aria-label="modelValue ? `Ícone selecionado: ${modelValue}. Clique para alterar` : 'Escolha um ícone'"
    @keydown.enter.prevent="openDrawer"
    @keydown.space.prevent="openDrawer"
>
    <!-- Conteúdo do gatilho -->
</div>
```

2. Células de ícone na gaveta:
```html
<button
    v-for="icon in row"
    :key="icon.name"
    type="button"
    class="icon-cell"
    :class="{ selected: modelValue === icon.name }"
    :aria-label="`Selecionar ícone ${icon.name}`"
    :title="icon.name"
    @click.stop="selectIcon(icon.name)"
>
    <div
        v-if="svgCache[icon.name]"
        class="picker-icon-svg"
        v-html="svgCache[icon.name]"
    />
    <div v-else class="picker-icon-placeholder" />
</button>
```

3. Botão de fechar gaveta acessível:
```html
<button
    type="button"
    class="p-drawer-close-button"
    aria-label="Fechar seletor de ícones"
    @click="visible = false"
>
    <MaxIcon i="mdi:close" size="1.2" />
</button>
```

#### SCSS Scoped
```scss
.icon-picker-trigger {
    &:focus-visible {
        outline: 2px solid var(--blue-600);
        outline-offset: 1px;
    }
}

.icon-cell {
    background: none;
    border: none;
    cursor: pointer;

    &:focus-visible {
        outline: 2px solid var(--blue-600);
        outline-offset: 1px;
        border-radius: 4px;
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Slots e Eventos Mantidos:**
   - O evento `@file-click` e as props do dialog nativo mantêm compatibilidade estrita.
   - O `v-model` de `MaxInputIconPicker` continua emitindo string do ícone selecionado.
2. **Layout Visual Intocado:**
   - Botões renderizados como `<button type="button">` herdam as propriedades de layout flex/grid existentes sem quebras de layout.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] Usuário consegue tabular até `MaxInputFileUploadBig` e abrir o seletor com `Enter` ou `Espaço`.
- [ ] Todos os botões de ação e miniaturas em `MaxInputFileUpload` possuem nome acessível (`aria-label`) e foco visível.
- [ ] O gatilho e as células de ícones em `MaxInputIconPicker` são botões focáveis e ativáveis por teclado.
- [ ] O botão de fechar gaveta do IconPicker possui `aria-label="Fechar seletor de ícones"`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxInputFileUploadBig.spec.ts
npx vitest run tests/unit/MaxInputFileUpload.spec.ts
npx vitest run tests/unit/MaxInputIconPicker.spec.ts
```
