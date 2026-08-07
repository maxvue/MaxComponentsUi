<template>
    <MaxButton v-bind="props" v-tooltip="null" pointer :action="onClickToggle" ref="btn_el" />
</template>

<script setup lang="ts">;
    import MaxButton from './MaxButton.vue';
    import { useTemplateRef } from 'vue';
    import { useElementBounding } from '@maxvue/max-use';
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();

    const props = withDefaults(defineProps<{
        /** Texto de exibição do botão */
        label?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rotação do ícone em graus */
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
        /** Mensagem de confirmação */
        message?: string;
        /** Icone de mensagem de confirmação */
        messageIcon?: string | null;
        /** Label do botão de sim */
        acceptLabel?: string;
        /** Icone do botão de sim */
        acceptIcon?: string;
        /** Label do botão de não */
        rejectProps?: {
            label: string;
            icon?: string;
            action?: ((event?: any) => void) | undefined;
        };
        acceptProps?: {
            label: string;
            icon?: string;
            action?: ((event?: any) => void) | undefined;
        };
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

    const onClickToggle = () => {
        const { x, y, height, width } = useElementBounding(btn_el as any);
        confirm_store.x = x.value;
        confirm_store.y = y.value;
        confirm_store.height = height.value;
        confirm_store.width = width.value;
        confirm_store.show = !confirm_store.show;
        confirm_store.message = props.message;
        confirm_store.messageIcon = props.messageIcon;
        confirm_store.rejectProps = props.rejectProps;
        confirm_store.acceptProps = props.acceptProps;
    };

</script>
