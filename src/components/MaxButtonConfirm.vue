<template>
    <MaxButton class="max-button-confirm" :label="props.label" :icon="props.icon" :i="props.i" :blank="props.blank" :route="props.route" :data="props.data" :params="props.params" :rotate="props.rotate" :flip="props.flip" :size="props.size" :scale="props.scale" :severity="props.severity" :variant="props.variant" :loading="props.loading" :width="props.width" :height="props.height" :dark="props.dark" :light="props.light" v-tooltip="null" :action="onClickToggle" ref="btn_el" />
</template>

<script setup lang="ts">
    import MaxButton from './MaxButton.vue';
    import { useTemplateRef } from 'vue';
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import type { ButtonSeverity, ButtonVariant, ConfirmProps } from '../types';

    const confirm_store = useConfirmStore();

    const props = withDefaults(defineProps<ConfirmProps & {
        /** Texto de exibição do botão */
        label?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rota para navegação ao clicar */
        route?: string;
        /** Query data */
        data?: any;
        /** params data */
        params?: any;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Estilo de severidade do botão */
        severity?: ButtonSeverity;
        /** Variante visual do botão */
        variant?: ButtonVariant;
        loading?: boolean;
        /** Largura específica */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?',
        messageIcon: null,
        rejectProps: () => ({ label: 'Não', icon: undefined, severity: 'secondary', variant: 'outlined', action: () => {} }),
        acceptProps: () => ({ label: 'Sim', icon: undefined, severity: 'danger', action: () => {} })
    });


    const btn_el = useTemplateRef('btn_el');

    const onClickToggle = () => {
        const rawEl = btn_el.value as any;
        const domEl: HTMLElement | null = rawEl?.$el ?? rawEl;
        const rect = domEl?.getBoundingClientRect?.() ?? { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 };

        confirm_store.confirm({
            message: props.message,
            messageIcon: props.messageIcon,
            severity: props.severity,
            rejectProps: props.rejectProps,
            acceptProps: props.acceptProps,
            x: rect.x ?? rect.left ?? 0,
            y: rect.y ?? rect.top ?? 0,
            width: rect.width ?? 0,
            height: rect.height ?? 0,
            target: domEl
        });
    };

</script>
