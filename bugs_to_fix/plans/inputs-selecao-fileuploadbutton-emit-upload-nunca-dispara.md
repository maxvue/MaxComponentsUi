# `onUpload` do MaxInputFileUploadButton nunca é chamado — o emit `upload` é inalcançável

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputFileUploadButton.vue:3`, `src/components/MaxInputFileUploadButton.vue:19-23`, `src/components/MaxInputFileUpload.vue:135-153`
- **Domínio:** inputs-selecao-arquivo

## Problema

O componente passa `onUpload` como **prop** ao filho e declara um emit correspondente:

```vue
<MaxInputFileUpload v-bind="attrs" :modelValue="(attrs.modelValue as any)" class="no-style" customUpload :onUpload="onUpload">
```
```ts
const emit = defineEmits(['upload']);
const onUpload = (files: any) => { emit('upload', files); };
```

O problema está em como o `MaxInputFileUpload` consome esse `onUpload`. Lá, `onUpload` chega via `useAttrs()` (linha 88) e é lido dentro do handler do evento do PrimeVue (linhas 141-143):

```ts
const onUploadHandler = (event: any) => {
    if (attrs.onUpload) return attrs.onUpload(event);
    ...
};
```

Mas o `MaxInputFileUpload` registra `@upload="onUploadHandler"` no `<FileUpload>` (linha 17) e simultaneamente faz `v-bind="attrs"` (linha 6) no mesmo elemento. Como `attrs` contém `onUpload`, o Vue interpreta essa chave como um listener do evento `upload` e a mescla com o `@upload` explícito — ou seja, `attrs.onUpload` é **ao mesmo tempo** repassado como listener ao `FileUpload` e checado dentro do handler.

Mais grave: o `MaxInputFileUploadButton` passa `customUpload` (linha 3). Com `customUpload` ativo, o `FileUpload` do PrimeVue **não** dispara o evento `upload` — ele dispara `uploader`, delegando o envio à aplicação. O componente não registra `@uploader` em lugar nenhum. Portanto, com `customUpload` ligado:

- Nenhum upload real acontece (não há handler de `uploader`);
- `onUploadHandler` nunca roda, então `attrs.onUpload(event)` nunca é chamado;
- `emit('upload', files)` do Button é inalcançável — o emit declarado na linha 19 nunca dispara.

O `MaxInputFileUpload` também repassa `attrs` duas vezes: no `<div>` raiz (linha 2) e no `<FileUpload>` (linha 6), duplicando todos os atributos e listeners na árvore.

## Impacto

O `MaxInputFileUploadButton` está funcionalmente quebrado: seleciona arquivos mas nunca os envia, e a app consumidora nunca é notificada via `@upload`. Como é um botão de upload compacto — usado como ação secundária dentro de outros campos, dado o `position: absolute` do seu estilo (linha 29) —, a falha é silenciosa: o usuário clica, escolhe o arquivo, e nada acontece nem no cliente nem no servidor.

## Plano de correção

1. Decidir o contrato de `customUpload`: se o Button pretende delegar o envio à aplicação, registrar `@uploader` no `<FileUpload>` do `MaxInputFileUpload` e encaminhar esse evento; se pretende usar o upload nativo do PrimeVue, **remover** o `customUpload` da linha 3 do Button.
2. Trocar a passagem por prop (`:onUpload="onUpload"`) por um listener de evento (`@upload="onUpload"`), que é o mecanismo idiomático — e declarar o emit correspondente em `MaxInputFileUpload` (`defineEmits(['upload', 'file-click', 'upload-error'])`, hoje só as duas últimas existem na linha 111).
3. Remover o padrão `if (attrs.onSelect) return attrs.onSelect(event)` / `if (attrs.onUpload) return ...` (linhas 136 e 142) do `MaxInputFileUpload`: interceptar listeners de `attrs` e fazer *early return* cancela toda a lógica interna do componente (o `uploading.value = false` e a atualização do `modelValue`), o que é um efeito colateral surpreendente. Emitir o evento e deixar a app reagir é o comportamento correto.
4. Eliminar o `v-bind="attrs"` duplicado (linhas 2 e 6 do `MaxInputFileUpload`), mantendo-o apenas no `<FileUpload>`.
5. Declarar as props do Button (`label`, `icon`/`i`/`ico`, `modelValue`) em vez de lê-las de `attrs` sem tipagem.

## Verificação

- Novo teste em `tests/components/MaxInputFileUploadButton.test.ts`: simular a conclusão do upload no `MaxInputFileUpload` stub e asserir que o Button emitiu `upload` (hoje nunca emite).
- Teste de que `customUpload` (se mantido) resulta no registro de um handler de `uploader`.
- Teste em `tests/components/MaxInputFileUpload.test.ts`: passar um listener `@upload` externo **não** deve impedir a atualização interna do `modelValue` — cobre a remoção do early return da linha 142.
- `npx vitest run tests/components/MaxInputFileUploadButton.test.ts tests/components/MaxInputFileUpload.test.ts`.
