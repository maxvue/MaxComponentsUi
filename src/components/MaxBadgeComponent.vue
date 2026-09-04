<template>
    <div :class="`badge-component-main-div ${props.size ?? ''}`">
        <MaxIcon v-if="props.icon || props.i" :icon="props.icon ?? props.i" class="icon-badge" dark="0.3" :color="icon_color" />
        <span v-if="is_overlay" class="p-badge p-overlay-badge" :style="{ backgroundColor: bg_color }"></span>
        <span
            v-else
            ref="badgeElem"
            v-bind="passthrough_attrs"
            :class="`p-badge p-component ${badge_size_class} ${props.icon || props.iconColor ? 'with-icon' : ''} ${props.iconValue ? 'with-icon-value' : ''}`"
            :style="{ backgroundColor: bg_color, color: text_color }"
        >{{ message }}</span>
        <div class="circle-color-badge" v-if="props.iconColor || props.iconValue">
            <div :style="{ background: (props.iconColor ?? 'none') as string }" class="circle-color-badge-text">
                {{ props.iconValue ?? '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import MaxIcon from './MaxIcon.vue';
    import { useAttrs, computed } from 'vue';
    import { getColorFromVar } from '@maxvue/max-use';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** Texto do badge */
        label?: string;
        /** Alias para o texto do badge */
        value?: string;
        /** Alias para o texto do badge */
        msg?: string;
        /** Alias para o texto do badge */
        mensagem?: string;
        /** Alias para o texto do badge */
        text?: string;
        /** Alias para o texto do badge */
        txt?: string;
        /** Alias para o nome do ícone */
        number?: string;
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
        /** Cor do ícone */
        iconColor?: string;
        /** Valor do ícone */
        iconValue?: string;
        /** Apenas se estiver usando overlay = true */
        badge?: any;
        /** Apenas se estiver usando overlay = true */
        overlay?: boolean | undefined;
        /** Cor do Fundo */
        background?: string;
        /** Cor da Texto */
        textColor?: string;
    }>(), {});

    const message = computed<string>(() => String(props.label ?? props.msg ?? props.value ?? props.mensagem ?? props.text ?? props.txt ?? props.number ?? ''));
    const is_overlay = computed(() => props.overlay === true);

    const badge_size_class = computed<string>(() => {
        const size = (attrs.size ?? attrs['size']) as string | undefined;
        if (size === 'large') return 'p-badge-lg';
        if (size === 'xlarge') return 'p-badge-xl';
        return '';
    });

    const passthrough_attrs = computed(() => {
        const out: Record<string, unknown> = {};
        for (const key in attrs) {
            if (key.startsWith('color-')) continue;
            if (key === 'size') continue;
            out[key] = attrs[key];
        }
        return out;
    });

    const bg_color = computed<string>(() => {
        if (props.background) return props.background;

        for (const key in attrs) if (key.startsWith('color-')) {
            const color = key.replace('color-hover-', '').replace('color-', '');
            return `var(--${color}) !important`;
        }

        return 'var(--orange-600)';
    });

    const text_color = computed(() => {
        if (props.textColor) return props.textColor;

        const Color = getColorFromVar(bg_color.value);
        if (Color.isLight()) return Color.darken(0.5).hexa();

        return Color.lighten(0.6).hexa();
    });

    const icon_color = computed(() => {
        if (props.iconColor) return props.iconColor;
        const Color = getColorFromVar(text_color.value);
        if (Color.isDark()) return Color.darken(0.5).hexa();

        return Color.lighten(0.6).hexa();
    });
</script>

<style lang="scss">
    .badge-component-main-div {
        position: relative;
        display: grid;
        place-items: center start;
        grid-template-columns: auto 1fr;

        .p-badge {
            font-size: 0.6rem;
            font-weight: 500;
            height: 22.5px;
            text-transform: uppercase;
            display: grid;
            place-items: center;
            border-radius: 6px;
            padding: 0 6px;

            &.p-badge-lg {
                font-size: 0.65rem;
                font-weight: 500;
                padding: 2px 8px 0;
                height: 23px;

                &.with-icon {
                    padding-left: 25px;
                }

                &.with-icon-value {
                    padding-left: 28px !important;
                }
            }

            &.p-badge-xl {
                font-size: 0.6rem;
                font-weight: 500;
                padding: 0 6px;
                height: 20px;

                &.with-icon {
                    padding-left: 23px;
                }

                &.with-icon-value {
                    padding-left: 25px;
                }
            }

            &.with-icon, &.with-icon-value {
                padding-left: 26px;
            }

            &.p-overlay-badge {
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(50%, -50%);
                min-width: 8px;
                height: 8px;
                border-radius: 50%;
                padding: 0;
            }
        }

        .circle-color-badge {
            position: absolute;
            top: 1px;
            left: 0;
            width: 21px;
            height: 100%;
            border-radius: 3px;
            display: grid;
            place-items: center;

            .circle-color-badge-text {
                width: 14px;
                height: 14px;
                border-radius: 6px;
                display: grid;
                place-items: center;
                font-size: 9px;
                color: var(--primary-0);
            }
        }

        .icon-badge {
            position: absolute;
            left: 4px;
        }
    }
</style>
