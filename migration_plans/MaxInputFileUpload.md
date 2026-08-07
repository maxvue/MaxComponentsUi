# Plano de Migração — MaxInputFileUpload (Independência do PrimeVue)

> Documento autossuficiente. Uma IA executora deve conseguir realizar a migração lendo **apenas**
> este arquivo + os fontes referenciados. **Não** altere a API pública, os estilos nem o
> comportamento observável.

---

## 1. Componente

- **Nome:** `MaxInputFileUpload`
- **Caminho:** `src/components/MaxInputFileUpload.vue`
- **Nível de dificuldade:** `média`
- **Objetivo da migração:** Remover a dependência de `FileUpload` e `ProgressSpinner` do PrimeVue.
  Reimplementar a seleção de arquivos com um `<input type="file">` nativo + área de drag & drop,
  utilizando `useDropZone` e `useFileDialog` (re-exportados por `@maxvue/max-use` a partir do
  VueUse). Reimplementar o upload assíncrono via `XMLHttpRequest` (que o PrimeVue fazia internamente,
  com eventos `select`/`before-send`/`upload`/`error`). Substituir o `ProgressSpinner` por um spinner
  puramente em CSS. Preservar TODA a API pública, os slots, os `attrs`, o `v-model` e os estilos.

> **Nota crítica sobre paridade de comportamento:** o `FileUpload` do PrimeVue fazia MUITO trabalho
> "invisível": gerenciava a lista interna de arquivos selecionados, fazia o request XHR real
> (com `withCredentials`), disparava `@before-send` (permitindo mutar `xhr`/`formData`), disparava
> `@upload` no sucesso (com `event.xhr`), `@error` na falha, e `@select` na seleção. Ao reimplementar,
> é OBRIGATÓRIO reproduzir esse fluxo XHR manualmente, pois o `onUploadHandler`/`onBeforeUpload`/`onError`
> atuais dependem dele.

---

## 2. Dependências do PrimeVue (trechos reais)

Imports no `<script setup>` (linhas 81–82):

```ts
import FileUpload from 'primevue/fileupload';
import ProgressSpinner from 'primevue/progressspinner';
```

### 2.1 `FileUpload` — uso no template (linhas 3–63)

```html
<FileUpload
    ref="fileUploadRef"
    name="file"
    v-bind="attrs"
    :disabled="attrs.disabled ?? false"
    :accept="attrs.accept ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx'"
    :auto="attrs.auto ?? true"
    :multiple="attrs.multiple ?? true"
    :showCancelButton="false"
    :showUploadButton="attrs.showUploadButton !== undefined && attrs.showUploadButton !== false"
    :withCredentials="true"
    @error="onError"
    @before-send="onBeforeUpload"
    @upload="onUploadHandler"
    @select="onSelectHandler"
>
    <template #content="{ files, uploadedFiles }"> ... </template>
    <template #empty> ... </template>
    <template #chooseicon> ... </template>
    <template #uploadicon> ... </template>
    <template #cancelicon> ... </template>
</FileUpload>
```

Contratos do PrimeVue que precisam ser replicados:

| Prop / evento / slot PrimeVue | Semântica que precisa ser mantida |
|---|---|
| `name="file"` | Nome do campo no `FormData` (`file`). |
| `:accept` | Atributo `accept` do `<input type="file">`. |
| `:auto` (default `true`) | Se `true`, faz upload imediatamente após seleção; se `false`, só faz upload ao clicar no botão de upload. |
| `:multiple` (default `true`) | Permite selecionar vários arquivos. |
| `:withCredentials="true"` | `xhr.withCredentials = true` (envia cookies). |
| `:disabled` | Desabilita seleção. |
| `:showUploadButton` | Mostra/oculta botão de upload manual. `:showCancelButton="false"` e `:showUploadButton` condicional. |
| `@select` → `onSelectHandler({ files })` | Disparado quando arquivos são escolhidos; `event.files` é `File[]`. |
| `@before-send` → `onBeforeUpload({ xhr, formData })` | ANTES de enviar; permite `xhr.setRequestHeader(...)` e `formData.append(...)`. |
| `@upload` → `onUploadHandler({ xhr })` | No SUCESSO do request; `event.xhr` é o `XMLHttpRequest` com `.response` (string JSON). |
| `@error` → `onError(event)` | Na falha do request. |
| slot `#content="{ files, uploadedFiles }"` | Conteúdo quando há arquivos; recebe `files` (selecionados) e `uploadedFiles` (já enviados). |
| slot `#empty="{ files }"` (implícito: usa `files.length === 0`) | Conteúdo quando vazio. |
| slots `#chooseicon` / `#uploadicon` / `#cancelicon` | Ícones dos botões. |

> **Importante:** o template do PrimeVue expõe `files` e `uploadedFiles` para os slots. No código atual,
> `#content` referencia `files.length` e `uploadedFiles.length`, e `#empty` referencia `files.length`.
> Ao reimplementar, esses valores devem vir do estado interno do novo componente (ver §5).

### 2.2 `ProgressSpinner` — uso no template (linha 27)

```html
<ProgressSpinner style="width: 20px; height: 20px;" animationDuration="2s" />
```

Único uso, dentro do bloco de "Carregando arquivos". Deve virar um spinner CSS de 20×20px com
duração de animação 2s.

### 2.3 Diretiva/estilos acoplados ao PrimeVue

- `v-tooltip` (linha 54): diretiva registrada pelo `install()` da lib (não é import direto do PrimeVue
  aqui). **Manter** — não faz parte desta migração.
- `<Icon .../>` (Iconify, global): componente global do Iconify (`@iconify/vue`), NÃO é PrimeVue.
  **Não** trocar. Já é usado sem import neste arquivo (registrado globalmente).
- **Classes CSS PrimeVue** referenciadas no `<style>` e no JS: `.p-fileupload`, `.p-fileupload-header`,
  `.p-fileupload-file`, `.p-fileupload-content`, `.p-fileupload-cancel-button`, `.p-fileupload-highlight`,
  `.p-button`, `.p-fileupload-choose` (esta última usada no JS em `triggerChoose`, linha 130). Ao
  remover o `FileUpload`, essas classes deixam de existir automaticamente — a nova marcação HTML
  precisa **replicar a estrutura visual** que essas regras produziam (ver §7).

---

## 3. Dependências internas

- **`@maxvue/max-use`** (obrigatório) — fonte em `../MaxUse`. Re-exporta do VueUse:
  - `useDropZone` — `../MaxUse/src/Helpers/VueUse/index.ts:261-262`
    (`export const useDropZone = vueUseCore.useDropZone;`)
  - `useFileDialog` — `../MaxUse/src/Helpers/VueUse/index.ts:285-286`
    (`export const useFileDialog = vueUseCore.useFileDialog;`)
  - Import a adicionar: `import { useDropZone, useFileDialog } from '@maxvue/max-use';`
- **Iconify `<Icon>`** — usado globalmente no template (não importar; já disponível).
- **Vue** — `ref, computed, watch, useAttrs` (linha 80). Serão mantidos; adicionar o que for necessário
  (ex.: `onBeforeUnmount` para abortar XHR pendente).
- **`InputBase`** — este componente **NÃO** usa `InputBase` (confirme: nenhum import de `InputBase.vue`).
  Não introduzir.
- **Stores/helpers da lib** — nenhum usado por este componente.

---

## 4. API pública a preservar

### 4.1 Props (linhas 91–103)

```ts
withDefaults(
    defineProps<{
        token?: string;                       // CSRF -> header X-CSRF-TOKEN
        uploadData?: Record<string, any>;     // pares extras no FormData
        label?: string;                       // rótulo do campo
        responseField?: string;               // campo da resposta que contém os dados do arquivo
    }>(),
    { uploadData: () => ({}), label: '', responseField: 'file' }
);
```

### 4.2 `v-model`

```ts
const modelValue = defineModel<any[]>({ default: () => [] });
```

Array de arquivos já enviados. Cada `onUploadHandler` bem-sucedido faz
`modelValue.value = [...modelValue.value, fileData]`.

### 4.3 Emits (linha 111)

```ts
const emit = defineEmits(['file-click', 'upload-error']);
```

- `file-click` — emitido ao clicar num ícone de arquivo já enviado (template linha 67).
- `upload-error` — emitido em `onError` (linha 158).

### 4.4 Attrs relevantes (via `useAttrs`, `v-bind="attrs"`)

Lidos dinamicamente: `attrs.disabled`, `attrs.accept`, `attrs.auto`, `attrs.multiple`,
`attrs.showUploadButton`, `attrs.uploading`, `attrs['label-disabled']` / `attrs.labelDisabled` /
`attrs.label_disabled`, e os handlers customizados `attrs.onSelect` / `attrs.onUpload`
(usados como override em `onSelectHandler`/`onUploadHandler`).

### 4.5 Slots

- default (rótulo) — usado dentro de `#content` e `#empty`.
- `error` — mensagem de erro (fallback: "Ocorreu um erro ao fazer o upload.").

### 4.6 Métodos/estado expostos usados nos testes (ver §8)

Os testes acessam via `wrapper.vm`: `onError`, `onUploadHandler`, `onSelectHandler`, `onBeforeUpload`,
`triggerChoose`, `files` (ref, `.length`), `showError` (ref, gravável), `uploading` (ref).
**Esses nomes e assinaturas DEVEM ser mantidos** para não quebrar os testes.

### 4.7 Comportamentos observáveis a preservar

- `displayLabel` (computed, linhas 113–117): se desabilitado, usa `label-disabled`/`labelDisabled`/
  `label_disabled`/`props.label`; senão, `props.label`.
- `watch(showError)` (linhas 119–125): ao virar `true`, após 3000ms reseta `showError=false` e
  `files.value=[]`.
- `triggerChoose` (linhas 127–133): abre o seletor de arquivos.
- `onSelectHandler` (linhas 135–139): se `attrs.onSelect`, delega; senão `uploading=true` e
  `files.value=event.files`.
- `onUploadHandler` (linhas 141–153): se `attrs.onUpload`, delega; senão `uploading=false`, faz
  `JSON.parse(event.xhr.response)`, extrai `responseField` (ou resposta inteira) e adiciona ao
  `modelValue`. Erro de parse → `console.error`.
- `onBeforeUpload` (linhas 161–173): se há `xhr`, seta header CSRF (se `token`), faz append de
  `uploadData` e de `extension` (extensão do 1º arquivo) no `formData`.
- `onError` (linhas 155–159): `showError=true`, `uploading=false`, `emit('upload-error', event)`.
- `getFileExtension` (linha 175): lowercase da extensão.
- Ícones de preview por tipo (`pdf`, `jpg/jpeg`, `png`) e thumbnail/`src` (template linhas 66–74).

---

## 5. Estratégia de substituição

Reconstruir o componente em três blocos: (A) seleção via `<input type="file">` + `useFileDialog`,
(B) drag & drop via `useDropZone`, (C) upload manual via `XMLHttpRequest` reproduzindo os eventos
do PrimeVue.

### 5.1 Estado interno (substitui o estado interno do `FileUpload`)

```ts
const files = ref<File[]>([]);          // já existe — selecionados, ainda não enviados
const uploadedFiles = ref<any[]>([]);   // NOVO — equivalente ao uploadedFiles do PrimeVue (enviados nesta sessão)
const uploading = ref(false);           // já existe
const showError = ref(false);           // já existe
const rootRef = ref<HTMLElement | null>(null);   // NOVO — alvo do dropzone
```

> `uploadedFiles` é usado pelo slot `#content` (`uploadedFiles.length`). Pode-se derivá-lo de
> `modelValue` (arquivos confirmados) OU manter uma lista local. Para simplicidade e paridade,
> derive: `const uploadedFilesLen = computed(() => modelValue.value.length)`. O `files.length`
> continua vindo de `files.value.length`.

### 5.2 Seleção de arquivos — `useFileDialog`

```ts
const { open, onChange, reset } = useFileDialog({
    accept: (attrs.accept as string) ?? '.pdf, .jpg, .jpeg, .png, .doc, .docx',
    multiple: (attrs.multiple as boolean) ?? true
});

onChange((selected) => {
    if (!selected || selected.length === 0) return;
    handleSelectedFiles(Array.from(selected));
});
```

- `triggerChoose` passa a chamar `open()` (se não `disabled`), substituindo o hack do
  `.p-fileupload-choose` (linhas 127–133). **Manter o nome `triggerChoose`.**

### 5.3 Drag & drop — `useDropZone`

```ts
const { isOverDropZone } = useDropZone(rootRef, {
    onDrop: (dropped) => {
        if ((attrs.disabled ?? false)) return;
        if (dropped && dropped.length) handleSelectedFiles(dropped);
    },
    // opcional: dataTypes derivado de accept
});
```

- `isOverDropZone` controla a classe de destaque que antes era `.p-fileupload-highlight`
  (ver §7). Aplique a classe condicionalmente quando `isOverDropZone` for `true`.

### 5.4 Função unificada de seleção (mantém eventos)

```ts
const handleSelectedFiles = (selected: File[]) => {
    onSelectHandler({ files: selected });   // mantém contrato @select
    if ((attrs.auto ?? true)) startUpload(selected);
};
```

`onSelectHandler` permanece com a assinatura atual (delegando a `attrs.onSelect` se existir).

### 5.5 Upload via `XMLHttpRequest` (substitui o request interno do PrimeVue)

O `FileUpload` do PrimeVue montava o `FormData` (com o campo `name`), abria um XHR para a URL
(`attrs.url`), aplicava `withCredentials`, disparava `before-send`, e no `load`/`error` chamava
`upload`/`error`. Reproduzir:

```ts
let currentXhr: XMLHttpRequest | null = null;

const startUpload = (toSend: File[]) => {
    if (!toSend.length) return;
    const url = (attrs.url as string) ?? '';   // FileUpload usa attrs.url
    const xhr = new XMLHttpRequest();
    currentXhr = xhr;

    const formData = new FormData();
    const fieldName = (attrs.name as string) ?? 'file';
    if ((attrs.multiple ?? true)) {
        toSend.forEach((f) => formData.append(fieldName, f, f.name));
    } else {
        formData.append(fieldName, toSend[0], toSend[0].name);
    }

    xhr.withCredentials = true;               // :withCredentials="true"
    xhr.open('POST', url, true);

    // @before-send: permite mutar xhr/formData ANTES de open->send.
    // NOTA: setRequestHeader só é válido após open(). Chamamos onBeforeUpload aqui.
    onBeforeUpload({ xhr, formData });

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            onUploadHandler({ xhr });          // @upload
        } else {
            onError({ xhr });                  // @error (status HTTP de erro)
        }
        currentXhr = null;
    };
    xhr.onerror = () => { onError({ xhr }); currentXhr = null; };

    xhr.send(formData);
};

onBeforeUnmount(() => { currentXhr?.abort(); });
```

> **`onBeforeUpload` sem alteração de lógica:** ele já faz `event.xhr.setRequestHeader(...)`,
> `event.formData.append(...)` e adiciona `extension` do `files.value[0]`. Como agora chamamos
> `onSelectHandler` (que seta `files.value`) ANTES de `startUpload`, `files.value[0]` estará
> populado. Mantenha `onBeforeUpload` idêntico.

> **`onUploadHandler` e `onError` sem alteração de lógica.** Continuam recebendo `{ xhr }` /
> `event` e fazendo `JSON.parse(event.xhr.response)` etc.

> **Modo manual (`auto=false`):** quando `showUploadButton` está ativo e `auto` é `false`, o botão
> de upload chama `startUpload(files.value)`. Mantenha o botão de upload (com slot `#uploadicon`)
> ligado a essa ação.

### 5.6 Substituição do `ProgressSpinner`

Trocar `<ProgressSpinner style="width:20px;height:20px" animationDuration="2s" />` por
`<span class="max-spinner" aria-hidden="true"></span>` com CSS (§7.3). Remover o import.

### 5.7 Marcação (template) — nova estrutura

Recriar a raiz e replicar as três "views" (conteúdo, carregando, erro) e a lista de ícones de
arquivos enviados. Preservar TODOS os `v-if/v-else-if` e slots atuais. Esqueleto (mantendo classes
e slots existentes; substituindo o wrapper `<FileUpload>` por HTML nativo):

```html
<div ref="rootRef" class="input-upload-file-main-div" :class="{ 'is-dragover': isOverDropZone }" v-bind="attrs">
    <!-- input nativo oculto (fallback de acessibilidade / seleção) -->
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

    <div class="p-fileupload" :disabled="attrs.disabled ?? false">
        <!-- botão de escolha (equivale ao .p-fileupload-choose) -->
        <button type="button" class="p-button p-fileupload-choose"
                :disabled="attrs.disabled ?? false" @click.stop="triggerChoose">
            <div class="chose-icon-div">
                <Icon icon="line-md:loading-loop" size="2" v-if="uploading" />
                <Icon icon="quill:folder-open" size="2" v-else />
            </div>
        </button>

        <!-- botão de upload manual (quando showUploadButton) -->
        <button type="button" class="p-button" v-if="showUploadButtonComputed"
                v-tooltip="'Enviar arquivo'" @click.stop="startUpload(files)">
            <div class="chose-icon-div">
                <Icon icon="ic:baseline-file-upload" size="2" />
            </div>
        </button>

        <!-- área de conteúdo (equivale ao .p-fileupload-content) -->
        <div class="p-fileupload-content">
            <div @click.stop="triggerChoose" class="label-file-upload"
                 v-if="(files.length > 0 || modelValue.length > 0) && !uploading && !showError && (attrs.uploading === false || attrs.uploading === undefined)">
                <slot><span class="text">{{ displayLabel }}</span></slot>
            </div>
            <div v-else-if="uploading || attrs.uploading">
                <div class="flex" gap-30>
                    <span class="max-spinner" aria-hidden="true"></span>
                    <div>Carregando arquivos</div>
                </div>
            </div>
            <div v-else-if="showError">
                <slot name="error">Ocorreu um erro ao fazer o upload.</slot>
            </div>
            <!-- estado vazio (equivale ao slot #empty) -->
            <div @click.stop="triggerChoose" class="label-file-upload"
                 v-else-if="files.length === 0 && (attrs.uploading === false || attrs.uploading === undefined)">
                <slot><span class="text">{{ displayLabel }}</span></slot>
                <slot name="error" v-if="showError">Ocorreu um erro ao fazer o upload.</slot>
            </div>
        </div>
    </div>

    <!-- lista de arquivos enviados (INALTERADA) -->
    <div class="file-upload-content-div" :disabled="attrs.disabled ?? false">
        <div class="files-icons" v-if="modelValue.length > 0">
            <div v-for="(file, index) in modelValue" :key="file.id || index" class="file-icon" @click="$emit('file-click', file)">
                <Icon icon="ph:file-pdf-light" v-if="getFileExtension(file?.file_name || '') === 'pdf'" size="1.8" p0 />
                <Icon icon="ph:file-jpg-light" v-if="['jpg', 'jpeg'].includes(getFileExtension(file?.file_name || ''))" size="1.8" p0 />
                <Icon icon="ph:file-png-light" v-if="getFileExtension(file?.file_name || '') === 'png'" size="1.8" />
                <Icon icon="fa:check-circle" class="file-check" size="0.7" />
                <img :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src" alt="Image" v-show="!file.file_name" />
            </div>
        </div>
    </div>
</div>
```

> **Atenção `v-bind="attrs"` duplicado:** o fonte atual faz `v-bind="attrs"` tanto na `<div>` raiz
> (linha 2) quanto no `<FileUpload>` (linha 6). Como agora há só a `<div>` raiz, mantenha um único
> `v-bind="attrs"` na raiz. Evite vincular handlers de eventos (`onSelect`/`onUpload`) como atributos
> DOM — extraia-os antes (ex.: computar um objeto `attrs` sem as chaves de handler para o `v-bind`,
> ou usar `inheritAttrs: false` + bind explícito). Preferir manter comportamento: os handlers
> continuam sendo lidos via `attrs.onSelect` / `attrs.onUpload` dentro das funções, não no template.

Helper de leitura para o botão de upload:

```ts
const showUploadButtonComputed = computed(() =>
    attrs.showUploadButton !== undefined && attrs.showUploadButton !== false
);
```

Handler do `<input type="file">` nativo (para quem prefere o input a `useFileDialog`; ambos podem
coexistir, mas evite disparo duplo — use apenas um caminho de seleção):

```ts
const onNativeInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length) handleSelectedFiles(Array.from(target.files));
    target.value = '';   // permite reselecionar o mesmo arquivo
};
```

> Decisão recomendada: usar `useFileDialog` como caminho principal (o `<input>` fica como fallback
> oculto e/ou é dispensável). Documente a escolha no PR. O importante é NÃO disparar `onSelectHandler`
> duas vezes.

---

## 6. Passos de implementação

1. **Ler os fontes:** este plano, `src/components/MaxInputFileUpload.vue`,
   `tests/components/MaxInputFileUpload.test.ts` e (para exports do max-use)
   `../MaxUse/src/Helpers/VueUse/index.ts` (linhas 261–262 e 285–286).
2. **Trocar imports:** remover `import FileUpload from 'primevue/fileupload';` e
   `import ProgressSpinner from 'primevue/progressspinner';`. Adicionar
   `import { useDropZone, useFileDialog } from '@maxvue/max-use';` e incluir `onBeforeUnmount`
   (e, se necessário, `inheritAttrs`) nos imports de `vue`.
3. **Adicionar estado novo:** `rootRef`, `nativeInputRef`, `uploadedFiles`/`uploadedFilesLen`,
   `currentXhr`, `showUploadButtonComputed`. Manter `files`, `uploading`, `showError` como estão.
4. **Configurar `useFileDialog`** (accept/multiple a partir de `attrs`) e `onChange` →
   `handleSelectedFiles`.
5. **Configurar `useDropZone(rootRef, { onDrop })`** com guarda de `disabled`.
6. **Implementar `handleSelectedFiles`** (chama `onSelectHandler` e, se `auto`, `startUpload`).
7. **Implementar `startUpload`** com `XMLHttpRequest` reproduzindo `withCredentials`,
   `before-send` (via `onBeforeUpload`), `upload` (via `onUploadHandler`), `error` (via `onError`).
   Adicionar `onBeforeUnmount` para `abort`.
8. **Reescrever `triggerChoose`** para `open()` (respeitando `disabled`). Manter o nome.
9. **Manter INALTERADAS** as funções: `onSelectHandler`, `onUploadHandler`, `onBeforeUpload`,
   `onError`, `getFileExtension`, `displayLabel`, `watch(showError)`. (Ajuste só o necessário para
   receber `{ xhr }`/`{ files }` — que já são os formatos usados.)
10. **Reescrever o template** conforme §5.7, replicando estados e slots; trocar `ProgressSpinner`
    pelo `<span class="max-spinner">`.
11. **Ajustar o `<style>`**: adaptar seletores `.p-fileupload*` para a nova marcação (§7) e adicionar
    o CSS do `.max-spinner` e do `.is-dragover`/highlight. Manter todas as variáveis CSS e valores.
12. **Rodar verificações** (§8): type-check, testes do componente (os 3 arquivos de teste), lint.
13. **Manifest do resolver:** NÃO é necessário regenerar (nenhum arquivo `.vue` novo é adicionado).

---

## 7. Estilos

O `<style lang="scss">` atual (linhas 178–378) depende de classes do PrimeVue. Estratégia:
**manter a folha de estilo praticamente igual**, pois a nova marcação (§5.7) reusa deliberadamente as
mesmas classes (`.p-fileupload`, `.p-fileupload-content`, `.p-button`, `.chose-icon-div`,
`.label-file-upload`, `.file-upload-content-div`, `.files-icons`, `.file-icon`, `.file-check`).
Assim, o visual é preservado sem reescrever o SCSS.

### 7.1 Classes que somem e precisam de ajuste

- `.p-fileupload-header`, `.p-fileupload-file`, `.p-fileupload-cancel-button` — eram estruturas internas
  do PrimeVue. Suas regras (esconder `span`, `display:none` no file, etc.) podem ser **removidas** com
  segurança, pois esses elementos deixam de existir. NÃO removê-las também é inofensivo (seletores
  órfãos), mas prefira limpar para clareza.
- `.p-fileupload-highlight` (linhas 371–377) — era o overlay de drag&drop do PrimeVue. Reaproveitar o
  MESMO conjunto de regras aplicando-o à classe `.is-dragover` (ou renderizar um `<div class="p-fileupload-highlight">`
  quando `isOverDropZone`). Manter os valores (position absolute, top/left 0, width 100%,
  border-radius `calc(1rem - 5px)`).

### 7.2 Regras que devem permanecer idênticas

Todo o restante do `<style>` (grid do `.p-fileupload`, dimensões dos `.p-button` 30×30,
`background-color: var(--primary-c)`, hover `var(--primary-mouse)`, `.label-file-upload` com
`color: var(--background-600)` e hover `var(--blue-700)`, `.file-upload-content-div` com
`pointer-events`, `.files-icons`, `.file-icon`, `.file-check`, etc.) deve ser preservado
byte-a-byte na medida do possível. **Não** alterar nenhuma variável CSS (`--primary-c`, `--text-b`,
`--background-400/600`, `--blue-600/700`, `--green-b-800`, `--icon-mouse`, `--primary-mouse`,
`--text-c`).

### 7.3 Spinner CSS (substitui `ProgressSpinner`)

Adicionar ao `<style>` (20×20px, animação 2s, como o `animationDuration="2s"` original):

```scss
.max-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 2px solid var(--background-300);
    border-top-color: var(--primary-c);
    border-radius: 50%;
    animation: max-spinner-rotate 2s linear infinite;
}

@keyframes max-spinner-rotate {
    to { transform: rotate(360deg); }
}
```

### 7.4 Input nativo oculto

```scss
.max-file-native-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
    clip: rect(0 0 0 0);
}
```

---

## 8. Testes / verificação

Existem **três** arquivos de teste que exercitam este componente:

- `tests/components/MaxInputFileUpload.test.ts` (lido — ver detalhes abaixo)
- `tests/components/MaxInputFileUploadBig.test.ts`
- `tests/components/MaxInputFileUploadButton.test.ts`

### 8.1 Contratos verificados por `MaxInputFileUpload.test.ts` (NÃO quebrar)

- Monta com `stubs: { FileUpload: true, Icon: true, ProgressSpinner: true }`. **PROBLEMA:** após a
  migração não haverá mais `FileUpload`/`ProgressSpinner`. Stubs para componentes inexistentes são
  **inofensivos** (Vue Test Utils simplesmente ignora stubs que não correspondem a nada renderizado),
  então os testes que só chamam métodos via `wrapper.vm` continuam válidos.
- `wrapper.vm.onError(event)` → emite `upload-error`. **Manter.**
- `wrapper.vm.onUploadHandler({ xhr: { response: JSON.stringify({ file: {...} }) } })` → emite
  `update:modelValue`; e branch de JSON inválido (`console.error`). **Manter assinatura `{ xhr }`.**
- `wrapper.vm.onSelectHandler({ files: [...] })` → `files.length === 1`. **Manter.**
- `wrapper.vm.onBeforeUpload({ xhr: { setRequestHeader }, formData: { append } })` → seta header
  `X-CSRF-TOKEN` com `token`, faz `append('key1','value1')` e `append('extension','pdf')`. **Manter
  lógica idêntica** (o teste depende de `files.value[0].name` ter sido setado por `onSelectHandler`).
- `wrapper.vm.triggerChoose()` — só precisa existir e não lançar. Novo corpo (`open()`) satisfaz.
- Teste "covers all slots" usa um stub de `FileUpload` que renderiza os slots `#content`/`#empty`/
  `#chooseicon`/`#uploadicon`/`#cancelicon`. **Após a migração esses slots viram markup direto** (não
  há mais componente `FileUpload`), então esse stub não renderiza nada — mas o teste só valida
  chamadas de método (`onSelectHandler`, `onBeforeUpload`, `triggerChoose`), que continuam passando.
  Se algum `expect` de renderização de slot falhar, atualizar o teste é permitido (o objetivo é
  preservar API/estilos/comportamento, não a árvore de stubs do PrimeVue).
- Teste "showError true branches" — grava `wrapper.vm.showError = true`, roda timers e espera
  `showError === false` (watch de 3000ms). **Manter `watch(showError)` idêntico.**
- Teste "custom events" — passa `attrs.onSelect`/`attrs.onUpload`; `onSelectHandler`/`onUploadHandler`
  devem delegar. **Manter os early-returns `if (attrs.onSelect)` / `if (attrs.onUpload)`.**

> **Regra:** priorizar manter os testes passando SEM alterá-los. Se um `expect` depender
> exclusivamente da estrutura interna do `FileUpload` do PrimeVue (impossível de manter), ajustar
> apenas esse `expect` — documentando no PR — sem enfraquecer a cobertura dos comportamentos públicos.

### 8.2 Comandos

```bash
npm run type-check
npx vitest run tests/components/MaxInputFileUpload.test.ts
npx vitest run tests/components/MaxInputFileUploadBig.test.ts
npx vitest run tests/components/MaxInputFileUploadButton.test.ts
npm run lint
```

Verificação manual (playground): `npm run dev:playground` — selecionar arquivo, arrastar & soltar,
ver spinner de carregamento, upload automático (`auto=true`), upload manual (`auto=false` +
`showUploadButton`), estado de erro (3s de auto-reset), lista de arquivos enviados com ícones por
tipo e clique (`file-click`), estado `disabled`.

### 8.3 `tests/setup.ts` (contexto)

O setup global mocka `fetch`, `localStorage`, `getComputedStyle`, `indexedDB`, `virtual:uno.css`,
provê PrimeVue + Pinia e stuba `v-tooltip`/`v-maska`. Isso já cobre `v-tooltip` no template.
`useDropZone`/`useFileDialog` do VueUse funcionam em `happy-dom`; se algum teste exercitar o
dropzone diretamente e falhar por API de DOM ausente, mockar pontualmente.

---

## 9. Skills necessárias (caminho + justificativa)

1. **`.claude/skills/vue-uppy-file-upload-best-practices/SKILL.md`**
   Justificativa: é a skill de referência do repo para uploads client-side em Vue 3 (drag & drop,
   handlers de eventos de upload, barras de progresso, `FormData`, integração com endpoints AdonisJS
   via `@maxvue/max-use`). Fornece o padrão de ciclo de vida (`onBeforeUnmount` para liberar recursos)
   e o contrato de eventos de upload que estamos reproduzindo manualmente com `XMLHttpRequest`.
   (Nota: aqui NÃO usamos Uppy — reimplementamos com input nativo + VueUse — mas os padrões de
   handlers, progresso e `FormData` da skill são diretamente aplicáveis.)

2. **`.claude/skills/vue-max-use-development-best-practices/SKILL.md`**
   Justificativa: cobre o uso correto dos composables re-exportados por `@maxvue/max-use`
   (`useDropZone`, `useFileDialog` são referenciados nesta skill), a origem VueUse e as convenções de
   import a partir de `@maxvue/max-use`.

3. **`.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md`**
   Justificativa: convenções específicas desta lib (`<script setup lang="ts">`, indentação de 4
   espaços, aspas simples, ponto-e-vírgula, ordem Template→Script→Style, uso de variáveis CSS do tema
   Max) exigidas pelo `CLAUDE.md`.

4. **`.claude/skills/vue-vitest-testing-best-practices/SKILL.md`**
   Justificativa: para atualizar/validar os três arquivos de teste do componente com Vitest +
   `@vue/test-utils` preservando a cobertura dos comportamentos públicos.

5. **`.claude/skills/vue-unocss-styling-best-practices/SKILL.md`** (auxiliar)
   Justificativa: o template usa utilitários UnoCSS custom (`gap-30`, `p0`, `flex`) definidos no preset
   Max; útil ao ajustar a marcação sem introduzir classes inválidas.

---

## 10. Riscos e pontos de atenção

1. **Request XHR real:** o maior risco. O PrimeVue montava e enviava o request internamente. Ao
   reimplementar com `XMLHttpRequest`, é preciso descobrir a URL do endpoint — o `FileUpload` usa
   `attrs.url`. Confirme com os consumidores que a URL é passada via prop `url` (é o padrão PrimeVue).
   Se algum consumidor dependia de outros props do `FileUpload` (`method`, `maxFileSize`,
   `fileLimit`, `chooseLabel`, etc.), avaliar caso a caso — a maioria vai por `v-bind="attrs"`.
2. **`before-send` — ordem `open()` antes de `setRequestHeader`:** `xhr.setRequestHeader` só é válido
   APÓS `xhr.open()`. Garanta que `onBeforeUpload` seja chamado após `open()` e antes de `send()`.
3. **Disparo duplo de seleção:** usar simultaneamente o `<input type="file">` nativo (evento `change`)
   E `useFileDialog` pode disparar `onSelectHandler` duas vezes. Escolher UM caminho principal.
4. **`v-bind="attrs"` com handlers:** `attrs.onSelect`/`attrs.onUpload`/`attrs.onError` fazem parte de
   `attrs`. Fazer `v-bind="attrs"` na raiz pode "bindar" handlers como listeners DOM inesperados.
   Preferir `inheritAttrs: false` + bind explícito, mantendo a leitura dos handlers dentro das funções
   (como já é feito). Cuidado para não regredir o comportamento de override de `onSelect`/`onUpload`.
5. **`showUploadButton` / `auto=false` (modo manual):** garantir que o botão de upload manual continue
   funcionando e que `startUpload` use `files.value` corrente. Cobrir pelo teste
   `MaxInputFileUploadButton.test.ts`.
6. **`uploadedFiles` no slot `#content`:** o slot original recebia `uploadedFiles` do PrimeVue. Ao
   migrar, derivar de `modelValue` (`modelValue.length`). Verificar que as condições
   `(files.length > 0 || uploadedFiles.length > 0)` continuem semanticamente equivalentes usando
   `modelValue.length`.
7. **Estados `attrs.uploading` vs `uploading` (ref):** o template mistura ambos (prop externa e estado
   interno). Preservar as duas fontes exatamente como estão nas condições `v-if`/`v-else-if`.
8. **Reset após erro:** `watch(showError)` limpa `files` após 3s. Não esquecer de resetar também o
   `useFileDialog` (`reset()`) e o `value` do `<input>` para permitir reselecionar o mesmo arquivo.
9. **`p0` / `gap-30` (UnoCSS custom):** manter as classes utilitárias exatamente como no fonte para
   não alterar espaçamentos.
10. **Acessibilidade do spinner:** `ProgressSpinner` do PrimeVue tinha ARIA; o `.max-spinner` é
    decorativo (`aria-hidden`), acompanhado do texto "Carregando arquivos" — aceitável e mais simples.
11. **Testes com stubs de `FileUpload`/`ProgressSpinner`:** deixam de corresponder a algo real. Não
    removê-los quebra nada, mas os `expect` que dependiam da árvore de slots do stub podem precisar de
    ajuste pontual (§8.1).
