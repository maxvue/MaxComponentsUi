# Ausência de Indicadores de Foco Visível (:focus-visible) em Botões e Elementos Interativos

## Descrição e Causa Raiz

### Problema
O critério de sucesso **WCAG 2.4.7 (Foco Visível - Nível AA)** e as melhores práticas de usabilidade exigem que qualquer elemento interativo operável pelo teclado possua um indicador visual de foco claramente distinguível (um anel de foco, borda contrastante ou sombra destacada).

Ao auditar os componentes interativos centrais da biblioteca:

1. **MaxButton.vue ([`src/components/MaxButton.vue:110-300`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L110-L300)):**
   - O componente define regras detalhadas para `:hover`, `:active`, e variações de severidade (`success`, `info`, `warning`, `danger`, etc.).
   - **Não existe nenhuma regra para `:focus-visible`**.
   - Na variante `max-button-dashed` ([`src/components/MaxButton.vue:230-234`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L230-L234)), a regra `&:hover, &:active, &:focus { background: transparent !important; }` remove explicitamente qualquer distinção visual de foco.
2. **InputBase.vue ([`src/components/InputBase.vue:273-282`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L273-L282)):**
   - As regras globais scoped do componente forçam:
     ```scss
     :deep(input), :deep(textarea) {
         outline: none !important;
         box-shadow: none !important;
     }
     ```
   - Embora a `.max-input-field-div` adicione um contorno tênue de `1px solid var(--blue-700)` via `:focus-within`, ele possui baixo contraste e espessura insuficiente para usuários com baixa visão.
3. **MaxMenuVerticalItem.vue ([`src/components/MaxMenuVerticalItem.vue:8-12, 98-188`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMenuVerticalItem.vue#L8-L12)):**
   - Os itens do menu lateral recebem `tabindex="0"`, mas no bloco `<style lang="scss">` não há nenhuma regra para `:focus` ou `:focus-visible`. Ao tabular pelo menu vertical lateral, o usuário não tem nenhuma indicação visual de qual item está focado.

### Impacto
Usuários de navegação por teclado (usuários com deficiências motoras que usam switches/teclado, idosos ou usuários avançados) perdem a referência de onde está o cursor visual na página, não conseguindo prever qual ação será disparada ao teclar `Enter` ou `Espaço`.

## Localização no Código
- [`src/components/MaxButton.vue:110-307`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L110-L307)
- [`src/components/InputBase.vue:245-253, 273-283`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/InputBase.vue#L245-L253)
- [`src/components/MaxMenuVerticalItem.vue:98-188`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxMenuVerticalItem.vue#L98-L188)
- [`src/themes/tokens.scss:1-60`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/themes/tokens.scss#L1-L60)

## Proposta de Solução
1. Estabelecer um padrão de anel de foco consistente em `tokens.scss`:
   ```scss
   :root {
       --max-focus-ring: 0 0 0 2px var(--background-0), 0 0 0 4px var(--blue-600);
   }
   ```
2. Adicionar regras `:focus-visible` em `MaxButton.vue`:
   ```scss
   .max-button:focus-visible {
       outline: 2px solid var(--blue-600);
       outline-offset: 2px;
       box-shadow: 0 0 0 2px var(--background-0);
   }
   ```
3. Em `MaxMenuVerticalItem.vue`:
   ```scss
   .item_menu:focus-visible {
       outline: 2px solid var(--blue-600);
       outline-offset: -2px;
       border-radius: 8px;
   }
   ```
4. Melhorar o feedback visual de `:focus-within` em `InputBase.vue` para pelo menos 2px de contorno com contraste adequado.
