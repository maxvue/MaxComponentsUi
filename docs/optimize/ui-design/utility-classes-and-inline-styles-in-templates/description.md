# Achado de UI & Design: Classes Utilitárias, Atributos de Estilo e CSS Inline nos Templates

## 1. Identificação e Sumário Executivo

- **Identificador:** `utility-classes-and-inline-styles-in-templates`
- **Categoria:** Proibição de Utilitários e Estilização Inline no Template (GEMINI.md — Seção 1 e Seção 2)
- **Severidade:** Alta (Violação Direta da Regra Primária de Estilização do Design System)
- **Impacto:** Utilização de classes utilitárias em `:class`, atributos utilitários de estilo (`[flex]`, `[full]`, `[slim]`), classes de tipografia helper e dezenas de propriedades CSS inline através de atributos `style` e `:style` estáticos nos templates.
- **Componentes mais Críticos:**
  - [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue): Injeção condicional de `text-center` e `text-right` no template; atributos utilitários de estilização inline (`[flex]`, `[full]`, `[slim]`, `[no-border]`).
  - [`src/components/MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue): Classes utilitárias `text-h1` e `text-h2` no template.
  - [`src/components/MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue): `:style="'letter-spacing: 2.5px;'"` inline no template.
  - [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue): `style="display: none;"` inline no template.
  - [`src/components/MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue): `style="height: 300px; width: 300px;"` inline no template.
  - [`src/components/MaxLoaderAi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue): `style="height: 400px; width: 400px;"` inline no template.
  - [`src/components/MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue): `style="display: grid; white-space: nowrap;"` inline no template.
  - [`src/components/MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue): `:style="{ width: '30px' }"` inline no template.

---

## 2. Descrição e Contexto do Problema

O `GEMINI.md` impõe diretrizes estritas e inegociáveis:
> **1. Proibição Absoluta de Classes Utilitárias e Atributos de Estilo no Template**
> - **É ESTRITAMENTE PROIBIDO** utilizar classes utilitárias de estilo inline dentro dos atributos `class` ou `:class` nos templates dos componentes Vue (ex.: `class="flex p-30"`, `class="text-xs pt-1"`, `class="mb-2"`, `class="w-full flex"` são terminantemente proibidas).
> - **É ESTRITAMENTE PROIBIDO** utilizar atributos de utilitários no modo UnoCSS Attributify diretamente nas tags do template (ex.: `<div flex>`, `<div s100>`, `<div w-full>`, `<div gap-4>`, `<div pb-15>`, `<MaxIcon ml-5 />` são terminantemente proibidos).
> - Nenhum elemento deve carregar utilitários de margem, padding, tipografia, dimensionamento, posicionamento, alinhamento ou flexbox/grid através de classes utilitárias ou atributos no template. Todo o estilo deve ser semântico.
>
> **2. O Único Meio Permitido: Seção `<style lang="scss" scoped>`**
> - O único meio autorizado para aplicar estilização aos componentes Vue é através da tag de estilo do componente.

A auditoria comprovou que, embora classes óbvias como `flex` ou `p-30` tenham sido reduzidas, **o código migrou o vício de estilização utilitária para outros canais proibidos**:
1. **Injeção de Classes Utilitárias no Wrapper Base:** Em [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue), classes utilitárias (`text-center`, `text-right`) são montadas dinamicamente via interpolação de strings no `:class`.
2. **Atributos Utilitários como Chaves de Estilo (Pseudo-Attributify):** O componente [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue) define no seu SCSS seletores de atributos utilitários como `&[full]`, `&[flex]`, `&[slim]`, `&[no-border]`. Esses atributos atuam exatamente como utilitários de layout e dimensionamento no template (ex.: `<InputBase full flex no-border />`), violando o princípio semântico.
3. **Estilos Estáticos Inline no Template:** Propriedades como `display: none;`, `letter-spacing: 2.5px;`, `height: 300px; width: 300px;` e `display: grid; white-space: nowrap;` foram declaradas diretamente no HTML via `style="..."` ou `:style="..."`, contornando completamente o isolamento do `<style lang="scss" scoped>`.

---

## 3. Evidências Comprovadas no Código

### A. Injeção de Utilitários em `:class` e Atributos de Estilo

- [`src/components/InputBase.vue:L2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L2):
  ```html
  <div class="max-input-base max-input-main-div" :class="`${props.float !== undefined ? 'float' : ''} ${done ? 'done' : ''} ${!noStatus && caution ? 'caution' : ''} ${textCenter ? 'text-center' : ''} ${textRight ? 'text-right' : ''} ${props.class ? props.class : ''} ${!noStatus &&  isError ? 'error' : ''} ${inLine ? 'in-line' : ''}`">
  ```
  O template concatena classes utilitárias `text-center` e `text-right` diretamente via interpolação de strings.
- [`src/components/InputBase.vue:L515-L533`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L515-L533):
  ```scss
  &[full],
  &[flex] {
      width: 100% !important;
      height: 100% !important;

      :deep(input) {
          width: 100% !important;
          height: 100% !important;
          padding: 0 10px !important;
      }
  }

  &[slim],
  &[input-click] {
      grid-template-rows: 20px;
      height: 20px;
  }
  ```
  Atributos utilitários embutidos diretamente no componente base para simular classes utilitárias.
- [`src/components/MaxTitle2.vue:L8-L9`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L8-L9):
  ```html
  <div v-if="resolvedTitle" class="text-h1">{{ resolvedTitle }}</div>
  <div v-if="resolvedSubtitle" class="text-h2" v-html="resolvedSubtitle"></div>
  ```
  Nomenclatura típica de classes utilitárias de framework CSS em vez de classes semânticas (`.title-heading`, `.subtitle-heading`).

### B. Estilos Estáticos em Atributos `style` e `:style` no Template

- [`src/components/MaxInputCpfCnpj.vue:L10`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue#L10):
  ```html
  <input
      type="text"
      class="p-inputtext p-component"
      :value="masked_value"
      v-maska="maskValue"
      :disabled="props.disabled"
      @input="onUserInput"
      :style="`letter-spacing: 2.5px;`"
  />
  ```
  Propriedade CSS estática injetada via template string inline.
- [`src/components/MaxInputFileUpload.vue:L7`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L7):
  ```html
  <input type="file" ref="fileInput" @change="onFileSelect" style="display: none;" />
  ```
- [`src/components/MaxInputFileUploadBig.vue:L15, L24`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue#L15):
  ```html
  <div class="upload-dropzone" style="height: 300px; width: 300px;">
  ```
- [`src/components/MaxLoaderAi.vue:L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue#L5):
  ```html
  <div class="loader-ai-canvas" style="height: 400px; width: 400px;">
  ```
- [`src/components/MaxTagSelect.vue:L101`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L101):
  ```html
  <div style="display: grid; white-space: nowrap;">
  ```
- [`src/components/MaxInputSelect.vue:L91, L122`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L91):
  ```html
  <div :style="{ width: '30px' }">
  ```

---

## 4. Impacto no Sistema e Riscos

1. **Quebra de Manutenibilidade e Escalabilidade:** Estilos declarados diretamente no template não se beneficiam de variáveis SCSS, mixins, nesting ou regras de especificidade do CSS scoped.
2. **Impossibilidade de Sobrescrita Temática e Dark Mode:** Propriedades em atributos `style` possuem especificidade máxima inline (1, 0, 0, 0), impedindo que o tema claro/escuro ou variantes do design system customizem o componente via CSS.
3. **Violação das Políticas do Repositório:** A existência de utilitários e CSS inline no template contraria frontalmente a política de "zero classes utilitárias" estipulada no `GEMINI.md`.

---

## 5. Plano de Resolução Recomendado

1. **Migrar Todos os Estilos Inline para `<style lang="scss" scoped>`:**
   - Em [`MaxInputCpfCnpj.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCpfCnpj.vue), remover `:style="letter-spacing: 2.5px;"` e adicionar classe semântica `.cpf-cnpj-input { letter-spacing: 2.5px; }` no bloco `<style lang="scss" scoped>`.
   - Em [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue), substituir `style="display: none;"` por classe semântica `.hidden-file-input { display: none; }`.
   - Em [`MaxInputFileUploadBig.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUploadBig.vue) e [`MaxLoaderAi.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLoaderAi.vue), transferir dimensões fixas para classes de container no SCSS.
   - Em [`MaxTagSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue) e [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue), remover `style="display: grid; white-space: nowrap;"` e `:style="{ width: '30px' }"`, encapsulando no SCSS aninhado.
2. **Refatorar [`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue):**
   - Substituir interpolações de strings por classes semânticas tipadas e canônicas no padrão Vue (`is-text-centered`, `is-text-right`, `is-full-width`, `is-slim`).
   - Substituir seletores de atributos (`&[flex]`, `&[full]`, `&[no-border]`) por modificadores de classe (`&.is-flex`, `&.is-fluid`, `&.no-border`).
3. **Renomear Classes em [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue):**
   - Substituir `.text-h1` por `.title-heading` e `.text-h2` por `.subtitle-heading`.
