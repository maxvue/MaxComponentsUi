<template>
    <div class="max-input-main-div" :class="`${props.float !== undefined ? 'float' : ''} ${done ? 'done' : ''} ${!noStatus && caution ? 'caution' : ''} ${textCenter ? 'text-center' : ''} ${textRight ? 'text-right' : ''} ${props.class ? props.class : ''} ${!noStatus &&  isError ? 'error' : ''} ${inLine ? 'in-line' : ''}`">
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
            <MaxIcon :icon="props.iconLeft ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark" v-if="hasContent(props.iconLeft ?? props.icon ?? props.i) && !props.noIcon && (props.iconLeft || props.iconPos === 'left')" ml-5 />
            <div v-else></div>
            <div mr-3 ml-3 w-full class="input-slot-div">
                <slot :input-id="input_id" :message-id="message_id"></slot>
            </div>
            <MaxIcon :icon="props.iconRight ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark" v-if="hasContent(props.iconRight ?? props.icon ?? props.i) && !props.noIcon && (props.iconRight || props.iconPos === 'right')" mr-5  />
            <div v-else></div>

            <!-- INPUT STATUS ICON -->
            <div class="input-status-icon">
                <div class="is-done" v-if="done && !noDone && !noStatus">
                    <MaxIcon icon="lets-icons:check-fill" :size="0.8" :light="light" :dark="dark" color-green-700 />
                </div>
                <div class="is-caution" v-else-if="caution && !noCaution && !noStatus">
                    <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" color-orange-600 />
                </div>
                <div class="is-error" v-else-if="error && !noError && !noStatus">
                    <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" color-red-700 />
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
        <div class="input-message" :id="message_id" aria-live="polite" :role="isError ? 'alert' : undefined">
            <MaxIcon :icon="iconMessage" v-if="iconMessage && displayMessage" :size="0.9" :light="light" :dark="dark" />
            <span class="message-text">{{ displayMessage }}</span>
        </div>
    </div>

</template>

<script setup lang="ts">
    import { hasContent } from '@maxvue/max-use';
    import { computed, useId } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { SelectGroupOptions } from '../types';

    /**
     * Propriedades base para componentes de entrada (inputs).
     * Este componente serve como wrapper para padronizar o layout, ícones e mensagens.
     */
    interface Props {
        /** Valor do input (suporta v-model) */
        value?: any;
        /** Valor do input para v-model no Vue 3 */
        modelValue?: any;
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
        options?: any[];
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
        /** Flag que força ocultar o icone */
        noIcon?: boolean;
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
        inLine: false
    });

    /**
     * Id unico por instancia, gerado com `useId()` (Vue 3.5+). Usado para associar
     * o `<label>` (via `for`) e a mensagem de feedback (via `aria-describedby`) ao
     * elemento real de input, que vive dentro do `<slot>` (fora do controle direto
     * do InputBase). Exposto via slot prop `inputId` para adocao futura pelos
     * componentes filhos.
     */
    const input_id = useId();
    const message_id = computed(() => `${input_id}-message`);

    const isError = computed(() => (!props.noStatus && typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);

    const displayMessage = computed(() => {
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        const mainMsg = props.message ?? props.msg;
        if (hasContent(mainMsg)) return mainMsg;
        // String vazia (e nao `false`) para manter a linha de mensagem reservando
        // o espaco sem interpolar o literal "false" no template.
        return '';
    });
</script>

<style lang="scss">
.max-input-main-div {
    display: grid !important;
    grid-template-rows: 36px 19px;
    position: relative;
    place-items: center;

    input {
        color: var(--background-700);
    }

    .max-input-label {
        position: absolute;
        pointer-events: none;
        line-height: 1;

        // color: var(--background-600);
        top: calc((0.75rem / 2) * -1);
        left: 20px;
        padding: 0 5px !important;
        font-size: 0.75rem;
        color: var(--background-650) !important;
        height: 0.75rem;
        z-index: 1;

        &::before {
            content: attr(data-content);
            position: absolute;
            left: 0;
            width: 100%;
            height: 2px;
            top: calc((0.75rem / 2) - 1px);
            background-color: var(--background-0);
            z-index: -1;
        }

        &.active {
            top: 0;
            transform: translateY(-50%);
            border-radius: var(--max-floatlabel-on-border-radius, 2px);
            background: var(--max-floatlabel-on-active-background, var(--background-0));
            padding: 0 5px !important;
            font-weight: var(--max-floatlabel-active-font-weight, 400);
            inset-inline-start: 15px !important;
        }

        input {
            color: green !important;
        }
    }

    &:has(.max-input-field-div:focus-within) .max-input-label {
        color: var(--blue-700) !important;
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
            outline: 1px solid var(--blue-700) !important;
        }

        input, textarea, label, .p-select, .p-select-label {
            &:not(.max-input-otp-cell){
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

            .is-done {
                color: #16a34a;
            }

            .is-caution {
                color: #da422b;
            }

            .required {
                position: absolute;
                top: 1px;
                right: 3px;
                color: darkred;
            }
        }
    }


    &.text-center {
        input {
            text-align: center !important;
        }
    }

    &.text-right {
        input {
            text-align: right !important;
        }
    }

    &.caution {
        label, .max-input-label {
            color: var(--orange-600);
        }

        .max-input-field-div {
            outline: 1px solid var(--orange-b-500) !important;

            &:focus-within {
                outline: 1px solid var(--blue-700) !important;
            }
        }

        .p-select {
            border-color: var(--orange-600);
        }

        .input-message {
            color: var(--max-orange-500);

            .message-text {
                color: var(--orange-600);
            }
        }
    }

    &.error {
        label, .max-input-label {
            color: var(--max-red-600);
        }

        .max-input-field-div {
            outline: 1px solid var(--red-b-650) !important;

            &:focus-within {
                outline: 1px solid var(--blue-700) !important;
            }
        }

        input {
            border-color: var(--max-red-600);
        }

        .p-select {
            border-color: var(--max-red-600);
        }

        .input-message {
            color: var(--max-red-600);

            .message-text {
                color: var(--max-red-600);
            }
        }
    }

    &[input-click] {
        &:not([input-click='false']) {
            .p-select-label {
                min-height: 10px !important;
                max-height: 10px !important;
            }

            span, input, select, .p-select, .p-inputnumber {
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
            .p-select {
                padding: 0 !important;
            }

            .p-select-label {
                padding: 0 !important;
            }

            span, input, select, .p-select, .p-inputnumber {
                &:not(.max-input-otp-cell){
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

    &[input-click], &[input-click-auto] {
        &:not([input-click='false']) {
            grid-template-rows: 1fr;
            height: 20px;
            padding: 0 !important;


            .value-div {
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

    // Remove forcadamente qualquer borda/outline do campo, inclusive nos estados
    // de foco, erro e caution (que aplicam outline com !important mais acima).
    // Encadeado com `&.error`/`&.caution` para vencer a especificidade daquelas
    // regras, ja que `!important` sozinho nao desempata entre seletores iguais.
    &[no-border]:not([no-border='false']) {

        &, &.error, &.caution {
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

        input, textarea, select, .p-select, .p-select-label, .p-inputtext, .p-inputnumber, .value-div {
            &:not(.max-input-otp-cell){
                outline: none !important;
                border: none !important;
                box-shadow: none !important;
            }
        }
    }

    &[no-message], &[no-messages] {
        grid-template-rows: 1fr;

        .message-spacer {
            display: none !important;
        }
    }

    &[full], &[flex] {
        width: 100% !important;
        height: 100% !important;

        input {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            padding: 0 10px !important;
        }
    }

    &[slim], &[input-click] {
        grid-template-rows: 20px;
        height: 20px;

        div, span, input, select, .p-select, .value-div, .value-text {
            height: 20px !important;
            max-height: 20px !important;
            font-size: 0.8rem;


        }

        .message-spacer {
            display: none !important;
        }

        .placeholder-select {
            left: 5px;
            top: 2px;

        }
    }

    input {
        &::placeholder {
            color: var(--background-625);
        }
    }

    &.in-line {
        grid-template-columns: auto 1fr !important;
        grid-template-rows: 1fr !important;
        place-items: center start;
        gap: 7px !important;
        padding: 0 !important;

        .input-slot-div {
            min-height: 100% !important;
        }

        div, span, input, select, .p-select-label, .p-inputtext, .p-inputnumber, .p-component, .value-div {
            height: 100% !important;

            .value-div {
                width: 100% !important;
                text-align: center !important;
            }
        }

        input, span, select, .p-select-label, .p-inputtext, .value-div, .value-text {
            color: var(--background-650) !important;
        }

        // O select aninha .p-select > .p-select-label > .value-div > .value-text; sem isto
        // cada nivel recebe o fundo acima e as pilulas aparecem empilhadas
        .p-select {
            .p-select-label, .value-div, .value-text, span {
                background-color: transparent !important;
            }
        }

        .in-line-label {
            font-size: 12px;
            font-weight: 500;
            background-color: transparent !important;
            color: var(--background-650);
            text-align: left !important;
            width: fit-content !important;
            padding: 0 !important;
        }
    }

    .input-message {
        display: none;
        align-items: center;
        justify-content: flex-end;
        padding: 0 6px;
        padding-top: 4px;
        color: var(--max-surface-400);
        height: 16px;
        width: 100%;

        .message-text {
            font-size: 10px !important;
        }
    }

    .p-inputtext, .p-datepicker, .p-autocomplete {
        width: 100% !important;
    }

    &.no-dropdown, &[no-dropdown] {
        .p-select-dropdown {
            display: none !important;
        }

        &.text-center {
            .value-div, .p-select-label {
                padding: 0 !important;
            }
        }
    }

    &.text-center {
        .value-div, .p-select-label {
            width: 100%;
        }

        .value-text, .p-select-label {
            padding-left: 2.5rem;
        }

        &.no-dropdown {
            .value-div, .p-select-label {
                padding-left: 0 !important;
            }
        }

        input, .p-select-label {
            text-align: center !important;
        }
    }
}

.p-inputtext {
    height: 36px;

    &[disabled] {
        background: var(--background-75) !important;
        color: var(--background-400) !important;
    }
}

.p-disabled, [disabled='true'], [disabled] {
    background-color: unset !important;

    input, span, .p-floatlabel .p-select-label, .p-inputtext {
        color: var(--background-575) !important;
    }
}

.p-inputtext[disabled] {
    font-size: 12px;
    font-weight: 500;
    color: var(--background-575) !important;
}


</style>