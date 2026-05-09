<template>
    <div class="icon-div ico-btn" ref="icon_ref" v-bind="props" :style="{width: size, height: size}">
        <MaxIcon pointer :size="size" :light="props.light" :dark="props.dark ?? 0.4" v-bind="props" />
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';

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
    }>(), {
        dark: undefined,
        light: undefined
    });


    const size = computed(() => 16 * Number(props.size ?? 1) + 'px');
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
</style>
