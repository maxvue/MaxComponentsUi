# Affordance Quebrada em Controles de Seleção e Botões de Ícone (`MaxInputSwitch`, `MaxInputRadio`, `MaxIconButton`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxInputSwitch.vue`, `MaxInputRadio.vue`, `MaxInputCheckbox.vue`, `MaxIconButton.vue`.
- **Categoria:** Inputs e formulários / Ações e botões / Consistência e clareza de affordance.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #4 (Consistência e Padrões), Nielsen #1 (Visibilidade do Status) e Diretrizes W3C WAI-ARIA (Design Patterns para Switch, Radio e Button).

---

## Descrição do Problema

Diversos componentes de controle e ação utilizam marcação puramente visual com elementos `<div>`, omitindo semântica nativa e quebrando o feedback de estados desabilitados:

### 1. `MaxInputSwitch`: Switch Fantasma Sem Acessibilidade e Sem Visual Desabilitado
Em [`MaxInputSwitch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue), o controle é construído exclusivamente com elementos `<div>`:
- Não há `<input type="checkbox">` nativo.
- Não há `role="switch"`, `aria-checked` ou `tabindex="0"`.
- Não há nenhum tratamento para eventos de teclado (`@keydown.space`, `@keydown.enter`).
- **Pior:** quando `props.disabled === true`, os métodos `setValue` e `toggleValue` bloqueiam a mutação interna (`if (props.disabled) return;`), mas no CSS **não existe nenhuma regra para o estado desabilitado**. O switch desabilitado mantém exatamente a mesma cor, o mesmo cursor pointer e o mesmo contraste de um switch habilitado. O usuário clica várias vezes, nada acontece, e ele presume que o sistema travou.

### 2. `MaxInputRadio`: Seleção Permitida Mesmo Quando Desabilitado
Em [`MaxInputRadio.vue:56-59`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputRadio.vue#L56-L59):
```ts
const onClick = (e: Event) => {
    if (e && (e.target as HTMLElement).tagName === 'INPUT') return;
    temp_value.value = props.value;
};
```
O método `onClick` no wrapper externo não verifica se `attrs.disabled` ou `props.disabled` é verdadeiro. Embora o input nativo possua o atributo `:disabled`, se o usuário clicar no texto do label ou no container ao redor, o valor é alterado e emitido normalmente, contornando o bloqueio de segurança do campo.

### 3. `MaxIconButton`: Botão Falso em `<div>` sem Foco de Teclado
Em [`MaxIconButton.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L2):
```html
<div :class="`max-icon-button icon-div ico-btn ${hover ? 'hover' : ''}`" ... @click="onClick">
```
O componente renderiza uma `<div>`, não uma tag `<button>`. Não possui `tabindex="0"`, `role="button"`, nem acessibilidade para acionamento via teclado. Além disso, quando `MaxButton` é utilizado sem `label` (ex.: `<MaxButton icon="mdi:trash" :disabled="true" />`), ele delega para `MaxIconButton`, herdando essa deficiência de affordance e acessibilidade.

---

## Evidência no Código

1. [`MaxInputSwitch.vue:3-17`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue#L3-L17): estrutura baseada em `div` sem semântica interativa WAI-ARIA.
2. [`MaxInputSwitch.vue:116-193`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue#L116-L193): inexistência de classes ou seletores CSS para `[disabled]`, `:disabled` ou `.is-disabled`.
3. [`MaxInputRadio.vue:56-59`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputRadio.vue#L56-L59): clique na área externa ignora a flag `disabled`.
4. [`MaxIconButton.vue:37-55`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L37-L55): ausência de checagem de `props.disabled` antes de executar ações de rota ou callbacks assíncronos.

---

## Impacto na Experiência do Usuário (UX)

1. **Frustração por Falta de Feedback:** Usuários que interagem com switches desabilitados não recebem nenhuma pista visual de indisponibilidade (como redução de opacidade ou cursor `not-allowed`). A sensação percebida é de lentidão ou defeito da aplicação.
2. **Inconsistência de Controle:** Poder marcar opções de rádio desabilitadas simplesmente clicando em seu texto viola as expectativas elementares de segurança e validação do sistema.
3. **Barreira Intransponível para Teclado:** Pessoas que utilizam navegação por teclado (tecla Tab) não conseguem sequer focar ou alternar switches e botões de ícone na interface.

---

## Recomendações de Solução

1. **Semântica e Acessibilidade em `MaxInputSwitch`:**
   - Adicionar atributos semânticos: `role="switch"`, `:aria-checked="temp_value === props.trueValue"`, `:tabindex="props.disabled ? -1 : 0"`.
   - Adicionar listeners de teclado para alternância: `@keydown.space.prevent="toggleValue"` e `@keydown.enter.prevent="toggleValue"`.
   - Implementar estilização clara para desabilitado:
     ```scss
     &.is-disabled, &[disabled] {
         opacity: 0.5;
         cursor: not-allowed;
         pointer-events: none;
     }
     ```
2. **Proteção Rigorosa em `MaxInputRadio`:**
   - No `onClick` do `MaxInputRadio`, validar `if (attrs.disabled || props.disabled) return;` antes de alterar o valor.
3. **Migrar `MaxIconButton` para `<button>` Nativo:**
   - Utilizar a tag `<button type="button">`, herdando comportamento nativo de foco, estados de desabilitação (`:disabled="props.disabled || props.loading"`) e disparos de teclado automáticos.
