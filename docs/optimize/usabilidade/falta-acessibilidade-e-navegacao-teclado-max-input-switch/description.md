# Falta de Acessibilidade e Navegação por Teclado em MaxInputSwitch e MaxInputToggle

## Descrição e Causa Raiz

### Problema
O componente `MaxInputSwitch.vue` é a solução primária da biblioteca para alternâncias booleanas (Sim/Não, Ativo/Inativo). No entanto, sua implementação é feita inteiramente com `<div>`s sem semântica e manipuladores puramente de clique com mouse:

```html
<!-- MaxInputSwitch.vue:1-19 -->
<template>
    <InputBase v-bind="props" class="max-input-switch max-switch">
        <div :class="`max-switch-input ${temp_value === props.trueValue ? 'active' : ''}`">
            <div class="max-switch-label left" v-if="has_left_label" @click="() => setValue(props.falseValue)">
                {{ props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel ?? '' }}
            </div>
            <div :class="`max-switch-toggle ${temp_value === props.trueValue ? 'active' : ''}`" @click="toggleValue">
                <div class="max-switch-background">
                    <div class="max-switch-button">

                    </div>
                </div>
            </div>
            <div class="max-switch-label right" v-if="has_right_label" @click="() => setValue(props.trueValue)">
                {{ props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question ?? '' }}
            </div>
        </div>
    </InputBase>
</template>
```

### Análise de Violações ARIA e de Usabilidade
1. **Ausência Completa de Papel ARIA (`role="switch"`) e Estado (`aria-checked`):**
   De acordo com o padrão WAI-ARIA Switch Pattern, um interruptor deve possuir `role="switch"` e o atributo `aria-checked="true|false"`. Em `MaxInputSwitch.vue`, não há nenhuma menção a esses atributos.
2. **Impossibilidade Total de Foco e Operação por Teclado (WCAG 2.1.1):**
   Nenhum dos elementos internos (`div.max-switch-input`, `div.max-switch-toggle`) possui `tabindex="0"`. Usuários que navegam com a tecla `Tab` simplesmente saltam sobre o switch sem conseguir interagir. Também não há manipuladores de `@keydown.enter` ou `@keydown.space`.
3. **Ausência de Indicador de Foco Visível (WCAG 2.4.7):**
   Como o elemento não recebe foco, não há estilos `:focus-visible`.
4. **Desconexão de Rótulo em MaxInputToggle (`MaxInputToggle.vue:1-29`):**
   No componente irmão `MaxInputToggle.vue`, o rótulo principal é exibido em uma `<div>` (`.input-toggle-field-label-div`), enquanto o controle real é um `<input type="checkbox">` envolto em `<label class="max-toggleswitch">` que não contém texto. Não há associação via `id`/`for` ou `aria-labelledby`, resultando em um checkbox sem rótulo acessível para leitores de tela.

## Localização no Código
- [`src/components/MaxInputSwitch.vue:1-19`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue#L1-L19)
- [`src/components/MaxInputToggle.vue:1-29`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputToggle.vue#L1-L29)

## Proposta de Solução
1. Em `MaxInputSwitch.vue`, transformar o elemento interativo de alternância em um botão ou adicionar os atributos ARIA e ouvintes de teclado:
   ```html
   <div
       class="max-switch-toggle"
       :class="{ active: temp_value === props.trueValue }"
       role="switch"
       tabindex="0"
       :aria-checked="temp_value === props.trueValue"
       :aria-label="props.label ?? props.question ?? 'Alternar'"
       :aria-disabled="props.disabled ? 'true' : undefined"
       @click="toggleValue"
       @keydown.space.prevent="toggleValue"
       @keydown.enter.prevent="toggleValue"
   >
   ```
2. Adicionar regras CSS para `:focus-visible` em `.max-switch-toggle:focus-visible`:
   ```scss
   .max-switch-toggle:focus-visible {
       outline: 2px solid var(--blue-600);
       outline-offset: 2px;
   }
   ```
3. Em `MaxInputToggle.vue`, associar o `input` nativo à `label` externa via `id` único e atributo `for`.
