# Plano de Implementação: Falta de Acessibilidade e Navegação por Teclado em MaxInputSwitch e MaxInputToggle

## 1. Diagnóstico e Objetivo

### Diagnóstico
1. **[`MaxInputSwitch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue#L1-L19):**
   - O componente é composto inteiramente de elementos `<div>` sem semântica interativa nativa.
   - **Ausência do Padrão WAI-ARIA Switch:** Não possui `role="switch"` nem `:aria-checked="temp_value === props.trueValue"`. Dispositivos assistivos não informam que se trata de uma alternância ligada/desligada.
   - **Inacessível por Teclado (WCAG 2.1.1):** Não possui `tabindex="0"`. Usuários que navegam com a tecla `Tab` saltam diretamente sobre o interruptor sem conseguir focá-lo ou alternar seu estado com `Espaço` ou `Enter`.
   - **Sem Foco Visível (WCAG 2.4.7):** O switch não possui anel ou indicador de `:focus-visible`.
2. **[`MaxInputToggle.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputToggle.vue#L1-L29):**
   - O rótulo do campo é exibido em uma `<div>` (`.input-toggle-field-label-div`), enquanto o controle nativo `<input type="checkbox">` está dentro de um `<label class="max-toggleswitch">` sem texto.
   - Não há associação por atributo `for` e `id` ou por `aria-labelledby`, deixando o checkbox sem nome acessível para leitores de tela (WCAG 1.3.1 e 4.1.2).

### Objetivo
- Implementar o padrão WAI-ARIA Switch completo em `MaxInputSwitch.vue`, incluindo foco de teclado, suporte a `Enter`/`Espaço`, `aria-checked` reativo e `:focus-visible`.
- Estabelecer associação acessível formal entre rótulo e checkbox em `MaxInputToggle.vue` através de ID determinístico e atributos `id` / `for`.

---

## 2. Arquivos a Modificar

- [`src/components/MaxInputSwitch.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSwitch.vue)
- [`src/components/MaxInputToggle.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputToggle.vue)
- [`tests/unit/MaxInputSwitch.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputSwitch.spec.ts)
- [`tests/unit/MaxInputToggle.spec.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/tests/unit/MaxInputToggle.spec.ts)

---

## 3. Especificação Técnica Cirúrgica

### 3.1. `MaxInputSwitch.vue`

#### Alterações no Template
Tornar o interruptor `.max-switch-toggle` um elemento de switch acessível:
```html
<template>
    <InputBase v-bind="props" class="max-input-switch max-switch">
        <div :class="`max-switch-input ${temp_value === props.trueValue ? 'active' : ''}`">
            <!-- Rótulo esquerdo (falso) -->
            <div
                class="max-switch-label left"
                v-if="has_left_label"
                :id="leftLabelId"
                @click="() => setValue(props.falseValue)"
            >
                {{ resolvedFalseLabel }}
            </div>

            <!-- Botão de alternância com padrão WAI-ARIA Switch -->
            <div
                class="max-switch-toggle"
                :class="{
                    'active': temp_value === props.trueValue,
                    'is-disabled': props.disabled
                }"
                role="switch"
                :tabindex="props.disabled ? -1 : 0"
                :aria-checked="temp_value === props.trueValue ? 'true' : 'false'"
                :aria-disabled="props.disabled ? 'true' : undefined"
                :aria-label="switchAriaLabel"
                :aria-labelledby="switchAriaLabelledby"
                @click="toggleValue"
                @keydown.space.prevent="toggleValue"
                @keydown.enter.prevent="toggleValue"
            >
                <div class="max-switch-background">
                    <div class="max-switch-button"></div>
                </div>
            </div>

            <!-- Rótulo direito (verdadeiro) -->
            <div
                class="max-switch-label right"
                v-if="has_right_label"
                :id="rightLabelId"
                @click="() => setValue(props.trueValue)"
            >
                {{ resolvedTrueLabel }}
            </div>
        </div>
    </InputBase>
</template>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const instanceId = `max-switch-${Math.random().toString(36).slice(2, 9)}`;
const leftLabelId = `${instanceId}-label-left`;
const rightLabelId = `${instanceId}-label-right`;

const resolvedFalseLabel = computed(() => {
    return props.labelLeft ?? props.leftLabel ?? props.labelFalse ?? props.falseLabel ?? '';
});

const resolvedTrueLabel = computed(() => {
    return props.labelRight ?? props.rightLabel ?? props.labelTrue ?? props.trueLabel ?? props.question ?? '';
});

const switchAriaLabel = computed(() => {
    if (props.label && props.label.trim()) return props.label;
    if (props.question && props.question.trim()) return props.question;
    if (!resolvedFalseLabel.value && !resolvedTrueLabel.value) return 'Alternador';
    return undefined;
});

const switchAriaLabelledby = computed(() => {
    if (switchAriaLabel.value) return undefined;
    const ids: string[] = [];
    if (has_left_label.value) ids.push(leftLabelId);
    if (has_right_label.value) ids.push(rightLabelId);
    return ids.length > 0 ? ids.join(' ') : undefined;
});

const toggleValue = () => {
    if (props.disabled) return;
    if (temp_value.value === props.trueValue) {
        setValue(props.falseValue);
    } else {
        setValue(props.trueValue);
    }
};
```

#### Alterações no SCSS Scoped
```scss
.max-switch-toggle {
    cursor: pointer;
    border-radius: 9999px;
    transition: outline 0.15s ease, box-shadow 0.15s ease;

    &:focus-visible {
        outline: 2px solid var(--blue-600, #00768E);
        outline-offset: 3px;
    }

    &.is-disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}
```

---

### 3.2. `MaxInputToggle.vue`

#### Alterações no Template
Vincular o label nativo ao checkbox através de ID:
```html
<template>
    <div :class="`max-input-toggle input-toggle-field-main-div ${attrs.label !== undefined ? 'labeled' : ''}`">
        <div :class="`input-toggle-field-label-main-div ${attrs.labelCenter !== undefined ? 'label-center' : ''}`">
            <label
                :for="toggleInputId"
                class="input-toggle-field-label-div"
                v-if="attrs.label !== undefined"
            >
                {{ attrs.label }}
            </label>
        </div>
        <div :class="`input-toggle-field-input-div ${attrs.label !== undefined ? 'labeled' : ''}`">
            <div :class="`input-toggle-field ${attrs.label !== undefined ? 'labeled' : ''}`">
                <div :class="`input-toggle-field-label ${falseValue === modelvalue ? 'active' : ''}`" v-if="falseLabel">
                    {{ falseLabel ?? '' }}
                </div>
                <div class="input-toggle-field-input">
                    <label :for="toggleInputId" class="max-toggleswitch">
                        <input
                            :id="toggleInputId"
                            type="checkbox"
                            class="max-toggleswitch-input"
                            :checked="modelvalue === trueValue"
                            :aria-label="attrs.label ? undefined : 'Alternar opção'"
                            @change="on_toggle(($event.target as HTMLInputElement).checked)"
                        />
                        <span class="max-toggleswitch-slider"></span>
                    </label>
                </div>
                <div :class="`input-toggle-field-label ${trueValue === modelvalue ? 'active' : ''}`" v-if="trueLabel">
                    {{ trueLabel ?? '' }}
                </div>
            </div>
        </div>
    </div>
</template>
```

#### Alterações no `<script setup lang="ts">`
```typescript
const toggleInputId = `max-toggle-${Math.random().toString(36).slice(2, 9)}`;
```

#### Alterações no SCSS Scoped
Adicionar indicador de foco visível no slider:
```scss
.max-toggleswitch-input:focus-visible + .max-toggleswitch-slider {
    outline: 2px solid var(--blue-600, #00768E);
    outline-offset: 2px;
}
```

---

## 4. Garantia de Retrocompatibilidade

1. **Valores Booleanos e Customizados:**
   - As props `trueValue` e `falseValue` permanecem inalteradas, permitindo tanto valores booleanos (`true`/`false`) quanto strings ou números (`1`/`0`, `'S'`/`'N'`).
2. **Aliases de Rótulos Mantidos:**
   - Todos os aliases legados (`labelLeft`, `leftLabel`, `labelFalse`, `labelRight`, `rightLabel`, `labelTrue`, `question`) continuam funcionando com precedência estrita.

---

## 5. Critérios de Aceitação e Comandos de Validação

### Critérios de Aceitação
- [ ] O elemento de alternância possui `role="switch"` e `aria-checked="true"` ou `"false"` correspondente ao seu valor.
- [ ] O interruptor recebe foco via tecla `Tab` e exibe anel `:focus-visible` de 2px.
- [ ] Pressionar `Espaço` ou `Enter` com foco no switch alterna seu valor entre `trueValue` e `falseValue`.
- [ ] O rótulo em `MaxInputToggle` está associado via atributo `for` ao input do checkbox.

### Comandos de Validação
```bash
npm run type-check
npx vitest run tests/unit/MaxInputSwitch.spec.ts
npx vitest run tests/unit/MaxInputToggle.spec.ts
```
