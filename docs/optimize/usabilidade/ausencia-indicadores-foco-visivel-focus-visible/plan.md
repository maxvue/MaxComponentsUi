# Plano de Implementação: Ausência de Indicadores de Foco Visível (:focus-visible)

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`tokens.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/themes/tokens.scss#L1-L60):**
   - Não existe um token padronizado de anel de foco (`focus ring`) para elementos interativos em toda a biblioteca.
2. **[`MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L110-L300):**
   - O botão principal da biblioteca define estilos detalhados para `:hover` e `:active`, mas não possui regra para `:focus-visible`.
   - Na variante `max-button-dashed` ([`src/components/MaxButton.vue:230-234`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L230-L234)), a regra `&:hover, &:active, &:focus { background: transparent !important; }` anula qualquer indicação visual de foco pelo navegador.
3. **[`InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L245-L253,L273-L282):**
   - Força `outline: none !important; box-shadow: none !important;` em todos os inputs/textareas internos.
   - O contorno do contêiner `.max-input-field-div:focus-within` é de apenas `1px solid var(--blue-700)`, possuindo espessura insuficiente para conformidade com a WCAG 2.4.7 (Foco Visível) e WCAG 2.4.11 (Aparência do Foco - Nível AA).
4. **[`MaxMenuVerticalItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMenuVerticalItem.vue#L8-L12,L98-188):**
   - Recebe `tabindex="0"`, mas não declara nenhuma regra de `:focus-visible` em seu SCSS, tornando a navegação por teclado pelo menu vertical completamente invisível.

### Objetivo
- Criar o token de sistema `--max-focus-ring` e `--max-focus-outline`.
- Aplicar `:focus-visible` cirúrgico em `MaxButton.vue` (incluindo botões com severidade, outlined, text e dashed).
- Reforçar `:focus-within` em `InputBase.vue` com espessura de 2px e alto contraste.
- Adicionar estilo de foco visível nítido em `MaxMenuVerticalItem.vue`.

---

## 2. Arquivos a Modificar

- [`src/themes/tokens.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/themes/tokens.scss)
- [`src/components/MaxButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue)
- [`src/components/InputBase.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue)
- [`src/components/MaxMenuVerticalItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMenuVerticalItem.vue)
- [`tests/unit/FocusVisible.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/FocusVisible.spec.ts) (criação de testes)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `src/themes/tokens.scss`
Adicionar tokens de foco globais para temas claro e escuro:

```scss
:root {
    // Tokens de anel de foco acessível (WCAG 2.4.7 / WCAG 2.4.11)
    --max-focus-ring-color: var(--blue-600, #00768E);
    --max-focus-ring-offset-color: var(--background-0, #ffffff);
    --max-focus-ring: 0 0 0 2px var(--max-focus-ring-offset-color), 0 0 0 4px var(--max-focus-ring-color);
    --max-focus-outline: 2px solid var(--max-focus-ring-color);
}

.dark {
    --max-focus-ring-color: var(--blue-400, #178DA5);
    --max-focus-ring-offset-color: var(--background-900, #18181b);
    --max-focus-ring: 0 0 0 2px var(--max-focus-ring-offset-color), 0 0 0 4px var(--max-focus-ring-color);
    --max-focus-outline: 2px solid var(--max-focus-ring-color);
}
```

---

### 3.2. `src/components/MaxButton.vue`

#### Alterações no Bloco `<style lang="scss" scoped>`
Adicionar regra `:focus-visible` geral e ajustar a classe `.max-button-dashed`:

```scss
.max-button {
    // ... estilos existentes ...

    &:focus-visible {
        outline: 2px solid var(--max-focus-ring-color, #00768E);
        outline-offset: 2px;
        box-shadow: 0 0 0 2px var(--max-focus-ring-offset-color, #ffffff);
    }

    &.max-button-dashed {
        background: transparent !important;
        border-style: dashed !important;
        border-width: 1px;
        color: var(--max-primary-500) !important;

        &:hover,
        &:active {
            background: transparent !important;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768E);
            outline-offset: 2px;
        }
    }
}
```

---

### 3.3. `src/components/InputBase.vue`

#### Alterações no Bloco `<style lang="scss" scoped>`
Reforçar o estado de foco do campo (`.max-input-field-div:focus-within`):

```scss
.max-input-field-div {
    outline: 1px solid var(--background-300) !important;
    border-radius: 8px;
    height: 36px;
    position: relative;
    transition: outline 0.15s ease, box-shadow 0.15s ease;

    &:focus-within {
        outline: 2px solid var(--blue-600, #00768E) !important;
        outline-offset: 1px;
    }

    &.error:focus-within {
        outline: 2px solid var(--danger-500, #ef4444) !important;
    }

    &.caution:focus-within {
        outline: 2px solid var(--warn-500, #f97316) !important;
    }
}
```

---

### 3.4. `src/components/MaxMenuVerticalItem.vue`

#### Alterações no Bloco `<style lang="scss" scoped>`
Adicionar anel de foco no item interativo com teclado:

```scss
.item_menu {
    display: grid;
    width: 100%;
    height: 2.7rem;
    cursor: pointer;
    place-items: center;
    position: relative;
    border-radius: 8px;

    &:focus-visible {
        outline: 2px solid var(--max-focus-ring-color, #00768E);
        outline-offset: -2px;
        z-index: 2;
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Sem Alterações de DOM ou Atributos Quebrados:**
   - As modificações afetam exclusivamente pseudo-classes `:focus-visible` e `:focus-within`.
   - Elementos clicados via mouse mantêm sua aparência usual, não sofrendo com bordas indesejadas (comportamento nativo de `:focus-visible`).
2. **Propriedades e Classes Preservadas:**
   - Nenhuma classe CSS foi renomeada ou removida.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] Navegar por botões `MaxButton` via teclado (`Tab`) exibe anel de foco destacado com contraste de no mínimo 3:1 em relação ao fundo.
- [ ] Botão `max-button-dashed` não esconde mais o foco ao ser tabulado.
- [ ] O contêiner de entrada `InputBase` amplia o contorno para 2px ao receber foco em inputs internos.
- [ ] Itens de menu lateral `MaxMenuVerticalItem` exibem contorno visível de foco ao navegar via `Tab`.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/FocusVisible.spec.ts
```
