<template>
    <InputBase
        class="max-input-search input-search-main-div"
        :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'"
    >
        <input
            :type="props.type"
            class="max-input-native"
            v-bind="attrs"
            :value="temp_value"
            :placeholder="props.placeholder || 'Pesquisar...'"
            :aria-label="ariaLabelComputed"
            :aria-busy="isLoading ? 'true' : undefined"
            @input="onInput"
        />
        <span class="sr-only" aria-live="polite" aria-atomic="true">
            {{ isLoading ? 'Buscando resultados...' : '' }}
        </span>
    </InputBase>
</template>

<script setup lang="ts">
    import { ref, computed, watch, useAttrs, onUnmounted } from 'vue';
    import InputBase from './InputBase.vue';

    const attrs = useAttrs();

    interface Props {
        modelValue: string;
        isLoading?: boolean;
        type?: string;
        placeholder?: string;
        ariaLabel?: string;
    }

    const props = withDefaults(
        defineProps<Props>(),
        {
            modelValue: '',
            isLoading: false,
            type: 'search',
            placeholder: 'Pesquisar...',
            ariaLabel: undefined
        }
    );

    const emit = defineEmits<{
        'update:modelValue': [value: string];
        'search': [query: string];
    }>();
    const temp_value = ref(props.modelValue);

    const ariaLabelComputed = computed(() => {
        if (props.ariaLabel) return props.ariaLabel;
        if (attrs['aria-label']) return attrs['aria-label'] as string;
        return props.placeholder || 'Pesquisar';
    });

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

<style lang="scss" scoped>
    .max-input-search {
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
            border: 0;
        }
    }
</style>

