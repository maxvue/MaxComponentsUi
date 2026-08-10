<template>
    <MaxButton :label="props.label" :icon="props.icon" :i="props.i" :blank="props.blank" :route="props.route" :data="props.data" :params="props.params" :rotate="props.rotate" :flip="props.flip" :size="props.size" :scale="props.scale" :severity="props.severity" :variant="props.variant" :loading="props.loading" :width="props.width" :height="props.height" :dark="props.dark" :light="props.light" v-tooltip="null" pointer :action="onClickToggle" ref="btn_el" />
</template>

<script setup lang="ts">
    import MaxButton from './MaxButton.vue';
    import { useTemplateRef } from 'vue';
    import { useElementBounding } from '@maxvue/max-use';
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import type { ConfirmProps } from '../types';

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
        severity?: 'secondary' | 'success' | 'info' | 'whatsapp' | 'warning' | 'help' | 'danger' | 'contrast';
        /** Variante visual do botão */
        variant?: 'outlined' | 'text' | 'link';
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
        rejectProps: () => ({ label: 'Não', icon: undefined, action: () => {} }),
        acceptProps: () => ({ label: 'Sim', icon: undefined, action: () => {} })
    });


    const btn_el = useTemplateRef('btn_el');

    const { x, y, height, width } = useElementBounding(btn_el as any);

    const onClickToggle = () => {
        confirm_store.confirm({
            message: props.message,
            messageIcon: props.messageIcon,
            rejectProps: props.rejectProps,
            acceptProps: props.acceptProps,
            x: x.value,
            y: y.value,
            width: width.value,
            height: height.value
        });
    };

</script>
