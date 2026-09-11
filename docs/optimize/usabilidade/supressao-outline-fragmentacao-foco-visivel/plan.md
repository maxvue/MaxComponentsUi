# Plano de Implementação: Eliminação da Supressão Insegura de Outline e Padronização Canônica de Foco Visível (`:focus-visible`)

## 1. Objetivo da Refatoração

Eliminar a ocorrência de "foco fantasma" (quando o foco do teclado avança por controles, mas nenhum contorno visual é apresentado ao usuário) e unificar os estilos de foco visível em toda a biblioteca sob os tokens canônicos já estabelecidos em `src/themes/tokens.scss`.

Causas a corrigir:
1. A regra global `[noborder]` em `src/themes/params.scss` aplica `outline: none !important;`, removendo o contorno nativo de qualquer elemento que utilize essa propriedade.
2. Componentes com interações frequentes (`MaxListBox`, `MaxAccordionItem`, `MaxTab`, `MaxInputCodeToolbar`, `MaxInputMarkdownToolbar`, `MaxTable`, `MaxTableFields`) aplicam `outline: none` para suprimir o anel no clique do mouse, mas omitem a declaração `:focus-visible`, violando o critério WCAG 2.4.7.
3. Inconsistência de contraste e espessura do indicador de foco, em desconformidade com a diretriz WCAG 2.2 (Critério 2.4.11 Focus Appearance).

Este plano detalha a erradicação de `outline: none !important;` e a aplicação consistente da pseudo-classe `:focus-visible` integrada ao tema claro e escuro.

---

## 2. Arquivos Afetados

### Parâmetros Globais e Tokens de Tema
- [`src/themes/params.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/themes/params.scss) — Correção da regra `[noborder]`.
- [`src/themes/tokens.scss`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/themes/tokens.scss) — Consolidação dos tokens canônicos `--max-focus-ring`, `--max-focus-outline` e `--max-focus-ring-offset-color`.

### Componentes Interativos Afetados
- [`src/components/MaxListBox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxListBox.vue)
- [`src/components/MaxAccordionItem.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxAccordionItem.vue)
- [`src/components/MaxTab.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTab.vue)
- [`src/components/MaxInputCodeToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputCodeToolbar.vue)
- [`src/components/MaxInputMarkdownToolbar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputMarkdownToolbar.vue)
- [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue)
- [`src/components/MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue)

### Testes
- [`tests/themes/FocusVisibleUnified.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/themes/FocusVisibleUnified.test.ts) (Novo arquivo de verificação de CSS e conformidade de regras de foco)
- Suítes de testes de unidade de cada componente afetado.

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Correção nos Parâmetros Globais (`src/themes/params.scss`)
Substituir a remoção cega do contorno de foco por uma regra cirúrgica que remove o outline apenas quando o foco é acionado por clique de ponteiro (mouse/touch), preservando e aplicando o indicador visual explícito para navegação por teclado:
```scss
// src/themes/params.scss (Linhas 81-84)
// ANTES:
// [noborder] {
//     border: none !important;
//     outline: none !important;
// }

// DEPOIS:
[noborder] {
    border: none !important;

    &:focus:not(:focus-visible) {
        outline: none !important;
    }

    &:focus-visible {
        outline: var(--max-focus-outline) !important;
        outline-offset: 2px !important;
    }
}
```

### Passo 2: Verificação e Validação dos Tokens em `src/themes/tokens.scss`
Assegurar que os tokens em `:root` e `.dark` atendam à relação de contraste mínima de 3:1 contra o fundo:
```scss
:root {
    --max-focus-ring-color: var(--max-primary-500, #00768E);
    --max-focus-ring-offset-color: var(--background-0, #ffffff);
    --max-focus-ring: 0 0 0 2px var(--background-0, #ffffff), 0 0 0 4px var(--max-primary-500, #00768E);
    --max-focus-outline: 2px solid var(--max-primary-500, #00768E);
}

.dark {
    --max-focus-ring-color: var(--max-primary-400, #178DA5);
    --max-focus-ring-offset-color: var(--background-900, #18181b);
    --max-focus-ring: 0 0 0 2px var(--max-focus-ring-offset-color), 0 0 0 4px var(--max-focus-ring-color);
    --max-focus-outline: 2px solid var(--max-primary-400, #178DA5);
}
```

### Passo 3: Implementação em `MaxListBox.vue`
No elemento focável `.max-listbox-list` (`tabindex="0"`, `role="listbox"`):
1. Manter a supressão apenas para foco via ponteiro:
   ```scss
   .max-listbox-list {
       position: relative;
       flex: 1;
       overflow-y: auto;
       scrollbar-width: none;
       -ms-overflow-style: none;

       &:focus:not(:focus-visible) {
           outline: none;
       }

       &:focus-visible {
           outline: var(--max-focus-outline);
           outline-offset: -2px;
           border-radius: 4px;
       }
   ```
2. Garantir que os itens da lista (`.max-listbox-item`) em foco programático via setas recebam feedback evidente (borda interna ou background distinguível com contraste acessível).

### Passo 4: Implementação em `MaxAccordionItem.vue`
No cabeçalho do acordeão `.max-accordion-item-header`:
```scss
.max-accordion-item-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--background-775);
    transition: background-color 0.2s ease;

    &:hover:not(.max-accordion-item-header-disabled) {
        background-color: var(--background-300);
    }

    &:focus:not(:focus-visible) {
        outline: none;
    }

    &:focus-visible {
        outline: var(--max-focus-outline);
        outline-offset: -2px;
        border-radius: 4px;
    }

    &.max-accordion-item-header-active {
        color: var(--max-primary-500);
    }
}
```

### Passo 5: Implementação em `MaxTab.vue`
No botão da aba individual `.max-tab` (`role="tab"`):
```scss
.max-tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 0.75rem 1rem;
    cursor: pointer;
    color: var(--background-700);
    white-space: nowrap;
    transition: color 0.2s ease, border-color 0.2s ease;

    &:focus:not(:focus-visible) {
        outline: none;
    }

    &:focus-visible {
        outline: var(--max-focus-outline);
        outline-offset: -2px;
        border-radius: 4px 4px 0 0;
    }

    &.max-tab-active {
        border-bottom-color: var(--max-primary-500);
        color: var(--max-primary-500);
    }
}
```

### Passo 6: Implementação nas Barras de Ferramentas
1. **`MaxInputCodeToolbar.vue`**:
   Em `&__btn` e `&__select`:
   ```scss
   &__btn {
       // ... propriedades existentes
       &:focus:not(:focus-visible) {
           outline: none;
       }

       &:focus-visible {
           outline: var(--max-focus-outline);
           outline-offset: 1px;
       }
   }

   &__select {
       &:focus-visible {
           outline: var(--max-focus-outline);
           outline-offset: 1px;
       }
   }
   ```
2. **`MaxInputMarkdownToolbar.vue`**:
   Em `.md-toolbar__btn`:
   ```scss
   .md-toolbar__btn {
       // ... propriedades existentes
       &:focus:not(:focus-visible) {
           outline: none;
       }

       &:focus-visible {
           outline: var(--max-focus-outline);
           outline-offset: 1px;
       }
   }
   ```

### Passo 7: Implementação em Tabelas (`MaxTable.vue` e `MaxTableFields.vue`)
1. Em `MaxTable.vue`:
   - Remover `outline: none !important;` indiscriminado na regra `td` (linha 911).
   - Aplicar `:focus-visible` nas colunas ordenáveis (`.max-table-th-sortable`):
     ```scss
     .max-table-th-sortable {
         cursor: pointer;

         &:focus:not(:focus-visible) {
             outline: none;
         }

         &:focus-visible {
             outline: var(--max-focus-outline);
             outline-offset: -2px;
         }
     }
     ```
2. Em `MaxTableFields.vue`:
   - Ajustar `.max-table-fields-td` para permitir foco em células ou controles editáveis:
     ```scss
     .max-table-fields-td {
         &:focus-visible {
             outline: var(--max-focus-outline);
             outline-offset: -1px;
         }
     }
     ```

---

## 4. Padrões WCAG 2.1/2.2 e Diretrizes do GEMINI.md

| Critério WCAG | Nível | Como a Implementação Cumpre o Padrão |
|---|---|---|
| **2.4.7 Focus Visible** | A | Nenhum controle focável suprime o anel de foco no modo de navegação por teclado (`Tab`, setas). |
| **2.4.11 Focus Appearance** | AA (WCAG 2.2) | O anel de foco possui espessura mínima de 2px sólida (`2px solid ...`), área perimetral contínua e contraste superior a 3:1 em relação aos fundos adjacentes no modo claro (`#00768E` sobre `#ffffff`) e no modo escuro (`#178DA5` sobre `#18181b`). |
| **1.4.11 Non-text Contrast** | AA | Os indicadores de estado e foco visual cumprem com folga a taxa de contraste mínima de 3:1 exigida para elementos de interface do usuário. |

### Diretrizes de Estilização (GEMINI.md)
- Todas as regras de foco residem nos blocos `<style lang="scss" scoped>`.
- O aninhamento espelha estritamente a hierarquia dos seletores do template.
- Cores de foco consomem obrigatoriamente as variáveis do design system (`var(--max-focus-outline)` e `var(--max-primary-500)`).

---

## 5. Critérios de Aceite e Verificação Técnica

### Critérios de Aceite
1. **Inspeção de Navegação com Tecla Tab**:
   - Ao teclar `Tab` para percorrer `MaxListBox`, `MaxAccordionItem`, `MaxTab`, `MaxInputCodeToolbar`, `MaxInputMarkdownToolbar` e os cabeçalhos de `MaxTable`, um contorno azul-petróleo (teal) de 2px de espessura com cantos arredondados deve ser exibido com precisão.
2. **Supressão Exclusiva no Clique do Mouse**:
   - Ao clicar com o ponteiro do mouse nos mesmos botões e abas, nenhum anel de foco perturbador deve ser desenhado (comportamento nativo de `:focus:not(:focus-visible)`).
3. **Modo Escuro**:
   - No modo escuro (`.dark`), o contorno deve ajustar-se automaticamente para `--max-primary-400` (`#178DA5`), mantendo contraste perceptível e nítido.
4. **Validação de Lint**:
   - `npm run lint` passa com 0 advertências de Stylelint e ESLint.

### Suíte de Testes Automatizados (`tests/themes/FocusVisibleUnified.test.ts`)
```typescript
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Padronização de Foco Visível e Eliminação de outline: none Inseguro', () => {
    it('params.scss não deve conter outline: none !important solto sem :focus-visible', () => {
        const content = readFileSync(resolve(__dirname, '../../src/themes/params.scss'), 'utf-8');
        expect(content).not.toMatch(/\[noborder\]\s*\{[^}]*outline:\s*none\s*!important;(?!\s*&)/);
    });

    it('MaxAccordionItem deve declarar &:focus-visible com var(--max-focus-outline)', () => {
        const content = readFileSync(resolve(__dirname, '../../src/components/MaxAccordionItem.vue'), 'utf-8');
        expect(content).toContain('&:focus-visible');
        expect(content).toContain('--max-focus-outline');
    });

    it('MaxTab deve declarar &:focus-visible com var(--max-focus-outline)', () => {
        const content = readFileSync(resolve(__dirname, '../../src/components/MaxTab.vue'), 'utf-8');
        expect(content).toContain('&:focus-visible');
        expect(content).toContain('--max-focus-outline');
    });

    it('MaxListBox deve declarar &:focus-visible em .max-listbox-list', () => {
        const content = readFileSync(resolve(__dirname, '../../src/components/MaxListBox.vue'), 'utf-8');
        expect(content).toContain('&:focus-visible');
        expect(content).toContain('--max-focus-outline');
    });
});
```

---

## 6. Mitigação de Riscos de Regressão

| Risco Potencial | Probabilidade | Impacto | Estratégia de Mitigação |
|---|---|---|---|
| **Aparecimento de anéis indesejados ao clicar com mouse** | Baixa | Baixo | Uso rigoroso da pseudo-classe moderna `:focus-visible` em conjunto com `&:focus:not(:focus-visible) { outline: none; }`, suportada em 100% dos navegadores modernos. |
| **Corte de anel de foco por `overflow: hidden` em contêineres pais** | Média | Médio | Em contêineres com `overflow: hidden` (como `MaxListBox` ou células de tabela), aplicar `outline-offset: -2px;` para desenhar o anel para dentro dos limites da borda (*inset outline*), evitando qualquer corte visual. |
| **Quebra de testes de snapshot existentes** | Baixa | Baixo | As adições são estritamente de classes pseudo-estilos no bloco `<style scoped>`, não alterando nós, classes raiz ou tags no template HTML. |
