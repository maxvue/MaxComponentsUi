<template>
    <div class="max-icon-div" :style="style" v-if="icon_name" ref="icon_ref" >
        <div v-if="props.tooltip" v-tooltip="props.tooltip" flex absolute></div>
        <div class="max-icon" v-html="svgContent" v-bind="attrs" flex :style="style" />
        <div class="sub-icon checked" v-if="props.checked === true">
            <div class="background-icon"></div>
            <svg full xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" /></svg>
        </div>
        <div class="sub-icon plus" v-if="props.plus === true">
            <div class="background-icon"></div>
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 448 512"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32v144H48c-17.7 0-32 14.3-32 32s14.3 32 32 32h144v144c0 17.7 14.3 32 32 32s32-14.3 32-32V288h144c17.7 0 32-14.3 32-32s-14.3-32-32-32H256z" /></svg>
        </div>
    </div>
    <div v-else></div>
</template>

/**
 * Componente de ícone padronizado.
 * Busca ícones do ecossistema Iconify e os exibe como SVG.
 * Possui sistema de cache local para performance.
 */
<script setup lang="ts">
    import { useIconStore } from '../stores/useIcon.Store';
    import { ref, computed, useAttrs, watchEffect } from 'vue';
    import { useElementHover, isNumber, getColorFromVar } from '@maxvue/max-use';

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
        iconColor?: string;
        /** Icone de adição */
        colorHover?: string;
        /** Hover color */
        hoverColor?: string | undefined;
        /** Hover color */
        tooltip?: string | undefined;
    }>(), {
        dark: undefined,
        light: undefined,
        color: undefined,
        hoverColor: undefined
    });
    const icon_name = computed(() => props.i ?? props.icon ?? null);

    const value_dark = computed(() => {
        if (isNumber(props.dark)) return props.dark;
        if (props.dark) return 0.6;
        return null;
    });

    const value_light = computed(() => {
        if (isNumber(props.light)) return props.light;
        if (props.light) return 0.5;
        return null;
    });

    const color = computed<string>(() => {
        if (props.color) return props.color;

        for (const key in attrs) if (key.startsWith('color-') && ! key.startsWith('color-hover-')) {
            const color = key.replace('color-hover-', '').replace('color-', '');
            return `var(--${color}) !important`;
        }

        if (value_light.value) return `rgba(255,255,255, ${value_light.value})` ;
        if (value_dark.value) return `rgba(0,0,0, ${value_dark.value})`;

        return 'rgba(0,0,0, 0.4)';
    });

    const hover_color = computed<string>(() => {

        for (const key in attrs) if (key.startsWith('hover-') || key.startsWith('color-hover-')) {
            const color = key.replace('color-hover-', '').replace('hover-', '');
            return `var(--${color}) !important`;
        }

        if (attrs.pointer === undefined && props.hoverColor === undefined) return color.value;

        if (props.hoverColor) return props.hoverColor;

        const Color = getColorFromVar(color.value);

        const value = 13;

        const alpha = Color.object().alpha;
        if (alpha && alpha > 0) return Color.alpha(alpha + 0.2).hexa();

        return Color.darken(value).hexa();
    });

    const colorStyle = computed<Record<string, string>>(() => {
        return { color: isHovered.value ? hover_color.value : color.value };
    });

    const DEFAULT_SIZE = '1rem';

    /** O svg interno é width:100%, então um tamanho inválido não encolhe o ícone:
     *  o navegador descarta a declaração e ele estica até o contêiner pai. Por
     *  isso valores não dimensionáveis caem no padrão em vez de passar adiante. */
    const isValidCssSize = (value: string) => {
        if (!value || value.includes('NaN') || value === 'undefined' || value === 'null') return false;
        // Com unidade (2rem, 50%, 16px) ou número puro, ao qual acrescentamos rem.
        return /^[\d.]+([a-z]+|%)$/i.test(value) || /^[\d.]+$/.test(value);
    };

    const sizeStyles = computed(() => {
        const raw = String(props.size ?? DEFAULT_SIZE).trim();
        const value = isValidCssSize(raw) ? raw : DEFAULT_SIZE;
        const formattedValue = /[a-z|%]$/i.test(value) ? value : `${value}rem`;
        return { width: formattedValue, height: formattedValue };
    });

    const style = computed(() => ({ ...sizeStyles.value, ...colorStyle.value }));

    // watchEffect roda fora da árvore de avaliação de computeds: aqui é seguro
    // disparar a mutação de estado (marcar 'waiting' / requisitar fetch) via getIcon().
    watchEffect(() => {
        if (icon_name.value) icon_store.getIcon(icon_name.value);
    });

    // Getter puro: apenas lê o estado já presente na store, sem mutá-lo.
    const svgContent = computed(() => {
        if (!icon_name.value) return 'C';
        const cached = icon_store.icons_data[icon_name.value];
        return cached && cached !== 'waiting' ? cached : null;
    });

</script>

<style lang="scss">
    .max-icon-div {
        position: relative;

        .max-icon {
            display: grid;
            place-items: center;
            width: 100%;

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
