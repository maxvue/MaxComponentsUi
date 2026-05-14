import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

export const usePopoverStore = defineStore('confirm.popover', () => {

    const show: Ref<boolean> = ref(false);

    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);

    const hide = () => {
        show.value = false;
    };

    return { show, x, y, width, height, hide };
});