# Plano de Implementação: Cores Hardcoded e Fallbacks Arbitrários do Tailwind

## 1. Diagnóstico e Objetivo

A auditoria de UI & Design identificou 342 ocorrências de cores hardcoded e fallbacks arbitrários em 52 arquivos de componentes, violando diretamente a Seção 1 do `GEMINI.md`:
1. **Fallbacks para Paleta Tailwind CSS em Vez da Identidade Max:**
   - Em [`MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue#L430-L460) e [`MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue#L290-L292), foram inseridos fallbacks `var(--max-primary-500, #3b82f6)` e `var(--max-primary-600, #2563eb)`. O valor `#3b82f6` é o azul padrão do Tailwind CSS, divergindo do tom canônico Teal `#00768E` da identidade visual Max.
   - Em [`MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue#L291), `box-shadow: 0 0 0 2px rgb(59 130 246 / 15%);` hardcoda o RGB do Tailwind Blue 500.
   - Em [`MaxBottomMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue#L302-L318), utilizam-se `var(--blue-700, #0284c7)` e `var(--blue-500, #38bdf8)` (Tailwind Sky).
2. **Hexadecimais Literais em Vez de Variáveis Canônicas:**
   - [`MaxSideMenuMobile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue#L239) e [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L108): fundo fixado com `#005F77` literal em vez de `var(--max-primary-600)`.
   - [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L127-L198): `color: #fff;` repetido em 8 variantes em vez de `var(--background-0)`.
   - [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue#L268-L291): `fill: #369;` hardcoded em nós SVG.
   - [`MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L429): `color: green !important;` literal arbitrário.
3. **Variáveis Semânticas Legadas sem Prefixo Canônico:**
   - [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue) e [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue) consomem `var(--success-500)`, `var(--warn-500)`, `var(--danger-500)` e `var(--info-500)` em vez dos tokens padrão `--max-*`.

**Objetivo:** Expurgar todos os fallbacks do Tailwind, substituir hexadecimais literais por tokens canônicos do design system (`var(--max-primary-*)`, `var(--background-*)`, `var(--max-success-*)`) e padronizar o consumo das variáveis semânticas com retrocompatibilidade garantida.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue#L420-L463) — Corrigir fallbacks de Tailwind para tokens Max.
- [`src/components/MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue#L280-L298) — Substituir fallback Tailwind e sombra RGB hardcoded por `color-mix` com `--max-primary-500`.
- [`src/components/MaxBottomMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue#L300-L322) — Substituir tokens Tailwind Sky por tokens institucionais Max.
- [`src/components/MaxSideMenuMobile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue#L235-L248) — Substituir `#005F77` por `var(--max-primary-600)`.
- [`src/components/MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue#L100-L138) — Substituir `#005f77` e `#fff` por variáveis de tema.
- [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L125-L200) — Substituir `color: #fff;` por `var(--background-0);` e unificar tokens semânticos (`--max-success-500`, etc.).
- [`src/components/MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue#L268-L292) — Substituir `fill: #369;` por `fill: var(--max-primary-600);`.
- [`src/components/MaxInputFileUpload.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputFileUpload.vue#L427-L435) — Substituir `color: green !important;` por `color: var(--max-success-500) !important;`.
- [`src/components/MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue#L120-L141) — Unificar variáveis de severidade com a nomenclatura `--max-*`.
- [`tests/components/MaxThemeColors.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxThemeColors.test.ts) — Novo teste de regressão para verificar ausência de literais de cor proibidos e conformidade de tokens.

---

## 3. Especificação Técnica Cirúrgica

### A. [`MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputMarkdownToolbar.vue)

Substituir os seletores com fallbacks Tailwind por tokens canônicos:

```scss
// Em src/components/MaxInputMarkdownToolbar.vue:
&__select,
&__input {
    height: 30px;
    padding: 0 8px;
    border: 1px solid var(--background-300);
    border-radius: 6px;
    font-size: 13px;
    outline: none;
    background: var(--background-0);
    color: var(--background-700);
    transition: border-color 0.15s;
    box-sizing: border-box;

    &:focus {
        border-color: var(--max-primary-500, #00768E);
    }
}

&__btn {
    height: 30px;
    padding: 0 12px;
    border: 1px solid var(--background-300);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    background: var(--background-50);
    cursor: pointer;
    white-space: nowrap;
    color: var(--background-750);
    transition: all 0.15s;
    box-sizing: border-box;

    &:hover {
        background: var(--background-150);
    }

    &--primary {
        background: var(--max-primary-500, #00768E);
        border-color: var(--max-primary-500, #00768E);
        color: var(--background-0);

        &:hover {
            background: var(--max-primary-600, #005F77);
            border-color: var(--max-primary-600, #005F77);
        }
    }
}
```

### B. [`MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputCodeToolbar.vue)

Substituir o bloco de foco e cores do select:

```scss
// Em src/components/MaxInputCodeToolbar.vue:
&__select {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--background-750);
    background-color: var(--background-0);
    border: 1px solid var(--background-300);
    border-radius: 4px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:focus {
        border-color: var(--max-primary-500, #00768E);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--max-primary-500, #00768E) 15%, transparent);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
    }
}
```

### C. [`MaxBottomMenu.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxBottomMenu.vue)

Substituir o botão flutuante central:

```scss
// Em src/components/MaxBottomMenu.vue:
.floating-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: none;
    appearance: none;
    border-radius: 999px;
    background: var(--max-primary-600, #005F77);
    color: var(--background-0);
    cursor: pointer;
    box-shadow: 0 6px 16px var(--max-bottom-menu-shadow, rgb(0 32 58 / 28%));
    transition: transform 0.18s ease, box-shadow 0.18s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 22px var(--max-bottom-menu-shadow-hover, rgb(0 32 58 / 34%));
        background: var(--max-primary-700, #004b5f);
    }

    &:active {
        transform: translateY(0);
    }

    &:focus-visible {
        outline: 2px solid var(--max-primary-500, #00768E);
        outline-offset: 3px;
    }
}
```

### D. [`MaxSideMenuMobile.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxSideMenuMobile.vue) e [`MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxUserAvatar.vue)

Em `MaxSideMenuMobile.vue`:
```scss
.mobile-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: var(--max-primary-600);
    display: grid;
    place-items: center;
    overflow: hidden;

    .max-user-avatar {
        width: 100%;
        height: 100%;
    }
}
```

Em `MaxUserAvatar.vue`:
```scss
.max-user-avatar__icon-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50% !important;
    overflow: hidden !important;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--max-primary-600);
    color: var(--max-user-avatar-color, var(--background-0));

    :deep(.max-user-avatar__icon) {
        width: 72% !important;
        height: 72% !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        color: var(--background-0) !important;

        .max-icon {
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: var(--background-0) !important;
        }

        svg {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            display: block;
            transform: none;
        }
    }
}
```

### E. [`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue)

Atualizar as variantes para usar `var(--background-0)` e a hierarquia canônica de variáveis semânticas:

```scss
// Em src/components/MaxButton.vue:
background: var(--max-primary-500);
color: var(--background-0);
border-color: var(--max-primary-500);
transition: background 0.2s, color 0.2s, border-color 0.2s;

&:hover {
    background: var(--max-primary-600);
    border-color: var(--max-primary-600);
}

&.max-button-secondary, &.p-button-secondary {
    background: var(--background-500);
    border-color: var(--background-500);
    color: var(--background-0);
    &:hover { background: var(--background-600); border-color: var(--background-600); }
}

&.max-button-success, &.p-button-success {
    background: var(--max-success-500, var(--success-500));
    border-color: var(--max-success-500, var(--success-500));
    color: var(--background-0);
    &:hover { 
        background: var(--max-success-600, var(--success-600)); 
        border-color: var(--max-success-600, var(--success-600)); 
    }
}

&.max-button-info, &.p-button-info {
    background: var(--max-info-500, var(--info-500));
    border-color: var(--max-info-500, var(--info-500));
    color: var(--background-0);
    &:hover { 
        background: var(--max-info-600, var(--info-600)); 
        border-color: var(--max-info-600, var(--info-600)); 
    }
}

&.max-button-warning, &.p-button-warning, &.p-button-warn {
    background: var(--max-warning-500, var(--warn-500));
    border-color: var(--max-warning-500, var(--warn-500));
    color: var(--background-0);
    &:hover { 
        background: var(--max-warning-600, var(--warn-600)); 
        border-color: var(--max-warning-600, var(--warn-600)); 
    }
}

&.max-button-danger, &.p-button-danger {
    background: var(--max-danger-500, var(--danger-500));
    border-color: var(--max-danger-500, var(--danger-500));
    color: var(--background-0);
    &:hover { 
        background: var(--max-danger-600, var(--danger-600)); 
        border-color: var(--max-danger-600, var(--danger-600)); 
    }
}

&.max-button-whatsapp {
    background: var(--max-whatsapp-500, #25d366);
    border-color: var(--max-whatsapp-500, #25d366);
    color: var(--background-0);
    &:hover { 
        background: var(--max-whatsapp-600, #1da851); 
        border-color: var(--max-whatsapp-600, #1da851); 
    }
}
```

### F. [`MaxCreditCard.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxCreditCard.vue)

Substituir `fill: #369;` por `fill: var(--max-primary-600);`:

```scss
// Em src/components/MaxCreditCard.vue:
.credit-card-number,
.credit-card-name,
.credit-card-date,
.credit-card-cvv {
    fill: var(--max-primary-600);
    font-family: 'JetBrains Mono', monospace;
}
```

### G. [`MaxToast.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxToast.vue)

Padronizar as classes de severidade com tokens `--max-*` e fallbacks:

```scss
// Em src/components/MaxToast.vue:
&.severity-success {
    background: var(--max-success-600, var(--success-650, #0f766e));
}

&.severity-info {
    background: var(--max-info-600, var(--info-600, #2563eb));
}

&.severity-warning {
    background: var(--max-warning-600, var(--warn-600, #b45309));
}

&.severity-error {
    background: var(--max-danger-600, var(--danger-600, #dc2626));
}

&.severity-whatsapp {
    background: var(--max-whatsapp-600, #128c7e);
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Fallbacks Protetivos em Dupla Camada:**
   As chamadas a variáveis CSS utilizam a convenção de fallback `var(--max-token, var(--legacy-token, valorCanonico))`. Isso assegura que:
   - Se o tema novo da biblioteca estiver carregado, prevalece `--max-*`.
   - Se o projeto consumidor definir apenas a variável legada PrimeVue (`--success-500`), o valor continuará funcionando perfeitamente.
   - Se nenhuma variável estiver definida, o fallback estático adota o valor canônico da marca Max (Teal `#00768E`), nunca o azul do Tailwind (`#3b82f6`).
2. **Preservação Visual Completa:**
   `var(--background-0)` resolve para `#fff` em tema claro padrão, garantindo que o contraste de texto e ícones sobre fundos escuros e coloridos permaneça exatamente idêntico ao esperado.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação

1. **Zero Ocorrências de `#3b82f6` e `#2563eb`:** Nenhum componente deve conter fallbacks ou valores apontando para o azul padrão do Tailwind.
2. **Consistência de Marca:** Todo fallback primário deve resolver para `#00768E` (ou `#005F77` no hover).
3. **Ausência de Literais Proibidos:** Ocorrências de `color: green !important;`, `#005F77` (hexadecimal solto no SCSS) e `color: #fff` nas variantes de botões devem estar 100% substituídas pelos tokens canônicos.
4. **Passagem Completa na Suíte de Testes:** Todos os testes unitários de botões, toolbars e menus continuam verdes.

### Comandos de Validação

```bash
# 1. Verificação de Tipos TypeScript
npm run type-check

# 2. Execução dos Testes dos Componentes Afetados
npx vitest run tests/components/MaxButton.test.ts tests/components/MaxToast.test.ts tests/components/MaxUserAvatar.test.ts tests/components/MaxBottomMenu.test.ts

# 3. Busca de Regressão por Cores Hardcoded e Tailwind
# Este comando deve retornar 0 resultados nos arquivos alterados:
git grep -nE "#3b82f6|#2563eb|#0284c7|rgb\(59 130 246" src/components/

# 4. Verificação de Estilos
npm run lint
```
