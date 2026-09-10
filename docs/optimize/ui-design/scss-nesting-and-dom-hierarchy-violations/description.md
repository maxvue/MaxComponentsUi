# Achado de UI & Design: Violações de Aninhamento Estrito SCSS e Discrepâncias na Hierarquia DOM

## 1. Identificação e Sumário Executivo

- **Identificador:** `scss-nesting-and-dom-hierarchy-violations`
- **Categoria:** Aninhamento Obrigatório Conforme a Hierarquia do Template (GEMINI.md — Seção 3)
- **Severidade:** Média-Alta (Manutenibilidade, Rastreabilidade e Coerência Estrutural)
- **Impacto:** 31 componentes apresentam quebra de aninhamento estrito, possuindo múltiplos blocos raiz independentes no mesmo `<style lang="scss" scoped>`, seletores que pulam nós intermediários da DOM do template ou SCSS completamente desconectado da marcação.
- **Componentes mais Críticos:**
  - [`src/components/MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue): SCSS totalmente plano, sem seletor raiz do componente, contendo regras de autocomplete inexistentes e classes de teste mortas (`.tst1`, `.tst2`).
  - [`src/components/MaxTitle1.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle1.vue) e [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue): Desalinhamento entre o DOM do template (com `<div>` anônimo intermediário) e o aninhamento SCSS.
  - [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue): Seletor órfão `.icon-button-b` desaninhado no final do bloco de estilo.
  - [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue): 8 blocos de seletores raiz independentes no mesmo arquivo.
  - [`src/components/MaxImage.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue), [`MaxDrawer.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue), [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue), [`MaxPdfView.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue): Múltiplos nós raiz e classes de transição desaninhadas.

---

## 2. Descrição e Contexto do Problema

O `GEMINI.md` impõe a regra obrigatória de estrutura no SCSS:
> **3. Aninhamento Obrigatório Conforme a Hierarquia do Template**
> - Toda estilização na seção `<style lang="scss" scoped>` deve ser estruturada com seletores semânticos descritivos (ex.: `.title-icon`, `.upload-loading-state`, `.t1-main-text`).
> - Os blocos e regras no SCSS DEVEM obrigatoriamente ser **aninhados espelhando a árvore DOM e a hierarquia do template**:
>   ```html
>   <!-- Exemplo no Template -->
>   <template>
>       <div class="max-card">
>           <div class="card-header">
>               <span class="card-title">{{ title }}</span>
>           </div>
>       </div>
>   </template>
>
>   <!-- Exemplo Correto no SCSS Aninhado -->
>   <style lang="scss" scoped>
>   .max-card {
>       .card-header {
>           .card-title { ... }
>       }
>   }
>   </style>
>   ```
> - Para estilizar elementos fora da raiz do componente montados no body, utilize `:global(...)` ou aninhe sob a classe raiz do overlay.

A auditoria comprovou desvios notáveis dessa regra:
1. **Desconexão Total do Template:** Em [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue), o SCSS não possui nenhum seletor com o nome da classe raiz declarada no template (`.max-input-search` ou `.input-search-main-div`). O arquivo é uma coleção de seletores planos e regras `:deep(.p-autocomplete*)` herdadas de um componente antigo de busca que nem mais existe ali.
2. **Pulo de Nós Intermediários do DOM:** Em [`MaxTitle1.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle1.vue) e [`MaxTitle2.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue), o template possui um nó `<div>` intermediário sem classe que envolve os títulos e subtítulos. No SCSS, no entanto, as classes dos títulos são declaradas como filhas diretas da raiz (`.max-title-1 { .t1-main-text { ... } }`), violando o espelhamento estrito da árvore DOM.
3. **Múltiplos Seletores Raiz Desaninhados:** Em vez de manter um único bloco raiz representativo do componente com aninhamento estrito de todos os seus elementos filhos, mais de 30 arquivos espalham seletores de nível zero pelo SCSS, gerando código plano e desordenado.

---

## 3. Evidências Comprovadas no Código

### A. O Caso Crítico de `MaxInputSearch.vue`

- **Template:**
  [`src/components/MaxInputSearch.vue:L1-L5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L1-L5):
  ```html
  <template>
      <InputBase class="max-input-search input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'">
          <input type="text" class="p-inputtext" v-bind="attrs" :value="temp_value" @input="onInput" />
      </InputBase>
  </template>
  ```
- **Bloco SCSS Real:**
  [`src/components/MaxInputSearch.vue:L52-L74`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L52-L74):
  ```scss
  <style lang="scss" scoped>
      :deep(.p-autocomplete-option) {
          padding: 0 !important;
      }

      :deep(.p-autocomplete-list) {
          gap: 5px !important;
      }

      :deep(.p-autocomplete-overlay) {
          z-index: 99999 !important;
      }

      .tst1 {
          padding-left: 20px;
          font-weight: 300;
          color: var(--background-650);
      }

      .tst2 {
          font-weight: 600;
      }
  </style>
  ```
  O SCSS é completamente desvinculado do template. Não há menção a `.max-input-search`, o componente não tem nenhum autocomplete, e classes de teste (`.tst1`, `.tst2`) foram esquecidas no código de produção.

### B. Quebra de Hierarquia em `MaxTitle1.vue` e `MaxTitle2.vue`

- **Template em `MaxTitle2.vue`:**
  [`src/components/MaxTitle2.vue:L2-L11`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L2-L11):
  ```html
  <div class="max-title-2">
      <MaxIcon ... class="title-icon" />
      <div> <!-- Nó intermediário sem classe! -->
          <div v-if="resolvedTitle" class="text-h1">{{ resolvedTitle }}</div>
          <div v-if="resolvedSubtitle" class="text-h2" v-html="resolvedSubtitle"></div>
      </div>
  </div>
  ```
- **SCSS em `MaxTitle2.vue`:**
  [`src/components/MaxTitle2.vue:L39-L64`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTitle2.vue#L39-L64):
  ```scss
  .max-title-2 {
      .title-icon { ... }
      .text-h1 { ... } // Filho direto no SCSS, mas na DOM é neto (dentro de div)!
      .text-h2 { ... }
  }
  ```

### C. Seletores Órfãos e Desaninhados em `MaxButton.vue`

- [`src/components/MaxButton.vue:L302-L306`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L302-L306):
  ```scss
  .icon-button-b {
      /* min-width: 15px; */
      /* min-height: 15px; */
  }
  ```
  Seletor órfão de nível zero com regras comentadas esquecido no final do arquivo.

### D. Fragmentação de Blocos em `MaxTopMenuSearchBar.vue`

- [`src/components/MaxTopMenuSearchBar.vue:L132-L280`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L132-L280):
  O arquivo declara 8 seletores de nível zero:
  1. `.search-top-bar` (L132)
  2. `.search-top-bar-mobile` (L218)
  3. `.mobile-search-overlay` (L223)
  4. `.mobile-search-panel` (L230)
  5. `.mobile-search-header` (L241)
  6. `.mobile-search-input` (L248)
  7. `.mobile-search-checkbox` (L257)
  8. `.mobile-search-results` (L271)

  Todos os seletores `.mobile-search-*` residem dentro de `.mobile-search-overlay` no template, mas foram colocados de forma plana no SCSS, destruindo o aninhamento hierárquico.

---

## 4. Impacto no Sistema e Riscos

1. **Dificuldade Extrema de Manutenção:** O desenvolvedor não consegue inferir a estrutura da UI lendo o SCSS porque os seletores não refletem o aninhamento do HTML.
2. **Vazamento e Conflito de Nomes:** Seletores planos no SCSS aumentam a probabilidade de colisões acidentais caso múltiplos subcomponentes compartilhem nomes genéricos.
3. **Presença de Código Morto e Risco de Regressão:** Estilos como os de autocomplete em [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue) geram falso entendimento de funcionamento e pesam no bundle sem utilidade real.

---

## 5. Plano de Resolução Recomendado

1. **Refatorar [`MaxInputSearch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue):**
   - Eliminar todo o bloco SCSS morto (`:deep(.p-autocomplete-*)`, `.tst1`, `.tst2`).
   - Construir o bloco `<style lang="scss" scoped>` aninhado em torno de `.max-input-search`, estilizando o `<input>` semântico interno.
2. **Corrigir a Hierarquia DOM em `MaxTitle1.vue` e `MaxTitle2.vue`:**
   - No template, atribuir uma classe semântica ao nó intermediário: `<div class="title-text-group">`.
   - No SCSS, aninhar as classes de texto estritamente dentro de `.title-text-group`:
     ```scss
     .max-title-2 {
         .title-icon { ... }
         .title-text-group {
             .title-heading { ... }
             .subtitle-heading { ... }
         }
     }
     ```
3. **Limpar `MaxButton.vue`:**
   - Remover o seletor órfão `.icon-button-b` e comentários mortos.
4. **Reaninhamento Estrutural em `MaxTopMenuSearchBar.vue` e Overlays:**
   - Agrupar todos os seletores de modal/overlay dentro do bloco correspondente espelhando o template:
     ```scss
     .mobile-search-overlay {
         .mobile-search-panel {
             .mobile-search-header {
                 .mobile-search-input { ... }
                 .mobile-search-checkbox { ... }
             }
             .mobile-search-results { ... }
         }
     }
     ```
