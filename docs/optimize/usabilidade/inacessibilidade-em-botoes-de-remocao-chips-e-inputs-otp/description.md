# Inacessibilidade em Remoção de Chips, Entradas OTP e Botões Apenas Ícone

## Descrição e Causa Raiz

### Problema

#### 1. Remoção de Chips Inacessível por Teclado (`MaxChips.vue:28-40`)
Em `MaxChips.vue`, os tokens já adicionados exibem um botão de remoção individual com o seguinte código:
```html
<!-- MaxChips.vue:28-40 -->
<button
    v-if="!props.disabled && props.removable !== false"
    type="button"
    class="max-chip-remove-btn"
    tabindex="-1"
    :aria-label="'Remover ' + resolveChipLabel(item)"
    @click.stop="removeChip(index)"
>
    <slot name="removeicon">
        <MaxIcon icon="material-symbols:close-rounded" :size="0.85" />
    </slot>
</button>
```
- O atributo `tabindex="-1"` foi fixado no botão de remoção.
- **Consequência:** Embora o botão possua um bom `aria-label`, ele é **completamente inalcançável via tecla Tab**!
- Se um usuário adicionar 5 chips e quiser remover o segundo chip utilizando o teclado, isso é impossível, pois a única navegação de exclusão implementada é a tecla `Backspace` no final do `<input>`, que apenas apaga o último item da lista em ordem inversa.

#### 2. Falta de Contexto em Entradas de Código OTP (`MaxInputOTP.vue:22-46`)
Em `MaxInputOTP.vue`, as caixas de digitação individuais são renderizadas em loop:
```html
<!-- MaxInputOTP.vue:22-45 -->
<input
    v-for="item in group"
    :key="item.index"
    :ref="(el) => setInputRef(el, item.index)"
    class="max-input-otp-cell"
    :type="props.mask ? 'password' : 'text'"
    :inputmode="props.integerOnly ? 'numeric' : 'text'"
    :pattern="props.integerOnly ? '[0-9]*' : undefined"
    :maxlength="1"
    :disabled="props.disabled"
    :placeholder="props.placeholder || ''"
    :value="values[item.index]"
    :autocomplete="item.index === 0 ? 'one-time-code' : 'off'"
    ...
/>
```
- Nenhuma célula possui `aria-label` identificando sua posição (ex.: "Dígito 1 de 6", "Dígito 2 de 6").
- O contêiner de dígitos não declara `role="group"` nem `:aria-label="props.label ?? 'Código de verificação'"` associado.
- Para um usuário cego com leitor de tela, cada avanço de dígito anuncia monotonamente: "Edição de texto, em branco", sem informar em qual posição do código o usuário está digitando.

#### 3. MaxLikeButton sem Rótulo no Modo onlyIcon (`MaxLikeButton.vue:1-22`)
```html
<button
    type="button"
    class="max-like-button"
    :class="buttonClasses"
    :disabled="props.disabled || props.loading"
    :aria-pressed="isLiked"
    @click="handleClick"
>
    <span class="max-like-icon-container">...</span>
    <span v-if="!props.onlyIcon" class="max-like-label"><slot>{{ props.label }}</slot></span>
</button>
```
Quando `onlyIcon: true` é passado, o rótulo de texto é omitido da renderização. Porém, o `<button>` não recebe `:aria-label="props.label"`. O leitor de tela anuncia apenas "Botão alternável, não pressionado", sem informar que o botão serve para dar "Curtir/Gostei".

## Localização no Código
- [`src/components/MaxChips.vue:28-40`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L28-L40)
- [`src/components/MaxInputOTP.vue:14-47`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputOTP.vue#L14-L47)
- [`src/components/MaxLikeButton.vue:1-22`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLikeButton.vue#L1-L22)

## Proposta de Solução
1. Em `MaxChips.vue`, remover `tabindex="-1"` ou permitir navegação via setas esquerda/direita dentro da lista de chips com foco no botão de exclusão.
2. Em `MaxInputOTP.vue`, adicionar `:aria-label="'Dígito ' + (item.index + 1) + ' de ' + effectiveLength"` em cada input e adicionar `role="group"` com `:aria-label="props.label ?? 'Código de verificação'"` no contêiner.
3. Em `MaxLikeButton.vue`, adicionar `:aria-label="props.onlyIcon ? props.label : undefined"` no elemento `<button>`.
