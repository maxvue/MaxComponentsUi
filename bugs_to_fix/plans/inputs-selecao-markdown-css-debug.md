# CSS de depuração (borda vermelha / outline azul) enviado em produção no MaxInputMarkdown

- **Categoria:** bug
- **Severidade:** alta
- **Arquivo(s):** `src/components/MaxInputMarkdown.vue:125-127`
- **Domínio:** inputs-selecao-arquivo

## Problema

O bloco `<style lang="scss">` do componente abre com:

```scss
.max-input-markdown {
    border: 1px solid red !important;
    outline: 1px solid blue !important;
```

Isso é claramente CSS de depuração esquecido: uma borda vermelha de 1px e um outline azul de 1px, ambos com `!important`, aplicados na raiz do componente (`InputBase` recebe `class="max-input-mark-down"`... na verdade a classe aplicada é `max-input-mark-down`, enquanto o seletor de estilo é `.max-input-markdown` — ver também o segundo problema abaixo).

Há na verdade **dois** defeitos acoplados nessas linhas:

1. As declarações `border: 1px solid red !important` e `outline: 1px solid blue !important` são visualmente inaceitáveis em qualquer tela de produção.
2. O template aplica `class="max-input-mark-down"` (linha 2), com um hífen a mais, enquanto todo o bloco de estilo usa `.max-input-markdown`. Ou seja, hoje **nenhum** dos estilos do componente (incluindo tipografia do ProseMirror, tabelas, código, blockquote, listas) está sendo aplicado — o componente renderiza sem estilização, e a "borda vermelha" só não aparece por causa desse mesmo erro de digitação. Corrigir apenas um dos dois defeitos torna o outro visível/ativo.

## Impacto

Enquanto a divergência de classe existir, o editor markdown renderiza sem nenhuma estilização de conteúdo (headings, listas, tabelas, blocos de código e placeholder todos sem estilo), degradando severamente a usabilidade do editor. No momento em que alguém corrigir a classe do template sem remover o CSS de depuração, todos os campos markdown da aplicação passarão a exibir borda vermelha e outline azul — um defeito visual gritante em produção.

## Plano de correção

1. Em `src/components/MaxInputMarkdown.vue:125-127`, remover as duas declarações de depuração, deixando o seletor `.max-input-markdown { ... }` iniciar diretamente pelo `.max-input-markdown__editor-wrap`.
2. Padronizar a classe: alterar o template (linha 2) de `class="max-input-mark-down"` para `class="max-input-markdown"`, alinhando com o restante dos nomes BEM já usados (`max-input-markdown__editor-wrap`, `max-input-markdown__content`, `max-input-markdown__prosemirror`).
3. Verificar visualmente no playground (`npm run dev:playground`) que headings, listas, tabelas, código e blockquote passaram a receber os estilos definidos.

## Verificação

- `npx vitest run tests/components/MaxInputMarkdown.test.ts` continua verde.
- Adicionar um teste que asserte `wrapper.find('.max-input-markdown').exists() === true` (hoje falharia, pois a classe real é `max-input-mark-down`).
- Inspeção manual no playground: o campo não deve exibir borda vermelha nem outline azul, e o conteúdo formatado deve estar estilizado.
- `npm run lint` (Stylelint) sem novos avisos.
