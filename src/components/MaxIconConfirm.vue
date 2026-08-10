<template>
    <MaxIconButton :icon="props.icon" :i="props.i" :blank="props.blank" :route="props.route" :data="props.data" :params="props.params" :rotate="props.rotate" :flip="props.flip" :size="props.size" :scale="props.scale" :loading="props.loading" :width="props.width" :height="props.height" :dark="props.dark" :light="props.light" :checked="props.checked" :plus="props.plus" v-tooltip="null" pointer :action="onClickToggle" ref="btn_el" />
</template>

<script setup lang="ts">
    import MaxIconButton from './MaxIconButton.vue';
    import { useTemplateRef } from 'vue';
    import { useElementBounding } from '@maxvue/max-use';
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import type { ConfirmProps } from '../types';

    const confirm_store = useConfirmStore();

    const props = withDefaults(defineProps<ConfirmProps & {
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
        /** Label do botão de sim */
        acceptLabel?: string;
        /** Icone do botão de sim */
        acceptIcon?: string;
        /** Icone do botão de não */
        cancelIcon?: string;
        loading?: boolean;
        /** Largura específica */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
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
