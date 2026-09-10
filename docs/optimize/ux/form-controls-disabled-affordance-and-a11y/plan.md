# Plano de Implementação: Affordance Quebrada em Controles de Seleção e Botões de Ícone (`MaxInputSwitch`, `MaxInputRadio`, `MaxIconButton`)

## 1. Diagnóstico e Objetivo

A auditoria identificou falhas graves de acessibilidade e quebra de affordance em controles interativos e botões de ação:
1. **`MaxInputSwitch.vue`:** Construído com elementos `<div>` sem atributos WAI-ARIA (`role="switch"`, `aria-checked`, `tabindex`), sem listeners para acionamento via teclado (Space/Enter) e sem regras CSS para o estado desabilitado (`props.disabled`). O switch desabilitado mantém o mesmo visual de um switch ativo com cursor `pointer`, mas ignora cliques, gerando a impressão de congelamento do sistema.
2. **`MaxInputRadio.vue`:** O método `onClick` no elemento contêiner externo não verifica se o controle está desabilitado (`props.disabled` ou `attrs.disabled`). Ao clicar sobre o rótulo (label) ou na área adjacente ao rádio desabilitado, o valor é alterado e emitido normalmente, contornando a regra de bloqueio.
3. **`MaxIconButton.vue`:** Renderiza uma `<div>` em vez de uma tag semântica `<button>`. Não possui suporte a foco via teclado (`tabindex="0"`), nem bloqueia cliques quando `disabled` ou `loading` estão ativos.

**Objetivo:**
1. Transformar `MaxInputSwitch` em um controle WAI-ARIA completo com `role="switch"`, `aria-checked`, `tabindex`, navegação e ativação por teclado, além de estilização nítida de estado desabilitado (`opacity: 0.5`, cursor `not-allowed`).
2. Blindar `MaxInputRadio` contra cliques externos em estado desabilitado e refletir affordance visual adequada no container e no label.
3. Refatorar `MaxIconButton` para renderizar uma tag nativa `<button type="button">`, herdando foco, desabilitação nativa e bloqueio de execução quando `props.disabled` ou `props.loading` forem verdadeiros.

---

## 2. Arquivos a Modificar (com links absolutos)

- [`src/components/MaxInputSwitch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue): implementação de atributos ARIA, listeners de teclado e estilos para estado desabilitado.
- [`src/components/MaxInputRadio.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputRadio.vue): bloqueio de cliques no wrapper para estado desabilitado e estilos de affordance.
- [`src/components/MaxIconButton.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxIconButton.vue): migração de `<div>` para `<button type="button">` com prevenção de ação em estado desabilitado.
- [`tests/components/MaxInputSwitch.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputSwitch.test.ts): testes de atributos ARIA, acionamento por teclado e desabilitação.
- [`tests/components/MaxInputRadio.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxInputRadio.test.ts): testes de bloqueio de clique na área externa quando desabilitado.
- [`tests/components/MaxIconButton.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/components/MaxIconButton.test.ts): testes de tag `<button>`, desabilitação e foco.

---

## 3. Especificação Técnica Cirúrgica

### 3.1. Ajustes em `MaxInputSwitch.vue`

Template atualizado:

```html
<template>
    <InputBase v-bind="props" class="max-input-switch max-switch" :class="{ 'is-disabled': props.disabled }">
        <div
            :class="`max-switch-input ${temp_value === props.trueValue ? 'active' : ''} ${props.disabled ? 'is-disabled' : ''}`"
            role="switch"
            :aria-checked="temp_value === props.trueValue"
            :aria-disabled="props.disabled"
            :tabindex="props.disabled ? -1 : 0"
            @keydown.space.prevent="toggleValue"
            @keydown.enter.prevent="toggleValue"
        >
            <div
                class="max-switch-label left"
                v-if="has_left_label"
                @click="() => setValue(props.falseValue)"
            >
                {{ props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel ?? '' }}
            </div>
            <div
                :class="`max-switch-toggle ${temp_value === props.trueValue ? 'active' : ''}`"
                @click="toggleValue"
            >
                <div class="max-switch-background">
                    <div class="max-switch-button"></div>
                </div>
            </div>
            <div
                class="max-switch-label right"
                v-if="has_right_label"
                @click="() => setValue(props.trueValue)"
            >
                {{ props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question ?? '' }}
            </div>
        </div>
    </InputBase>
</template>
```

Estilização SCSS scoped correspondente:

```scss
<style lang="scss" scoped>
.max-switch {
    display: grid;
    grid-template-columns: 1fr;
    place-items: center;

    &.is-disabled,
    &[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }

    .max-switch-input {
        padding-left: 5px;
        display: grid;
        grid-template-columns: auto 1fr auto;
        height: 20px;
        align-items: center;
        outline: none;
        border-radius: 12px;

        &:focus-visible {
            box-shadow: 0 0 0 2px var(--max-primary-500, #00768e);
        }

        &.is-disabled {
            opacity: 0.5;
            cursor: not-allowed;

            .max-switch-label,
            .max-switch-toggle {
                cursor: not-allowed !important;
                pointer-events: none;
            }
        }

        .max-switch-label {
            cursor: pointer;

            &.right {
                padding-left: 10px;
            }

            &.left {
                padding-right: 10px;
            }
        }

        .max-switch-toggle {
            position: relative;
            height: 20px;
            cursor: pointer;

            .max-switch-background {
                width: 38px;
                height: 20px;
                display: grid;
                place-items: center;
                border-radius: 14px;
            }

            .max-switch-button {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                position: absolute;
                transition: left 0.2s ease, background-color 0.2s ease, color 0.2s ease;
            }
        }

        &.active {
            .max-switch-label.right {
                color: var(--blue-800);
            }

            .max-switch-background {
                background-color: var(--blue-200);
            }

            .max-switch-button {
                background-color: var(--blue-750);
                left: 21px;
            }
        }

        &:not(.active) {
            .max-switch-label.right {
                color: var(--background-700);
            }

            .max-switch-background {
                background-color: var(--background-200);
            }

            .max-switch-button {
                background-color: var(--background-600);
                left: 5px;
            }
        }
    }
}
</style>
```

### 3.2. Ajustes em `MaxInputRadio.vue`

Declaração explícita de `disabled` nas props e validação no método `onClick`:

```ts
const props = withDefaults(
    defineProps<{
        modelValue: any;
        value?: any;
        name?: string;
        disabled?: boolean;
    }>(),
    { modelValue: null, value: null, disabled: false }
);

const isRadioDisabled = computed(() => Boolean(props.disabled || attrs.disabled));

const onClick = (e: Event) => {
    if (isRadioDisabled.value) return;
    if (e && (e.target as HTMLElement).tagName === 'INPUT') return;
    temp_value.value = props.value;
};

const onChange = () => {
    if (isRadioDisabled.value) return;
    temp_value.value = props.value;
};
```

No template:

```html
<template>
    <div
        class="max-input-radio radio-button-input-main-div"
        :class="{ 'is-disabled': isRadioDisabled }"
        @click="onClick"
    >
        <input
            ref="inputRef"
            type="radio"
            class="max-radio-native"
            :id="id"
            :name="name ?? 'radio-group'"
            :value="value"
            :checked="isChecked"
            :disabled="isRadioDisabled"
            v-bind="inputAttrs"
            @change="onChange"
        />
        <label :for="id" v-if="attrs.label" class="max-radio-label">{{ attrs.label }}</label>
        <MaxIcon v-if="attrs.icon" :icon="attrs.icon" />
    </div>
</template>
```

No SCSS:

```scss
<style lang="scss" scoped>
.radio-button-input-main-div {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    &.is-disabled {
        cursor: not-allowed;
        opacity: 0.5;

        .max-radio-label {
            cursor: not-allowed;
            color: var(--background-500);
        }
    }

    .max-radio-label {
        cursor: pointer;
    }

    .max-radio-native {
        appearance: none;
        margin: 0;
        width: 20px;
        height: 20px;
        border: 2px solid var(--background-400);
        border-radius: 50%;
        display: grid;
        place-content: center;
        cursor: pointer;
        background: var(--background-0);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;

        &::before {
            content: '';
            width: 10px;
            height: 10px;
            border-radius: 50%;
            transform: scale(0);
            transition: transform 0.15s ease;
            background: var(--primary-500);
        }

        &:checked {
            border-color: var(--primary-500);

            &::before {
                transform: scale(1);
            }
        }

        &:focus-visible {
            outline: none;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-500) 25%, transparent);
        }

        &:disabled {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
}
</style>
```

### 3.3. Ajustes em `MaxIconButton.vue`

No template, trocar o elemento raiz de `<div>` para `<button type="button">`:

```html
<template>
    <button
        type="button"
        :class="`max-icon-button icon-div ico-btn ${hover ? 'hover' : ''}`"
        ref="icon_ref"
        :disabled="props.disabled || props.loading"
        :aria-disabled="props.disabled || props.loading"
        :style="{
            width: size,
            height: size,
            transform: 'scale(' + (hover && !props.disabled && !props.loading ? props.hoverScale : 1) + ')'
        }"
        @click="onClick"
        @mouseenter="!props.disabled && !props.loading ? (hover = true) : null"
        @mouseleave="hover = false"
    >
        <slot>
            <MaxIcon
                pointer
                :icon="props.icon"
                :i="props.i"
                :dark="props.dark"
                :light="props.light"
                :checked="props.checked"
                :plus="props.plus"
                :rotate="props.rotate"
                :flip="props.flip"
                :size="size"
                :color="props.color ?? props.iconColor"
            />
        </slot>
    </button>
</template>
```

No script, guardar execução com verificação de `disabled` e `loading`:

```ts
const onClick = async (event: MouseEvent) => {
    if (props.disabled || props.loading || executing.value) return;
    executing.value = true;
    try {
        if (props.route) {
            goToRoute(props.route, data.value);
            return;
        }

        if (props.action) {
            await props.action({ event: event, data: data.value });
            return;
        }

        emit('action', true);
    } finally {
        executing.value = false;
    }
};
```

No SCSS scoped:

```scss
<style lang="scss" scoped>
button.icon-div {
    display: grid;
    place-items: center;
    width: auto;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: none;
    transition: transform 0.3s ease, color 0.2s ease-in-out, opacity 0.2s ease;
    position: relative;

    &:focus-visible {
        outline: 2px solid var(--primary-500, #3b82f6);
        outline-offset: 2px;
        border-radius: 4px;
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed !important;
        pointer-events: none;
    }
}
</style>
```

---

## 4. Garantia de Retrocompatibilidade

- Emissões de `update:modelValue` em `MaxInputSwitch` e `MaxInputRadio` permanecem idênticas.
- Todas as props de slots, tamanhos e ícones continuam com os mesmos tipos e comportamentos.
- `MaxIconButton` preserva a interface `MaxButtonsType`, apenas garantindo que comportamentos desabilitados declarados em props sejam honrados pelo elemento raiz.

---

## 5. Critérios de Aceitação e Comandos de Validação

### 5.1. Critérios de Aceitação
1. `MaxInputSwitch` possui `role="switch"`, `aria-checked` refletindo o estado, e alterna o valor ao receber teclas Space ou Enter.
2. `MaxInputSwitch` com `disabled="true"` exibe `opacity: 0.5` e cursor `not-allowed`, sem permitir alternância via teclado ou mouse.
3. Clicar no rótulo de `MaxInputRadio` com `disabled="true"` não altera o valor selecionado.
4. `MaxIconButton` renderiza um elemento `<button type="button">`, foca via tecla Tab e bloqueia acionamentos quando `disabled="true"`.

### 5.2. Comandos de Validação
```bash
# Validação de tipagem
npm run type-check

# Testes automatizados dos componentes corrigidos
npx vitest run tests/components/MaxInputSwitch.test.ts tests/components/MaxInputRadio.test.ts tests/components/MaxIconButton.test.ts
```
