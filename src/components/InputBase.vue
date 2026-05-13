<template>
    <FloatLabel variant="on" class="max-input" :class="`${props.float !== undefined ? 'float' : ''} ${done ? 'done' : ''} ${caution ? 'caution' : ''} ${textCenter ? 'text-center' : ''} ${props.class ? props.class : ''}`">
        <IconField>
            <InputIcon v-if="icon ?? iconLeft ?? i">
                <MaxIcon :icon="icon ?? iconLeft ?? i" :size="1.2" :light="light" :dark="dark" />
            </InputIcon>
            <slot></slot>
            <InputIcon v-if="iconRight">
                <MaxIcon :icon="iconRight" :size="1.2" />
            </InputIcon>
        </IconField>

        <label for="in_label" v-if="label" class="max-input-label active">{{ label }}</label>
        <Message size="small" :class="`input-message ${isError ? 'error' : ''}`" variant="simple" v-if="displayMessage">
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
            <MaxIcon icon="humbleicons:exclamation" :size="0.8" :light="light" :dark="dark" color-red-700 />
        </div>
        <div class="required" v-else-if="required">*</div>
    </FloatLabel>
</template>

<script setup lang="ts">
    import { hasContent } from '@maxvue/max-use';
    import { computed, useAttrs } from 'vue';
    import FloatLabel from 'primevue/floatlabel';
    import IconField from 'primevue/iconfield';
    import InputIcon from 'primevue/inputicon';
    import MaxIcon from './MaxIcon.vue';
    import Message from 'primevue/message';

    const attrs: any = useAttrs();

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
        /** Ícone posicionado à esquerda */
        iconLeft?: string | undefined;
        /** Ícone posicionado à direita (ex: ícone de carregamento ou olho para senha) */
        iconRight?: string | undefined;
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
        done?: boolean | undefined;
        /** Mensagem de erro ou estado de erro (exibe em destaque) */
        error?: string | boolean | undefined;
        /** Mensagem de atenção ou estado de alerta (exibe em laranja) */
        caution?: string | boolean | undefined;
        /** Indica se o preenchimento deste campo é obrigatório (exibe asterisco) */
        required?: boolean | undefined;
        /** Alinha o texto do input ao centro */
        textCenter?: boolean | undefined;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
    }

    const props = withDefaults(defineProps<Props>(), {
        value: '',
        textCenter: false,
        dark: 0.5,
        light: false
    });

    const isError = computed(() => (typeof props.error === 'string' && hasContent(props.error)) || props.error === true || props.done === false);

    const displayMessage = computed(() => {
        const mainMsg = props.message ?? props.msg;
        if (hasContent(mainMsg)) return mainMsg;
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        return false;
    });
</script>

<style lang="scss">
    .max-input {
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
            label {
                color: darkorange;
            }

            input {
                border-color: darkorange;
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

            &.error {
                color: darkorange !important; // Mantido por consistência, mas o nome é erro.
            }
        }

        .p-inputtext, .p-datepicker {
            width: 100% !important;
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