# Toolbar do markdown aceita URLs `javascript:` em links e imagens (XSS armazenado)

- **Categoria:** segurança
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputMarkdownToolbar.vue:261-287`, `src/components/MaxInputMarkdown.vue:77`
- **Domínio:** inputs-selecao-arquivo

## Problema

`applyLink` (linha 261) e `applyImage` (linha 282) repassam o conteúdo cru do input diretamente para os comandos do TipTap:

```ts
else props.editor?.chain().focus().setLink({ href: linkUrl.value, target: '_blank' }).run();
...
if (imageUrl.value) props.editor?.chain().focus().setImage({ src: imageUrl.value }).run();
```

Não há nenhuma validação de esquema. Um usuário (ou um conteúdo colado) pode digitar `javascript:alert(document.cookie)` ou `data:text/html;base64,...` no popover de link, e o valor é aceito e persistido no markdown emitido.

A extensão `Link` é configurada em `MaxInputMarkdown.vue:77` apenas com `Link.configure({ openOnClick: false })` — sem `protocols`, sem `validate`/`shouldAutoLink`, e sem `isAllowedUri`. Ou seja, o único filtro possível não está ativado. `Image` (linha 79) é usado sem nenhuma configuração.

`openOnClick: false` reduz a exploração *dentro* do próprio editor, mas o markdown gerado é emitido via `update:modelValue` e tipicamente é renderizado depois por outra tela/aplicação — onde o `href` malicioso volta a ser clicável.

## Impacto

Vetor de XSS armazenado: o valor perigoso entra pelo editor, é persistido no backend como markdown e detona quando renderizado em qualquer superfície que transforme markdown em HTML clicável. Como o componente é a base de todos os campos de descrição/observação rich-text da biblioteca, o alcance é amplo.

## Plano de correção

1. Criar um helper de validação de URL (ex.: `src/helpers/isSafeUrl.ts`) que aceite apenas `http:`, `https:`, `mailto:`, `tel:` e caminhos relativos, e rejeite explicitamente `javascript:`, `data:` e `vbscript:` (normalizando espaços/quebras de linha e caixa antes de comparar o esquema).
2. Em `MaxInputMarkdownToolbar.vue:261-267`, aplicar o helper antes do `setLink`: quando inválido, não aplicar o link e sinalizar o erro no próprio popover (não fechar silenciosamente).
3. Fazer o mesmo em `applyImage` (linhas 282-287) antes de `setImage`, permitindo adicionalmente `data:image/*` se isso for um requisito conhecido — ou negando `data:` por completo, se não for.
4. Reforçar em `MaxInputMarkdown.vue:77`: `Link.configure({ openOnClick: false, protocols: ['http', 'https', 'mailto', 'tel'], isAllowedUri: (url) => isSafeUrl(url) })` — defesa em profundidade para conteúdo colado, que não passa pela toolbar.

## Verificação

- Novo teste em `tests/components/MaxInputMarkdownToolbar.test.ts`: digitar `javascript:alert(1)` no popover de link e clicar em OK deve **não** chamar `editor._commands.setLink`.
- Novo teste equivalente para o popover de imagem com `javascript:` e com `data:text/html`.
- Teste de regressão: `https://example.com` continua chamando `setLink` com `{ href: 'https://example.com', target: '_blank' }` (caso já coberto hoje na linha 130 do teste).
- `npx vitest run tests/components/MaxInputMarkdownToolbar.test.ts tests/components/MaxInputMarkdown.test.ts`.
