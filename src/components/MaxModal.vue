<template>
    <div ref="btn_el" pointer >
        <slot name="button" v-if="! props.label">
            <MaxIconButton :icon="props.i ?? props.icon" :size="props.size" @click.stop="toggle" />
        </slot>
        <slot name="button" v-else>
            <MaxButton :label="props.label" :icon="props.i ?? props.icon" :size-icon="props.size" @click.stop="toggle" />
        </slot>
        <div style="position: fixed; z-index: 999;">
            <MaxAnimateFade :show="modal_store.show_id === id" :duration="0.3">
                <div class="background-modal" @click.stop="modal_store.hide" v-if="modal_store.show_id === id" :style="{opacity: style?.opacity}">
                    <div class="max-modal" ref="el" :style="{top: style.top + 'px', left: style.left + 'px'}"  @click.stop="() => {}">
                        <slot name="header">
                            <MaxGrid s100 class="max-modal-header" pt0 mt0 mb-15>
                                <MaxTitle1 s90  :h1="props.title ?? 'Titulo'" :h2="props.subtitle ?? 'Sub Titulo'" p0 m0 />
                                <MaxIconButton s10 i="iconoir:xmark" size="1.3" @click.stop="modal_store.hide" />
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
    import { useModalStore } from '../stores/useModal.Store';
    import { useElementSize, useWindowSize, Random, useDefaultReset } from '@maxvue/max-use';
    import { useTemplateRef, ref } from 'vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';
    import MaxAnimateFade from './MaxAnimateFade.vue';


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

    const modal_store = useModalStore();

    const id = ref(Random());

    const el = useTemplateRef('el');

    const style: any = useDefaultReset({
        top: 0,
        left: 0,
        isTop: false,
        isLeft: false,
        opacity: 0
    });

    const toggle = () => {
        console.log('toggling', id.value);

        if (style.value.opacity !== 0) style.reset();


        modal_store.toggle(id.value);

        setTimeout(() => {
            const { width: width_el, height: height_el } = useElementSize(el as any);
            const { width: window_width, height: window_height } = useWindowSize();
            const data = {
                top: (window_height.value - height_el.value) / 2,
                left: (window_width.value - width_el.value) / 2,
                isTop: false,
                isLeft: false,
                opacity: 0
            };

            style.value = data;
            style.value.opacity = 1;
        }, 1);
    };


</script>

<style lang="scss">
.background-modal {
    background-color: rgb(0 0 0 / 60%);
    height: 100vh;
    width: 100vw;
    position: fixed;
    z-index: 5;
    top: 0;
    left: 0;
    transition: opacity 0.3s ease;
}

.max-modal {
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


    .max-modal-header {
        width: 100%;
    }
}
</style>
