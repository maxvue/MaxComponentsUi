<template>
    <InputBase class="input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' :  'material-symbols:search-rounded'">
        <input type="text" class="p-inputtext" v-bind="attrs" :value="temp_value" @input="onInput" />
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, watch, useAttrs, onUnmounted } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            isLoading?: boolean;
        }>(),
        { modelValue: '', isLoading: false }
    );

    const emit = defineEmits(['update:modelValue', 'search']);
    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));
    watch(() => props.modelValue, (val) => temp_value.value = val);

    let debounceTimer: ReturnType<typeof setTimeout>;

    const onInput = (event: Event) => {
        // O v-model implícito do InputText deixou de existir na migração para <input> nativo:
        // o handler passa a ser o responsável por atualizar temp_value a partir do evento.
        // O watch(temp_value, ...) continua emitindo update:modelValue — não emitir aqui.
        temp_value.value = (event.target as HTMLInputElement).value;

        clearTimeout(debounceTimer);

        // Campo limpo: notifica o consumidor imediatamente (sem debounce) para que ele possa
        // resetar a lista de resultados exibida, sem esperar os 300ms do debounce de busca.
        if (temp_value.value === '') {
            emit('search', '');
            return;
        }

        debounceTimer = setTimeout(() => {
            if (temp_value.value && temp_value.value.length > 1) emit('search', temp_value.value);
        }, 300);
    };

    onUnmounted(() => clearTimeout(debounceTimer));
</script>

<style lang="scss">
    .p-autocomplete-option {
        padding: 0 !important;
    }

    .p-autocomplete-list {
        gap: 5px !important;
    }

    .p-autocomplete-overlay {
        z-index: 99999 !important;
    }

    .tst1 {
        padding-left: 20px;
        font-weight: 300;
        color: var(--background-650);
    }

    .tst2 {
        font-weight: 600;
    }
</style>
