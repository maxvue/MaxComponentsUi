# Falha Crítica de Acessibilidade e Tamanho de Toque em MaxIconButton

## Descrição e Causa Raiz

### Problema
O componente `MaxIconButton.vue` é um dos elementos interativos mais utilizados em toda a biblioteca `MaxComponentsUi` — servindo como base para botões de fechar modais e gavetas (`MaxModal.vue`, `MaxDrawer.vue`), botões de confirmação (`MaxIconConfirm.vue`), botões da barra superior (`MaxTopToolbar.vue`, `MaxTopMenu.vue`), ações de tabela (`MaxTableFields.vue`), etc.

Ao analisar seu template e implementação ([`MaxIconButton.vue:1-7`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L1-L7)), constata-se:
```html
<template>
    <div :class="`max-icon-button icon-div ico-btn ${hover ? 'hover' : ''}`" ref="icon_ref" :style="{width: size, height: size, transform: 'scale('+ (hover? props.hoverScale : 1) +')'}" @click="onClick" @mouseenter="hover = true" @mouseleave="hover = false">
        <slot>
            <MaxIcon pointer :icon="props.icon" :i="props.i" :dark="props.dark" :light="props.light" :checked="props.checked" :plus="props.plus" :rotate="props.rotate" :flip="props.flip" :size="size" :color="props.color ?? props.iconColor" />
        </slot>
    </div>
</template>
```

1. **Elemento Não Semântico sem Papel ARIA (WCAG 4.1.2):**
   Renderizado como uma `<div>` genérica sem `role="button"`. Dispositivos assistivos não reconhecem o elemento como acionável.
2. **Inacessível por Teclado (WCAG 2.1.1 - Teclado):**
   Não possui `tabindex="0"`. Usuários que navegam usando a tecla `Tab` não conseguem alcançar o botão. Além disso, não há ouvintes para as teclas `Enter` ou `Espaço`.
3. **Ausência de Nome Acessível (WCAG 1.1.1 e 4.1.2):**
   Não possui prop ou atributo de acessibilidade nativo (`aria-label`). Como o ícone interno é um SVG estático ou dinâmico sem texto equivalente, o botão é 100% invisível para usuários cegos.
4. **Dimensões Críticas de Alvo de Toque (WCAG 2.5.5 e 2.5.8 - Target Size):**
   No script ([`MaxIconButton.vue:26-29`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L26-L29)):
   ```typescript
   const size = computed(() => {
       const factor = Number(props.size);
       return 16 * (isNaN(factor) ? 1 : factor) + 'px';
   });
   ```
   Quando `size` não é especificado ou usa o padrão `1`, a largura e altura do elemento são calculadas em **16px por 16px**. Em touch screens e mobile, um alvo de 16px é extremamente difícil de acertar com precisão (o padrão mínimo da WCAG 2.5.8 é 24x24px e o padrão de Usabilidade Móvel/WCAG 2.5.5 é 44x44px).
5. **Sem Indicador de Foco Visível (WCAG 2.4.7):**
   Não há declaração de estilo `:focus-visible` no componente.

### Impactos
- Usuários dependentes de teclado não conseguem fechar modais (`MaxModal.vue:29`), gavetas (`MaxDrawer.vue:41`), confirmar ações (`MaxIconConfirm.vue:2`) ou acionar comandos na barra de ferramentas.
- Usuários com dificuldades motoras ou em dispositivos móveis sofrem com toques perdidos devido à área de 16px.

## Localização no Código
- [`src/components/MaxIconButton.vue:1-70`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue#L1-L70)
- [`src/components/MaxButton.vue:30`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxButton.vue#L30) (fallback de MaxButton para MaxIconButton quando não há label)
- [`src/components/MaxIconConfirm.vue:1-3`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconConfirm.vue#L1-L3)
- [`src/components/MaxModal.vue:29`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxModal.vue#L29)

## Proposta de Solução
1. Substituir a tag raiz por `<button type="button">` (ou adicionar `role="button"`, `tabindex="0"`, `@keydown.enter.prevent="onClick"` e `@keydown.space.prevent="onClick"`).
2. Adicionar suporte a `aria-label` nas props e passar para a raiz. Se não informado, utilizar `props.label` ou fallback contextual.
3. Garantir uma área mínima clicável de no mínimo 36px a 44px através de padding ou pseudo-elemento `::after` invisível para expansão de área de toque touch:
   ```scss
   .ico-btn {
       min-width: 36px;
       min-height: 36px;
       position: relative;
       
       &:focus-visible {
           outline: 2px solid var(--blue-600);
           outline-offset: 2px;
           border-radius: 4px;
       }
   }
   ```
