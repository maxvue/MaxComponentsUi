# Tema impõe `overflow: hidden` e `font-size: 16px !important` no `html`/`body` da app consumidora

- **Categoria:** falha
- **Severidade:** média
- **Arquivo(s):** `src/themes/font.scss:6-13`, `src/themes/app.scss:1-4`
- **Domínio:** build-config

## Problema

O tema, que é injetado automaticamente no `document` ao importar a biblioteca, aplica regras
globais em seletores que pertencem à aplicação consumidora, não à biblioteca:

```scss
// src/themes/font.scss
body, html, #app {
    font-family: Quicksand, sans-serif;
    overflow: hidden;          // linha 9
}

html {
    font-size: 16px !important;  // linha 13
}
```

```scss
// src/themes/app.scss
body, html {
    margin: 0;
    padding: 0;
}
```

Cada uma dessas regras é uma decisão de layout global que uma biblioteca de componentes não
deveria tomar pelo consumidor:

1. **`overflow: hidden` em `html`, `body` e `#app`** — desativa a rolagem da página inteira.
   É uma escolha coerente para uma aplicação com shell de altura fixa (que é presumivelmente
   o caso do app para o qual a lib foi feita), mas quebra qualquer consumidor que espere uma
   página com rolagem normal — um site com conteúdo longo simplesmente fica truncado, sem
   barra de rolagem, e a causa é muito difícil de rastrear até uma dependência de UI.

2. **`font-size: 16px !important` no `html`** — sobrescreve o tamanho de fonte raiz do
   consumidor **e**, por ser `!important`, não pode ser sobreposto por CSS normal da app.
   Pior: isso quebra a preferência de tamanho de fonte do usuário configurada no browser,
   que é um recurso de acessibilidade. Usuários que aumentam a fonte padrão para ler melhor
   têm o ajuste anulado, e como todo o dimensionamento em `rem` deriva daí, o efeito é
   global.

3. **`#app`** — a lib assume que existe um elemento com esse `id` específico e o estiliza.
   É um acoplamento à convenção de nomenclatura da app, não à lib.

Além disso, `margin: 0; padding: 0` em `body`/`html` é um reset — comportamento legítimo de
um reset CSS opt-in, mas não de um tema aplicado automaticamente.

Note que essas regras chegam ao consumidor por dois caminhos: o preflight do preset
(`src/presetMaxUno.ts:99-121`, para quem usa o preset UnoCSS) e o CSS injetado no
`index.es.js` — ou seja, mesmo quem só importa um componente recebe tudo isso.

## Impacto

- Consumidores com layout de página rolável têm o conteúdo truncado sem explicação aparente.
- Regressão de acessibilidade: a preferência de tamanho de fonte do usuário é anulada por um
  `!important` que a app não consegue sobrepor.
- Acoplamento a `#app`, um id que pode não existir ou ter outro significado.

## Plano de correção

1. Separar o que é **tema da biblioteca** (variáveis CSS de cor, tipografia dos componentes
   Max) do que é **shell da aplicação** (`overflow`, `font-size` raiz, reset de
   `margin`/`padding`, `#app`). Só o primeiro grupo deve ir no CSS injetado automaticamente.

2. Mover as regras de shell para uma folha **opt-in** separada, por exemplo
   `dist/themes/app-shell.scss`, que a app importa explicitamente se quiser o comportamento
   de aplicação em tela cheia:

   ```ts
   import '@maxvue/max-components-ui/themes/app-shell.css';
   ```

3. Remover o `!important` de `font-size` em qualquer caso. Se um tamanho base for mesmo
   necessário, aplicá-lo num container da lib, não em `html`, e preferir unidades relativas
   para não quebrar a preferência do usuário.

4. Restringir `font-family` a um escopo da biblioteca (ex.: uma classe raiz `.max-root` ou os
   próprios componentes), em vez de `body, html, #app`.

5. Documentar a mudança no README — para o app que já dependia do shell embutido, isso é
   breaking e exige o import adicional.

## Verificação

- Criar uma página de teste com conteúdo mais alto que a viewport, importar apenas
  `MaxButton`, e confirmar que a página **rola** normalmente.
- Alterar o tamanho de fonte padrão do browser para 20px e confirmar que a UI acompanha, em
  vez de ficar travada em 16px.
- Confirmar que os componentes Max continuam com a tipografia e as cores corretas sem o
  import do shell.
- `grep -c "overflow: hidden" dist/index.es.js` não deve mais casar com a regra de
  `html`/`body`.
