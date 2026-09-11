# Plano de Implementação: Purificação de Atributos Utilitários de Estilo no Template e Desativação Gradual de Seletores Mágicos em `params.scss`

## 1. Objetivo da Refatoração

Erradicar a presença de atributos estilísticos utilitários aplicados diretamente sobre tags HTML e componentes nos templates Vue SFC (como `pointer`, `transparent`, `flex`, `center`, `no-padding`), e sanear o arquivo de estilos globais `src/themes/params.scss`.

Os objetivos principais desta refatoração são:
1. **Purificação dos Templates SFC**: Remover todos os atributos utilitários nus inseridos em tags de componentes e elementos nativos, eliminando o vazamento de atributos não tipados (`fallthrough attributes`) no Vue 3.
2. **Desativação de Seletores Globais de Atributo em `params.scss`**: Descontinuar regras com seletores de colchetes invasivos como `[pointer]`, `[transparent]`, `[danger]`, `[cancel]`, `[confirm]`, `[center]`, `[full]`, `[flex]`, `[no-padding]`, que utilizam `!important` globalmente e atropelam o encapsulamento do Design System.
3. **Migração para Semântica BEM e Props Tipadas**: Converter as intenções visuais desses atributos em propriedades formais nos componentes (ex.: prop `:no-padding="true"` em `MaxDrawer`) ou em classes semânticas BEM no `<style lang="scss" scoped>` (ex.: `.max-button--text`, `.is-centered`).
4. **Conformidade Estrita com o `GEMINI.md`**: Atender integralmente à regra canônica que proíbe atributos utilitários no estilo UnoCSS Attributify dentro dos templates da biblioteca:
   > *"É ESTRITAMENTE PROIBIDO utilizar atributos de utilitários no modo UnoCSS Attributify diretamente nas tags do template (ex.: `<div flex>`, `<div s100>`, `<div w-full>`, `<div gap-4>`, `<div pb-15>`, `<MaxIcon ml-5 />` são terminantemente proibidos). Nenhum elemento deve carregar utilitários de margem, padding, tipografia, dimensionamento, posicionamento, alinhamento ou flexbox/grid através de classes utilitárias ou atributos no template. Todo o estilo deve ser semântico."*

---

## 2. Arquivos Afetados

| Caminho Relativo | Caminho Absoluto | Atributos/Seletores Envolvidos |
|---|---|---|
| `src/themes/params.scss` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/themes/params.scss` | Seletores globais: `[pointer]`, `[transparent]`, `[no-padding]`, `[center]`, `[full]`, `[flex]`, etc. |
| `src/components/MaxButtonConfirm.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxButtonConfirm.vue` | Atributo nu `pointer` em `<MaxButton>` |
| `src/components/MaxIconConfirm.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconConfirm.vue` | Atributo nu `pointer` em `<MaxIconButton>` |
| `src/components/MaxTogglePopover.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTogglePopover.vue` | Atributos nus `pointer` em `<MaxIconButton>` e `<MaxButton>` |
| `src/components/MaxIconButton.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxIconButton.vue` | Atributo nu `pointer` em `<MaxIcon>` |
| `src/components/MaxUserSection.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserSection.vue` | Atributo nu `pointer` em `<div>` |
| `src/components/MaxSideMenuMobile.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxSideMenuMobile.vue` | Atributo nu `no-padding` em `<MaxDrawer>` |
| `src/components/MaxTitle1.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTitle1.vue` | Seletor de classe utilitária `.center` |
| `src/components/MaxInputFile.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputFile.vue` | Atributo `flex` nas tags `<slot name="button">` e `<slot name="filesPreview">` |
| `src/components/MaxTopToolbar.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbar.vue` | Atributo `transparent` em `<MaxIconButton>` |
| `src/components/MaxTopToolbarSubmenu.vue` | `/home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTopToolbarSubmenu.vue` | Atributo `transparent` em `<MaxIconButton>` |

---

## 3. Passo a Passo Detalhado da Implementação

### Fase 1: Purificação dos Templates de Botões e Confirmações

1. **`MaxButtonConfirm.vue`**:
   - **No `<template>` (Linha 2)**:
     - **Antes**:
       ```html
       <MaxButton class="max-button-confirm" :label="props.label" ... v-tooltip="null" pointer :action="onClickToggle" ref="btn_el" />
       ```
     - **Depois**:
       ```html
       <MaxButton class="max-button-confirm" :label="props.label" ... v-tooltip="null" :action="onClickToggle" ref="btn_el" />
       ```
   - *Justificativa Técnica*: O componente base `MaxButton.vue` já possui a regra `cursor: pointer;` definida nativamente em sua classe raiz `.max-button` (linha 119). O atributo `pointer` era 100% redundante e vazava no DOM como atributo HTML `pointer=""`.

2. **`MaxIconConfirm.vue`**:
   - **No `<template>` (Linha 2)**:
     - **Antes**:
       ```html
       <MaxIconButton class="max-icon-confirm" :icon="props.icon" ... v-tooltip="null" pointer :action="onClickToggle" ref="btn_el" />
       ```
     - **Depois**:
       ```html
       <MaxIconButton class="max-icon-confirm" :icon="props.icon" ... v-tooltip="null" :action="onClickToggle" ref="btn_el" />
       ```
   - *Justificativa Técnica*: O componente `MaxIconButton.vue` define explicitamente `cursor: pointer;` em sua classe base `.icon-div` (linha 118). A remoção do atributo é limpa e segura.

3. **`MaxTogglePopover.vue`**:
   - **No `<template>` (Linhas 4 e 7)**:
     - Remover o atributo nu `pointer` de `<MaxIconButton>` e de `<MaxButton>`.

4. **`MaxIconButton.vue`**:
   - **No `<template>` (Linha 20)**:
     - Remover o atributo nu `pointer` da tag interna `<MaxIcon>`. O cursor de ponteiro é responsabilidade do `<button>` externo envolvente (`.icon-div`), não do ícone SVG interno.

5. **`MaxUserSection.vue`**:
   - **No `<template>`**:
     - Localizar o elemento de trigger com atributo `pointer` e substituí-lo por uma classe semântica `.user-profile-trigger`, adicionando a regra `cursor: pointer;` em `<style lang="scss" scoped>`.

### Fase 2: Purificação de Slots e Navegação

1. **`MaxInputFile.vue`**:
   - **No `<template>` (Linhas 13 e 31)**:
     - **Antes**:
       ```html
       <slot name="button" flex>
       ...
       <slot name="filesPreview" flex>
       ```
     - **Depois**:
       ```html
       <slot name="button">
       ...
       <slot name="filesPreview">
       ```
   - *Justificativa Técnica*: `<slot>` é uma tag abstrata do compilador Vue que não gera nó físico no DOM. Inserir `flex` em `<slot>` é sintaticamente errôneo e tentava evocar uma regra de atributo `[flex] { width: 100% !important; height: 100% !important; }`. O controle de dimensionamento e flexbox dos elementos inseridos pertence aos containers concretos `.input-file-content` e `.files-list-preview`, os quais já possuem regras de display no SCSS.

2. **`MaxSideMenuMobile.vue`**:
   - **No `<template>` (Linha 7)**:
     - **Antes**:
       ```html
       <MaxDrawer
           v-model:visible="system.side_menu_open"
           position="left"
           :show-close-icon="false"
           :base-z-index="1000"
           no-padding
           class="max-side-menu-mobile max-side-menu-mobile-drawer"
       >
       ```
     - **Depois**:
       ```html
       <MaxDrawer
           v-model:visible="system.side_menu_open"
           position="left"
           :show-close-icon="false"
           :base-z-index="1000"
           :no-padding="true"
           class="max-side-menu-mobile max-side-menu-mobile-drawer"
       >
       ```
   - *Justificativa Técnica*: `MaxDrawer.vue` possui a prop tipada `noPadding?: boolean` (linha 15: `{'max-drawer-no-padding': props.noPadding}`). Vincular explicitamente `:no-padding="true"` garante o repasse tipado como prop booleana do Vue, sem emitir um atributo HTML nu que ative a regra global `[no-padding]` de `params.scss`.

3. **`MaxTitle1.vue`**:
   - **No `<template>` (Linha 2)**:
     - Substituir `:class="{ center: center }"` por `:class="{ 'is-centered': center }"`.
   - **No `<style lang="scss" scoped>` (Linhas 49-52)**:
     - Substituir `&.center` por `&.is-centered { display: grid; place-items: center; }`.

### Fase 3: Resolução de Botões Transparentes em `MaxTopToolbar.vue` e `MaxTopToolbarSubmenu.vue`

1. **Problema do Atributo `transparent`**:
   - Nos templates, `<MaxIconButton ... transparent />` é utilizado para tornar o botão sem bordas e transparente. Como `MaxIconButton` não declara uma prop `transparent` em sua tipagem `MaxButtonsType`, o atributo cai em `$attrs` e vaza para o `<button>` nativo, sendo estilizado pelo seletor `[transparent]` em `params.scss`.
2. **Solução Arquitetural Semântica**:
   - Em `src/types/button.ts` (ou interface `MaxButtonsType`), formalizar a prop semântica:
     ```typescript
     export interface MaxButtonsType {
         // ...
         /** Exibe o botão em modo transparente / ghost */
         transparent?: boolean;
     }
     ```
   - Em `MaxIconButton.vue`:
     - Consumir `props.transparent` e vincular a classe semântica `:class="{ 'is-transparent': props.transparent }"`.
     - No `<style lang="scss" scoped>` de `MaxIconButton.vue`:
       ```scss
       .icon-div {
           // ...
           &.is-transparent {
               background-color: transparent;
               border-color: transparent;
               outline-color: transparent;
               color: var(--background-700);

               &:hover {
                   color: var(--max-primary-600);
               }
           }
       }
       ```
   - Em `MaxTopToolbar.vue` e `MaxTopToolbarSubmenu.vue`:
     - Utilizar a prop tipada `:transparent="true"`, sem atributos soltos no DOM.

### Fase 4: Saneamento e Desativação de Seletores Globais em `src/themes/params.scss`

Após a purificação de todos os componentes SFC, o arquivo `src/themes/params.scss` deve ser higienizado para cessar a injeção de seletores globais com `!important`:

1. **Remoção Imediata de Seletores Inofensivos/Redundantes**:
   - Remover `[pointer] { cursor: pointer !important; }` (elementos interativos já possuem cursor pointer).
   - Remover `[no-padding] { padding: 0 !important; }`.
   - Remover `[no-gap]`, `[no-row-gap]`, `[no-column-gap]`.
2. **Isolamento de Seletores de Estado**:
   - Manter temporariamente apenas classes de compatibilidade externa se referenciadas por aplicações legadas consumidoras, convertendo-as de seletores de atributo para classes CSS formais com aviso de depreciação:
     ```scss
     // DEPRECATED: Substituído por classes semânticas BEM no Max Design System
     .u-pointer { cursor: pointer; }
     .u-transparent { background-color: transparent; border-color: transparent; }
     ```

---

## 4. Regras de Estilo do GEMINI.md a Cumprir

- **Proibição Absoluta de Atributos de Utilitários no Template**: Nenhuma tag deve conter atributos nus como `pointer`, `transparent`, `flex`, `center`.
- **Encapsulamento Semântico no `<style lang="scss" scoped>`**: Cada elemento deve receber classes que reflitam seu papel (BEM), com estilos agrupados e aninhados espelhando a árvore de marcação.
- **Tipagem Estrita de Props**: Qualquer comportamento configurável repassado para componentes filhos deve ser tipado em sua interface TypeScript (`defineProps<Interface>()`).

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Varredura de Atributos Nus nos Templates**:
   ```bash
   rg '<(MaxButton|MaxIconButton|div|slot)[^>]*\s(pointer|transparent|flex|center|no-padding)[>\s]' src/components
   ```
   *Critério*: Deve retornar **0 resultados** em todo o diretório `src/components/`.
2. **Checagem de Tipagem TypeScript (`vue-tsc`)**:
   ```bash
   npm run type-check
   ```
   *Critério*: Código 0 sem erros de compilação ou de props desconhecidas.
3. **Validação de Linters**:
   ```bash
   npm run lint
   ```
   *Critério*: Código 0 sem violações de ESLint ou Stylelint.
4. **Execução da Suíte Completa de Testes**:
   ```bash
   npm run test
   ```
   *Critério*: Todos os 176 arquivos de teste passando.
5. **Verificação do DOM Gerado no Playground**:
   - Inspecionar botões de confirmação e ícones da barra superior no DevTools e atestar que nenhum nó HTML possui atributos estranhos como `pointer=""` ou `transparent=""`.

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Severidade | Estratégia de Mitigação |
|---|:---:|:---:|---|
| Botões da barra superior perderem a transparência ao remover o seletor `[transparent]` | Média | Alta | A classe semântica `.is-transparent` em `MaxIconButton.vue` aplica as regras exatas de transparência antes ativadas pelo seletor de atributo, garantindo 100% de paridade estética. |
| Drawer móvel (`MaxSideMenuMobile`) voltar a ter padding | Baixa | Média | O binding explícito `:no-padding="true"` já aciona a classe `.max-drawer-no-padding` nativa em `MaxDrawer.vue`, mantendo o menu ocupando 100% da área útil sem margens laterais. |
| Quebra de layouts que confiavam em `flex` em slots de `MaxInputFile` | Baixa | Baixa | Os elementos filhos renderizados no slot possuem estilos próprios de exibição flexbox no SCSS do componente pai. |
