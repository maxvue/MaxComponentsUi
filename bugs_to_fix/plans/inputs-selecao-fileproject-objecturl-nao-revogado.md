# `URL.createObjectURL` sem `revokeObjectURL` no MaxInputFileProject — vazamento de memória

- **Categoria:** performance
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputFileProject.vue:66`, `src/components/MaxInputFileProject.vue:146`, `src/components/MaxInputFileProject.vue:59-72`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente cria object URLs em dois pontos e **nunca** os revoga:

`convertItem` (linhas 61-72), chamado para cada arquivo:
```ts
item.blob ??= new Blob([ item as any ], { type: item.type });
item.objectURL ??= URL.createObjectURL(item.blob);
item.src ??= item.objectURL;
item.file_bloob ??= item.objectURL;
```

`sendFile` (linhas 142-148), para cada arquivo do lote:
```ts
file['blob'] ??= new Blob([file], { type: file.type });
file['objectURL'] ??= URL.createObjectURL(file.blob);
```

Não há `URL.revokeObjectURL` em lugar nenhum do arquivo, nem hook `onBeforeUnmount`/`onUnmounted`. Cada object URL criado mantém o `Blob` inteiro vivo na memória do navegador até a página ser descarregada — não é coletado pelo GC enquanto a URL existir, mesmo que nenhuma referência JavaScript ao blob permaneça.

O agravante está na forma como `convertItem` é acionado (linha 59):

```ts
watch(count_files, () => temp_files.value.forEach((file: DBFile) => convertItem(file)), { deep: true, immediate: true });
```

O watcher é `deep` sobre um computed de contagem e itera **todos** os arquivos a cada disparo. O `??=` protege contra recriar a URL do mesmo objeto, mas quando `props.files` é substituído por um novo array (o watch das linhas 50-52 faz `temp_files.value = files` com `deep: true`), os objetos são novos: novos blobs, novas object URLs, e as anteriores ficam órfãs e vivas.

Há ainda um defeito correlato na linha 66: `new Blob([ item as any ], { type: item.type })` constrói um Blob a partir do **objeto DBFile inteiro**, não do conteúdo do arquivo. Quando `item` já é um `File` (caso do file dialog), isso funciona por acidente; quando é um registro vindo do backend, o Blob resultante contém a serialização do objeto — e uma object URL é criada para esse lixo mesmo assim.

## Impacto

Vazamento de memória proporcional ao volume de arquivos manipulados. Numa tela de upload de documentos — o caso de uso exato deste componente, onde o usuário adiciona, remove e re-adiciona arquivos, tipicamente fotos de vários MB — a memória do navegador cresce monotonicamente durante toda a sessão. A revogação é a única forma de liberar; sem ela, só o reload resolve. Em SPA, onde a página vive por horas, isso degrada e eventualmente trava a aba.

## Plano de correção

1. Manter um registro das URLs criadas pelo componente (ex.: um `Set<string>` no escopo do `<script setup>`), alimentado nos dois pontos de criação (linhas 66 e 146).
2. Revogar quando o arquivo sai da lista: no watch de `temp_files`/`count_files`, comparar a lista anterior com a nova e chamar `URL.revokeObjectURL` para cada `objectURL` que não está mais presente.
3. Revogar tudo na desmontagem:
   ```ts
   onBeforeUnmount(() => {
       created_urls.forEach((url) => URL.revokeObjectURL(url));
       created_urls.clear();
   });
   ```
4. Em `sendFile`, revogar as URLs do lote assim que o `axios.post` concluir (sucesso ou erro) — elas servem apenas para montar o `FormData` e não são usadas depois; hoje são criadas e imediatamente abandonadas.
5. Corrigir a construção do Blob na linha 66: usar o próprio `item` apenas quando ele for de fato um `File`/`Blob` (`item instanceof Blob`), e não criar object URL para registros que já vêm do servidor com `src`/`thumbnail` próprios.
6. Reavaliar o watch da linha 59: `{ deep: true }` sobre `count_files` (um computed numérico) não tem efeito útil e faz o handler rodar mais do que o necessário.

## Verificação

- Novo teste em `tests/components/MaxInputFileProject.test.ts`: espionar `URL.revokeObjectURL` com `vi.spyOn`, montar com arquivos, desmontar, e asserir que foi chamado uma vez por URL criada.
- Teste de remoção: substituir `props.files` por uma lista menor e asserir que a URL do arquivo removido foi revogada.
- Teste de `sendFile`: após a resolução do `axios.post` mockado, as URLs do lote foram revogadas.
- Teste de que `convertItem` não cria object URL para um registro que já possui `src` vindo do servidor.
- `npx vitest run tests/components/MaxInputFileProject.test.ts`.
