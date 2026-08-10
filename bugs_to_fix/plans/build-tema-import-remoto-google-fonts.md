# Tema faz `@import` remoto de Google Fonts, embutido no CSS injetado da biblioteca

- **Categoria:** performance
- **Severidade:** média
- **Arquivo(s):** `src/themes/font.scss:2`, `src/themes/app.scss:6-8`
- **Domínio:** build-config

## Problema

`src/themes/font.scss` começa com um import remoto:

```scss
// FONTES DO GOOGLE
@import 'https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap';
```

Esse arquivo entra no `all.scss` (`src/themes/all.scss`), que é compilado pelo preflight do
preset (`src/presetMaxUno.ts:113`) e, no caminho do `index.es.js`, acaba injetado no
`document` em runtime pelo `vite-plugin-css-injected-by-js`.

Três consequências:

1. **Requisição de rede bloqueante fora do controle do consumidor.** Um `@import` no topo de
   uma folha de estilo é *render-blocking*: o browser precisa buscar
   `fonts.googleapis.com` antes de terminar de aplicar o CSS. Como o CSS é injetado via JS,
   isso acontece tarde no ciclo de carregamento, o pior momento possível. E a app consumidora
   não tem como desativar ou pré-conectar (`<link rel="preconnect">`), porque o import está
   enterrado no bundle da lib.

2. **Implicação de privacidade/conformidade.** Toda app que usar a lib passa a fazer
   requisições para servidores do Google, transmitindo IP e User-Agent do usuário final. Em
   contextos sujeitos a LGPD/GDPR isso é uma decisão que precisa ser do consumidor, não
   imposta silenciosamente por uma dependência de UI. Tribunais europeus já trataram o
   Google Fonts embutido como transferência de dados não consentida.

3. **Falha offline / ambiente fechado.** Em intranets ou builds air-gapped o import falha e a
   tipografia degrada silenciosamente para o fallback.

Há ainda uma **inconsistência entre os dois arquivos de fonte**:

- `app.scss:6-8` define `--font-sans` como `'Instrument Sans', ui-sans-serif, ...`
- `font.scss:6-8` aplica `font-family: Quicksand, sans-serif` em `body, html, #app`

Ou seja, a variável `--font-sans` anuncia *Instrument Sans* — uma fonte que não é importada
em lugar nenhum e portanto nunca carrega — enquanto o que de fato se aplica é *Quicksand*.
Quem usar `var(--font-sans)` num componente recebe uma fonte inexistente e cai no
`ui-sans-serif`, divergindo visualmente do resto da aplicação.

## Impacto

- Carregamento bloqueante e não otimizável nas apps consumidoras.
- Requisições a terceiros impostas de forma não configurável, com implicação de conformidade.
- Tipografia inconsistente entre quem usa `var(--font-sans)` e quem herda do `body`.

## Plano de correção

1. Remover o `@import` remoto de `src/themes/font.scss` e passar a responsabilidade de
   carregar a fonte para a app consumidora, documentando no README o `<link>` recomendado:

   ```html
   <link rel="preconnect" href="https://fonts.googleapis.com">
   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
   <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300..700&display=swap" rel="stylesheet">
   ```

   Assim o consumidor controla origem, `preconnect` e política de privacidade.

2. Alternativa para quem quiser zero configuração: distribuir os arquivos `.woff2` da
   Quicksand dentro de `dist/themes/` e declarar `@font-face` local, eliminando a dependência
   de rede externa. A fonte tem licença SIL OFL, que permite redistribuição.

3. Reconciliar a inconsistência: decidir qual é a fonte oficial do tema e alinhar
   `--font-sans` em `app.scss` com o `font-family` de `font.scss`. Se for Quicksand, a
   variável deve ser `--font-sans: Quicksand, ui-sans-serif, system-ui, sans-serif, ...`.

4. Preferir `@use` a `@import` no restante do SCSS — `@import` está formalmente depreciado no
   Sass e emitirá avisos crescentes. `all.scss` já usa `@use` corretamente; `font.scss` é a
   exceção.

## Verificação

- Buildar e confirmar que o CSS gerado não contém mais `fonts.googleapis.com`:
  `grep -c "googleapis" dist/index.es.js` retorna 0.
- Rodar `npm run dev:playground` com o `<link>` no HTML e confirmar que a tipografia
  permanece idêntica à atual.
- Confirmar em DevTools (aba Network, offline) que nenhuma requisição a domínio do Google
  parte da lib.
- Confirmar que `var(--font-sans)` e a fonte herdada do `body` resolvem para a mesma família.
