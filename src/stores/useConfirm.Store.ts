import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref } from 'vue';
import type { ButtonSeverity, ConfirmActionProps } from '../types';

export type ConfirmPayload = {
    message: string;
    messageIcon?: string | null;
    severity?: ButtonSeverity;
    rejectProps: ConfirmActionProps;
    acceptProps: ConfirmActionProps;
    x: number;
    y: number;
    width: number;
    height: number;
    target?: HTMLElement | null;
};

export const useConfirmStore = defineStore('confirm.popover', () => {

    const message: Ref<string> = ref('Deseja continuar?');
    const messageIcon: Ref<string | null> = ref(null);
    const severity: Ref<ButtonSeverity | undefined> = ref(undefined);
    const rejectProps: Ref<ConfirmActionProps> = ref({
        label: 'Não',
        icon: undefined,
        severity: 'secondary',
        variant: 'outlined',
        action: () => {}
    });
    const acceptProps: Ref<ConfirmActionProps> = ref({
        label: 'Sim',
        icon: undefined,
        severity: 'danger',
        action: () => {}
    });

    const show: Ref<boolean> = ref(false);

    const x: Ref<number> = ref(0);
    const y: Ref<number> = ref(0);
    const width: Ref<number> = ref(0);
    const height: Ref<number> = ref(0);
    const targetElement: Ref<HTMLElement | null> = ref(null);

    const hide = () => {
        show.value = false;
        targetElement.value = null;
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
        severity.value = payload.severity;
        rejectProps.value = {
            label: payload.rejectProps?.label ?? 'Não',
            icon: payload.rejectProps?.icon,
            severity: payload.rejectProps?.severity ?? 'secondary',
            variant: payload.rejectProps?.variant ?? 'outlined',
            action: payload.rejectProps?.action
        };
        acceptProps.value = {
            label: payload.acceptProps?.label ?? 'Sim',
            icon: payload.acceptProps?.icon,
            severity: payload.acceptProps?.severity ?? (payload.severity ?? 'danger'),
            variant: payload.acceptProps?.variant,
            action: payload.acceptProps?.action
        };
        x.value = payload.x;
        y.value = payload.y;
        width.value = payload.width;
        height.value = payload.height;
        targetElement.value = payload.target ?? null;
        show.value = true;
    };

    return { message, messageIcon, severity, rejectProps, acceptProps, show, x, y, width, height, targetElement, hide, confirm };
});