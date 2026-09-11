# Supressão Insegura de Outline e Fragmentação Sistêmica de Indicadores de Foco Visível (`:focus-visible`)

## Severidade: Alta

## Componentes Impactados
- `src/themes/params.scss`
- `src/components/MaxListBox.vue`
- `src/components/MaxAccordionItem.vue`
- `src/components/MaxTab.vue`
- `src/components/MaxInputCodeToolbar.vue`
- `src/components/MaxInputMarkdownToolbar.vue`
- `src/components/MaxTable.vue`
- `src/components/MaxTableFields.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Foco Invisível em Controles Focáveis**: Ao navegar exclusivamente por teclado utilizando a tecla `Tab`, o usuário depara-se com "foco fantasma": o foco avança para a lista de itens (`MaxListBox`), para cabeçalhos de acordeão (`MaxAccordionItem`), para abas de navegação (`MaxTab`) ou para os botões das barras de ferramentas de código e markdown, mas **nenhum anel ou indicador visual de foco é exibido na tela**. O usuário não consegue saber qual elemento está ativo para pressionar `Enter` ou `Space`.
2. **Inconsistência Visual e Baixo Contraste**: Nos poucos componentes que implementaram anel de foco, há divergência de cores e dimensões: alguns utilizam `--max-focus-ring-color`, outros `--max-primary-500`, outros a cor azul fixa `--blue-500` / `--blue-600`, e outros sombras suaves `box-shadow` com opacidade que falham no teste de contraste 3:1 exigido pela WCAG 2.2 em fundos escuros.

### Causa Raiz Profunda
1. **Supressão Global Indiscriminada**: No arquivo de parâmetros globais `src/themes/params.scss`, a regra utilitária `[noborder]` aplica `outline: none !important;` de forma indiscriminada, removendo o contorno de foco nativo fornecido pelo agente do usuário sem estabelecer uma regra correspondente para `:focus-visible`.
2. **Supressão em Componentes Interativos sem Contrapartida**: Em múltiplos componentes interativos, os desenvolvedores declararam `outline: none` para remover o contorno ao clicar com o mouse, mas omitiram por completo o bloco de estilo `:focus-visible`:
   - Em `MaxListBox.vue`: o contêiner rolável e focável `.max-listbox-list` (`tabindex="0"`, `role="listbox"`) recebe `outline: none;` (linha 681), mas nenhuma regra `:focus-visible` foi escrita para ele.
   - Em `MaxAccordionItem.vue`: o elemento interativo `.max-accordion-item-header` (`role="button"`, `tabindex="0"`) possui apenas `:hover`, não existindo `:focus-visible` em seu SCSS.
   - Em `MaxTab.vue`: a aba individual `.max-tab` (`role="tab"`, `tabindex="0"`) não possui `:focus-visible`. Se uma aba não selecionada receber foco por navegação, não há como distinguir que ela está focada.
   - Em `MaxInputCodeToolbar.vue` e `MaxInputMarkdownToolbar.vue`: a classe dos botões (`.max-input-code-toolbar__btn` e `.md-toolbar__btn`) tem `border: 1px solid transparent; background: transparent;`, sem nenhum indicador visual ao receber foco pelo teclado.
   - Em `MaxTable.vue`: a tag `td` aplica `outline: none !important;` (linha 911), e cabeçalhos ordenáveis não possuem estilo de foco.

---

## Evidência Técnica com Trechos e Caminhos de Arquivo

### 1. `src/themes/params.scss` (Linhas 81–84)
Regra global que remove foco forçadamente:

```scss
// Trecho de src/themes/params.scss
[noborder] {
    border: none !important;
    outline: none !important; // Quebra o anel nativo em qualquer componente que use o atributo noborder
}
```

### 2. `src/components/MaxListBox.vue` (Linhas 677–684)
Elemento com `role="listbox"` e `tabindex="0"` que suprime outline sem alternativa:

```scss
// Trecho de src/components/MaxListBox.vue
.max-listbox-list {
    position: relative;
    flex: 1;
    overflow-y: auto;
    outline: none; // Supressão sem :focus-visible
    scrollbar-width: none;
    -ms-overflow-style: none;
```

### 3. `src/components/MaxAccordionItem.vue` (Linhas 126–141)
Cabeçalho de acordeão (`role="button"`) com estilo de hover mas sem `:focus-visible`:

```scss
// Trecho de src/components/MaxAccordionItem.vue
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

    &.max-accordion-item-header-active {
        color: var(--max-primary-500);
    }
    // FALHA: Nenhuma regra &:focus-visible definida
}
```

### 4. `src/components/MaxInputCodeToolbar.vue` (Linhas 307–336)
Botões de barra de ferramentas sem definição de foco visível:

```scss
// Trecho de src/components/MaxInputCodeToolbar.vue
&__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: var(--background-650, #475569);
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;

    &:hover:not(:disabled) {
        background-color: var(--background-150, #e2e8f0);
        color: var(--background-900, #0f172a);
    }
    // FALHA: Nenhuma regra &:focus-visible definida
}
```

---

## Impacto na Usabilidade e Conformidade com WCAG

| Critério WCAG | Nível | Descrição do Impacto |
|---|---|---|
| **2.4.7 Focus Visible** | A | Falha direta: o indicador de foco do teclado não é visível em múltiplos elementos interativos fundamentais da biblioteca. |
| **2.4.11 Focus Appearance** | AA (WCAG 2.2) | Falha: o indicador de foco, quando existente, não atinge espessura mínima de 2px ou falha na relação de contraste de 3:1 contra cores de fundo adjacentes. |

### Recomendações de Correção
1. Declarar nos tokens de tema uma variável padronizada de foco do design system:
   ```scss
   --max-focus-ring: 2px solid var(--max-primary-500, #00768e);
   --max-focus-ring-offset: 2px;
   ```
2. Remover `outline: none !important;` incondicional de `src/themes/params.scss`.
3. Adicionar regra padrão de `:focus-visible` em todos os elementos operáveis (`.max-accordion-item-header`, `.max-listbox-list`, `.max-tab`, botões de toolbars):
   ```scss
   &:focus-visible {
       outline: 2px solid var(--max-focus-ring-color, #00768e);
       outline-offset: 2px;
   }
   ```
