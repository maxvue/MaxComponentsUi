# Achado de UI & Design: Inconsistências de Dark Mode e Falhas de Contraste

## 1. Identificação e Sumário Executivo

- **Identificador:** `dark-mode-inconsistencies-and-contrast-failures`
- **Categoria:** Coerência Visual e Suporte ao Dark Mode `.dark` (GEMINI.md — Seção 5)
- **Severidade:** Alta (Falha Visual e Acessibilidade Comprometida)
- **Impacto:** Componentes apresentam fundos brancos hardcoded que se tornam artefatos visuais no modo escuro, texto branco sobre fundo claro no hover de variantes contrastantes e barras de busca presas a temas monocromáticos fixos.
- **Componentes mais Críticos:**
  - [`src/components/MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue) e [`src/components/MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue): Fundo do ícone com `background-color: white;` fixo gerando círculo branco em temas escuros.
  - [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue): Variante `contrast` colapsa contraste no modo escuro (`color: #fff` sobre fundo que se torna branco no dark).
  - [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue): Estilização fixa para fundo escuro, quebrando em tema claro.

---

## 2. Descrição e Contexto do Problema

O `GEMINI.md` estipula:
> **1. Sistema de Cores e Superfícies (Modo Claro e Modo Escuro)**
> - `--background-0`: Superfície base mais clara / fundo de cards e inputs no modo claro (`#ffffff`), e superfície escura no modo escuro (`#17293D`).
> - `--background-800` a `--background-900`: Superfície escura no modo claro, e superfície clara invertida no modo escuro.
> - Suporte impecável e rigoroso a Dark Mode (`.dark`).

A auditoria comprovou três cenários críticos de colapso visual em Dark Mode:

### A. Ícones de Estado com Mancha Branca Traseira em Inputs Escuros
Tanto [`MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue) quanto [`MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue) utilizam um pseudo-elemento `::before` redondo de `15px` com `background-color: white;` hardcoded. O objetivo original era evitar que o fundo do input transparecesse por trás do SVG recortado.
No entanto, no modo escuro (`.dark`), os inputs possuem fundo escuro (`var(--background-0)` = `#17293D`). Como o `background-color: white` é estático, renderiza-se um **círculo branco brilhante** sob o ícone verde ou vermelho, gerando um defeito visual gritante no canto do input.

### B. Colapso de Contraste na Variante Contrast de `MaxButton.vue`
Em [`src/components/MaxButton.vue:L195-L200`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L195-L200):
```scss
&.max-button-contrast, &.p-button-contrast {
    background: var(--background-900);
    border-color: var(--background-900);
    color: #fff;
    &:hover { background: var(--background-800); border-color: var(--background-800); }
}
```
No arquivo de tema [`src/themes/colors.scss:L1740-L1772`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/themes/colors.scss#L1740-L1772), a rampa `.dark` inverte a ordem dos backgrounds:
- `--background-800` no modo escuro vale `#F6F8FA` (branco quase puro).
- `--background-900` sequer é definido dentro do bloco `.dark` (a rampa para em `--background-850: #FFF`).
Consequência:
1. No estado normal em dark mode, `var(--background-900)` é inválido/inexistente.
2. No estado `:hover`, o background vira `var(--background-800)` (`#F6F8FA`, branco), enquanto o texto permanece fixado em `color: #fff`. O botão exibe **texto branco sobre fundo branco**, tornando o botão ilegível (invisível).

### C. Quebra de Tema em `MaxTopMenuSearchBar.vue`
Em [`src/components/MaxTopMenuSearchBar.vue:L151-L168`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L151-L168), os estilos foram escritos assumindo que a barra superior é permanentemente escura:
```scss
outline: rgb(255 255 255 / 10%) 1px solid !important;
background-color: rgb(0 0 0 / 10%) !important;
border-color: rgb(255 255 255 / 7%);
background-color: rgb(255 255 255 / 7%);
color: rgb(255 255 255 / 70%);
```
Se a aplicação estiver rodando com layout de topo claro, ou se o tema for alternado dinamicamente, a barra de busca não se adapta, mantendo textos e bordas brancos sem contraste com o fundo claro.

---

## 3. Evidências Comprovadas no Código

- [`src/components/MaxDoneIcon.vue:L23-L30`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue#L23-L30):
  ```scss
  &::before {
      position: absolute;
      content: '';
      width: 15px;
      height: 15px;
      background-color: white; // Defeito no dark mode
      border-radius: 50%;
  }
  ```
- [`src/components/MaxErrorIcon.vue:L23-L31`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue#L23-L31):
  ```scss
  &::before {
      position: absolute;
      content: '';
      width: 15px;
      height: 15px;
      background-color: white; // Defeito no dark mode
      border-radius: 50%;
      box-shadow: 0 0 10px 5px rgb(0 0 0 / 15%);
  }
  ```
- [`src/components/MaxButton.vue:L195-L200`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L195-L200):
  ```scss
  &.max-button-contrast, &.p-button-contrast {
      background: var(--background-900);
      border-color: var(--background-900);
      color: #fff;
      &:hover { background: var(--background-800); border-color: var(--background-800); }
  }
  ```
- [`src/components/MaxImage.vue:L701-L709`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue#L701-L709):
  ```scss
  .max-image-crop-handle {
      background-color: #fff; // Fixo, sem adaptação ao tema
      border: 1px solid rgb(0 0 0 / 30%);
  }
  ```

---

## 4. Impacto no Sistema e Riscos

1. **Acessibilidade e Legibilidade Comprometidas:** Usuários de modo escuro que utilizarem a variante `contrast` do botão terão o texto totalmente ilegível ao passar o mouse.
2. **Poluição Visual em Formulários:** Todos os inputs com validação bem-sucedida ou com erro em dark mode exibirão uma mancha branca atrás do ícone, passando impressão de software inacabado.
3. **Incompatibilidade com o Tema Institucional:** A quebra da inversão de cores da rampa `--background-*` no Dark Mode quebra a promessa de suporte a temas dark/light sem alterações manuais de CSS.

---

## 5. Plano de Resolução Recomendado

1. **Corrigir `MaxDoneIcon.vue` e `MaxErrorIcon.vue`:**
   - Substituir `background-color: white;` por `background-color: var(--background-0);`. No modo claro, resolverá para `#ffffff`; no modo escuro, resolverá dinamicamente para a superfície do input (`#17293D`), integrando-se perfeitamente ao fundo do campo.
2. **Refatorar a Variante Contrast de `MaxButton.vue`:**
   - Utilizar os tokens canônicos de contraste definidos em `tokens.scss`:
     ```scss
     &.max-button-contrast {
         background: var(--max-button-contrast-border-color, var(--background-900));
         border-color: var(--max-button-contrast-border-color, var(--background-900));
         color: var(--background-0);

         &:hover {
             background: var(--background-750);
             border-color: var(--background-750);
         }
     }
     ```
   - Em `.dark`, o fundo do botão de contraste será claro (`--max-button-contrast-border-color: #ffffff`) e o texto será escuro (`var(--background-0)`), garantindo alto contraste sem colapso.
3. **Tematizar `MaxTopMenuSearchBar.vue`:**
   - Substituir os literais RGBA brancos e pretos por variáveis de superfície de menu (`var(--background-100)`, `var(--background-700)`, `var(--background-600)`), garantindo legibilidade tanto em barras superiores claras quanto escuras.
