# MaxInputFileUploadBig não valida tipo nem tamanho dos arquivos arrastados

- **Categoria:** falha
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputFileUploadBig.vue:96-105`, `src/components/MaxInputFileUploadBig.vue:41-62`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente declara a prop `accept` com um default significativo (linha 57): `'.pdf, .jpg, .jpeg, .png, .doc, .docx'`. Essa prop é repassada ao `useFileDialog` (linha 81), o que faz o **navegador** filtrar a seleção no diálogo de arquivos.

Porém, o caminho de **arrastar e soltar** ignora completamente `accept`:

```ts
function onFilesDropped(files: File[] | null) {
    if (props.disabled || !files || files.length === 0) return;
    handleFiles(files);
}

function handleFiles(files: File[]) {
    if (props.onSelect) props.onSelect({ files });
}
```

Nenhuma verificação de extensão/MIME é feita. Um `.exe`, um `.zip` de 2 GB ou um `.svg` arrastado para a área é entregue diretamente ao `onSelect` da aplicação, exatamente como um PDF válido seria. Nem sequer há uma prop de tamanho máximo (`maxFileSize`) declarada — o componente não tem como limitar volume por nenhum caminho.

Além disso, `props.multiple` também é ignorado no drop: o `useDropZone` é configurado com `multiple: true` fixo (linha 75), então mesmo com `:multiple="false"` o usuário pode soltar vários arquivos de uma vez.

Como agravante, `showError` (linha 64) existe, tem watch com auto-reset de 3s (linhas 67-70) e um slot dedicado no template (linhas 21-30), mas **nunca é setado para `true` em lugar nenhum do componente** — não há caminho de código que ative o estado de erro. É exatamente a infraestrutura que uma validação usaria, deixada inerte.

## Impacto

Bypass trivial de filtro de tipo: basta arrastar em vez de clicar. Arquivos não suportados chegam ao backend, e arquivos enormes são enviados sem limite, com risco de esgotar memória do navegador e de conexão. A ausência de limite de tamanho, combinada com `multiple` ignorado, permite o envio acidental (ou malicioso) de lotes arbitrários.

## Plano de correção

1. Declarar uma prop `maxFileSize?: number` (bytes) e uma prop opcional `maxFiles?: number`.
2. Criar uma função `validateFiles(files: File[]): { valid: File[]; errors: string[] }` que:
   - Normalize `props.accept` numa lista de extensões/MIME e rejeite o que não casar (comparando extensão do `file.name` e `file.type`).
   - Rejeite arquivos acima de `maxFileSize`.
   - Respeite `props.multiple === false` truncando para o primeiro arquivo.
3. Chamar `validateFiles` no início de `handleFiles`, de modo que ambos os caminhos (dialog e drop) passem pela mesma validação — colocar em `handleFiles` e não em `onFilesDropped` garante paridade.
4. Ativar o estado de erro já existente: quando houver rejeições, setar `showError.value = true` (o auto-reset de 3s da linha 67 já cuida do resto) e expor a razão pelo slot `error`.
5. Declarar formalmente um emit `rejected` com os arquivos recusados e o motivo, para que a app possa exibir uma mensagem própria.

## Verificação

- Novo teste em `tests/components/MaxInputFileUploadBig.test.ts`: com `accept: '.pdf'`, soltar um `new File(['x'], 'malware.exe')` via `dropZoneOnDropCb` deve **não** chamar `onSelect` e deve ativar `showError`.
- Teste de tamanho: com `maxFileSize: 10`, um arquivo maior é rejeitado.
- Teste de `multiple: false`: soltar dois arquivos entrega apenas um ao `onSelect`.
- Teste de regressão: um `.pdf` dentro do limite continua chegando ao `onSelect` (casos das linhas 137-152 do teste atual permanecem verdes).
- `npx vitest run tests/components/MaxInputFileUploadBig.test.ts` — deve também elevar a cobertura de funções, hoje em 54,5%.
