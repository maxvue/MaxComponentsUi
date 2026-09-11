<template>
    <MaxPopover class="max-toggle-popover">
        <slot name="button" v-if="! props.label">
            <MaxIconButton :icon="props.i ?? props.icon" @click.stop="onClickToggle" ref="btn_el" />
        </slot>
        <slot name="button" v-else>
            <MaxButton :label="props.label" :icon="props.i ?? props.icon" v-tooltip="null" @click.stop="onClickToggle" ref="btn_el" />
        </slot>
    </MaxPopover>
</template>

<script setup lang="ts">
    import MaxIconButton from './MaxIconButton.vue';
    import MaxPopover from './MaxPopover.vue';
    import MaxButton from './MaxButton.vue';
    import { useTemplateRef } from 'vue';
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();

    const props = withDefaults(defineProps<{
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
        /** Label para botão */
        label?: string;
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
            action: (event?: any) => void;
        };
        acceptProps?: {
            label: string;
            icon?: string;
            action: (event?: any) => void;
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
        message: 'Deseja continuar?',
        rejectProps: () => ({ label: 'Não', icon: undefined, action: () => {} }),
        acceptProps: () => ({ label: 'Sim', icon: undefined, action: () => {} })
    });


    const btn_el = useTemplateRef('btn_el');

    const onClickToggle = () => {
        const rawEl = btn_el.value as any;
        const domEl: HTMLElement | null = rawEl?.$el ?? rawEl;
        const rect = domEl?.getBoundingClientRect?.() ?? { x: 0, y: 0, left: 0, top: 0, width: 0, height: 0 };

        confirm_store.confirm({
            message: props.message,
            messageIcon: props.messageIcon,
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