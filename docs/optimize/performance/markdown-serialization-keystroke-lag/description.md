# Dupla Serialização AST para Markdown a Cada Tecla sem Debounce

## Categoria
Watchers e Reatividade / Serialização Onerosa / Input Latency

## Severidade
Alta

## Componentes Envolvidos
- [MaxInputMarkdown.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdown.vue#L371-L389)

## Descrição do Problema
No componente `MaxInputMarkdown.vue`, a cada caractere digitado no editor baseado em Tiptap / ProseMirror, o callback `onUpdate` é disparado:

```typescript
// MaxInputMarkdown.vue L372-L374
onUpdate: ({ editor: e }) => {
    emit('update:modelValue', (e.storage as Record<string, any>).markdown.getMarkdown());
}
```

Quando o evento `update:modelValue` é emitido, a aplicação pai atualiza a propriedade vinculada (`v-model`), o que aciona imediatamente o `watch` de `props.modelValue` dentro do próprio componente:

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

## Causa Raiz
1. O método `.markdown.getMarkdown()` da extensão `tiptap-markdown` percorre recursivamente toda a árvore de nós AST do ProseMirror (parágrafos, cabeçalhos, listas, links, imagens e tabelas), convertendo cada nó para sua representação em texto Markdown puro.
2. A cada tecla pressionada, essa conversão completa do documento acontece **duas vezes**:
   - **Primeira vez**: dentro do `onUpdate` ao extrair a string para emitir `update:modelValue`.
   - **Segunda vez**: dentro do `watch(() => props.modelValue)` para checar `if (val !== current)` antes de chamar `setContent`.
3. Não há nenhum mecanismo de debounce, throttle ou verificação de flag de sincronização interna (ex.: `isInternalUpdate`).

## Impacto na Performance
- **Input Lag Severo**: Em documentos de tamanho médio a grande (com mais de 50 linhas, tabelas ou imagens embutidas), a serialização da AST consome dezenas de milissegundos a cada tecla.
- **Bloqueio da Thread Principal**: Digitação rápida em texto longo causa acúmulo de tarefas síncronas no Event Loop, provocando atraso perceptível entre a pressão da tecla no teclado físico e a aparição do glifo no cursor do editor.
- **Queda de Frames (FPS)**: O navegador perde taxas de atualização de 60fps/120fps, gerando sensação de lentidão e travamento na interface.

## Solução Recomendada
1. **Flag de Modificação Interna**: Utilizar uma flag booleana temporária para indicar que a alteração originou-se no próprio editor, evitando a segunda chamada de serialização no `watch`:

```typescript
let isLocalChange = false;

// no useEditor:
onUpdate: ({ editor: e }) => {
    isLocalChange = true;
    const md = (e.storage as Record<string, any>).markdown.getMarkdown();
    emit('update:modelValue', md);
    nextTick(() => { isLocalChange = false; });
}

// no watch:
watch(
    () => props.modelValue,
    (val) => {
        if (isLocalChange || !editor.value) return;
        const current = (editor.value.storage as Record<string, any>).markdown.getMarkdown();
        if (val !== current) editor.value.commands.setContent(val ?? '');
    }
);
```
2. **Debounce Opcional na Emissão**: Para textos muito longos, adicionar um debounce leve (ex.: 100ms - 200ms) na emissão do `update:modelValue`, reduzindo a frequência de serializações de alta densidade durante digitação ininterrupta.
