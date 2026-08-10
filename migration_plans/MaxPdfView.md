# Plano de Migração — MaxPdfView

> Plano autossuficiente. Uma IA futura deve conseguir executá-lo lendo apenas este
> arquivo e o código-fonte referenciado. **Não** alterar código durante a leitura do plano.
> Objetivo: remover a dependência do PrimeVue no `MaxPdfView`, preservando API pública,
> estilos e comportamento. **Não** tocar em `vue-pdf-embed` nem em `useWindowSize`.

---

## 1. Componente

- **Nome:** `MaxPdfView`
- **Caminho:** `src/components/MaxPdfView.vue`
- **Nível de dificuldade:** `baixa`
- **Aliases exportados** (`src/index.ts`, linha 93):
  ```ts
  export { default as MaxPdfView } from './components/MaxPdfView.vue';
  ```
  Existe **um único** export para este componente. Preservá-lo exatamente. Nenhum outro
  alias precisa ser criado ou removido.
- **Resumo da migração:** o único ponto de contato com o PrimeVue é o `ProgressSpinner`
  usado na tela de "Loading". Substituí-lo por um spinner puramente CSS (elemento nativo
  `<div>` com animação `@keyframes`). Toda a renderização de PDF (`vue-pdf-embed`), o
  cálculo de tamanho via `useWindowSize`, o zoom, a paginação e as transições permanecem
  **inalterados**.

---

## 2. Dependências do PrimeVue (trechos reais)

Única dependência direta do PrimeVue neste componente.

**Import** (`src/components/MaxPdfView.vue`, linha 43):
```ts
import ProgressSpinner from 'primevue/progressspinner';
```

**Uso no template** (linhas 10-12):
```html
<div class="circle">
    <ProgressSpinner style="width: 50px; height: 50px;" strokeWidth="7" animationDuration=".5s" aria-label="Custom ProgressSpinner"></ProgressSpinner>
</div>
```

O que o `ProgressSpinner` do PrimeVue faz e precisa ser reproduzido:
- Renderiza um SVG circular animado (um `<svg class="p-progressspinner-svg">` com um
  `<circle class="p-progressspinner-circle">`) que gira continuamente. Há duas animações
  simultâneas no preset padrão: uma rotação do container (`p-progressspinner-rotate`) e uma
  animação de traço (`dash`) + variação de cor. Para efeito visual dentro de um overlay
  escuro de PDF, um **spinner circular simples de cor sólida girando** é suficiente e
  visualmente equivalente ao percebido pelo usuário.
- Props usadas: dimensão `50px x 50px` (via `style` inline), `strokeWidth="7"` (espessura
  do traço), `animationDuration=".5s"` (duração de uma volta), `aria-label` para
  acessibilidade. Todos esses valores devem ser mapeados para o spinner CSS.

Não há dependência de `useToast`, `usePrimeVue`, diretivas do PrimeVue nem de nenhum outro
componente PrimeVue neste arquivo. Confirmado por leitura integral do arquivo (174 linhas).

---

## 3. Dependências internas

- **`@maxvue/max-use` → `useWindowSize`** (linha 41):
  ```ts
  import { useWindowSize } from '@maxvue/max-use';
  ```
  Reexport do VueUse (fonte: `../MaxUse/src/Helpers/VueUse/index.ts`, linhas 479-480:
  `export const useWindowSize = vueUseCore.useWindowSize;`). Retorna refs reativos
  `{ width, height }` da janela. **Manter exatamente como está.** Não é PrimeVue.
- **`vue-pdf-embed` → `VuePdfEmbed`** (linha 44): componente de renderização de PDF. **Não é
  PrimeVue. Manter exatamente como está** (props `:annotation-layer`, `:textLayer`,
  `:source`, `:width`, `:height` e eventos `@rendered`, `@loaded`, `@progress`).
- **`./MaxButton.vue` → `MaxButton`** (linha 45): componente Max interno, usado na barra de
  ferramentas de zoom/fechar. **Não é PrimeVue diretamente aqui. Manter como está.** (Se
  `MaxButton` ainda depender de PrimeVue internamente, isso é escopo de outro plano — não
  mexer nele por este plano.)
- **`vue`** (linha 42): `ref`, `watch`. Manter.

---

## 4. API pública a preservar

Nada da API pública muda. Enumerada para verificação pós-migração:

- **Props** (linhas 49-52):
  - `file` (default `''`): URL ou fonte do arquivo PDF. Assinatura e default preservados.
- **Comportamento observável:**
  - Ao alterar `props.file` (watcher, linhas 89-95): reinicia estado (`opacity=0`,
    `isLoading=true`, `percent=0`, `total=0`) e abre o modal (`is_open=true`).
  - Tela de loading com texto "Loading", spinner e "{{ percent }}%" (linhas 7-15).
  - Renderização do PDF com cabeçalho "Página X de Y" por página (linhas 19-23).
  - Barra de ferramentas fixa com zoom-out, zoom-in e fechar (linhas 28-32).
  - Zoom altera `size.width` em ±5% (linhas 55-59).
  - `closePDF` faz fade-out (`opacity=0`) e fecha após 500ms (linhas 82-87).
  - Eventos do PDF: `rendered` (esconde loading, opacity 0.9), `loaded` (define `total`,
    opacity 1), `progressPdf` (calcula `percent`, cap em 98).
- **Emits:** nenhum (`defineEmits` não existe no componente). Não adicionar.
- **Slots:** nenhum exposto ao consumidor (o `#before-page` é interno ao `VuePdfEmbed`).

Todos os itens acima devem permanecer idênticos após a migração. **A única mudança visível
no template é a substituição do elemento `<ProgressSpinner>` por um `<div>` de spinner CSS.**

---

## 5. Estratégia de substituição (só o ProgressSpinner precisa mudar)

Substituir o `ProgressSpinner` do PrimeVue por um spinner CSS puro, mantendo o mesmo tamanho,
espessura de traço e duração de animação percebidos.

1. **Remover** o import `import ProgressSpinner from 'primevue/progressspinner';` (linha 43).
2. **Substituir** o elemento `<ProgressSpinner .../>` (linhas 10-12) por um `<div>` com classe
   dedicada (ex.: `max-spinner`) que renderiza um círculo girando via `border` + `@keyframes`.
3. **Adicionar** ao bloco `<style scoped lang="scss">` as regras da nova classe, replicando os
   parâmetros do uso original:
   - largura/altura: `50px`
   - espessura do traço (`strokeWidth="7"`): `border-width: 7px`
   - duração da animação (`animationDuration=".5s"`): `animation-duration: .5s`
   - cor: usar um tom claro coerente com o overlay escuro (o texto/percent usam
     `rgb(255 255 255 / 50%)`); usar branco para o arco ativo e transparente para o resto,
     ou uma variável do tema Max (ex.: `var(--max-primary-500)`) se o design assim preferir.
     Manter contraste sobre fundo `rgb(0 0 0 / 90%)`.
   - acessibilidade: preservar `aria-label` movendo-o para o `<div>` (com `role="status"`).

Nenhuma outra parte do `<script>` ou `<template>` deve ser alterada.

### Template — antes → depois (proposta)

Antes (linhas 10-12):
```html
<div class="circle">
    <ProgressSpinner style="width: 50px; height: 50px;" strokeWidth="7" animationDuration=".5s" aria-label="Custom ProgressSpinner"></ProgressSpinner>
</div>
```

Depois (proposta — respeitar 4 espaços de indentação, aspas simples no script):
```html
<div class="circle">
    <div class="max-spinner" role="status" aria-label="Custom ProgressSpinner"></div>
</div>
```

---

## 6. Passos de implementação

1. Abrir `src/components/MaxPdfView.vue`.
2. **Remover** a linha 43: `import ProgressSpinner from 'primevue/progressspinner';`.
3. No template, **trocar** o elemento `<ProgressSpinner .../>` (linhas 10-12) pelo
   `<div class="max-spinner" role="status" aria-label="Custom ProgressSpinner"></div>`,
   mantendo o wrapper `<div class="circle">`.
4. No `<style scoped lang="scss">`, **adicionar** a classe `.max-spinner` com o
   `@keyframes` de rotação (ver seção 7). Colocar dentro do escopo do arquivo (bloco scoped
   já existente, linhas 98-174).
5. Não alterar `<script setup>` além da remoção do import. Manter `ref`, `watch`,
   `useWindowSize`, `VuePdfEmbed`, `MaxButton`, todas as funções e o watcher intactos.
6. Rodar `npm run type-check` e `npm run lint` (auto-fix) para garantir conformidade
   (4 espaços, aspas simples, ponto e vírgula, sem trailing comma).
7. Verificar visualmente no playground (`npm run dev:playground`) que o spinner aparece
   girando na fase de loading e desaparece após `rendered`.
8. **Não** é necessário rodar `generateResolver.ts` (nenhum arquivo `.vue` novo foi criado).

Ordem dos blocos no arquivo já está correta (Template → comentário JSDoc → Script → Style);
manter. Observação: o bloco de comentário JSDoc (linhas 36-39) está fora de qualquer tag —
não movê-lo nem removê-lo neste plano (fora do escopo).

---

## 7. Estilos

Adicionar ao bloco `<style scoped lang="scss">` (proposta):

```scss
.max-spinner {
    width: 50px;
    height: 50px;
    border: 7px solid rgb(255 255 255 / 20%);
    border-top-color: rgb(255 255 255 / 90%);
    border-radius: 50%;
    animation: max-spinner-rotate 0.5s linear infinite;
}

@keyframes max-spinner-rotate {
    to {
        transform: rotate(360deg);
    }
}
```

Notas:
- `border: 7px` reproduz `strokeWidth="7"`.
- `50px x 50px` reproduz o `style` inline original.
- `animation ... 0.5s` reproduz `animationDuration=".5s"`.
- Cor: arco claro sobre fundo escuro (coerente com `.texto`/`.percent` que usam
  `rgb(255 255 255 / 50%)`). Ajustável para `var(--max-primary-500)` se o design preferir.
- A classe `.circle` já é usada como wrapper no template original (linha 10); ela **não**
  possui regra CSS própria no arquivo atual — o espaçamento vem do layout `grid` de
  `.conjunto`. Preservar o wrapper para não alterar o layout. Verificar visualmente que o
  centro do spinner permanece alinhado com "Loading"/"{{ percent }}%".
- Os `@keyframes` `v-enter-active`/`v-leave-active` (transições, linhas 165-173) **não**
  mudam. O novo `@keyframes max-spinner-rotate` não conflita com eles.
- Todas as demais regras SCSS (linhas 99-163) permanecem intactas.

---

## 8. Testes / verificação

Não há arquivo de teste dedicado localizado para este componente; se for criado, seguir o
setup de `tests/` (Vitest + `@vue/test-utils` + `happy-dom`, `tests/setup.ts`). Verificações
mínimas (manuais ou automatizadas):

1. **Sem referência a PrimeVue:** confirmar que `grep -n "primevue" src/components/MaxPdfView.vue`
   não retorna nada e que `ProgressSpinner` não aparece mais no arquivo.
2. **Type-check:** `npm run type-check` sem erros novos.
3. **Lint:** `npm run lint` sem erros (indentação de 4 espaços, aspas simples, `;`).
4. **Montagem:** o componente monta sem PrimeVue registrando `ProgressSpinner` globalmente.
   (Teste sugerido: `mount(MaxPdfView)`, alterar `file` via prop → `is_open` fica true →
   existe `.max-spinner` no DOM durante loading.)
5. **Comportamento de PDF:** no playground, abrir um PDF; confirmar loading com spinner
   girando, percent atualizando, render final, zoom in/out e fechar funcionando.
6. **API:** prop `file` continua controlando a abertura via watcher; default `''`.
7. **Acessibilidade:** `role="status"` + `aria-label="Custom ProgressSpinner"` presentes no
   spinner CSS.

Comando para rodar um teste específico, se criado:
```bash
npx vitest run tests/components/MaxPdfView.test.ts
```

---

## 9. Skills necessárias (caminho + justificativa)

- **`.claude/skills/vue-pdf-viewer-best-practices/SKILL.md`**
  Justificativa: o componente usa `vue-pdf-embed` (`VuePdfEmbed`) para renderizar o PDF, com
  props de camadas (`:annotation-layer`, `:textLayer`), `:source`, dimensões e eventos
  (`@rendered`, `@loaded`, `@progress`). Esta skill documenta o uso correto dessas props
  (ex.: sempre passar booleanos com prefixo `:`), tratamento de status de carregamento e
  limpeza de memória. Consultá-la garante que a parte de PDF (que **não** deve mudar) não
  seja quebrada acidentalmente durante a edição do spinner.
- **`.claude/skills/vue-unocss-styling-best-practices/`** (opcional/apoio)
  Justificativa: o projeto usa UnoCSS + SCSS com variáveis do tema Max
  (`var(--background-750)`, etc.). Útil se o executor optar por usar uma variável de tema
  (ex.: `var(--max-primary-500)`) na cor do spinner em vez de branco fixo.
- **`.claude/skills/vue-max-components-ui-development-best-practices/`** (opcional/apoio)
  Justificativa: reforça convenções da biblioteca (`<script setup lang="ts">`, ordem de
  blocos, aliases em `src/index.ts`) — relevante para manter conformidade sem introduzir
  regressões.

Skills **não** relevantes para este componente (não usar): qualquer `adonisjs-*`,
`laravel-*`, skills de AI/agents, MCP, testing backend, etc. Escopo é puramente frontend Vue.

---

## 10. Riscos e pontos de atenção

- **Escopo estrito:** a única mudança permitida é o `ProgressSpinner`. Resistir à tentação de
  "melhorar" a renderização de PDF, o zoom, o watcher ou o comentário JSDoc solto (linhas
  36-39). Fora de escopo.
- **Booleanos do `VuePdfEmbed`:** não tocar, mas notar que `:annotation-layer="false"` e
  `:textLayer="false"` já usam binding correto — não converter para string ao editar arquivos
  vizinhos.
- **Alinhamento visual do spinner:** o CSS original do PrimeVue tinha animação dupla
  (rotação + dash). O spinner CSS proposto usa só rotação; validar visualmente que o
  resultado é aceitável sobre o overlay escuro. Ajustar cor/espessura se necessário.
- **`.circle` sem regra própria:** confirmar que o layout de `.conjunto` (grid) mantém o
  spinner centralizado após a troca; o percent usa `transform: translateY(-39px)` (linha 133)
  que depende da altura do bloco do spinner — manter o spinner com `50px` de altura para não
  deslocar o "{{ percent }}%".
- **`MaxButton` interno:** este plano não migra `MaxButton`. Se `MaxButton` ainda importar
  PrimeVue, isso é tratado em outro plano; não alterar aqui.
- **Global PrimeVue:** após remover o import, garantir que nenhum teste/uso dependa de
  `ProgressSpinner` ter sido registrado por este arquivo (não é o caso — o import era local).
- **Convenções:** manter 4 espaços de indentação, aspas simples no `<script>`, ponto e vírgula,
  sem trailing comma, e ordem Template → Script → Style. Rodar `npm run lint` ao final.
