# Plano de Implementação: Inacessibilidade em Botões de Remoção de Chips, Inputs OTP e Botões Apenas Ícone

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue#L28-L40):**
   - O botão individual de exclusão de cada chip possui `tabindex="-1"` fixado no template.
   - Embora o botão possua um bom atributo `:aria-label="'Remover ' + resolveChipLabel(item)"`, **ele é completamente inalcançável por tabulação de teclado** (WCAG 2.1.1).
   - Se o usuário cadastrar múltiplos chips e desejar remover o primeiro ou o intermediário via teclado, ele é impossibilitado, pois a única forma de exclusão por teclado é pressionar `Backspace` no campo de texto ao final da lista, o qual apaga apenas o último chip em sequência reversa.
2. **[`MaxInputOTP.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputOTP.vue#L14-L47):**
   - As caixas de digitação individuais de 1 caractere não possuem `aria-label` posicional.
   - O agrupamento de dígitos não declara `role="group"` nem `:aria-label="props.label ?? 'Código de verificação'"`.
   - Para um usuário cego com leitor de tela (NVDA/TalkBack), cada salto automático de foco apenas anuncia repetidamente "Edição de texto, em branco", sem informar em qual posição do código de segurança o cursor se encontra (WCAG 1.3.1 e 4.1.2).
3. **[`MaxLikeButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLikeButton.vue#L1-L22):**
   - No modo `onlyIcon: true`, o texto do botão é omitido do template, mas o elemento `<button>` não recebe `:aria-label="props.label || 'Curtir'"`. O leitor de tela anuncia apenas "Botão de alternância, não pressionado", sem informar a que se refere a ação.

### Objetivo
- Permitir navegação e remoção de chips individuais por teclado em `MaxChips.vue`.
- Fornecer contexto acessível estruturado para o grupo de campos OTP em `MaxInputOTP.vue` com `role="group"` e rótulos posicionais individuais ("Dígito 1 de 6").
- Garantir rótulo acessível explícito em `MaxLikeButton.vue` quando renderizado no modo `onlyIcon`.

---

## 2. Arquivos a Modificar

- [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChips.vue)
- [`src/components/MaxInputOTP.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputOTP.vue)
- [`src/components/MaxLikeButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxLikeButton.vue)
- [`tests/unit/MaxChips.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxChips.spec.ts)
- [`tests/unit/MaxInputOTP.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputOTP.spec.ts)
- [`tests/unit/MaxLikeButton.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxLikeButton.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxChips.vue`

#### Alterações no Template
Permitir que o botão de remoção seja alcançado por foco ou setas direcionais:
```html
<button
    v-if="!props.disabled && props.removable !== false"
    type="button"
    class="max-chip-remove-btn"
    tabindex="0"
    :aria-label="'Remover ' + resolveChipLabel(item)"
    @click.stop="removeChip(index)"
    @keydown.enter.prevent="removeChip(index)"
    @keydown.space.prevent="removeChip(index)"
>
    <slot name="removeicon">
        <MaxIcon icon="material-symbols:close-rounded" :size="0.85" />
    </slot>
</button>
```

#### Alterações no SCSS Scoped
Adicionar anel de foco no botão de remoção:
```scss
.max-chip-remove-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    padding: 2px;
    margin-left: 4px;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 1px;
    }
}
```

---

### 3.2. `MaxInputOTP.vue`

#### Alterações no Template
1. Agrupamento semântico no contêiner com `role="group"`:
```html
<div
    class="max-input-otp-container"
    :class="{ 'is-disabled': props.disabled }"
    role="group"
    :aria-label="props.label || `Código de verificação de ${effectiveLength} dígitos`"
>
```

2. Rótulos contextuais de posição para cada input celular:
```html
<input
    v-for="item in group"
    :key="item.index"
    :ref="(el) => setInputRef(el, item.index)"
    class="max-input-otp-cell"
    :class="{
        'has-value': !!values[item.index],
        'is-focused': focusedIndex === item.index
    }"
    :type="props.mask ? 'password' : 'text'"
    :inputmode="props.integerOnly ? 'numeric' : 'text'"
    :pattern="props.integerOnly ? '[0-9]*' : undefined"
    :maxlength="1"
    :disabled="props.disabled"
    :placeholder="props.placeholder || ''"
    :value="values[item.index]"
    :aria-label="`Dígito ${item.index + 1} de ${effectiveLength}`"
    :autocomplete="item.index === 0 ? 'one-time-code' : 'off'"
    @input="onInput($event, item.index)"
    @keydown="onKeyDown($event, item.index)"
    @focus="onFocus(item.index)"
    @blur="onBlur(item.index)"
    @paste="onPaste($event)"
/>
```

#### SCSS Scoped
Assegurar foco visível destacado na célula OTP ativa:
```scss
.max-input-otp-cell {
    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E) !important;
        outline-offset: 1px;
        z-index: 1;
    }
}
```

---

### 3.3. `MaxLikeButton.vue`

#### Alterações no Template
Adicionar `:aria-label` quando no modo `onlyIcon`:
```html
<template>
    <button
        type="button"
        class="max-like-button"
        :class="buttonClasses"
        :disabled="props.disabled || props.loading"
        :aria-pressed="isLiked ? 'true' : 'false'"
        :aria-label="props.onlyIcon ? (props.label || 'Curtir') : undefined"
        @click="handleClick"
    >
        <span class="max-like-icon-container" :class="{ 'animating': isAnimating }">
            <MaxIcon
                :icon="resolvedIcon"
                :size="resolvedIconSize"
                class="max-like-icon"
                :color="resolvedIconColor"
            />
        </span>

        <span v-if="!props.onlyIcon" class="max-like-label">
            <slot>{{ props.label }}</slot>
        </span>

        <span
            v-if="!props.noNumber"
            class="max-like-badge"
            :class="[props.onlyIcon ? 'is-overlay' : 'is-inline', props.badgeClass]"
        >
            {{ formattedNumber }}
        </span>
    </button>
</template>
```

#### SCSS Scoped
```scss
.max-like-button {
    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 2px;
        border-radius: 6px;
    }
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Chips Input:** A digitação usual de chips via teclado e a remoção com `Backspace` continuam operando normalmente. O botão de remoção torna-se agora adicionalmente acessível via `Tab` e `Enter`.
2. **OTP e LikeButton:**
   - Nenhuma propriedade foi renomeada ou removida.
   - Em `MaxLikeButton`, quando `onlyIcon` for falso, o texto visível continua sendo anunciado naturalmente pelo leitor sem duplicação de `aria-label`.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] O botão de remoção em `MaxChips` recebe foco com `Tab` (`tabindex="0"`) e aciona a exclusão do chip ao pressionar `Enter` ou `Espaço`.
- [ ] As células de `MaxInputOTP` possuem `aria-label` posicional (ex: "Dígito 1 de 6", "Dígito 2 de 6").
- [ ] O contêiner de `MaxInputOTP` declara `role="group"` e descrição acessível.
- [ ] `MaxLikeButton` em modo `onlyIcon: true` expõe `aria-label` com o texto da ação (ex: "Curtir").

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxChips.spec.ts
npx vitest run tests/unit/MaxInputOTP.spec.ts
npx vitest run tests/unit/MaxLikeButton.spec.ts
```
