# Plano de Implementação — Issue #81

## Descrição e Causa Raiz

### Problema
No catálogo oficial de componentes da biblioteca ([`COMPONENTS.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/COMPONENTS.md#L921-L940), linhas 921 a 940), o componente `MaxInputFile` está documentado como uma funcionalidade completa e ativa da biblioteca:
- **Descrição oficial:** "Área de **seleção de arquivos** com drag-and-drop, drop zone e suporte a **colagem (Ctrl+V)**. Exibe pré-visualização dos arquivos selecionados (imagens com thumbnail, demais com ícone + tamanho)."
- **Props públicas declaradas:** `modelValue: File[]` (padrão `[]`), `label: string` (texto descritivo da dropzone).
- **Atributos especiais:** `no-view` / `no-preview` (ocultar pré-visualizações), `size-files` / `size-preview` (`'mini'` para exibição compacta de ícones).
- **Eventos:** `update:modelValue`.
- **Slots:** `button` (área de clique/drop) e `filesPreview` (lista de pré-visualização customizada).

Entretanto, ao inspecionar a implementação real em [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue#L1-L8), constata-se que o componente é uma casca completamente vazia:
```vue
<template>

</template>
<script setup lang="ts">


</script>

<style lang="scss">
...
```
O componente não possui template (renderiza zero nós DOM), não declara props, não possui emits, não lida com drag-and-drop, nem com colagem Ctrl+V, nem com abertura de arquivo. Curiosamente, as linhas 9 a 113 contêm 104 linhas de regras residuais em SCSS (`.input-file-main-div`, `.input-file-content`, `.files-list-mini`, `.files-list-preview`, `.drop-zone-div`), que foram mantidas órfãs no arquivo sem qualquer elemento correspondente.

Além disso, na suíte de testes em [`tests/components/MaxInputFile.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/tests/components/MaxInputFile.test.ts#L11-L15), existe um teste que atesta e congela esse comportamento quebrado:
```typescript
it('não renderiza nenhum conteúdo (template vazio, componente sem lógica)', () => {
    const wrapper = mount(MaxInputFile);
    expect(wrapper.html()).toBe('');
    expect(wrapper.findAll('*').length).toBe(0);
});
```

A biblioteca continua exportando `MaxInputFile` em [`src/index.ts:100`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/index.ts#L100) e no manifesto [`src/components-manifest.json:44,378-383`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components-manifest.json#L44), bem como listando-o no [`README.md:153`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/README.md#L153). Qualquer desenvolvedor que consulta o catálogo e utiliza `<MaxInputFile>` depara-se com um elemento fantasma sem nenhuma indicação ou funcionalidade.

### Causa Raiz Comprovada
- **Localização Exata:**
  - Código-fonte esvaziado: [`src/components/MaxInputFile.vue:1-8`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue#L1-L8).
  - Documentação canônica divergente: [`COMPONENTS.md:921-940`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/COMPONENTS.md#L921-L940).
  - Teste falso/reforçador de no-op: [`tests/components/MaxInputFile.test.ts:11-15`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/tests/components/MaxInputFile.test.ts#L11-L15).
- **Histórico de Commits e Origem da Falha:**
  1. No commit `3824e5389e7cee15ba6b85c95986a6cb6279cbe2` (*feat: atualizando componentes*, 2026-05-25), uma edição ampla em 10 componentes apagou inadvertidamente todo o `<template>` e `<script setup>` de `MaxInputFile.vue` (111 linhas deletadas), mantendo as regras SCSS órfãs. Antes desse commit (no hash `fa7a0597`), o componente possuía a estrutura exata documentada em `COMPONENTS.md`.
  2. No commit `b6abcebfd072e6dfb92558a5be1da5402704370b` (*test: fortalece testes superficiais de MaxInputFileUploadBig e reforca no-ops (achado 32)*, 2026-08-10), ao auditar testes superficiais, o autor assumiu erroneamente que `MaxInputFile.vue` era um stub intencional (junto com `MaxTableColumn` e `MaxTextInputFloatLabel`) e adicionou o teste `não renderiza nenhum conteúdo (template vazio, componente sem lógica)`, chancelando a casca vazia na suíte de testes em vez de restaurar o código e alinhar com `COMPONENTS.md`.
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  - Aplicação consumidora declara: `<MaxInputFile v-model="arquivos" label="Selecione arquivos" />` conforme o contrato de `COMPONENTS.md:921-940`.
  - O resolver/bundler importa `src/components/MaxInputFile.vue` através de `src/index.ts`.
  - Vue monta o SFC: o render function resulta em nó de comentário ou vazio (`wrapper.html() === ''`).
  - Nenhum seletor de arquivos é exibido, o evento de drag-and-drop não é configurado, os eventos de paste no `window` não são escutados, o `v-model` não é atualizado, e nenhuma pré-visualização é renderizada.
  - Resultado: Falha silenciosa total na interface do usuário.

---

## Arquivos Afetados

1. [`src/components/MaxInputFile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/src/components/MaxInputFile.vue) — Restauração e implementação completa do componente conforme a documentação oficial:
   - Inclusão do `<input type="file">` invisível com acionamento por clique no container ou botão;
   - Implementação da drop zone reativa com `useDropZone` de `@maxvue/max-use`;
   - Implementação de captura de arquivos/imagens via colagem (Ctrl+V) com `useEventListener(window, 'paste')`;
   - Implementação das props públicas `modelValue: File[]` e `label?: string` com suporte a `update:modelValue`;
   - Suporte aos atributos especiais `no-view` / `no-preview` e `size-files` / `size-preview`;
   - Suporte aos slots `button` e `filesPreview`;
   - Gerenciamento de ciclo de vida das Object URLs (`URL.createObjectURL` e `URL.revokeObjectURL`) para prevenir vazamentos de memória (memory leaks);
   - Integração perfeita com os estilos SCSS pré-existentes no arquivo.
2. [`tests/components/MaxInputFile.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-81/tests/components/MaxInputFile.test.ts) — Reescrita completa da suíte de testes:
   - Remoção do teste obsoleto que exigia retorno HTML vazio;
   - Criação de testes unitários abrangentes cobrindo montagem, renderização do label padrão e customizado, emissão de `update:modelValue`, clique para abrir input file, drag-and-drop, colagem Ctrl+V, atributos `no-view` / `no-preview`, atributos `size-files="mini"` e customização via slots.

---

## Execuções Propostas

### 1. Implementação de `src/components/MaxInputFile.vue`

O componente deve ser reconstruído respeitando estritamente os padrões do projeto (Composition API, `<script setup lang="ts">`, ordem obrigatória: 1º `<template>`, 2º `<script setup>`, 3º `<style lang="scss">`, 4 espaços de indentação e regras do `eslint.config.js`):

```vue
<template>
    <div class="input-file-main-div" v-bind="attrs" @click="triggerChoose">
        <input
            ref="nativeInputRef"
            type="file"
            class="max-input-file-hidden"
            style="display: none;"
            multiple
            @change="onNativeInputChange"
        />

        <slot name="button" flex>
            <div class="input-file-content" v-if="!isOverDropZone">
                <div class="input-file-content-icon-label">
                    <MaxIcon icon="lets-icons:upload-light" size="3" />
                    <div
                        class="input-file-content-label"
                        v-html="displayLabel"
                    ></div>
                </div>
            </div>
            <div ref="dropZoneRef" :class="`drop-zone-div ${isOverDropZone ? 'dropping' : ''}`">
                <div class="drop-zone-div-content">
                    <MaxIcon icon="tabler:drag-drop" size="2.6" />
                    <div>Solte aqui seus arquivos para enviar.</div>
                </div>
            </div>
        </slot>

        <slot name="filesPreview" flex>
            <template v-if="isVisibleFiles && temp_value.length > 0">
                <div class="files-list-mini" v-if="sizePreview === 'mini'">
                    <div v-for="(file, index) in temp_value" :key="`preview-mini-${index}`">
                        <MaxIcon icon="mdi:file-outline" size="1.5" />
                    </div>
                </div>
                <div class="files-list-preview" v-else>
                    <div
                        v-for="(file, index) in temp_value"
                        :key="`preview-${index}`"
                        class="files-list-preview-content"
                    >
                        <img
                            v-if="file.type && file.type.startsWith('image/')"
                            :src="getFilePreviewUrl(file)"
                            alt="Preview"
                        />
                        <div class="file-standard" v-else>
                            <MaxIcon icon="mdi:file-outline" size="3" />
                            <div class="file-standard-info">
                                <strong>Arquivo:</strong> {{ file.name }}
                            </div>
                            <div class="file-standard-info">
                                <strong>Tamanho:</strong> {{ (file.size / 1024).toFixed(2) }} KB
                            </div>
                        </div>
                        <div
                            class="trash-icon-remove-clipboard"
                            pr4
                            pt4
                            @click.stop="deleteItem(index)"
                        >
                            <MaxIcon icon="tabler:trash" size="1.3" hover-blue-icon />
                        </div>
                    </div>
                </div>
            </template>
        </slot>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
    import { useDropZone, useEventListener } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';

    /**
     * Componente de seleção de arquivos com drag-and-drop, drop zone e suporte a colagem (Ctrl+V).
     */
    const attrs: any = useAttrs();

    const props = withDefaults(
        defineProps<{
            /** Lista de arquivos selecionados (v-model) */
            modelValue?: File[];
            /** Texto descritivo na zona de drop */
            label?: string;
        }>(),
        {
            modelValue: () => []
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: File[]): void;
    }>();

    const nativeInputRef = ref<HTMLInputElement | null>(null);
    const dropZoneRef = ref<HTMLElement | null>(null);
    const temp_value = ref<File[]>([...props.modelValue]);

    // Mapa de Object URLs geradas para pré-visualização de imagens, garantindo cleanup em onBeforeUnmount
    const previewUrlMap = new Map<File, string>();

    const displayLabel = computed(() => {
        return props.label ?? attrs.label ?? 'Clique aqui, arraste e solte, <br>ou cole (CTRL + V) arquivos para carregar.';
    });

    const isVisibleFiles = computed(() => {
        return attrs.noView === undefined &&
            attrs.noPreview === undefined &&
            attrs['no-view'] === undefined &&
            attrs['no-preview'] === undefined;
    });

    const sizePreview = computed(() => {
        return attrs.sizeFiles ?? attrs.sizePreview ?? attrs['size-files'] ?? attrs['size-preview'] ?? '';
    });

    const getFilePreviewUrl = (file: File): string => {
        if (previewUrlMap.has(file)) {
            return previewUrlMap.get(file)!;
        }
        const url = URL.createObjectURL(file);
        previewUrlMap.set(file, url);
        return url;
    };

    const cleanupFileUrl = (file: File) => {
        const url = previewUrlMap.get(file);
        if (url) {
            URL.revokeObjectURL(url);
            previewUrlMap.delete(file);
        }
    };

    const cleanupAllUrls = () => {
        for (const url of previewUrlMap.values()) {
            URL.revokeObjectURL(url);
        }
        previewUrlMap.clear();
    };

    onBeforeUnmount(() => {
        cleanupAllUrls();
    });

    watch(
        () => props.modelValue,
        (val) => {
            temp_value.value = val ? [...val] : [];
        },
        { deep: true }
    );

    const updateFiles = (newFiles: File[]) => {
        temp_value.value = newFiles;
        emit('update:modelValue', newFiles);
    };

    const addFiles = (filesToAdd: File[]) => {
        if (!filesToAdd.length) return;
        updateFiles([...temp_value.value, ...filesToAdd]);
    };

    const deleteItem = (indexRemove: number) => {
        const removedFile = temp_value.value[indexRemove];
        if (removedFile) {
            cleanupFileUrl(removedFile);
        }
        const updated = temp_value.value.filter((_, index) => index !== indexRemove);
        updateFiles(updated);
    };

    const triggerChoose = () => {
        nativeInputRef.value?.click();
    };

    const onNativeInputChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
            addFiles(Array.from(target.files));
        }
        target.value = '';
    };

    const handlePaste = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const filesFound: File[] = [];
        const items = event.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    const ext = file.type ? file.type.split('/')[1] || 'bin' : 'bin';
                    const namedFile = new File([file], `pasted-${Date.now()}.${ext}`, { type: file.type });
                    filesFound.push(namedFile);
                }
            }
        }

        if (filesFound.length === 0 && event.clipboardData.files.length > 0) {
            filesFound.push(...Array.from(event.clipboardData.files));
        }

        if (filesFound.length > 0) {
            event.preventDefault();
            addFiles(filesFound);
        }
    };

    useEventListener(window, 'paste', handlePaste);

    const { isOverDropZone } = useDropZone(dropZoneRef as any, {
        onDrop: (files: File[] | null) => {
            if (files && files.length > 0) {
                addFiles(files);
            }
        },
        multiple: true,
        preventDefaultForUnhandled: false
    });
</script>

<style lang="scss">
    /* Manter integralmente as regras SCSS pré-existentes de linhas 9 a 113 */
</style>
```

### 2. Refatoração de `tests/components/MaxInputFile.test.ts`

Substituir o arquivo de testes atual por uma bateria robusta cobrindo todos os aspectos da especificação do catálogo:
1. **Renderização inicial:** Monta o elemento raiz `.input-file-main-div`, o input oculto `input[type="file"]`, e a área de instrução com o label padrão.
2. **Prop `label`:** Renderiza label customizado informado via prop ou via attr.
3. **Seleção de arquivos via input nativo:** Simula evento `change` no input invisível e verifica a adição dos arquivos e emissão de `update:modelValue`.
4. **Drag-and-Drop (drop zone):** Testa o acionamento do callback `onDrop` do `useDropZone` adicionando novos arquivos e emitindo o evento correspondente.
5. **Colagem via Clipboard (Ctrl+V):** Testa a captura do evento `paste` com arquivo/imagem e verifica sua inclusão na lista.
6. **Remoção de arquivo:** Testa o clique no botão de lixeira `.trash-icon-remove-clipboard`, confirmando a remoção do arquivo e emissão do novo array atualizado.
7. **Atributo `no-view` / `no-preview`:** Verifica que a lista de pré-visualização não é renderizada quando o atributo está presente.
8. **Atributo `size-files="mini"`:** Verifica que os arquivos são exibidos em `.files-list-mini` no formato compacto.
9. **Slots customizados:** Valida a substituição do conteúdo padrão através dos slots `#button` e `#filesPreview`.
10. **Desalocação de memória:** Valida que `URL.revokeObjectURL` é chamado quando um arquivo é excluído ou quando o componente é desmontado (`unmount()`).

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha)
- Ao executar um teste que espera elementos da interface documentada contra a implementação atual de `MaxInputFile.vue`:
```typescript
it('renderiza os elementos estruturais documentados', () => {
    const wrapper = mount(MaxInputFile, {
        props: { label: 'Arraste seus arquivos aqui' }
    });
    expect(wrapper.find('.input-file-main-div').exists()).toBe(true);
    expect(wrapper.find('.input-file-content-label').text()).toContain('Arraste seus arquivos aqui');
});
```
- **Resultado Red:**
  O teste falha com:
  `AssertionError: expected false to be true // wrapper.find('.input-file-main-div').exists()`
  pois `wrapper.html()` é `""`.

### 2. Etapa Green (Validação Pós-Implementação)
- Com a restauração e implementação completa do componente:
  - O seletor `.input-file-main-div` existe;
  - O label customizado é exibido;
  - A seleção de arquivos, drop zone, colagem e exclusão funcionam emitindo `update:modelValue`;
  - Todos os testes de `tests/components/MaxInputFile.test.ts` passam com status `PASSED`.

---

## Banco de dados

- **Nenhuma** migration necessária (biblioteca puramente de componentes UI front-end).

---

## Riscos de quebra e Não-Regressão

- **Riscos de Contrato / Componentes:** Nenhum. `MaxInputFile` estava inoperante (renderizava vazio). Restaurar sua funcionalidade atende ao contrato canônico publicado em `COMPONENTS.md:921-940` sem quebrar nenhum componente consumidor interno.
- **Gerenciamento de Recursos do Navegador:** O uso de `URL.createObjectURL` para thumbnails de imagens deve ter seus URLs devidamente revogados (`URL.revokeObjectURL`) tanto na exclusão individual de itens quanto no gancho `onBeforeUnmount`, evitando vazamentos de memória.
- **Testes Existentes:** O teste que exigia `wrapper.html() === ''` foi introduzido erroneamente como reforço de no-op e deve ser substituído pelos testes reais de contrato.
- **Suíte de Testes Global:** A execução de toda a suíte de testes (`npx vitest run`) continuará com 100% de sucesso nos 139 arquivos de teste.
- **Verificação TypeScript e Lint:** Garantir `npx vue-tsc --noEmit` com 0 erros e `npx eslint` / `npx stylelint` em conformidade estrita.

---

## Validação

1. **Validação dos Testes Unitários de `MaxInputFile`:**
   ```bash
   npx vitest run tests/components/MaxInputFile.test.ts
   ```
2. **Validação de Toda a Suíte de Testes da Biblioteca:**
   ```bash
   npx vitest run
   ```
3. **Checagem Estática de Tipos TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Validação de ESLint:**
   ```bash
   npx eslint src/components/MaxInputFile.vue tests/components/MaxInputFile.test.ts
   ```
5. **Validação de Stylelint:**
   ```bash
   npx stylelint "src/components/MaxInputFile.vue"
   ```

---

## Skills Aplicáveis

- `vue-components`
- `vue-max-stack-frontend-best-practices`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-eslint-stylelint-quality-standards`
- `test-driven-development`
- `code-review-and-quality`
- `superpowers`
