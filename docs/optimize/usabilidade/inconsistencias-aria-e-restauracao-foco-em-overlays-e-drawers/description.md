# Inconsistências de WAI-ARIA, Rótulo Acessível e Focus Trap em MaxDrawer e Overlays

## Descrição e Causa Raiz

### Problema

#### 1. Incompatibilidade Semântica de Role e Atributo em MaxDrawer (`MaxDrawer.vue:12-19`)
No componente `MaxDrawer.vue`, o elemento principal do painel deslizado é declarado assim:
```html
<!-- MaxDrawer.vue:12-19 -->
<div
    ref="panel_el"
    class="max-drawer"
    :class="[`max-drawer-${props.position}`, { 'max-drawer-no-padding': props.noPadding }, $attrs.class]"
    role="complementary"
    aria-modal="true"
    @keydown="trap.onKeydown"
>
```
- **Conflito WAI-ARIA:** A especificação oficial da W3C / WAI-ARIA estabelece que o atributo `aria-modal="true"` é estritamente aplicável aos papéis `role="dialog"` e `role="alertdialog"`. Utilizar `aria-modal="true"` em um landmark `role="complementary"` é semanticamente inválido e confunde os leitores de tela modernos, que tratam landmarks como seções navegáveis da página principal, e não como contêineres modais isolados.
- **Ausência de Nome Acessível (WCAG 4.1.2):** Apesar de receber `props.header` ou slot `header`, o painel do drawer não possui nem `aria-labelledby` referenciando o id do título, nem `aria-label`. Usuários de leitor de tela entram em um container modal sem saber qual é o propósito ou título da gaveta.

#### 2. Ausência de Fallback de Foco no Contêiner
No helper `useFocusTrap.ts` ([`src/helpers/useFocusTrap.ts:48-54`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useFocusTrap.ts#L48-L54)):
```typescript
const activate = () => {
    previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    nextTick(() => {
        const items = focusable();
        items[0]?.focus();
    });
};
```
Se o drawer ou modal for aberto com conteúdo puramente informativo (ex.: texto simples sem botões/links focáveis imediatamente disponíveis), `items[0]` é `undefined`. O contêiner (`.max-drawer`) não possui `tabindex="-1"`, portanto o foco permanece no `document.body` atrás da máscara, permitindo que a navegação por teclado ou leitores de tela leia elementos fora do diálogo.

#### 3. MaxInputIconPicker Drawer sem Semântica Modal ([`src/components/MaxInputIconPicker.vue:24-30`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L24-L30))
O seletor de ícones abre uma gaveta inferior (`.max-icon-picker-drawer`) que não utiliza nem o componente `MaxDrawer` nem as propriedades `role="dialog"`, `aria-modal="true"`, focus trap ou fechamento com tecla `Escape`. O botão de fechar (`.p-drawer-close-button`) não possui `aria-label="Fechar"`.

## Localização no Código
- [`src/components/MaxDrawer.vue:12-23`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxDrawer.vue#L12-L23)
- [`src/helpers/useFocusTrap.ts:48-54`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/helpers/useFocusTrap.ts#L48-L54)
- [`src/components/MaxInputIconPicker.vue:22-35`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputIconPicker.vue#L22-L35)

## Proposta de Solução
1. Em `MaxDrawer.vue`:
   - Utilizar `role="dialog"` (ou parametrizável com `props.modal ? 'dialog' : 'complementary'`).
   - Gerar um ID estável para o título (`id="drawer-header-${id}"`) e adicionar `:aria-labelledby="titleId"` ou `:aria-label="props.header ?? undefined"` no painel.
   - Adicionar `tabindex="-1"` ao painel `.max-drawer` e focar o painel como fallback caso não haja elementos focáveis internos.
2. Em `MaxInputIconPicker.vue`:
   - Refatorar a gaveta inferior para utilizar `MaxDrawer` diretamente ou adicionar `role="dialog"`, `aria-modal="true"`, foco automático no campo de pesquisa ao abrir, e manipulador para tecla `Escape`.
