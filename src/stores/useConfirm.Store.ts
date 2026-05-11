import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

export const useConfirmStore = defineStore('confirm.popover', () => {

    const message: Ref<string> = ref('Deseja continuar?');
    const messageIcon: Ref<string | null> = ref(null);
    const rejectProps: Ref<{ label: string; icon: string | null; action: Function }> = ref({
        label: 'Não',
        icon: null,
        action: () => {}
    });
    const acceptProps: Ref<{ label: string; icon: string | null; action: Function }> = ref({
        label: 'Sim',
        icon: null,
        action: () => {}
    });
    const count_loadeds = ref(0);

    const show: Ref<boolean> = ref(false);

    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);

    return { message, messageIcon, rejectProps, acceptProps, show, x, y, width, height, count_loadeds };
});