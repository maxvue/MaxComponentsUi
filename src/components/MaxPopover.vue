<template>
    <div class="max-popover-div" ref="icon_ref" v-bind="props" :style="{width: size, height: size}">
        MaxPopover
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

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
        /** Icone de adição */
        plus?: boolean | string | number | undefined;
        /** Element Click */
        element?: HTMLElement | null;
        /** Position Right */
    }>(), {
        dark: undefined,
        light: undefined
    });

    const size = computed(() => 16 * Number(props.size ?? 1) + 'px');


    const toggle = () => {
        console.log('toggle');
    };

    defineExpose({
        toggle
    });
</script>

<style lang="scss">
    .max-popover-div {
        display: fixed;
        z-index:3;
        min-width: 100px;
        min-height: 100px;
        background-color: var(--background-0);
    }
</style>
