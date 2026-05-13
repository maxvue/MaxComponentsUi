<template>
    <FloatLabel variant="on" class="max-input-main-div" :class="`${props.float !== undefined ? 'float' : ''} ${done ? 'done' : ''} ${caution ? 'caution' : ''} ${textCenter ? 'text-center' : ''} ${props.class ? props.class : ''} ${isError ? 'error' : ''} ${caution ? 'caution' : ''} ${inLine ? 'in-line' : ''}`">
        <div v-if="props.label && props.inLine">
            {{ props.label }}
        </div>
        <IconField v-if="props.icon ?? props.i ?? props.iconLeft ?? props.iconRight">
            <InputIcon v-if="props.iconLeft || props.iconPos === 'left'">
                <MaxIcon :icon="props.iconLeft ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark" />
            </InputIcon>
            <slot></slot>
            <InputIcon v-if="props.iconRight || props.iconPos === 'right'">
                <MaxIcon :icon="props.iconRight ?? props.icon ?? props.i" :size="1.2" :light="light" :dark="dark"  />
            </InputIcon>
        </IconField>
        <slot v-else></slot>
        <label for="in_label" v-if="props.label && !props.inLine" class="max-input-label active">{{ props.label }}</label>
        <Message size="small" class="input-message" variant="simple" v-if="displayMessage">
            <template #icon>
                <MaxIcon :icon="iconMessage" v-if="iconMessage" :size="0.9" :light="light" :dark="dark"  />
            </template>
            {{ displayMessage }}
        </Message>
        <div v-else class="message-spacer"></div>
        <div class="is-done" v-if="done">
            <MaxIcon icon="lets-icons:check-fill" :size="0.8" :light="light" :dark="dark" color-green-700 />
        </div>
        <div class="is-caution" v-else-if="caution && !done">
            <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" color-orange-600 />
        </div>
        <div class="is-caution" v-else-if="error && !done">
            <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" color-red-700 />
        </div>
        <div class="required" v-else-if="required">*</div>
    </FloatLabel>

</template>

<script setup lang="ts">
    import { hasContent } from '@maxvue/max-use';
    import { computed } from 'vue';
    import FloatLabel from 'primevue/floatlabel';
    import IconField from 'primevue/iconfield';
    import InputIcon from 'primevue/inputicon';
    import MaxIcon from './MaxIcon.vue';
    import Message from 'primevue/message';
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
    }

    const props = withDefaults(defineProps<Props>(), {
        value: '',
        textCenter: false,
        dark: 0.5,
        light: false,
        iconPos: 'left',
        inLine: false
    });

    const isError = computed(() => (typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);

    const displayMessage = computed(() => {
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        const mainMsg = props.message ?? props.msg;
        if (hasContent(mainMsg)) return mainMsg;
        return false;
    });
</script>

<style lang="scss">
.max-input-main-div {
    display: grid !important;
    grid-template-rows: 36px 19px;

    .max-input-label {
        &.active {
            top: 0;
            transform: translateY(-50%);
            border-radius: var(--max-floatlabel-on-border-radius);
            background: var(--max-floatlabel-on-active-background);
            padding: 0 5px !important;
            font-size: var(--max-floatlabel-active-font-size);
            font-weight: var(--max-floatlabel-active-font-weight);
            inset-inline-start: 15px !important;
        }
    }

    .message-spacer {
        height: 16px;
        width: 100%;
    }

    .required {
        position: absolute;
        top: 1px;
        right: 3px;
        color: darkred;
    }

    .is-done {
        position: absolute;
        top: 2px;
        right: 3px;
        color: #16a34a !important;
    }

    .is-caution {
        position: absolute;
        top: 2px;
        right: 3px;
    }

    &.text-center {
        input {
            text-align: center !important;
        }
    }

    &.caution {
        label, .max-input-label {
            color: var(--orange-600);
        }

        input {
            border-color: var(--orange-600);
        }

        .p-select {
            border-color: var(--orange-600) !important;
        }

        .input-message {
            .p-message-content {
                color: var(--max-orange-500) !important;
            }

            .p-message-text {
                color: var(--orange-600) !important;
            }
        }
    }

    &.error {
        label, .max-input-label {
            color: var(--max-red-600) !important;
        }

        input {
            border-color: var(--max-red-600) !important;
        }

        .p-select {
            border-color: var(--max-red-600) !important;
        }

        .input-message {
            .p-message-content {
                color: var(--max-red-600) !important;
            }

            .p-message-text {
                color: var(--max-red-600) !important;
            }
        }
    }

    &[input-click] {
        grid-template-rows: 20px;

        div, span, input, select, .p-select-label {
            max-height: 20px;
            border: none !important;
            padding: 0 !important;;
        }

        .message-spacer {
            display: none !important;
        }
    }

    &.in-line {
        grid-template-columns: auto 1fr !important;
        grid-template-rows: 1fr !important;
        place-items: center start;
        gap: 4px !important;

        .p-select-label, input {
            background-color: var(--background-100) !important;
            border-radius: 4px;

            .value-div {
                width: 100% !important;
                text-align: center !important;
            }
        }
    }

    .input-message {
        .p-message-content {
            justify-content: flex-end;
            padding: 0 6px;
            padding-top: 4px;
            color: var(--max-surface-400);
        }

        .p-message-text {
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
</style>