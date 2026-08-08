<template>
    <div ref="btn_el" pointer v-tooltip="null" class="max-popover-main">
        <div v-tooltip="null" @click.stop="toggle" flex :style="{width: size_icon, height: size_icon} " class="max-popover-icon">
            <slot name="button" v-bind="props">
                <MaxButton v-bind="props" :size="String(props.size ?? props.sizeIcon ?? props.iconSize ?? 1.1)" :action="undefined" />
            </slot>
        </div>
        <Teleport to="body" :disabled="! isOpen">
            <div style="position: fixed;" v-tooltip="null" class="popover-item" >
                <MaxAnimateFade :show="isOpen" :duration="0.3">
                    <div class="background-popover" @click.stop="hide" v-if="isOpen" :style="{opacity: position.opacity}">
                        <div class="max-popover-dialog" ref="el" :style="{top: position.top + 'px', left: position.left + 'px'}"  :class="[position.isTop ? 'is-top' : 'is-bottom', position.isLeft ? 'is-left' : 'is-right', props.noPicker ? 'no-picker' : '', props.class]" @click.stop="() => {}" >
                            <slot name="header">
                                <MaxGrid s100 class="max-popover-header" pt0 mt0 mb-15>
                                    <MaxTitle1 s90  :h1="props.title ?? 'Titulo'" :h2="props.subTitle ?? 'Sub Titulo'" p0 m0 />
                                    <MaxIconButton s10 i="iconoir:xmark" size="1.3" @click.stop="hide" />
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
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { useElementSize, useWindowSize, useElementBounding, useDefaultReset } from '@maxvue/max-use';
    import { useTemplateRef, ref, computed, useId } from 'vue';
    import { usePopoverStore } from '../stores/usePopover.Store';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxAnimateFade from './MaxAnimateFade.vue';
    import { getCssSize } from '../helpers/getCssSize';

    const props = withDefaults(defineProps<{
        /** Classes passadas ao componente */
        class?: string;
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
        subTitle?: string;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        sizeIcon?: string | number;
        iconSize?: string | number;
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
        /** Oculta o triangulo de ligação com o botão */
        noPicker?: boolean;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?',
        noPicker: false
    });

    const size_icon = computed(() => getCssSize(String(props.size ?? props.sizeIcon ?? props.iconSize ?? 1.1)) );

    const id = ref(useId());

    const popover_store = usePopoverStore();

    const isOpen = computed(() => popover_store.show_id === id.value);

    const el = useTemplateRef('el');
    const btn_el = useTemplateRef('btn_el');

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(btn_el as any);
    const { width: width_el, height: height_el } = useElementSize(el as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const style: any = useDefaultReset({
        opacity: 0
    });

    const position = computed(() => {
        const data = {
            top: y.value + height_btn.value + 15,
            left: x.value + (width_btn.value / 2) - (width_el.value / 2),
            isTop: false,
            isLeft: false,
            opacity: style.value.opacity
        };

        if (data.top + height_el.value + 15 > window_height.value) {
            data.top = y.value - height_btn.value - height_el.value;
            data.isTop = true;
        }

        if (data.left + width_el.value + 15 > window_width.value) {
            data.left = x.value + (width_btn.value) - (width_el.value) + 10;
            data.isLeft = true;
        }

        return data;
    });

    const toggle = () => {
        if (style.value.opacity !== 0) style.reset();

        popover_store.toggle(id.value);

        setTimeout(() => {
            style.value.opacity = 1;
        }, 1);
    };

    const hide = () => {
        style.reset();
        popover_store.hide();
    };

    const show = toggle;


    defineExpose({
        hide,
        show,
        toggle
    });


</script>

<style lang="scss">
.max-popover-main {
    display: grid;
    place-items: center;

    .max-popover-icon {
        display: grid;
        place-items: center;
    }
}

.background-popover {
    background-color: rgb(0 0 0 / 10%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 99 !important;
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

    &:not(.no-picker) {
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
    }

    .max-popover-header {
        width: 100%;
    }
}

.popover-item {
    z-index: 9999 !important;
}
</style>
