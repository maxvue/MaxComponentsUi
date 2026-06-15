<template>
    <div class="max-icon-ai-animated" :class="{ 'is-animated': animated }" :style="sizeStyles" >
        <!-- <div class="img-p-top" :style="sizePLStyles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
            </svg>
        </div>

        <div class="img-p-bottom" :style="sizePLStyles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
            </svg>
        </div> -->

        <div class="img-g-right" :style="sizeStyles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                <path d="M0 0h16v16H0z" fill="none" />
                <path fill="#448aff" d="M15 8.014A7.457 7.457 0 0 0 8.014 15h-.028A7.456 7.456 0 0 0 1 8.014v-.028A7.456 7.456 0 0 0 7.986 1h.028A7.457 7.457 0 0 0 15 7.986z" />
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
        noAnimate: false
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
            position: absolute;
            top: 1.5px;
            left: 1.5px;
            width: 40%;
            height: 40%;
        }

        .img-p-bottom {
            position: absolute;
            bottom: 1.5px;
            left: 1.5px;
            width: 40%;
            height: 40%;
        }

        .img-g-right {
            width: 100%;
            height: 100%;
            svg: {
                width: 100%;
                height: 100%;
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
