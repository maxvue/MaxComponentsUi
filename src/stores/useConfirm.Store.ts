import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';

type ConfirmActionProps = { label: string; icon?: string; action?: (event?: any) => void };

type ConfirmPayload = {
    message: string;
    messageIcon?: string | null;
    rejectProps: ConfirmActionProps;
    acceptProps: ConfirmActionProps;
    x: number;
    y: number;
    width: number;
    height: number;
};

export const useConfirmStore = defineStore('confirm.popover', () => {

    const message: Ref<string> = ref('Deseja continuar?');
    const messageIcon: Ref<string | null> = ref(null);
    const rejectProps: Ref<ConfirmActionProps> = ref({
        label: 'Não',
        icon: undefined,
        action: () => {}
    });
    const acceptProps: Ref<ConfirmActionProps> = ref({
        label: 'Sim',
        icon: undefined,
        action: () => {}
    });

    const show: Ref<boolean> = ref(false);

    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);

    const hide = () => {
        show.value = false;
    };

    /**
     * Abre o confirm no alvo informado, resetando todos os campos para os
     * valores do payload (nunca faz toggle — sempre abre no alvo clicado,
     * mesmo que outro confirm já esteja aberto, evitando vazamento de
     * estado entre instâncias como `messageIcon`).
     */
    const confirm = (payload: ConfirmPayload) => {
        message.value = payload.message;
        messageIcon.value = payload.messageIcon ?? null;
        rejectProps.value = payload.rejectProps;
        acceptProps.value = payload.acceptProps;
        x.value = payload.x;
        y.value = payload.y;
        width.value = payload.width;
        height.value = payload.height;
        show.value = true;
    };

    return { message, messageIcon, rejectProps, acceptProps, show, x, y, width, height, hide, confirm };
});