# Plano de Implementação: Inconsistências de Dark Mode e Falhas de Contraste

## 1. Diagnóstico e Objetivo

A auditoria de UI & Design identificou falhas graves de contraste e quebras de tema no suporte ao Dark Mode (`.dark`), violando a Seção 1 e Seção 5 das diretrizes do `GEMINI.md`:
1. **Artefato de Fundo Branco em Ícones de Validação:** [`MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue#L28) e [`MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue#L28) definem `background-color: white;` estático no pseudo-elemento `::before`. Em tema escuro, os inputs possuem fundo escuro (`var(--background-0)` = `#17293D`), resultando em um círculo branco visível e destoante sob os ícones.
2. **Colapso de Contraste na Variante Contrast de [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L195-L200):** A classe `.max-button-contrast` fixa `color: #fff` sobre `var(--background-900)`. No arquivo [`colors.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/themes/colors.scss), a rampa `.dark` inverte os fundos e `--background-800` vale `#F6F8FA` (quase branco). No estado `:hover`, o botão assume fundo claro com texto branco, tornando o conteúdo invisível.
3. **Estilos Monocromáticos Fixos em [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L150-L179):** Cores de fundo e borda estão travadas em literais `rgb(255 255 255 / 10%)` e `rgb(255 255 255 / 70%)`, impedindo que a barra superior se adapte a esquemas claros ou temas dinâmicos.
4. **Alça de Redimensionamento Estática em [`MaxImage.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue#L705):** `.max-image-crop-handle` usa `background-color: #fff;` sem conexão com tokens do tema.

**Objetivo:** Eliminar todos os valores hardcoded de cor que quebram no modo escuro, adotando os tokens semânticos canônicos (`var(--background-0)`, `var(--max-button-contrast-border-color)`, `var(--background-750)`) com suporte consistente a Dark Mode (`.dark`) e conformidade WCAG AA de contraste em todos os estados.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue) — Substituir `background-color: white;` por `var(--background-0);` e aninhar SCSS sob `.max-done-icon`.
- [`src/components/MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue) — Substituir `background-color: white;` por `var(--background-0);`, padronizar cor do erro e aninhar SCSS.
- [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L195-L200) — Refatorar `.max-button-contrast` para alternar cor de texto e fundo dinamicamente no tema claro e escuro.
- [`src/components/MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L145-L180) — Substituir literais RGBA por variáveis de superfície de menu e contraste.
- [`src/components/MaxImage.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue#L701-L710) — Tematizar o crop handle com `var(--background-0)` e borda adaptativa.
- [`tests/components/MaxDarkModeContrast.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxDarkModeContrast.test.ts) — Novo arquivo de testes unitários para validar conformidade de classes e tokens de Dark Mode.

---

## 3. Especificação Técnica Cirúrgica

### A. [`MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue)

Substituir o bloco `<style lang="scss" scoped>`:

```html
<template>
    <div class="max-done-icon icon-done-max">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M0 0h24v24H0z" fill="none" />
            <path fill="currentColor" fill-rule="evenodd" d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18m-.232-5.36l5-6l-1.536-1.28l-4.3 5.159l-2.225-2.226l-1.414 1.414l3 3l.774.774z" clip-rule="evenodd" />
        </svg>
    </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
    .max-done-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        position: relative;
        color: var(--max-success-500, var(--green-600));

        &::before {
            position: absolute;
            content: '';
            width: 15px;
            height: 15px;
            background-color: var(--background-0);
            border-radius: 50%;
        }

        svg {
            z-index: 0;
        }
    }
</style>
```

### B. [`MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue)

Substituir o bloco `<style lang="scss" scoped>`:

```html
<template>
    <div class="max-error-icon icon-error-max">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 512 512">
            <path d="M0 0h512v512H0z" fill="none" />
            <path fill="currentColor" fill-rule="evenodd" d="M256 42.667c117.803 0 213.334 95.53 213.334 213.333S373.803 469.334 256 469.334S42.667 373.803 42.667 256S138.197 42.667 256 42.667m48.918 134.25L256 225.836l-48.917-48.917l-30.165 30.165L225.835 256l-48.917 48.918l30.165 30.165L256 286.166l48.918 48.917l30.165-30.165L286.166 256l48.917-48.917z" />
        </svg>
    </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
    .max-error-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        position: relative;
        color: var(--max-danger-500, var(--red-575));

        &::before {
            position: absolute;
            content: '';
            width: 15px;
            height: 15px;
            background-color: var(--background-0);
            border-radius: 50%;
            box-shadow: 0 0 10px 5px rgb(0 0 0 / 15%);
        }

        svg {
            z-index: 0;
        }
    }
</style>
```

### C. [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L195-L200)

Refatorar a variante `.max-button-contrast` para utilizar tokens sem colapso de cores no tema escuro:

```scss
// Em src/components/MaxButton.vue:
&.max-button-contrast,
&.p-button-contrast {
    background: var(--max-button-contrast-border-color, var(--background-900));
    border-color: var(--max-button-contrast-border-color, var(--background-900));
    color: var(--background-0);

    &:hover {
        background: var(--background-750);
        border-color: var(--background-750);
    }
}

:global(.dark) &.max-button-contrast,
:global(.dark) &.p-button-contrast,
:global([data-theme="dark"]) &.max-button-contrast,
:global([data-theme="dark"]) &.p-button-contrast {
    background: var(--max-button-contrast-border-color, #ffffff);
    border-color: var(--max-button-contrast-border-color, #ffffff);
    color: var(--background-900, #09090b);

    &:hover {
        background: var(--background-200, #e4e4e7);
        border-color: var(--background-200, #e4e4e7);
    }
}
```

### D. [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue#L149-L180)

Substituir regras rígidas por variáveis de tema:

```scss
:deep(.max-input-field-div) {
    border: none !important;
    outline: 1px solid var(--background-300) !important;
    background-color: var(--background-100) !important;
    height: 38px !important;
    width: 100% !important;
    border-radius: 8px;
}

.search-top-bar-input {
    position: relative;
    width: 100%;
    max-width: 520px;
    display: flex;
    align-items: center;

    :deep(input) {
        border-color: transparent;
        background-color: transparent;
        color: var(--background-800);
        padding: 0 12px 0 38px !important;
        height: 100% !important;
        font-size: 0.9rem;

        &::placeholder {
            color: var(--background-500);
        }
    }

    :deep(.max-icon-div) {
        margin-left: 6px;

        svg {
            color: var(--background-500) !important;
        }
    }
}
```

### E. [`MaxImage.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue#L701-L710)

Substituir o manipulador de corte no SCSS:

```scss
.max-image-crop-handle {
    position: absolute;
    width: 14px;
    height: 14px;
    background-color: var(--background-0);
    border: 1px solid var(--background-400);
    border-radius: 2px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 40%);
    touch-action: none;

    &--tl { top: -7px; left: -7px; cursor: nwse-resize; }
    &--tr { top: -7px; right: -7px; cursor: nesw-resize; }
    &--bl { bottom: -7px; left: -7px; cursor: nesw-resize; }
    &--br { bottom: -7px; right: -7px; cursor: nwse-resize; }
}
```

---

## 4. Garantia de Retrocompatibilidade

- **Preservação de Interfaces Públicas:** Nenhuma prop, slot ou emit foi adicionado, alterado ou removido em [`MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue), [`MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue), [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue), [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue) ou [`MaxImage.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxImage.vue).
- **Compatibilidade com Seletores Legados:** Mantida a classe de compatibilidade `.p-button-contrast` junto a `.max-button-contrast` para transição transparente.
- **Transição Suave de Superfície:** Em Light Mode, `var(--background-0)` resolve para `#ffffff`, preservando 100% da renderização visual existente; em Dark Mode, resolve para a superfície escura correspondente, eliminando o artefato sem efeitos colaterais.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação

1. **Ausência de Círculo Branco:** Ao renderizar [`MaxDoneIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDoneIcon.vue) e [`MaxErrorIcon.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxErrorIcon.vue) sob um container `.dark`, o pseudo-elemento `::before` deve herdar `var(--background-0)`, camuflando-se com o fundo escuro do input.
2. **Legibilidade no Hover da Variante Contrast:** No tema escuro (`.dark`), o botão com variante `contrast` deve exibir fundo claro com texto escuro em `:hover` e repouso, nunca texto branco sobre fundo branco.
3. **Tematização Dinâmica de Busca:** [`MaxTopMenuSearchBar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTopMenuSearchBar.vue) deve usar variáveis de background em vez de opacidades fixas sobre branco.
4. **Sem regressão de tipos:** Verificação de tipos estritos do TypeScript 100% limpa.

### Comandos de Validação

```bash
# 1. Verificação de Tipos TypeScript
npm run type-check

# 2. Execução da Suíte de Testes Unitários dos Componentes Afetados
npx vitest run tests/components/MaxButton.test.ts tests/components/MaxDoneIcon.test.ts tests/components/MaxErrorIcon.test.ts

# 3. Execução do Teste de Contraste e Dark Mode
npx vitest run tests/components/MaxDarkModeContrast.test.ts

# 4. Linting e Validação SCSS
npm run lint
```
