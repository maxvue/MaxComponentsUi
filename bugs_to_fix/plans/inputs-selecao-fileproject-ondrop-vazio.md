# Drop zone do MaxInputFileProject está montada mas o handler `onDrop` é um no-op

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputFileProject.vue:161-163`, `src/components/MaxInputFileProject.vue:94-98`, `src/components/MaxInputFileProject.vue:2`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente monta uma drop zone completa e a anuncia explicitamente na interface:

- Linha 2: a raiz recebe `ref="drop_zone_ref"` e as classes `in-drop`/`not-in-drop`, com estilo de destaque visual (linhas 206-209).
- Linhas 94-98: `useDropZone(drop_zone_ref, { onDrop, multiple: true, ... })`.
- Linha 10 do template, texto visível ao usuário: **"Clique aqui ou arraste e solte os documentos para carregar."**

Mas o handler é vazio:

```ts
function onDrop(_files: File[] | null) {
    // if (files) emit('files-selected', files);
}
```

Os arquivos arrastados são descartados. O feedback visual `in-drop` acende durante o arraste (porque `isOverDropZone` funciona), reforçando ao usuário que o drop foi aceito — e nada acontece.

Note o contraste com o caminho do clique, que funciona: `onChange` (linhas 104-109) faz `temp_files.value = [...temp_files.value, ...files]`, o que dispara a cadeia `count_files` → `convertItem` → `count_to_upload` → `sendFile`.

O comentário morto sugere um `emit('files-selected', files)` que nunca existiu: o componente não declara `defineEmits` algum.

## Impacto

Metade da funcionalidade anunciada na própria interface não funciona. O usuário arrasta documentos para a área, vê o destaque visual de aceite, solta, e nada é enviado — sem nenhuma mensagem de erro. Como o texto na tela promete explicitamente o comportamento, é um defeito de alta visibilidade.

## Plano de correção

1. Implementar `onDrop` reutilizando exatamente o mesmo caminho do `onChange` do file dialog:
   ```ts
   function onDrop(files: File[] | null) {
       if (!files || size(files) === 0) return;
       temp_files.value = [...temp_files.value, ...files];
   }
   ```
   Assim a cadeia reativa existente (`count_files` → `convertItem`, `count_to_upload` → `sendFile`) roda igual para arraste e clique, sem duplicar lógica.
2. Se a intenção original era também notificar o pai, declarar formalmente o emit (`defineEmits<{ 'files-selected': [files: File[]] }>()`) e emiti-lo nos dois caminhos — ou remover o comentário morto de vez, para não sugerir uma API inexistente.
3. Remover o parâmetro com prefixo `_` ao dar uso real ao argumento.

## Verificação

- Novo teste em `tests/components/MaxInputFileProject.test.ts`: mockar `useDropZone` capturando `opts.onDrop` (padrão já usado em `tests/components/MaxInputFileUploadBig.test.ts:27-31`), invocar o callback com um `File` e asserir que `temp_files` cresceu.
- Teste de paridade: os arquivos entrados por drop passam por `convertItem` (ganham `id`, `extension`, `message_type`) igual aos do file dialog.
- Teste de guarda: `onDrop(null)` e `onDrop([])` não alteram `temp_files`.
- `npx vitest run tests/components/MaxInputFileProject.test.ts`.
