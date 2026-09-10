# Achado de UI & Design: Cores Hardcoded e Fallbacks Arbitrários do Tailwind

## 1. Identificação e Sumário Executivo

- **Identificador:** `hardcoded-colors-and-tailwind-fallbacks`
- **Categoria:** Sistema de Cores e Tokens CSS de Tema (GEMINI.md — Seção 1)
- **Severidade:** Alta (Desvio de Identidade Visual e Inconsistência de Temas)
- **Impacto:** 342 ocorrências de cores hardcoded identificadas em 52 arquivos de componentes.
- **Componentes mais Críticos:**
  - [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue): 13 cores hardcoded (`color: #fff`, `#25d366`, `#1da851`).
  - [`src/components/MaxInputMarkdown.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdown.vue) e [`MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue): 66 ocorrências com fallbacks para a paleta Tailwind CSS (`#3b82f6` Azul em vez de Teal `#00768E`).
  - [`src/components/MaxBottomMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue): 15 ocorrências com cores e sombras Tailwind/arbitrárias (`#0284c7`, `#38bdf8`, `rgb(0 32 58 / 16%)`).
  - [`src/components/MaxSideMenuMobile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue) e [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue): `#005F77` escrito como hex literal em vez de `var(--max-primary-600)`.
  - [`src/components/MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue): `#369` hardcoded em múltiplos nós SVG.
  - [`src/components/MaxPdfView.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue): Cores arbitrárias em RGB/RGBA sem tokens (`rgb(0 0 0 / 90%)`, `rgb(255 255 255 / 50%)`).
  - [`src/components/MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue): `#fff`, sombras RGB e `#128c7e`.

---

## 2. Descrição e Contexto do Problema

O `GEMINI.md` define de forma inequívoca o padrão de consumo de cores:
> **1. Sistema de Cores e Superfícies**
> Todas as cores devem ser consumidas obrigatoriamente através das variáveis CSS do design system declaradas em `src/themes/`:
> - Superfícies: `--background-0` a `--background-900`.
> - Rampa Primária Canônica (Teal): `--max-primary-50` a `--max-primary-900` (canônica: `--max-primary-500: #00768E`, hover: `--max-primary-600: #005F77`).
> - Cores Semânticas de Estado:
>   - Sucesso: `--max-success-500: #10B981`, `--emerald-700: #047857`
>   - Atenção: `--max-warning-500: #F59E0B`, `--max-orange-500: #f97316`
>   - Erro: `--max-danger-500: #EF4444`, `--red-700: #b91c1c`
>   - Informativo: `--max-info-500: #0EA5E9`, `--blue-600: #2563eb`

Dois problemas principais foram comprovados:
1. **Proliferação de Cores Hardcoded:** Múltiplos componentes utilizam literais como `#fff`, `#ffffff`, `#1e1e1e`, `#369`, `green` e valores RGBA em propriedades de `color`, `background`, `border` e `box-shadow`, impedindo a tematização dinâmica e ignorando as variáveis CSS do design system.
2. **Poluição por Fallbacks do Tailwind CSS:** Em componentes criados recentemente (como [`MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue) e [`MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue)), desenvolvedores inseriram chamadas `var(--max-primary-500, #3b82f6)` e `var(--max-primary-600, #2563eb)`. O valor de fallback `#3b82f6` é o azul padrão do Tailwind CSS, **completamente divergente da cor primária Teal `#00768E` da identidade institucional Max**. Se a variável não estiver carregada no contexto ou em testes isolados, o componente é renderizado no azul do Tailwind em vez da cor da marca Max.
3. **Uso de Variáveis Semânticas Não-Canônicas:** [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue) e [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue) utilizam `var(--success-500)`, `var(--warn-500)`, `var(--danger-500)` e `var(--info-500)` em vez dos tokens padronizados `--max-success-500`, `--max-warning-500`, `--max-danger-500` e `--max-info-500`.

---

## 3. Evidências Comprovadas no Código

### A. Fallbacks do Tailwind Corrompendo a Marca Max

- [`src/components/MaxInputMarkdownToolbar.vue:L430, L453, L458`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue#L430):
  ```scss
  &:focus {
      border-color: var(--max-primary-500, #3b82f6); // #3b82f6 é Tailwind Blue! Canônico Max é #00768E
  }

  &--primary {
      background: var(--max-primary-500, #3b82f6);
      border-color: var(--max-primary-500, #3b82f6);
      color: #fff;

      &:hover {
          background: var(--max-primary-600, #2563eb); // #2563eb é Tailwind Blue! Canônico Max é #005F77
          border-color: var(--max-primary-600, #2563eb);
      }
  }
  ```
- [`src/components/MaxInputCodeToolbar.vue:L291`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue#L291):
  ```scss
  box-shadow: 0 0 0 2px rgb(59 130 246 / 15%); // rgb(59 130 246) é Tailwind Blue 500!
  ```
- [`src/components/MaxBottomMenu.vue:L302, L318`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue#L302):
  ```scss
  background: var(--blue-700, #0284c7); // #0284c7 é Tailwind Sky 600
  outline: 2px solid var(--blue-500, #38bdf8); // #38bdf8 é Tailwind Sky 400
  ```

### B. Hexadecimais Literais e Ausência de Variáveis

- [`src/components/MaxButton.vue:L127, L148, L155, L162, L169, L176, L183, L190, L198`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L127):
  ```scss
  background: var(--max-primary-500);
  color: #fff; // Repetido em 8 variantes de botão em vez de var(--background-0)

  &.max-button-whatsapp {
      background: #25d366; // Hardcoded
      border-color: #25d366;
      color: #fff;
      &:hover { background: #1da851; border-color: #1da851; }
  }
  ```
- [`src/components/MaxSideMenuMobile.vue:L239`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue#L239):
  ```scss
  .mobile-avatar {
      background-color: #005F77; // Hex literal; deve ser var(--max-primary-600)
  }
  ```
- [`src/components/MaxUserAvatar.vue:L108, L117, L125, L153`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L108):
  ```scss
  background-color: #005f77; // Hex literal; deve ser var(--max-primary-600)
  color: #fff !important;
  ```
- [`src/components/MaxCreditCard.vue:L270, L277, L283, L289`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue#L270):
  ```scss
  .credit-card-number { fill: #369; }
  .credit-card-name { fill: #369; }
  .credit-card-date { fill: #369; }
  .credit-card-cvv { fill: #369; }
  ```
- [`src/components/MaxPdfView.vue:L167, L187, L197, L198`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxPdfView.vue#L167):
  ```scss
  background-color: rgb(0 0 0 / 90%);
  color: rgb(255 255 255 / 50%);
  border: 7px solid rgb(255 255 255 / 20%);
  border-top-color: rgb(255 255 255 / 90%);
  ```
- [`src/components/MaxInputFileUpload.vue:L429`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L429):
  ```scss
  color: green !important; // Cor nomeada arbitrária
  ```

---

## 4. Impacto no Sistema e Riscos

1. **Quebra da Identidade da Marca:** Em ambientes com carregamento assíncrono de CSS ou SSR, o fallback para `#3b82f6` (azul clássico) exibe um componente de cor visivelmente errada, diferente do tom Teal `#00768E` da Max.
2. **Impossibilidade de Customização Temática:** Se um cliente ou produto do ecossistema Max redefinir a rampa de tema, componentes com cores hardcoded (`#fff`, `#005F77`, `#369`, `green`) não responderão às variáveis, gerando quebra visual.
3. **Incompatibilidade com Dark Mode:** Valores hardcoded como `color: #fff` impedem adaptações de contraste automático no modo escuro.

---

## 5. Plano de Resolução Recomendado

1. **Sanitizar Todos os Fallbacks de Variáveis:**
   - Em [`MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue) e [`MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue), substituir `var(--max-primary-500, #3b82f6)` por `var(--max-primary-500, #00768E)` e `var(--max-primary-600, #2563eb)` por `var(--max-primary-600, #005F77)`.
   - Substituir fallbacks Tailwind (`#e5e7eb`, `#d1d5db`, `#374151`, `#f9fafb`) pelos equivalentes canônicos em `var(--background-*)`.
2. **Substituir Hexadecimais Literais por Tokens:**
   - Em [`MaxSideMenuMobile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue) e [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue), substituir `#005F77` por `var(--max-primary-600)`.
   - Em [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue), substituir `color: #fff;` por `var(--background-0);`.
   - Em [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue), substituir `fill: #369;` por `fill: var(--max-primary-500);` ou token de contraste adequado.
   - Em [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue), substituir `color: green !important;` por `color: var(--max-success-500) !important;`.
3. **Padronizar as Variáveis Semânticas de Estado:**
   - Em [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue) e [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue), unificar:
     - `var(--success-500)` → `var(--max-success-500)`
     - `var(--warn-500)` → `var(--max-warning-500)`
     - `var(--danger-500)` → `var(--max-danger-500)`
     - `var(--info-500)` → `var(--max-info-500)`
