# Barreiras de Acessibilidade em Componentes de Upload de Arquivos e Seletor de Ícones

## Descrição e Causa Raiz

### Problema
Componentes avançados de entrada como envio de arquivos e seletores visuais apresentam barreiras severas que impedem o uso por pessoas com deficiência ou que utilizam exclusivamente o teclado.

#### 1. MaxInputFileUploadBig.vue ([`src/components/MaxInputFileUploadBig.vue:1-9`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L1-L9))
O componente cria uma área ampla de dropzone clicável:
```html
<div ref="drop_zone_ref" :class="`max-input-file-upload-big input-upload-file-big-main-div ${isOverDropZone ? 'in-drop' : 'not-in-drop'}`" @click="onAreaClick">
    <div class="upload-area" v-if="!uploading && !showError">
        <slot>
            <MaxIcon i="lets-icons:upload-light" size="3" />
            <div v-if="label">{{ label }}</div>
        </slot>
    </div>
    ...
</div>
```
- **Inacessível por Teclado:** Não há `tabindex="0"`, não há `role="button"`, nem ouvintes `@keydown.enter` ou `@keydown.space`.
- Um usuário cego ou motor que navega via teclado não consegue colocar foco na área e não consegue abrir o seletor de arquivos do sistema operacional através deste componente.

#### 2. MaxInputFileUpload.vue ([`src/components/MaxInputFileUpload.vue:16-39, 77-85`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L16-L39))
- Os botões `.p-fileupload-choose` (selecionar pasta/arquivo) e de envio (`startUpload`) renderizam tags `<button type="button">`, porém não possuem texto ou `aria-label`. Ambos contêm apenas um ícone SVG. O leitor de tela anuncia "Botão" sem qualquer explicação da sua função.
- Os arquivos selecionados listados em `.files-icons .file-icon` possuem `@click="$emit('file-click', file)"` mas são elementos `<div>` sem `role="button"`, sem `tabindex="0"`, sem rótulo do nome do arquivo e sem acionamento por teclado.

#### 3. MaxInputIconPicker.vue ([`src/components/MaxInputIconPicker.vue:10-19, 66-76`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L10-L19))
- O gatilho que abre a gaveta de ícones (`.icon-picker-trigger`) é uma `<div>` clicável sem `role="button"` e sem `tabindex="0"`.
- A grade de exibição de ícones gera centenas de células `.icon-cell` com `@click.stop="selectIcon(icon.name)"`. Essas células são tags `<div>` sem `role="option"`, sem `tabindex`, sem foco e sem eventos de teclado. É completamente impossível escolher um ícone utilizando apenas o teclado.

## Localização no Código
- [`src/components/MaxInputFileUploadBig.vue:1-32, 79-99`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L1-L32)
- [`src/components/MaxInputFileUpload.vue:16-39, 77-86`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L16-L39)
- [`src/components/MaxInputIconPicker.vue:10-20, 60-76`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L10-L20)

## Proposta de Solução
1. Em `MaxInputFileUploadBig.vue`:
   - Adicionar `role="button"`, `tabindex="0"`, `:aria-label="props.label || 'Selecionar arquivos para envio'"` e acionamento com `Enter`/`Espaço`.
2. Em `MaxInputFileUpload.vue`:
   - Adicionar `aria-label="Escolher arquivos"` no botão de escolha e `aria-label="Enviar arquivos"` no botão de upload.
   - Tornar os thumbnails de arquivos (`.file-icon`) botões focáveis com `role="button"`, `tabindex="0"` e `aria-label="'Visualizar ' + file.file_name"`.
3. Em `MaxInputIconPicker.vue`:
   - Tornar o gatilho um botão acessível (`role="button"`, `tabindex="0"`, `aria-haspopup="dialog"`).
   - Implementar suporte a foco e seleção por teclado (grid/listbox) com setas direcionais nas células de ícones e seleção via tecla `Enter`.
