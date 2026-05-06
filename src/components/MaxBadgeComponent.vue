<template>
    <div :class="`badge-component-main-div ${props.size ?? ''}`">
        <MaxIcon v-if="props.icon || props.i" :icon="props.icon ?? props.i" class="icon-badge" size="1.1" />
        <Badge :value="(props.label ?? props.msg ?? props.value ?? props.mensagem ?? props.text ?? props.txt ?? props.number) as any" v-if="props.overlay === undefined" :class="`${props.icon || props.iconColor ? 'with-icon' : ''} ${props.iconValue ? 'with-icon-value' : ''}`" ref="badgeElem" />
        <OverlayBadge v-if="props.overlay" />
        <div class="circle-color-badge">
            <div :style="{ background: (props.iconColor ?? 'none') as string }" class="circle-color-badge-text">
                {{ props.iconValue ?? '' }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import Badge from 'primevue/badge';
    import OverlayBadge from 'primevue/overlaybadge';
    import MaxIcon from './MaxIcon.vue';

    const props = defineProps<{
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

    }>();
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
        }

        .icon-badge {
            position: absolute;
            width: 16px;
            height: 16px;
            left: 3px;
            color: var(--background-0) !important;
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
    }
</style>
