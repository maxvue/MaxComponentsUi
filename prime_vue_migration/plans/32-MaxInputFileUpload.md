# Plano 32 — `MaxInputFileUpload` (substitui `FileUpload` + `ProgressSpinner`)

| | |
|---|---|
| **id** | 32 |
| **Arquivo** | `src/components/MaxInputFileUpload.vue` |
| **Primitivas eliminadas** | `FileUpload`, `ProgressSpinner` |
| **Depende de** | 3 (`MaxBaseSpinner`) |
| **Teste existente** | `tests/components/MaxInputFileUpload.test.ts` |

> **Vantagem enorme:** os três irmãos — `MaxInputFileUploadBig.vue`,
> `MaxInputFileUploadButton.vue` e `MaxInputFileProject.vue` — **já são PrimeVue-free**
> e já implementam seleção de arquivo, drag & drop e preview. Leia os três antes de
> escrever qualquer linha. Este item é mais "alinhar ao padrão da casa" do que
> "reimplementar do zero".

---

## 1. O `FileUpload` do PrimeVue 4

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `mode` | `'basic' \| 'advanced'` | `'advanced'` | básico = só botão; avançado = painel com lista |
| `multiple` | `boolean` | `false` | múltiplos arquivos |
| `accept` | `string` | — | filtro MIME |
| `maxFileSize` | `number` | — | tamanho máximo (bytes) |
| `fileLimit` | `number` | — | quantidade máxima |
| `auto` | `boolean` | `false` | envia ao selecionar |
| `customUpload` | `boolean` | `false` | delega o envio via `uploader` |
| `url` | `string` | — | endpoint |
| `withCredentials` | `boolean` | `false` | envia cookies |
| `invalidFileSizeMessage` | `string` | | mensagem de erro |
| `invalidFileLimitMessage` | `string` | | mensagem de erro |
| `showUploadButton` / `showCancelButton` | `boolean` | `true` | botões |
| `previewWidth` | `number` | `50` | largura da miniatura |

### Eventos

`select`, `before-upload`, `progress`, `upload`, `error`, `clear`, `remove`,
`uploader` (quando `customUpload`), `before-send`, `remove-uploaded-file`.

### Slots
`header`, `content`, `empty`, `filelabel`.

---

## 2. Levantamento obrigatório

```bash
sed -n '1,120p' src/components/MaxInputFileUpload.vue
grep -rn "MaxInputFileUpload\b" src/ playground/
```

Registre em `notas`: qual `mode` é usado? há upload real (`url`/`customUpload`) ou o
componente só seleciona e devolve os `File`s ao pai? Quais eventos o consumidor escuta?

**Isso muda drasticamente o escopo.** Se o componente só seleciona arquivos e emite
`update:modelValue`, você não precisa implementar XHR, progresso nem retry — e os irmãos
já migrados provavelmente fazem exatamente isso.

---

## 3. Implementação

### Base

```vue
<template>
    <InputBase v-bind="props">
        <div
            class="p-fileupload max-file-upload"
            :class="{ 'p-fileupload-highlight': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
        >
            <input
                ref="fileInputRef"
                type="file"
                class="p-fileupload-input"
                :multiple="props.multiple"
                :accept="props.accept"
                :disabled="props.disabled"
                @change="onFileSelect"
            />

            <button type="button" @click="fileInputRef?.click()">Escolher arquivo</button>

            <ul class="p-fileupload-file-list" v-if="files.length">
                <li v-for="(file, i) in files" :key="file.name + i">
                    <img v-if="isImage(file)" :src="previewUrl(file)" :width="props.previewWidth" alt="" />
                    <span>{{ file.name }}</span>
                    <span>{{ formatSize(file.size) }}</span>
                    <button type="button" :aria-label="`Remover ${file.name}`" @click="remove(i)">×</button>
                </li>
            </ul>

            <MaxBaseSpinner v-if="uploading" />
        </div>
    </InputBase>
</template>
```

### Validação

```ts
const validate = (file: File): string | null => {
    if (props.maxFileSize && file.size > props.maxFileSize) {
        return props.invalidFileSizeMessage ?? `${file.name}: arquivo maior que ${formatSize(props.maxFileSize)}.`;
    }
    if (props.accept && !matchesAccept(file, props.accept)) {
        return `${file.name}: tipo de arquivo não permitido.`;
    }
    return null;
};
```

> `accept` aceita extensões (`.pdf`), MIME completo (`image/png`) e wildcard
> (`image/*`). Trate os três — validar só por MIME rejeita arquivos legítimos cujo
> `type` o navegador não detectou (vem como string vazia).

### ⚠️ Vazamento de `Object URL`

```ts
const urls = new Map<File, string>();
const previewUrl = (file: File) => {
    if (!urls.has(file)) urls.set(file, URL.createObjectURL(file));
    return urls.get(file)!;
};

// obrigatório
const revokeAll = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls.clear(); };
onBeforeUnmount(revokeAll);
// e revogue individualmente ao remover um arquivo
```

Sem `revokeObjectURL`, cada preview de imagem segura o arquivo inteiro em memória até o
reload da página. Num formulário com várias imagens grandes, isso é um vazamento sério.

### Acessibilidade

- o `<input type="file">` real deve permanecer focável (esconda com
  `opacity: 0; position: absolute`, **não** com `display: none` — este remove do
  fluxo de foco);
- a área de drop precisa de instrução textual, não só ícone;
- erros de validação devem ir para uma região `aria-live="polite"`;
- botões de remoção com `aria-label` incluindo o nome do arquivo.

---

## 4. Teste

1. renderiza o input de arquivo e o botão;
2. selecionar arquivo emite `select` com os `File`s;
3. `multiple: false` aceita apenas um;
4. arquivo acima de `maxFileSize` é rejeitado com mensagem;
5. arquivo fora do `accept` é rejeitado (teste extensão, MIME e wildcard);
6. `fileLimit` limita a quantidade;
7. drag & drop adiciona arquivos;
8. `dragover` aplica a classe de destaque; `dragleave` remove;
9. remover um arquivo o tira da lista e emite `remove`;
10. `clear` esvazia e emite;
11. spinner aparece durante o upload (se houver upload);
12. **`URL.revokeObjectURL` é chamado** ao remover e ao desmontar (espione a função);
13. `disabled` impede seleção e drop;
14. mensagens de erro em região `aria-live`.

---

## 5. Checklist

- [ ] Irmãos já migrados lidos e padrão seguido
- [ ] Escopo real (com/sem upload) registrado em `notas`
- [ ] Sem PrimeVue
- [ ] `accept` trata extensão, MIME e wildcard
- [ ] `revokeObjectURL` chamado (teste 12) — sem vazamento
- [ ] `<input type="file">` focável (não `display: none`)
- [ ] `type-check`, `lint`, `test` OK
