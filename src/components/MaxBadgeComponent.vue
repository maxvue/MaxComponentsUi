<template>
    <div :class="`badge-component-main-div ${props.size ?? ''}`">
        <MaxIcon v-if="props.icon || props.i" :icon="props.icon ?? props.i" class="icon-badge" dark="0.3" :color="icon_color" />
        <span v-if="is_overlay" class="p-overlaybadge max-badge-overlay">
            <slot />
            <span :class="badgeClasses" v-bind="attrs" v-bind:aria-hidden="!message ? 'true' : undefined" :style="{ backgroundColor: bg_color, color: text_color }">
                {{ message }}
            </span>
        </span>
        <span v-else :class="badgeClasses" v-bind="attrs" ref="badgeElem" :style="{ backgroundColor: bg_color, color: text_color }">
            {{ message }}
        </span>
        <div class="circle-color-badge" v-if="props.iconColor || props.iconValue">
            <div :style="{ background: (props.iconColor ?? 'none') as string }" class="circle-color-badge-text">
                {{ props.iconValue ?? '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import MaxIcon from './MaxIcon.vue';
    import { useAttrs, computed, ref } from 'vue';
    import { getColorFromVar } from '@maxvue/max-use';

    const attrs = useAttrs();
    const badgeElem = ref<HTMLElement | null>(null);

    const props = withDefaults(defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** Texto do badge */
        label?: string;
        /** Alias para o texto do badge */
        value?: string | number;
        /** Alias para o texto do badge */
        msg?: string;
        /** Alias para o texto do badge */
        mensagem?: string;
        /** Alias para o texto do badge */
        text?: string;
        /** Alias para o texto do badge */
        txt?: string;
        /** Alias para o nome do ícone */
        number?: string | number;
        /** Severidade */
        severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast' | string;
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

    const message = computed<string>(() => {
        const val = props.label ?? props.msg ?? props.value ?? props.mensagem ?? props.text ?? props.txt ?? props.number;
        return val !== undefined && val !== null ? String(val) : '';
    });

    const is_overlay = computed(() => props.overlay === true);

    const badgeClasses = computed(() => {
        const sizeAttr = props.size ?? attrs.size;
        const sevAttr = props.severity ?? attrs.severity;
        return [
            'p-badge',
            'p-component',
            !message.value ? 'p-badge-dot' : '',
            message.value.length === 1 ? 'p-badge-circle' : '',
            sevAttr ? `p-badge-${sevAttr}` : '',
            sizeAttr === 'large' || sizeAttr === 'lg' ? 'p-badge-lg' : '',
            sizeAttr === 'xlarge' || sizeAttr === 'xl' ? 'p-badge-xl' : '',
            props.icon || props.iconColor ? 'with-icon' : '',
            props.iconValue ? 'with-icon-value' : ''
        ].filter(Boolean).join(' ');
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

    defineExpose({
        badgeElem
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

            &.p-badge-dot {
                width: 0.5rem;
                min-width: 0.5rem;
                height: 0.5rem;
                border-radius: 50%;
                padding: 0;
            }

            &.p-badge-circle {
                padding: 0;
                border-radius: 50%;
            }
        }

        .p-overlaybadge {
            position: relative;

            .p-badge {
                position: absolute;
                top: 0;
                right: 0;
                transform: translate(50%, -50%);
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
                color: white;
            }
        }

        .icon-badge {
            position: absolute;
            left: 4px;
        }
    }
</style>
