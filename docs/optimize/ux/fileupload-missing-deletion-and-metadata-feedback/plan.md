# Plano de Implementação: Impossibilidade de Remover Arquivos e Ausência de Metadados no Upload (`MaxInputFileUpload`)

## 1. Diagnóstico e Objetivo

No componente [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue), cada arquivo anexado em `modelValue` é renderizado exclusivamente como um pequeno ícone genérico (`.file-icon`) com um selo de check verde, sem qualquer identificador textual.
1. **Ausência de Remoção:** Não existe botão de exclusão ou remoção de arquivo. Uma vez adicionado um arquivo incorreto ou duplicado, o usuário não consegue removê-lo da lista `modelValue`.
2. **Omissão de Metadados:** O nome original do arquivo e seu tamanho (KB/MB) não são exibidos em lugar nenhum da interface. Múltiplos arquivos do mesmo tipo aparecem com ícones idênticos, impedindo distinção.
3. **Ícones Quebrados para Documentos Comuns:** O atributo `accept` inclui `.doc, .docx`, e formatos como `.xlsx`, `.csv` e `.zip` são rotineiros, mas o template trata apenas `pdf`, `jpg` e `png`, deixando outros formatos sem ícone visível.

**Objetivo:**
1. Implementar botão de remoção individual com confirmação opcional e emissão de eventos `@delete` e `@remove-file`, atualizando o `modelValue`.
2. Exibir nome do arquivo (com truncamento legível) e tamanho formatado (em B, KB, MB) via tooltip ou texto explicativo.
3. Expandir o catálogo de ícones de arquivo para cobrir formatos de texto, planilhas, arquivos compactados e fornecer ícone genérico de fallback (`ph:file-light` / `solar:document-outline`).

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue): inclusão do botão de exclusão, suporte a metadados, catálogo de ícones e formatação de tamanho.
- [`tests/components/MaxInputFileUpload.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputFileUpload.test.ts): novos testes para remoção de itens, emissão de eventos e fallbacks de extensão.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Novas Props, Eventos e Helpers em `MaxInputFileUpload.vue`

Props e emits:

```ts
const props = withDefaults(
    defineProps<{
        /** Token CSRF para autenticação no upload */
        token?: string;
        /** Dados adicionais para enviar via FormData no upload */
        uploadData?: Record<string, any>;
        /** Rótulo descritivo do campo */
        label?: string;
        /** Campo da resposta da API que contém os dados do arquivo */
        responseField?: string;
        /** Permite remover arquivos já selecionados da lista */
        removable?: boolean;
        /** Exibe metadados (nome e tamanho) dos arquivos */
        showMetadata?: boolean;
    }>(),
    {
        uploadData: () => ({}),
        label: '',
        responseField: 'file',
        removable: true,
        showMetadata: true
    }
);

const emit = defineEmits<{
    'file-click': [file: any];
    'upload-error': [error: any];
    'upload': [event: any];
    'select': [event: any];
    'delete': [payload: { file: any; index: number }];
    'remove-file': [payload: { file: any; index: number }];
}>();
```

Funções utilitárias de extensão, ícone e tamanho de arquivo:

```ts
const getFileName = (file: any): string => {
    return file?.name ?? file?.file_name ?? file?.fileName ?? 'Arquivo sem nome';
};

const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes <= 0 || isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const resolveFileIcon = (fileName: string): string => {
    const ext = getFileExtension(fileName);
    if (ext === 'pdf') return 'ph:file-pdf-light';
    if (['jpg', 'jpeg'].includes(ext)) return 'ph:file-jpg-light';
    if (ext === 'png') return 'ph:file-png-light';
    if (['doc', 'docx'].includes(ext)) return 'ph:file-doc-light';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'ph:file-xls-light';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'ph:file-zip-light';
    if (['txt', 'md'].includes(ext)) return 'ph:file-text-light';
    return 'ph:file-light';
};

const removeFile = (index: number, file: any) => {
    if (attrs.disabled) return;
    const updated = [...modelValue.value];
    updated.splice(index, 1);
    modelValue.value = updated;
    emit('delete', { file, index });
    emit('remove-file', { file, index });
};
```

### 3.2. Template Atualizado da Lista de Arquivos

Substituir o bloco `.files-icons` por:

```html
<div class="file-upload-content-div" :disabled="attrs.disabled ?? false">
    <div class="files-icons" v-if="modelValue.length > 0">
        <div
            v-for="(file, index) in modelValue"
            :key="file.id || index"
            class="file-icon"
            v-tooltip="props.showMetadata ? `${getFileName(file)} ${formatFileSize(file?.size) ? '(' + formatFileSize(file?.size) + ')' : ''}` : null"
            @click="$emit('file-click', file)"
        >
            <button
                v-if="props.removable && !attrs.disabled"
                type="button"
                class="file-remove-btn"
                aria-label="Remover arquivo"
                @click.stop="removeFile(index, file)"
            >
                <Icon icon="solar:close-circle-bold" size="0.9" />
            </button>

            <img
                :src="file?.thumbnail ? `/media/thumbnails/${file.thumbnail}` : file?.src"
                :alt="getFileName(file)"
                class="file-thumb"
                v-if="file?.thumbnail || (file?.src && !file.file_name)"
            />
            <Icon
                :icon="resolveFileIcon(getFileName(file))"
                size="1.8"
                v-else
            />

            <Icon icon="fa:check-circle" class="file-check" size="0.7" />

            <div class="file-info-label" v-if="props.showMetadata">
                <span class="file-name-text">{{ getFileName(file) }}</span>
                <span class="file-size-text" v-if="formatFileSize(file?.size)">{{ formatFileSize(file?.size) }}</span>
            </div>
        </div>
    </div>
</div>
```

### 3.3. Estilização SCSS Scoped

```scss
<style lang="scss" scoped>
.input-upload-file-main-div {
    .file-upload-content-div {
        position: absolute;
        top: 0;
        height: 100%;
        right: 0;
        display: flex;
        align-items: center;
        width: auto;
        pointer-events: none;

        .files-icons {
            display: flex;
            align-items: center;
            width: auto;
            gap: 14px;
            padding: 0 10px;
            height: 100%;
            pointer-events: auto;

            .file-icon {
                position: relative;
                min-width: 36px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.15s ease;

                &:hover {
                    .icon-div {
                        color: var(--blue-600) !important;
                    }

                    .file-remove-btn {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .file-thumb {
                    max-width: 32px;
                    max-height: 32px;
                    object-fit: cover;
                    border-radius: 4px;
                }

                .file-check {
                    position: absolute;
                    color: var(--green-600, #16a34a) !important;
                    bottom: -2px;
                    left: -2px;
                    width: 14px;
                    height: 14px;
                    background: var(--background-0, #fff);
                    border-radius: 50%;
                }

                .file-remove-btn {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: transparent;
                    border: none;
                    padding: 0;
                    cursor: pointer;
                    color: var(--red-500, #ef4444);
                    opacity: 0.8;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2;
                    transition: all 0.15s ease;

                    &:hover {
                        color: var(--red-700, #b91c1c);
                        transform: scale(1.15);
                    }
                }

                .file-info-label {
                    display: none; // Exibição primária via v-tooltip para economizar espaço horizontal no input
                }
            }
        }
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- O fluxo de envio automático (`auto: true`), eventos de progresso e listeners já existentes (`@file-click`, `@select`, `@upload`, `@upload-error`) continuam intactos.
- As novas props `removable` e `showMetadata` possuem valores padrão verdadeiros (`true`), fornecendo usabilidade imediata sem requerer alteração de chamadas existentes. Se uma tela precisar desativar a remoção, basta declarar `:removable="false"`.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. Cada arquivo exibido na lista apresenta um botão de remoção no canto superior direito.
2. Clicar no botão de remoção remove o item de `modelValue` e emite os eventos `@delete` e `@remove-file` com `{ file, index }`.
3. Arquivos com extensões `.doc`, `.docx`, `.xlsx`, `.zip` e `.txt` exibem seus respectivos ícones dedicados, e extensões desconhecidas utilizam o fallback `ph:file-light`.
4. O componente exibe tooltip com o nome do arquivo e tamanho formatado ao posicionar o ponteiro sobre o ícone do arquivo.

### 5.2. Comandos de Validação
```bash
# Verificação estrita de tipagem
npm run type-check

# Testes automatizados do FileUpload
npx vitest run tests/components/MaxInputFileUpload.test.ts
```
