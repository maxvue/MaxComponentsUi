import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import { refDebounced, watchDebounced, hasContent, normalizeToSearch } from '@maxvue/max-use';

/**
 * Store da barra de busca global.
 *
 * `input_value` acompanha a digitação; `search_value` só é atualizado após o
 * debounce e a partir de dois caracteres, normalizado para comparação.
 */
export const useSearchBarStore = defineStore('search-bar', () => {

    /** Indica se a barra de busca está visível. */
    const is_visible = ref(false);

    /** Texto digitado pelo usuário. */
    const input_value: Ref<string> = ref('');

    /** Texto normalizado usado para filtrar, atualizado após o debounce. */
    const search_value = ref<string>('');

    const debounced_input = refDebounced(input_value as any, 200);

    /** Verdadeiro enquanto o debounce não alcançou o texto digitado. */
    const is_filtering = computed(() => input_value.value !== debounced_input.value);

    /** Indica carregamento em andamento disparado pelo filtro. */
    const is_load_filter = ref(false);

    watchDebounced(input_value, () => {
        if (hasContent(input_value.value) && input_value.value.length >= 2) search_value.value = normalizeToSearch(input_value.value);
        else search_value.value = '';
    }, { debounce: 200 });

    return {
        is_visible,
        input_value,
        search_value,
        is_load_filter,
        is_filtering
    };
});
