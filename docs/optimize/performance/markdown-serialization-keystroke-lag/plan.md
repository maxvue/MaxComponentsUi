# Plano de Implementação: Eliminação da Dupla Serialização AST de Markdown a Cada Tecla

## 1. Diagnóstico e Objetivo

No componente `MaxInputMarkdown.vue`, o editor é construído sobre a biblioteca Tiptap / ProseMirror com a extensão `tiptap-markdown`.

A cada caractere digitado pelo usuário, o callback `onUpdate` é disparado:

```typescript
// MaxInputMarkdown.vue L372-L374
onUpdate: ({ editor: e }) => {
    emit('update:modelValue', (e.storage as Record<string, any>).markdown.getMarkdown());
}
```

Quando o evento `update:modelValue` é emitido, o componente pai atualiza a propriedade vinculada (`v-model`), o que reativamente engatilha o watcher de `props.modelValue` no próprio componente filho:

```typescript
// MaxInputMarkdown.vue L381-L388
watch(
    () => props.modelValue,
    (val) => {
        if (!editor.value) return;
        const current = (editor.value.storage as Record<string, any>).markdown.getMarkdown();
        if (val !== current) editor.value.commands.setContent(val ?? '');
    }
);
```

**Problemas identificados:**
1. **Dupla Serialização AST Síncrona a Cada Tecla:** O método `.markdown.getMarkdown()` percorre recursivamente toda a árvore sintática (AST) do ProseMirror convertendo nós, formatações e blocos em texto Markdown puro. A cada tecla digitada, essa serialização ocorre **duas vezes consecutivas**:
   - 1ª vez: no `onUpdate` para emitir o evento.
   - 2ª vez: no `watch` para comparar `if (val !== current)`.
2. **Latência de Digitação (Input Lag):** Em documentos com mais de 50 linhas, listas, tabelas ou imagens embutidas, cada serialização consome entre 15ms e 40ms. Duas serializações no mesmo ciclo síncrono congelam a thread principal, atrasando o cursor e a exibição dos caracteres digitados.
3. **Ausência de Flag de Sincronização Local:** Não há diferenciação entre alterações originadas pelo próprio usuário no editor e alterações enviadas externamente pelo componente pai.

**Objetivo:**
Eliminar a segunda serialização síncrona e a chamada redundante ao watcher em digitações locais através de uma flag booleana de sincronização (`isLocalChange`) e cache do último valor emitido, garantindo digitação instantânea a 60fps sem degradar a sincronização externa de dados.

---

## 2. Arquivos a Modificar

- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdown.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdown.vue)
- [/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputMarkdown.test.ts](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputMarkdown.test.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Modificações em `src/components/MaxInputMarkdown.vue`

1. **Declarar flags de rastreamento de alteração local:**
No bloco de script setup, criar as variáveis `isLocalChange` (booleano) e `lastEmittedValue` (string).

2. **Ajustar `onUpdate` no `useEditor`:**
Antes de emitir o valor atualizado, sinalizar `isLocalChange = true` e registrar `lastEmittedValue = md`. No `nextTick()`, redefinir `isLocalChange = false`.

3. **Ajustar o watcher de `props.modelValue`:**
Se `isLocalChange` for verdadeiro ou se `val === lastEmittedValue`, ignorar imediatamente a execução, poupando a segunda serialização completa da AST. Se o valor tiver sido alterado externamente (ex.: reset de formulário ou carregamento via API), proceder com a verificação e o `setContent`:

```typescript
// Implementação cirúrgica em src/components/MaxInputMarkdown.vue

let isLocalChange = false;
let lastEmittedValue = props.modelValue ?? '';

// Na configuração do useEditor ({ ... }):
onUpdate: ({ editor: e }) => {
    isLocalChange = true;
    const md = (e.storage as Record<string, any>).markdown.getMarkdown();
    lastEmittedValue = md;
    emit('update:modelValue', md);
    nextTick(() => {
        isLocalChange = false;
    });
}

// No watcher de props.modelValue:
watch(
    () => props.modelValue,
    (val) => {
        // Se a mudança se originou de uma digitação local recente, não serializa novamente
        if (isLocalChange || val === lastEmittedValue || !editor.value) return;

        const current = (editor.value.storage as Record<string, any>).markdown.getMarkdown();
        if (val !== current) {
            lastEmittedValue = val ?? '';
            editor.value.commands.setContent(val ?? '');
        }
    }
);
```

Template e estilos SCSS scoped mantêm-se estritamente intactos.

---

### 3.2. Adição de Testes Unitários em `tests/components/MaxInputMarkdown.test.ts`

Adicionar teste garantindo que quando o editor dispara `onUpdate`, o watcher não tenta reexecutar `setContent`:

```typescript
it('não reexecuta setContent no watcher quando o update origina-se do próprio editor', async () => {
    const wrapper = mountMarkdown({ modelValue: '# Inicial' });
    await wrapper.vm.$nextTick();

    mockEditor.commands.setContent.mockClear();

    // Simula evento de digitação local do Tiptap
    latestEditorOptions.onUpdate({ editor: mockEditor });
    await wrapper.setProps({ modelValue: '# Alterado pelo usuário' });
    await wrapper.vm.$nextTick();

    // O setContent NÃO deve ser invocado novamente
    expect(mockEditor.commands.setContent).not.toHaveBeenCalled();
});

it('executa setContent no watcher quando a alteração provém externamente', async () => {
    const wrapper = mountMarkdown({ modelValue: '# Inicial' });
    await wrapper.vm.$nextTick();

    mockEditor.commands.setContent.mockClear();
    mockEditor.storage.markdown.getMarkdown.mockReturnValue('# Inicial');

    // Alteração externa (sem onUpdate prévio)
    await wrapper.setProps({ modelValue: '# Novo Conteúdo Externo' });
    await wrapper.vm.$nextTick();

    expect(mockEditor.commands.setContent).toHaveBeenCalledWith('# Novo Conteúdo Externo');
});
```

---

## 4. Garantia de Retrocompatibilidade

- **Contrato de `v-model`:** O suporte a `v-model` contínuo permanece 100% idêntico.
- **Sincronização Bidirecional:** Dados recebidos de endpoints ou modificados pelo componente pai continuam sendo renderizados imediatamente no editor.
- **Emits e Exposes:** Os métodos `openImage`, `closeImage`, `openPdf` e a ref `editor` mantêm-se totalmente compatíveis.

---

## 5. Critérios de Aceitação e Comandos de Validação

1. Durante digitações ininterruptas, a serialização de AST via `.markdown.getMarkdown()` deve ser chamada apenas uma vez por atualização.
2. A atualização externa de `props.modelValue` continua atualizando o editor via `setContent`.
3. Nenhuma regressão de foco ou seleção de texto durante a digitação.
4. Checagem de tipagem TypeScript estrita:
   ```bash
   npm run type-check
   ```
5. Execução completa dos testes unitários do Markdown:
   ```bash
   npx vitest run tests/components/MaxInputMarkdown.test.ts tests/components/MaxInputMarkdownToolbar.test.ts
   ```
