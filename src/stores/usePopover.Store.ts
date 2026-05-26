import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

export const usePopoverStore = defineStore('popover', () => {

    const show_id: Ref<string | null> = ref(null);

    const hide = () => {
        show_id.value = null;
    };

    const show = (id: string) => {
        show_id.value = id;
    };

    const toggle = (id: string) => {
        show_id.value = show_id.value !== id ? id : null;
    };

    return { show_id, hide, show, toggle };
});