# `v-html` em label de attrs no MaxInputFileUploadButton e MaxInputFileUploadBig

- **Categoria:** segurança
- **Severidade:** média
- **Arquivo(s):** `src/components/MaxInputFileUploadButton.vue:7`, `src/components/MaxInputFileUploadBig.vue:7`
- **Domínio:** inputs-selecao-arquivo

## Problema

Ambos os componentes renderizam o rótulo com `v-html` sem sanitização:

`MaxInputFileUploadButton.vue:7`
```vue
<div v-html="attrs.label" v-if="attrs.label" pl-10 class="input-file-button-label"></div>
```

`MaxInputFileUploadBig.vue:7`
```vue
<div v-if="label" v-html="label"></div>
```

No caso do Button o valor vem de `useAttrs()` — sem sequer uma declaração de prop tipada —, o que torna a origem do dado completamente opaca para quem lê o componente. No caso do Big é uma prop declarada `label?: string` (linha 49) com default `''`.

O `v-html` é usado aqui presumivelmente para permitir `<br>` e `<strong>` no rótulo (a intenção é plausível: o texto do Big é multilinha). Mas a biblioteca já demonstra ter a preocupação certa em outro ponto do mesmo domínio: `MaxInputIconPicker.vue:209` passa todo SVG vindo da rede por `sanitizeSvg` antes de gravá-lo no cache que alimenta o `v-html` da linha 66. A inconsistência é o problema — aqui não há sanitização alguma.

O risco é condicionado: só é explorável quando o `label` for construído a partir de dado não confiável (nome de um documento vindo do backend, texto configurável por um usuário com menos privilégio, conteúdo de CMS). Como a biblioteca é consumida por várias apps e o `label` do Button entra por `attrs` sem tipagem, não há como garantir que isso nunca ocorra.

## Impacto

Vetor de XSS refletido/armazenado nas apps consumidoras que montarem o rótulo com dado de origem externa. Sendo componentes de upload, frequentemente aparecem em telas que já lidam com nomes de arquivo enviados por terceiros — exatamente o tipo de dado que não deveria chegar a um `v-html`.

## Plano de correção

1. Declarar `label` como prop tipada em `MaxInputFileUploadButton.vue` (hoje só existe via `attrs`), documentando explicitamente que ela aceita HTML.
2. Escolher uma das duas abordagens, aplicando-a igual nos dois componentes:
   - **Preferida:** trocar `v-html` por interpolação `{{ }}` e oferecer um `<slot>` para quem precisar de marcação — ambos os componentes já expõem um slot default (`MaxInputFileUploadButton.vue:4`, `MaxInputFileUploadBig.vue:5`), então o caso de uso rico já está atendido sem `v-html`.
   - **Alternativa:** manter `v-html` mas passar por um sanitizador de HTML, seguindo o precedente de `sanitizeSvg` em `src/helpers/`.
3. Documentar a decisão no JSDoc da prop, para que as apps consumidoras saibam se podem ou não passar HTML.

## Verificação

- Novo teste em `tests/components/MaxInputFileUploadButton.test.ts`: montar com `label: '<img src=x onerror=alert(1)>'` e asserir que o HTML não é interpretado (nenhum `<img>` no DOM) ou que o `onerror` foi removido.
- Teste equivalente em `tests/components/MaxInputFileUploadBig.test.ts`.
- Teste de regressão: o slot default continua permitindo marcação rica (caso já coberto em `tests/components/MaxInputFileUploadBig.test.ts:58`).
- `npx vitest run tests/components/MaxInputFileUploadButton.test.ts tests/components/MaxInputFileUploadBig.test.ts`.
