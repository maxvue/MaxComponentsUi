<template>
    <InputBase v-bind="props" class="input-base-date-picker" :error="errorMessage" :caution="isCaution" :done="isDone" :icon="props.icon ?? 'solar:calendar-line-duotone'" >
        <DatePicker v-bind="props" :dateFormat="props.dateFormat ?? 'dd/mm/yy'" v-model="internalDate" @blur="validate" ref="element" :placeholder="props.placeholder ?? ''" />
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import InputBase from './InputBase.vue';
    import DatePicker from 'primevue/datepicker';
    import { useDateFormat } from '@maxvue/max-use';
    import { SelectGroupOptions } from '../types';


    const modelValue = defineModel<any>({ default: '' });
    const internalDate = ref<Date | null>(null);
    const hasBeenTouched = ref(false);

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
        required?: boolean | undefined;
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
        /** Data Format */
        dateFormat?: string;
        /** Placeholder Text */
        placeholder?: string;
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

    // Sincroniza modelValue -> internalDate
    watch(modelValue, (val) => {
        if (!val) {
            internalDate.value = null;
            return;
        }
        // Adiciona 'T00:00:00' para strings date-only (YYYY-MM-DD) evitando interpretação UTC
        const dateObj = val instanceof Date ? val : new Date(typeof val === 'string' && !val.includes('T') && !val.includes(' ') ? val + 'T00:00:00' : val);
        if (!isNaN(dateObj.getTime())) {
            // Só atualiza se for realmente diferente para evitar loops
            if (!internalDate.value || internalDate.value.getTime() !== dateObj.getTime()) internalDate.value = dateObj;

        } else internalDate.value = null;

    }, { immediate: true });

    // Sincroniza internalDate -> modelValue
    watch(internalDate, (newDate) => {
        if (!newDate) {
            if (modelValue.value !== '') modelValue.value = '';
            return;
        }
        const formatted = useDateFormat(newDate, 'YYYY-MM-DD HH:mm:ss').value;
        if (formatted !== modelValue.value) modelValue.value = formatted;

    });

    const validate = () => {
        hasBeenTouched.value = true;
    };

    const isDone = computed(() => {
        if (props.noDone || props.noStatus) return null;
        if (props.done !== undefined) return props.done;
        return internalDate.value !== null;
    });

    const isCaution = computed(() => {
        if (props.noCaution || props.noStatus) return false;
        if (props.caution !== undefined) return props.caution;
        if (!hasBeenTouched.value && !modelValue.value) return false;
        return props.required && !internalDate.value;
    });

    const errorMessage = computed(() => {
        if (props.noStatus) return null;
        if (props.noError) return null;
        if (typeof props.error === 'string') return props.error;
        if (isCaution.value && typeof props.caution === 'string') return props.caution;
        if (isCaution.value) return ( 'Data é obrigatória');
        return null;
    });
</script>

<style lang="scss">
    .p-datepicker-panel {
        transform: translateX(-10px);
    }
</style>

