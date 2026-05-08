<template>
    <div class="max-icon-div">
        <div class="max-icon" :style="style" v-html="svgContent" />
        <div class="sub-icon checked" v-if="props.checked === true">
            <div class="background-icon"></div>
            <svg full xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" /></svg>
        </div>
        <div class="sub-icon plus" v-if="props.plus === true">
            <div class="background-icon"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z" /></svg>
        </div>
    </div>
</template>

/**
 * Componente de ícone padronizado.
 * Busca ícones do ecossistema Iconify e os exibe como SVG.
 * Possui sistema de cache local para performance.
 */
<script setup lang="ts">
    import { useIconStore } from '../stores/useIcon.Store';
    import { ref, computed, useAttrs, watch } from 'vue';
    import { useElementHover, isNumber } from '@maxvue/max-use';
    import { getColorFromVar } from '../helpers/getColorFromVar';
    import type { ComputedRef, Ref } from 'vue';
    import Color from 'color';

    const icon_store = useIconStore();
    const icon_ref = ref<HTMLElement | null>(null);
    const isHovered = useElementHover(icon_ref as any);

    const attrs: any = useAttrs();
    const props = withDefaults(defineProps<{
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
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição */
        plus?: boolean | string | number | undefined;
        /** Icone de adição */
        color?: string;
        /** Icone de adição */
        colorHover?: string;
    }>(), {
        dark: undefined,
        light: undefined,
        color: 'var(--blue-600)'
    });
    const icon_name: ComputedRef<string | null> = computed(() => props.i ?? props.icon ?? null);

    const value_dark = computed(() => {
        if (isNumber(props.dark)) return props.dark;
        if (props.dark) return 0.5;
        return null;
    });

    const value_light = computed(() => {
        if (isNumber(props.light)) return props.light;
        if (props.light) return 0.5;
        return null;
    });

    const color = computed(() => {
        if (value_light.value) return { color: `rgba(255,255,255, ${value_light.value})` };
        if (value_dark.value) return { color: `rgba(0,0,0, ${value_dark.value})` };
        return colorStyle.value;
    });

    const colorStyle = computed<Record<'color', string>>(() => {
        const baseColor = getColorFromVar(props.color);
        let finalColor = baseColor;

        if (isHovered.value && attrs.pointer !== undefined) {
            const customHoverColor = props.colorHover;
            finalColor = customHoverColor ? getColorFromVar(customHoverColor) : Color(baseColor).darken(0.35).hex();
        }

        return { color: finalColor };
    });

    const sizeStyles = computed(() => {
        const value = String(props.size ?? '1rem');
        const formattedValue = /[a-z|%]$/i.test(value) ? value : `${value}rem`;
        return { width: formattedValue, height: formattedValue };
    });

    const style: Ref<Record<string, string>> = computed(() => ({ ...sizeStyles.value, ...color.value }));

    const defaultSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="color: var(--background-400)"><g fill="#FF0000"><path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" /><path fill="currentColor" d="M13 21a1 1 0 1 1-2 0v-3a1 1 0 1 1 2 0zm0-15a1 1 0 1 1-2 0V3a1 1 0 1 1 2 0zm9 6a1 1 0 0 0-1-1h-3a1 1 0 1 0 0 2h3a1 1 0 0 0 1-1M6 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2zm13.071 8.071a1 1 0 0 0 0-1.414l-2.121-2.121a1 1 0 0 0-1.414 1.414l2.12 2.121a1 1 0 0 0 1.415 0M8.464 7.051A1 1 0 1 1 7.05 8.463L4.93 6.344a1 1 0 1 1 1.414-1.415zm10.607-2.122a1 1 0 0 0-1.414 0L15.536 7.05a1 1 0 0 0 1.414 1.414l2.121-2.12a1 1 0 0 0 0-1.415M7.051 15.536a1 1 0 1 1 1.413 1.414l-2.12 2.121a1 1 0 0 1-1.415-1.414z" /></g></svg>';
    const svgContent: Ref = ref(defaultSvg);
    const temp_icon: Ref<boolean> = ref(true);

    const request = () => {
        if (!icon_name.value) return;

        const icon_svg = icon_store.getIcon(icon_name.value);

        if (icon_svg === false) temp_icon.value = false;
        else if (icon_svg !== null) {
            svgContent.value = icon_svg;
            temp_icon.value = false;
        }
    };

    watch(icon_name, () => request(), { immediate: true });

    const { stop: stopWatch } = watch(
        () => [icon_store.icons_updated, temp_icon.value],
        () => {
            request();
            if (!temp_icon.value) {
                setTimeout(() => {
                    stopWatch();
                }, 10);
                return;
            }
        }, { immediate: true }
    );
</script>

<style lang="scss" scoped>
    .max-icon-div {
        position: relative;
        z-index: 1;

        .max-icon {
            display: grid;
            place-items: center;

            svg {
                min-width: 100% !important;
                min-height: 100% !important;
                max-width: 100% !important;
                max-height: 100% !important;
            }
        }

        .sub-icon {
            position: absolute;
            display: grid;
            place-items: center;

            &.plus {
                color: var(--blue-0);
                width: 13px;
                height: 13px;
                bottom: -2px;
                right: 0;

                .background-icon {
                    height: 15px;
                    width: 15px;
                    background-color: var(--blue-750);
                }
            }

            &.checked {
                color: var(--green-600);
                width: 15px;
                height: 15px;
                bottom: 0;
                right: 0;

                .background-icon {
                    width: 15px;
                    height: 15px;
                    background-color: rgb(255 255 255);
                }
            }

            .background-icon {
                content: '';
                position: absolute;
                border-radius: 50%;
            }

            svg {
                position: absolute;
            }
        }
    }
</style>
