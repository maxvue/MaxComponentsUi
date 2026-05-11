<template>
    <MaxIconButton v-bind="props" v-tooltip="null" pointer @click.stop="onClickToggle" ref="btn_el" />
</template>

<script setup lang="ts">;
    import MaxIconButton from './MaxIconButton.vue';
    import { useTemplateRef } from 'vue';
    import { useElementBounding } from '@maxvue/max-use';
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const props = withDefaults(defineProps<{
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
        /** Mensagem de confirmação */
        message?: string;
        /** Icone de mensagem de confirmação */
        messageIcon?: string;
        /** Label do botão de sim */
        acceptLabel?: string;
        /** Icone do botão de sim */
        acceptIcon?: string;
        /** Label do botão de não */
        rejectProps?: {
            label: string;
            icon?: string;
            action: Function;
        };
        acceptProps?: {
            label: string;
            icon?: string;
            action: Function;
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
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        rejectProps: () => ({ label: 'Não', action: () => {} }),
        acceptProps: () => ({ label: 'Sim', action: () => {} })
    });

    const confirm_store = useConfirmStore();

    const btn_el = useTemplateRef('btn_el');

    const onClickToggle = () => {
        const { x, y, height, width } = useElementBounding(btn_el as any);
        confirm_store.x = x.value;
        confirm_store.y = y.value;
        confirm_store.height = height.value;
        confirm_store.width = width.value;
        confirm_store.show = !confirm_store.show;
    };

</script>

<style lang="scss">
    .icon-div {
        display: grid;
        place-items: center;
        width: auto;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;

        &.ico-btn {
            &:hover {
                transform: scale(1.3) !important;
            }
        }
    }

    .max-icon-confirm-dialog {
        position: fixed;
        min-width: 100px;
        min-height: 100px;
        background-color: var(--background-0);
        z-index: 2;
        border: 1px solid var(--surface-border);
        box-shadow: 0 1px 6px 3px var(--primary-500);
        border-radius: 0.75rem;
        padding: 5px 15px;
    }
</style>
