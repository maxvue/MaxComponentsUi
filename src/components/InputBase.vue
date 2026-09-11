<template>
    <div
        :class="[
            'max-input-base',
            'max-input-main-div',
            {
                'float': props.float !== undefined,
                'is-float': props.float !== undefined,
                'is-floating': props.float !== undefined,
                'done': Boolean(props.done),
                'is-done': Boolean(props.done),
                'caution': !props.noStatus && Boolean(props.caution),
                'is-caution': !props.noStatus && Boolean(props.caution),
                'error': !props.noStatus && isError,
                'is-error': !props.noStatus && isError,
                'text-center': props.textCenter,
                'is-text-center': props.textCenter,
                'text-right': props.textRight,
                'is-text-right': props.textRight,
                'in-line': props.inLine,
                'is-inline': props.inLine,
                'no-status': props.noStatus,
                'no-message': props.noMessage
            },
            props.class
        ]"
    >
        <!-- INPUT LABEL -->
        <!--
            `for` aponta para `input_id`, o id exposto via slot prop `inputId`.
            O elemento real de input vive dentro do `<slot>` (controlado pelo
            componente filho), entao a associacao so tem efeito quando um filho
            futuro aplicar `:id="inputId"` no seu input. Ate la isso e inerte,
            nao um erro funcional.
        -->
        <label :for="input_id" :class="inLine ? 'in-line-label' : 'max-input-label'" v-if="props.label" >
            {{ props.label }}
        </label>


        <!-- INPUT FIELD -->
        <!--
            `aria-invalid` aplicado aqui (no wrapper) e nao no `<input>` real,
            pois este ultimo esta fora do controle direto do InputBase (vive no
            slot). Nao e o padrao ARIA ideal, mas serve como sinal semantico
            adicional ate que os consumidores adotem o slot prop `inputId`.
        -->
        <div class="max-input-field-div" :aria-invalid="isError ? 'true' : undefined">
            <MaxIcon :icon="props.iconLeft ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark" v-if="hasContent(props.iconLeft ?? props.icon ?? props.i) && !props.noIcon && (props.iconLeft || props.iconPos === 'left')" class="input-icon-left" />
            <div v-else></div>
            <div class="input-slot-div">
                <slot
                    :input-id="input_id"
                    :message-id="message_id"
                    :is-error="isError"
                    :is-required="Boolean(props.required)"
                    :has-message="Boolean(displayMessage)"
                    :display-message="displayMessage"
                ></slot>
            </div>
            <MaxIcon :icon="props.iconRight ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark" v-if="hasContent(props.iconRight ?? props.icon ?? props.i) && !props.noIcon && (props.iconRight || props.iconPos === 'right')" class="input-icon-right" />
            <div v-else></div>

            <!-- INPUT STATUS ICON -->
            <div class="input-status-icon" :class="{ 'with-icon-right': hasIconRight }">
                <div class="is-done" v-if="done && !noDone && !noStatus">
                    <MaxIcon icon="lets-icons:check-fill" :size="0.8" :light="light" :dark="dark" />
                </div>
                <div class="is-caution" v-else-if="caution && !noCaution && !noStatus">
                    <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" />
                </div>
                <div class="is-error" v-else-if="error && !noError && !noStatus">
                    <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" />
                </div>
                <!--
                    `aria-hidden` porque este asterisco e apenas um indicador visual
                    redundante. O `aria-required` "de verdade" precisaria estar no
                    `<input>` real dentro do slot, fora de alcance direto do InputBase.
                -->
                <div class="required" v-else-if="required && !noStatus" aria-hidden="true">*</div>
            </div>
        </div>

        <!-- INPUT MESSAGE -->
        <div
            class="input-message"
            :class="{ 'is-truncated': props.truncateMessage }"
            :id="message_id"
            aria-live="polite"
            :role="isError ? 'alert' : undefined"
            v-if="!props.noStatus && !props.noMessage"
        >
            <MaxIcon
                :icon="props.iconMessage"
                v-if="props.iconMessage && displayMessage"
                :size="0.85"
                :light="light"
                :dark="dark"
                class="message-icon"
            />
            <span
                class="message-text"
                :title="props.truncateMessage && displayMessage ? displayMessage : undefined"
                v-if="displayMessage"
            >{{ displayMessage }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { hasContent } from '@maxvue/max-use';
    import { computed, useId } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { InputValue, SelectOptionsList, SelectGroupOptions } from '../types';
    import { provideInputBaseContext } from './base/inputBaseContext';

    /**
     * Propriedades base para componentes de entrada (inputs).
     * Este componente serve como wrapper para padronizar o layout, ícones e mensagens.
     */
    interface Props {
        /** ID customizado do campo (se omitido, useId é gerado automaticamente) */
        id?: string;
        /** Valor do input (suporta v-model) */
        value?: InputValue;
        /** Valor do input para v-model no Vue 3 */
        modelValue?: InputValue;
        /** Lista de opções simples [{ name, value, icon, sub_label }] */
        class?: string;
        /** Ícone principal (ex: 'mdi:user') */
        icon?: string | undefined;
        /** Alias para o ícone principal */
        i?: string | undefined;
        /** Estado desabilitado do componente */
        disabled?: boolean | undefined;
        /** Ativa o estilo de label flutuante (FloatLabel) */
        float?: boolean | undefined;
        /** Mensagem de feedback ou instrução (alias para message) */
        msg?: string | undefined;
        /** Mensagem de feedback, erro ou aviso exibida abaixo do input */
        message?: string | undefined;
        /** Ícone exibido ao lado da mensagem de feedback */
        iconMessage?: string | undefined;
        /** Rótulo (label) exibido acima ou dentro do campo */
        label?: string | undefined;
        /** Define se o campo foi preenchido corretamente (exibe ícone de check) */
        done?: string | boolean | null | undefined;
        /** Mensagem de erro ou estado de erro (exibe em destaque) */
        error?: string | boolean | null | undefined;
        /** Mensagem de atenção ou estado de alerta (exibe em laranja) */
        caution?: string | boolean | null | undefined;
        /** Indica se o preenchimento deste campo é obrigatório (exibe asterisco) */
        required?: boolean | null | undefined;
        /** Alinha o texto do input ao centro */
        textCenter?: boolean | undefined;
        /** Alinha o texto do input à direita */
        textRight?: boolean | undefined;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Default Value */
        default?: string | number | boolean | null | undefined;
        /** Lista de opções simples [{ name, value, icon, sub_label }] */
        options?: SelectOptionsList;
        /** Lista de opções agrupadas [{ label, items: [] }] */
        groupOptions?: SelectGroupOptions;
        /** Ícone posicionado à esquerda */
        iconLeft?: string | undefined;
        /** Ícone posicionado à direita */
        iconRight?: string | undefined;
        /** Valor selecionado */
        loadOptions?: () => Promise<any[]>;
        /** Flag que informa o campo do valor */
        optionValue?: string;
        /** Flag que informa o campo do label */
        optionLabel?: string;
        /** Flag que informa o campo do name */
        optionName?: string;
        /** Ícone escuro comparado ao fundo */
        iconDark?: boolean | undefined | number | string;
        /** Ícone claro comparado ao fundo */
        iconLight?: boolean | undefined | number | string;
        /** Ícone claro comparado ao fundo */
        iconPos?: 'left' | 'right';
        /** Ícone claro comparado ao fundo */
        inLine?: boolean;
        /** Flag que força ocultar o icone done */
        noDone?: boolean;
        /** Flag que força ocultar o icone done */
        noCaution?: boolean;
        /** Flag que força ocultar o icone error */
        noError?: boolean;
        /** Flag que força ocultar os icones done, caution e error */
        noStatus?: boolean;
        /** Flag que força ocultar a mensagem de feedback e remove a reserva vertical */
        noMessage?: boolean;
        /** Flag que força ocultar o icone */
        noIcon?: boolean;
        /** Se verdadeiro, força a mensagem a permanecer em uma linha única com reticências (...) */
        truncateMessage?: boolean;
    }

    const props = withDefaults(defineProps<Props>(), {
        value: '',
        textCenter: false,
        dark: 0.5,
        done: undefined,
        caution: undefined,
        error: undefined,
        light: false,
        iconPos: 'left',
        inLine: false,
        noStatus: false,
        noMessage: false,
        truncateMessage: false
    });

    /**
     * Id unico por instancia, gerado com `useId()` (Vue 3.5+) ou customizado via `props.id`.
     * Usado para associar o `<label>` (via `for`) e a mensagem de feedback (via `aria-describedby`)
     * ao elemento real de input no slot.
     */
    const generated_id = useId();
    const input_id = computed(() => props.id || generated_id);
    const message_id = computed(() => `${input_id.value}-message`);

    const isError = computed(() => (!props.noStatus && typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);

    const displayMessage = computed(() => {
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        const mainMsg = props.message ?? props.msg;
        if (hasContent(mainMsg)) return mainMsg;
        if (isError.value) return 'Valor inválido';
        return '';
    });

    const hasIconRight = computed(() => hasContent(props.iconRight ?? props.icon ?? props.i) && !props.noIcon && Boolean(props.iconRight || props.iconPos === 'right'));

    provideInputBaseContext({
        inputId: input_id,
        messageId: message_id,
        hasMessage: computed(() => Boolean(displayMessage.value)),
        isError,
        isRequired: computed(() => Boolean(props.required)),
        displayMessage
    });
</script>

<style lang="scss" scoped>
.max-input-main-div {
    display: grid !important;
    grid-template-rows: 36px minmax(19px, auto);
    position: relative;
    place-items: center;
    min-height: 55px;
    height: auto;

    :deep() {
        input, textarea {
            color: var(--background-700);

            &::placeholder {
                color: var(--background-650);
            }
        }
    }

    .max-input-label {
        position: absolute;
        pointer-events: auto;
        cursor: pointer;
        line-height: 1;
        top: calc((0.75rem / 2) * -1 - 1px);
        left: 20px;
        padding: 0 5px !important;
        font-size: 0.75rem;
        color: var(--background-750) !important;
        height: 0.75rem;
        background: var(--max-floatlabel-on-active-background, var(--background-0));
        border-radius: var(--max-floatlabel-on-border-radius, 2px);
        z-index: 1;
    }

    &:has(.max-input-field-div:focus-within) .max-input-label {
        color: var(--max-primary-500, #00768E) !important;
    }

    .max-input-field-div {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        width: calc(100% - 4px);
        outline: 1px solid var(--background-300) !important;
        border-radius: 8px;
        height: 36px;
        position: relative;

        &:focus-within {
            outline: 2px solid var(--max-primary-500, #00768E) !important;
            outline-offset: 1px;
        }

        .input-icon-left {
            margin-left: 5px;
        }

        .input-icon-right {
            margin-right: 5px;
        }

        .input-slot-div {
            margin-right: 3px;
            margin-left: 3px;
            width: 100%;
        }

        :deep(input),
        :deep(textarea),
        :deep(label),
        :deep(.max-input-native),
        :deep(.max-select),
        :deep(.max-select-label) {
            &:not(.max-input-otp-cell) {
                outline: none !important;
                background-color: transparent !important;
                height: 100% !important;
                position: relative !important;
                padding: 0 7px;
                border: none !important;
                box-shadow: none !important;
                width: 100% !important;
            }
        }

        .input-status-icon {
            position: absolute;
            top: 2px;
            right: 3px;

            &.with-icon-right {
                right: 26px;
            }

            .is-done {
                color: var(--emerald-600);
            }

            .is-caution {
                color: var(--orange-600);
            }

            .is-error {
                color: var(--red-600);
            }

            .required {
                position: absolute;
                top: 1px;
                right: 3px;
                color: var(--red-600);
            }
        }
    }

    .input-message {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 2px 4px 0;
        color: var(--max-surface-400);
        min-height: 16px;
        height: auto;
        width: 100%;
        gap: 4px;
        overflow: visible;

        .message-icon {
            flex-shrink: 0;
            margin-top: 1px;
        }

        .message-text {
            font-size: 12px;
            font-weight: 400;
            line-height: 1.25;
            white-space: normal;
            overflow-wrap: break-word;
        }

        &.is-truncated {
            overflow: hidden;

            .message-text {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

    &.text-center,
    &.is-text-center {
        :deep(input),
        :deep(.max-input-native) {
            text-align: center !important;
        }
    }

    &.text-right,
    &.is-text-right {
        :deep(input),
        :deep(.max-input-native) {
            text-align: right !important;
        }
    }

    &.caution,
    &.is-caution {
        label,
        .max-input-label {
            color: var(--max-warning-600, var(--orange-600));
        }

        .max-input-field-div {
            outline: 1px solid var(--max-warning-500, #F59E0B) !important;

            &:focus-within {
                outline: 2px solid var(--max-warning-500, #F59E0B) !important;
                outline-offset: 1px;
            }
        }

        :deep(.max-select) {
            border-color: var(--max-warning-600, var(--orange-600));
        }

        .input-message {
            color: var(--max-warning-600, var(--orange-600));

            .message-text {
                color: var(--max-warning-600, var(--orange-600));
            }
        }
    }

    &.error,
    &.is-error {
        label,
        .max-input-label {
            color: var(--max-danger-600, var(--max-red-600));
        }

        .max-input-field-div {
            outline: 1px solid var(--max-danger-500, #EF4444) !important;

            &:focus-within {
                outline: 2px solid var(--max-danger-500, #EF4444) !important;
                outline-offset: 1px;
            }
        }

        :deep(input),
        :deep(.max-input-native) {
            border-color: var(--max-danger-600, var(--max-red-600));
        }

        :deep(.max-select) {
            border-color: var(--max-danger-600, var(--max-red-600));
        }

        .input-message {
            color: var(--max-danger-600, var(--max-red-600));

            .message-text {
                color: var(--max-danger-600, var(--max-red-600));
            }
        }
    }

    &.no-status,
    &.no-message,
    &[no-message],
    &[no-messages] {
        grid-template-rows: 36px !important;

        .input-message {
            display: none !important;
        }
    }

    &[input-click] {
        &:not([input-click='false']) {
            :deep(.max-select-label) {
                min-height: 10px !important;
                max-height: 10px !important;
            }

            :deep(span),
            :deep(input),
            :deep(select),
            :deep(.max-input-native),
            :deep(.max-select),
            :deep(.max-input-number) {
                width: calc(100% - 4px) !important;
                border: none !important;
                border-color: transparent !important;
                outline: none !important;
                outline-color: transparent !important;
                box-shadow: none !important;
                font-size: 0.85rem !important;
                color: var(--background-700);
                font-weight: 450;
                padding: 0 5px;
            }
        }
    }

    &[input-click-auto] {
        &:not([input-click='false']) {
            :deep(.max-select) {
                padding: 0 !important;
            }

            :deep(.max-select-label) {
                padding: 0 !important;
            }

            :deep(span),
            :deep(input),
            :deep(select),
            :deep(.max-input-native),
            :deep(.max-select),
            :deep(.max-input-number) {
                &:not(.max-input-otp-cell) {
                    width: 100% !important;
                    border: none !important;
                    border-color: transparent !important;
                    outline: none !important;
                    outline-color: transparent !important;
                    box-shadow: none !important;
                    font-size: 0.9rem;
                    color: var(--background-700);
                    font-weight: 450;
                    padding: 0 5px;
                }
            }
        }
    }

    &[input-click],
    &[input-click-auto] {
        &:not([input-click='false']) {
            grid-template-rows: 1fr;
            height: 20px;
            padding: 0 !important;

            :deep(.value-div) {
                width: 100% !important;
                border: none !important;
                border-color: transparent !important;
                outline: none !important;
            }

            .max-input-field-div {
                max-height: 20px;
                background-color: var(--background-100);
            }

            .input-slot-div {
                height: 100% !important;
                max-height: 20px;
                width: calc(100% - 6px);
            }

            .message-spacer {
                display: none !important;
            }
        }
    }

    &[no-border]:not([no-border='false']) {
        &,
        &.error,
        &.caution {
            .max-input-field-div {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;

                &:focus-within {
                    outline: none !important;
                    border: none !important;
                    box-shadow: none !important;
                }
            }
        }

        :deep(input),
        :deep(textarea),
        :deep(select),
        :deep(.max-select),
        :deep(.max-select-label),
        :deep(.max-input-native),
        :deep(.max-input-number),
        :deep(.value-div) {
            &:not(.max-input-otp-cell) {
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
            }
        }
    }

    &.is-full,
    &.is-flex,
    &[full],
    &[flex] {
        width: 100% !important;
        height: 100% !important;

        :deep(input),
        :deep(.max-input-native) {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            padding: 0 10px !important;
        }
    }

    &.is-slim,
    &[slim],
    &[input-click] {
        grid-template-rows: 20px;
        height: 20px;

        :deep(div),
        :deep(span),
        :deep(input),
        :deep(select),
        :deep(.max-select),
        :deep(.max-input-native),
        :deep(.value-div),
        :deep(.value-text) {
            height: 20px !important;
            max-height: 20px !important;
            font-size: 0.8rem;
        }

        .message-spacer {
            display: none !important;
        }

        :deep(.placeholder-select) {
            left: 5px;
            top: 2px;
        }
    }

    &.in-line,
    &.is-inline {
        grid-template-columns: auto 1fr !important;
        grid-template-rows: 1fr !important;
        place-items: center start;
        gap: 7px !important;
        padding: 0 !important;

        .input-slot-div {
            min-height: 100% !important;
        }

        :deep(div),
        :deep(span),
        :deep(input),
        :deep(select),
        :deep(.max-select-label),
        :deep(.max-input-native),
        :deep(.max-input-number),
        :deep(.value-div) {
            height: 100% !important;

            .value-div {
                width: 100% !important;
                text-align: center !important;
            }
        }

        :deep(input),
        :deep(textarea),
        :deep(span),
        :deep(select),
        :deep(.max-select-label),
        :deep(.max-input-native),
        :deep(.value-div),
        :deep(.value-text) {
            color: var(--background-700) !important;
        }

        :deep(.max-select) {
            .max-select-label,
            .value-div,
            .value-text,
            span {
                background-color: transparent !important;
            }
        }

        .in-line-label {
            font-size: 12px;
            font-weight: 500;
            background-color: transparent !important;
            color: var(--background-700);
            text-align: left !important;
            width: fit-content !important;
            padding: 0 !important;
            cursor: pointer;
        }
    }

    :deep(.max-input-native),
    :deep(input),
    :deep(.max-datepicker-input),
    :deep(.max-autocomplete) {
        width: 100% !important;
    }

    &.no-dropdown,
    &[no-dropdown] {
        :deep(.max-select-dropdown) {
            display: none !important;
        }

        &.text-center,
        &.is-text-center {
            :deep(.value-div),
            :deep(.max-select-label) {
                padding: 0 !important;
            }
        }
    }

    &.text-center,
    &.is-text-center {
        :deep(.value-div),
        :deep(.max-select-label) {
            width: 100%;
        }

        :deep(.value-text),
        :deep(.max-select-label) {
            padding-left: 2.5rem;
        }

        &.no-dropdown {
            :deep(.value-div),
            :deep(.max-select-label) {
                padding-left: 0 !important;
            }
        }

        :deep(input),
        :deep(.max-input-native),
        :deep(.max-select-label) {
            text-align: center !important;
        }
    }

    :deep(.max-input-native) {
        height: 36px;

        &[disabled] {
            font-size: 12px;
            font-weight: 500;
            background: var(--background-75) !important;
            color: var(--background-650) !important;
        }
    }

    &[disabled='true'],
    &[disabled] {
        background-color: unset !important;

        :deep(input),
        :deep(textarea),
        :deep(span),
        :deep(.max-input-native),
        :deep(.max-select-label) {
            color: var(--background-650) !important;
        }
    }

    :deep(.is-disabled),
    :deep(input:disabled) {
        background-color: unset !important;
        opacity: 0.6 !important;
        cursor: not-allowed !important;

        input,
        textarea,
        span,
        .max-select-label,
        .max-input-native {
            color: var(--background-650) !important;
        }
    }
}
</style>