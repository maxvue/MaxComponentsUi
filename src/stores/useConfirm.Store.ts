import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

export const useConfirmStore = defineStore('confirm.popover', () => {

    const message: Ref<string> = ref('Deseja continuar?');
    const messageIcon: Ref<string | null> = ref(null);
    const rejectProps: Ref<{ label: string; icon?: string; action?: (event?: any) => void }> = ref({
        label: 'Não',
        icon: undefined,
        action: () => {}
    });
    const acceptProps: Ref<{ label: string; icon?: string; action?: (event?: any) => void }> = ref({
        label: 'Sim',
        icon: undefined,
        action: () => {}
    });
    const count_loadeds = ref(0);

    const show: Ref<boolean> = ref(false);

    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);

    const hide = () => {
        show.value = false;
    };

    return { message, messageIcon, rejectProps, acceptProps, show, x, y, width, height, count_loadeds, hide };
});