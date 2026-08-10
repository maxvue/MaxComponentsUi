# MaxInputMarkdownToolbar: metade dos comandos e o comportamento dos popovers sem teste

- **Categoria:** falta-de-teste
- **Severidade:** média
- **Arquivo(s):** `tests/components/MaxInputMarkdownToolbar.test.ts:56-142`, `src/components/MaxInputMarkdownToolbar.vue:253-287`
- **Domínio:** inputs-selecao-arquivo

## Problema

Cobertura atual: **55,2% de statements e 27,5% de functions**. O arquivo de teste tem 8 casos e um `createFakeEditor` bem construído (linhas 11-50) que já expõe **todos** os 17 comandos como spies — mas apenas 5 deles são efetivamente assertados (`toggleBold`, `toggleHeading`, `setLink`, `insertTable`, e `undo`/`redo` indiretamente via `disabled`).

Comandos com spy pronto e nenhuma asserção: `toggleItalic`, `toggleUnderline`, `toggleStrike`, `toggleBulletList`, `toggleOrderedList`, `toggleBlockquote`, `toggleCodeBlock`, `setHorizontalRule`, `unsetAllMarks`/`clearNodes`, `unsetLink`, `setImage`. São 11 botões da toolbar que podem ser quebrados sem que nenhum teste reclame — e a infraestrutura para testá-los já existe, custando uma linha por caso.

Além dos comandos, quatro comportamentos de lógica estão descobertos:

1. **`openLinkPopover` (linhas 253-259)** — três branches sem teste: o pré-preenchimento com o href existente (`getAttributes('link').href`, linha 254), o **toggle** (segunda chamada fecha o popover, linha 256), e o fechamento mútuo do popover de imagem (linha 257). O fake editor já devolve `getAttributes: vi.fn(() => ({ href: '' }))` (linha 45), preparado para o caso, mas nunca é usado com um href real.

2. **`removeLink` (linhas 269-273)** — o botão "Remover" nunca é clicado em teste algum; `unsetLink` tem spy e zero asserções.

3. **`applyLink` com string vazia (linha 262)** — a branch `if (!linkUrl.value)` que chama `unsetLink` em vez de `setLink`. Só o caminho com URL preenchida é testado (linha 127).

4. **Exclusividade mútua dos popovers** — abrir o de imagem deve fechar o de link e vice-versa (linhas 257 e 278). Um bug aqui deixa dois popovers sobrepostos na tela.

5. **`applyImage` (linhas 282-287)** — nenhum teste; nem o caminho feliz (`setImage`), nem o guard de URL vazia.

6. **Teclado nos popovers** — `@keydown.enter.prevent="applyLink"` (linha 154) e `@keydown.escape` (linha 155) são atalhos que o usuário usa naturalmente e nunca foram exercitados.

7. **Foco automático** — `nextTick(() => linkInputRef.value?.focus())` (linhas 258 e 279), relevante para acessibilidade.

## Impacto

Uma toolbar de editor é composta quase inteiramente de handlers pequenos e independentes — exatamente o tipo de superfície que regride sem alarde (um `:class` trocado, um comando renomeado numa atualização do TipTap). Com 11 de 17 comandos sem asserção, a maior parte da toolbar não tem rede de proteção. A ausência de teste nos popovers é mais séria: são os dois únicos pontos com estado local no componente, e é onde a validação de URL (ver o achado de segurança correlato) precisará ser adicionada — sem testes de base, essa mudança entra às cegas.

## Plano de correção

1. **Cobrir os 11 comandos restantes** com um teste parametrizado (`it.each`), mapeando título do botão → nome do comando esperado:
   ```ts
   it.each([
       ['Itálico (Ctrl+I)', 'toggleItalic'],
       ['Sublinhado (Ctrl+U)', 'toggleUnderline'],
       ['Tachado', 'toggleStrike'],
       ['Lista com marcadores', 'toggleBulletList'],
       // ... etc
   ])('clicar em "%s" dispara %s', async (title, command) => { ... });
   ```
   Isso resolve o grosso da lacuna de functions em poucas linhas.
2. **`applyLink` sem URL:** abrir o popover, deixar o input vazio, clicar OK → `unsetLink` chamado, `setLink` não.
3. **`removeLink`:** abrir o popover e clicar em "Remover" → `unsetLink` chamado e popover fechado.
4. **Pré-preenchimento:** com `getAttributes` devolvendo `{ href: 'https://ja.com' }`, abrir o popover deve deixar o input com esse valor.
5. **Toggle:** clicar duas vezes no botão de link fecha o popover.
6. **Exclusividade:** abrir link, depois imagem → só o de imagem está no DOM; e o inverso.
7. **`applyImage`:** com URL preenchida chama `setImage({ src })`; com vazia não chama e mesmo assim fecha o popover.
8. **Teclado:** `trigger('keydown.enter')` no input aplica o link; `keydown.escape` fecha sem aplicar.
9. **Estado limpo:** após aplicar, `linkUrl`/`imageUrl` voltam a `''` (linhas 266 e 286).

## Verificação

- `npx vitest run tests/components/MaxInputMarkdownToolbar.test.ts` verde.
- `npm run test:coverage` deve levar o componente de 55,2% de statements e 27,5% de functions para acima de 90% em ambos — a toolbar é quase toda handlers pequenos, então a cobertura sobe rápido.
- Os 8 testes existentes permanecem inalterados e verdes.
