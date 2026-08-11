<template>
    <div class="max-icon-ai-animated" :class="{ 'is-animated': animated && !props.done }" :style="sizeStyles" >
        <div class="img-p-top" v-if="!props.done" >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
            </svg>
        </div>

        <div class="img-p-bottom" v-if="!props.done" >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
            </svg>
        </div>

        <div class="img-g-right" >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
            </svg>
        </div>
        <div class="img-check" v-if="props.done" >
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="m10.6 13.8l-2.15-2.15q-.275-.275-.7-.275t-.7.275t-.275.7t.275.7L9.9 15.9q.3.3.7.3t.7-.3l5.65-5.65q.275-.275.275-.7t-.275-.7t-.7-.275t-.7.275zM12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22" />
            </svg>
        </div>


    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';

    const props = withDefaults(defineProps<{
        /** Anima o ícone (ativo por padrão) */
        animate?: boolean;
        /** Desativa a animação (atalho para animate=false) */
        noAnimate?: boolean;
        done?: boolean;
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
    }>(), {
        animate: true,
        noAnimate: false,
        done: false
    });


    const sizeStyles = computed(() => {
        const value = String(props.size ?? '1rem');
        const formattedValue = /[a-z|%]$/i.test(value) ? value : `${value}rem`;
        return { width: formattedValue, height: formattedValue };
    });

    // const sizePLStyles = computed(() => {
    //     const value = Number(props.size) > 0 ? String() String( ?? '1rem');
    //     const formattedValue = /[a-z|%]$/i.test(value) ? value : `${value}rem`;
    //     return { width: formattedValue, height: formattedValue };
    // });

    const animated = computed(() => props.animate && !props.noAnimate);
</script>

<style scoped lang="scss">
@keyframes pulse-small {
    0%, 100% {
        transform: scale(0.7);
    }

    50% {
        transform: scale(1.3);
    }
}

@keyframes pulse-large {
    0%, 100% {
        transform: scale(1.2);
    }

    50% {
        transform: scale(0.5);
    }
}

.max-icon-ai-animated {
    position: relative;
    display: grid;
    place-items: center;

    .img-p-top {
        display: grid;
        place-items: center;
        position: absolute;
        top: 1px;
        right: 1px;
        width: 40% !important;
        height: 40% !important;

        svg {
            width: 100% !important;
            height: 100% !important;
        }
    }

    .img-p-bottom {
        display: grid;
        place-items: center;
        position: absolute;
        bottom: 1px;
        right: 1px;
        width: 40% !important;
        height: 40% !important;

        svg {
            width: 100% !important;
            height: 100% !important;
        }
    }

    .img-g-right {
        width: 90% !important;
        height: 90% !important;
        aspect-ratio: 1 / 1;
        transform: translateX(-3px);

        svg {
            width: 100% !important;
            height: 100% !important;
        }
    }

    .img-check {
        color: var(--green-700);
        display: grid;
        place-items: center;
        position: absolute;
        bottom: 1px;
        right: 4px;
        width: 35% !important;
        height: 35% !important;

        svg {
            width: 100% !important;
            height: 100% !important;
        }
    }


    &.is-animated {
        .img-p-top svg,
        .img-p-bottom svg {
            animation: pulse-small 2s ease-in-out infinite;
        }

        .img-g-right svg {
            animation: pulse-large 2s ease-in-out infinite;
        }
    }


}
</style>
