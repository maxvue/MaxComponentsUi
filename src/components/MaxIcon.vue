<template>
    <div class="max-icon-div" v-html="iconData" :style="{ width: size, height: size }"></div>
</template>

/**
 * Componente de ícone padronizado.
 * Busca ícones do ecossistema Iconify e os exibe como SVG.
 * Possui sistema de cache local para performance.
 */
<script setup lang="ts">
    import { getCached } from '../helpers/getCached';
    import { setCached } from '../helpers/setCached';

    const props = defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
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
    }>();

    const iconName = computed(() => props.icon || props.i || '');

    const iconData = ref('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="18;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path><path stroke-dasharray="60" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z" opacity="0.3"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="60;0"/></path></g></svg>');

    const size = computed(() => {
        const props_wh = props.width ?? props.height ?? null;
        const props_size = props.size ?? props.scale ?? null;
        const size_prop = props_wh ?? props_size;

        if (!size_prop) return '16px';


        if (typeof props_size === 'number') return `${16 * props_size}px`;
        if (typeof size_prop === 'number') return `${size_prop}px`;
        return /^[0-9.]+$/.test(size_prop) ? `${size_prop}px` : size_prop;
    });

    const STORAGE_KEY = computed(() => 'max-icon-' + iconName.value + '-' + size.value);

    watch(
        STORAGE_KEY,
        () => {
            const data = getCached(STORAGE_KEY.value);

            if (data) {
                iconData.value = data;
                return;
            }

            const prefix = iconName.value.split(':')[0];
            const name = iconName.value.split(':')[1];

            fetch('https://api.iconify.design/' + prefix + '/' + name + '.svg?height=' + size.value, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
            })
                .then((response) => {
                    if (response.ok) response.text().then((data) => {
                        console.log(data);
                        iconData.value = data;
                        setCached(STORAGE_KEY.value, data);
                    });

                })
                .catch((error) => {
                    console.error(error);
                });
        },
        { immediate: true }
    );
</script>

<style lang="scss" scoped>
    .max-icon-div {
        display: grid;
        place-items: center;

        svg {
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
        }
    }
</style>
