# MaxInputFileUpload não define limite de tamanho e confia na resposta bruta do servidor

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputFileUpload.vue:3-18`, `src/components/MaxInputFileUpload.vue:141-153`, `src/components/MaxInputFileUpload.vue:161-173`
- **Domínio:** inputs-selecao-arquivo

## Problema

Dois defeitos relacionados ao tratamento de arquivos/respostas:

**1. Sem limite de tamanho.** O `FileUpload` do PrimeVue é configurado (linhas 3-18) com `accept`, `auto`, `multiple`, `showCancelButton`, `showUploadButton` e `withCredentials`, mas **nunca** com `maxFileSize` nem `fileLimit`. Como `auto` tem default `true` (linha 10), qualquer arquivo selecionado dispara upload imediato, sem chance de o usuário perceber ou cancelar. Um arquivo de vários GB é enviado sem qualquer freio no cliente.

**2. `extension` derivada apenas do primeiro arquivo.** Em `onBeforeUpload` (linhas 161-173):

```ts
if (files.value.length > 0) {
    const extension = files.value[0].name.split('.').pop();
    event.formData.append('extension', extension);
}
```

Com `multiple` default `true` (linha 11), um lote heterogêneo (`foto.png` + `contrato.pdf`) envia ao backend `extension=png` para o lote inteiro. Se o backend usa esse campo para roteamento/validação, o `.pdf` é processado sob a extensão errada.

**3. Resposta do servidor consumida sem validação de forma.** Em `onUploadHandler` (linhas 141-153), `JSON.parse(event.xhr.response)` é seguido de `response[props.responseField]` e o resultado é empurrado direto para o `modelValue` público. O `try/catch` cobre apenas o erro de parse; uma resposta com JSON válido mas forma inesperada (ex.: uma string, ou um objeto sem os campos que o template consome nas linhas 68-72) entra silenciosamente no model e quebra a renderização da lista de arquivos.

## Impacto

Uploads sem limite de tamanho consomem banda e memória e podem derrubar a requisição no servidor sem feedback útil ao usuário. A `extension` incorreta corrompe o processamento de lotes mistos no backend. E a ausência de validação de forma na resposta transforma um erro de contrato de API num erro de renderização difícil de rastrear.

## Plano de correção

1. Declarar props `maxFileSize?: number` e `fileLimit?: number` e repassá-las ao `<FileUpload>` (linhas 3-18), com um default conservador de `maxFileSize` documentado.
2. Tratar o evento `@error` do PrimeVue para o caso específico de arquivo grande demais — hoje `onError` (linhas 155-159) trata todos os erros igual, exibindo a mensagem genérica "Ocorreu um erro ao fazer o upload."; distinguir o motivo melhora muito o feedback.
3. Corrigir a `extension`: enviar uma lista alinhada aos arquivos (`extensions[]`) em vez de um único valor derivado de `files.value[0]`, ou anexar a extensão por arquivo dentro do laço do `formData`.
4. Em `onUploadHandler`, validar a forma antes de mutar o model: verificar que `fileData` é objeto não-nulo (ou array de objetos) antes do `modelValue.value = [...]`; caso contrário, chamar o mesmo caminho de erro (`showError`/`emit('upload-error')`).

## Verificação

- Novo teste em `tests/components/MaxInputFileUpload.test.ts`: `maxFileSize` é repassado como prop ao `FileUpload` stub.
- Teste de `onBeforeUpload` com dois arquivos de extensões diferentes: o `formData` não deve rotular o lote inteiro com a extensão do primeiro.
- Teste de `onUploadHandler` com resposta JSON válida porém sem o `responseField` esperado: `modelValue` não deve ser alterado e `upload-error` deve ser emitido.
- Teste de regressão do caminho feliz (já coberto na linha 30 do teste atual: "deve atualizar o modelValue via evento onUploadHandler").
- `npx vitest run tests/components/MaxInputFileUpload.test.ts`.
