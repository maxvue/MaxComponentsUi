<template>
    <div ref="btn_el" pointer >
        <slot name="button" v-if="! props.label">
            <MaxIconButton :icon="props.i ?? props.icon" :size="props.size" @click.stop="toggle" />
        </slot>
        <slot name="button" v-else>
            <MaxButton :label="props.label" :icon="props.i ?? props.icon" :size-icon="props.size" @click.stop="toggle" />
        </slot>
        <div style="position: fixed; z-index: 999;">
            <MaxAnimateFade :show="popover_store.show_id === id" :duration="0.3">
                <div class="background-popover" @click.stop="popover_store.hide" v-if="popover_store.show_id === id" :style="{opacity: style.opacity}">
                    <div class="max-popover-dialog" ref="el" :style="{top: style.top + 'px', left: style.left + 'px'}"  :class="[style.isTop ? 'is-top' : 'is-bottom', style.isLeft ? 'is-left' : 'is-right']" @click.stop="() => {}">
                        <slot name="header">
                            <MaxGrid s100 class="max-popover-header" pt0 mt0 mb-15>
                                <MaxTitle1 s90  :h1="props.title ?? 'Titulo'" :h2="props.subtitle ?? 'Sub Titulo'" p0 m0 />
                                <MaxIconButton s10 i="iconoir:xmark" size="1.3" @click.stop="popover_store.hide" />
                            </MaxGrid>
                        </slot>
                        <div class="max-popover-content">
                            <slot name="content"></slot>
                            <slot></slot>
                        </div>
                    </div>
                </div>
            </MaxAnimateFade>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { usePopoverStore } from '../stores/usePopover.Store';
    import { useElementSize, useWindowSize, Random, useElementBounding, watchDebounced } from '@maxvue/max-use';
    import { useTemplateRef, ref } from 'vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxAnimateFade from './MaxAnimateFade.vue';
    import { useAttrs } from 'vue';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rotação do ícone em graus */
        route?: string;
        /** Label para botão */
        label?: string;
        /** Titulo do popover */
        title?: string;
        /** Subtitulo do popover */
        subtitle?: string;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Mensagem de confirmação */
        loading?: boolean;
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
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?'
    });

    const popover_store = usePopoverStore();

    const id = ref(Random());

    const el = useTemplateRef('el');
    const btn_el = useTemplateRef('btn_el');

    const style = ref({
        top: 0,
        left: 0,
        isTop: false,
        isLeft: false,
        opacity: 0
    });

    const resetStyle = () => {
        style.value = {
            top: 0,
            left: 0,
            isTop: false,
            isLeft: false,
            opacity: 0
        };
    };

    const toggle = () => {
        console.log('toggling', id.value);

        if (style.value.opacity !== 0) resetStyle();


        popover_store.toggle(id.value);

        setTimeout(() => {
            const { x, y, width: width_btn, height: height_btn } = useElementBounding(btn_el as any);
            const { width: width_el, height: height_el } = useElementSize(el as any);
            const { width: window_width, height: window_height } = useWindowSize();
            const data = {
                top: y.value + height_btn.value + 15,
                left: x.value + (width_btn.value / 2) - (width_el.value / 2),
                isTop: false,
                isLeft: false,
                opacity: 0
            };

            console.log({
                x: x.value,
                y: y.value,
                width_el: width_el.value,
                window_width: window_width.value,
                width_btn: width_btn.value,
                height_btn: height_btn.value
            });

            if (data.top + height_el.value + 15 > window_height.value) {
                data.top = y.value - height_btn.value - height_el.value;
                data.isTop = true;
            }

            if (data.left + width_el.value + 15 > window_width.value) {
                data.left = x.value + (width_btn.value) - (width_el.value) + 10;
                data.isLeft = true;
            }

            style.value = data;


            style.value.opacity = 1;
        }, 1);
    };


</script>

<style lang="scss">
.background-popover {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 5;
    top: 0;
    left: 0;
    transition: opacity 0.3s ease;
}

.max-popover-dialog {
    position: fixed;
    min-width: 300px;
    min-height: 60px;
    background-color: var(--background-0);
    z-index: 2;
    border: 1px solid var(--surface-border);
    display: grid;
    grid-template-rows: auto 1fr;

    /* O drop-shadow traça o contorno real do elemento + seus ::before, criando o balão perfeito */
    filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
    border-radius: 0.75rem;
    padding: 10px;

    &::before {
        content: '';
        position: absolute;
        width: 14px;
        height: 14px;
        background-color: var(--background-0);
        transform: rotate(45deg);
        z-index: 1; /* Cobre a borda principal para unificar o desenho */
    }

    &.is-bottom::before {
        top: -7px;
        border-top: 1px solid var(--surface-border);
        border-left: 1px solid var(--surface-border);
    }

    &.is-top::before {
        bottom: -7px;
        border-bottom: 1px solid var(--surface-border);
        border-right: 1px solid var(--surface-border);
    }

    &.is-left::before {
        right: 15px;
    }

    &.is-right::before {
        left: 15px;
    }

    .max-popover-header {
        width: 100%;
    }
}
</style>
