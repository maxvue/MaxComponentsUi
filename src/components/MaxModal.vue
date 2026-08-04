<template>
    <div ref="btn_el" pointer :class="['max-modal-item', { 'no-button': props.noButton }, props.class]">
        <div v-tooltip="null" @click.stop="toggle" flex v-if="! props.noButton">
            <slot name="button" v-bind="props">
                <MaxButton v-bind="props" :size="props.size || props.sizeIcon ? String(props.size ?? props.sizeIcon) : ''" />
            </slot>
        </div>
        <teleport to="body">
            <div class="background-modal" @click.stop="modal_store.hide" v-if="modal_store.show_id === id" :style="{opacity: style?.opacity}" :data-html2canvas-ignore="props.ignoreCanvas">
                <div class="max-modal" ref="el" :style="{top: style.top + 'px', left: style.left + 'px', padding: modal_padding}"  @click.stop="() => {}" :class="props.class">
                    <slot name="header" v-if="!props.noHeader">
                        <MaxGrid s100 class="max-modal-header" pt0 mt0 mb-15>
                            <slot name="title" v-bind="props">
                                <MaxTitle1 s90  :h1="props.title ?? 'Titulo'" :h2="props.subTitle ?? 'Sub Titulo'" p0 m0 />
                            </slot>
                            <div s1 w-max-23>
                                <slot name="close" :close="close" :hide="modal_store.hide">
                                    <MaxIconButton i="iconoir:xmark" size="1.3" @click.stop="modal_store.hide" class="close-btn" />
                                </slot>
                            </div>
                        </MaxGrid>
                    </slot>
                    <div class="max-modal-content">
                        <slot name="content"></slot>
                        <slot></slot>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
    import { useModalStore } from '../stores/useModal.Store';
    import { Random, useDefaultReset, refAutoReset } from '@maxvue/max-use';
    import { useTemplateRef, computed, ref, watch } from 'vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';


    const props = withDefaults(defineProps<{
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
        /** IgnoreCanvas */
        ignoreCanvas?: boolean;
        /** Padding geral do interior do modal (incluindo header/títulos). Número em px ou string CSS (ex: '1rem', '10px 20px') */
        padding?: string | number;
        /** No Button Flag */
        noButton?: boolean;
        /** No Header Flag */
        noHeader?: boolean;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?',
        ignoreCanvas: false,
        noButton: false,
        noHeader: false

    });

    const is_show = computed(() => modal_store.show_id === id.value);

    const modal_padding = computed(() => {
        if (props.padding === undefined) return undefined;
        return typeof props.padding === 'number' ? `${props.padding}px` : props.padding;
    });

    const modal_store = useModalStore();

    const id = ref(Random());

    const el = useTemplateRef('el');

    const hide = modal_store.hide;

    const show = modal_store.show;

    const style: any = useDefaultReset({
        isTop: false,
        isLeft: false,
        opacity: 0
    });

    const is_changing = refAutoReset(false, 400);

    /**
     * Timers de transição (abertura/fechamento) atualmente agendados.
     * Guardado para que uma chamada mais recente (toggle/open/close) possa
     * cancelar uma transição anterior ainda em voo, evitando que um
     * `hide()`/`toggle()` tardio (do fechamento anterior) desfaça uma
     * reabertura programática que já aconteceu.
     */
    let pending_timers: ReturnType<typeof setTimeout>[] = [];

    const clearPendingTimers = () => {
        pending_timers.forEach((timer) => clearTimeout(timer));
        pending_timers = [];
    };

    /**
     * Última intenção determinística expressa via open()/close().
     * Necessário porque `modal_store.show_id` continua igual ao `id` deste
     * modal durante toda a animação de saída (opacity indo a 0 até o
     * `hide()` disparar aos 300ms) — usá-lo sozinho para checar
     * idempotência faria `open()` concluir, erradamente, que o modal já
     * está aberto enquanto na verdade ele está no meio do fechamento.
     */
    let intent: 'open' | 'closed' = 'closed';

    /**
     * Se este modal for fechado por uma via que não passa por close()
     * (clique no fundo/botão X, que chamam `modal_store.hide` diretamente,
     * ou outro modal assumindo o `show_id` global), sincroniza `intent` de
     * volta para 'closed' para que um open() futuro não seja descartado
     * por acreditar, erroneamente, que o modal já está "abrindo".
     */
    watch(() => modal_store.show_id, (value) => {
        if (value !== id.value) intent = 'closed';
    });

    const toggle = () => {

        if (is_changing.value) return;

        is_changing.value = true;

        clearPendingTimers();

        if (style.value.opacity !== 0) style.reset();

        // ADICIONA MODAL
        if (modal_store.show_id !== id.value) {

            intent = 'open';

            modal_store.toggle(id.value);
            pending_timers.push(setTimeout(() => {
                const data = {
                    isTop: false,
                    isLeft: false,
                    opacity: 0
                };

                style.value = data;
                style.value.opacity = 1;
            }, 1));

            return;
        }

        // REMOVE MODAL
        else if (modal_store.show_id === id.value) {

            intent = 'closed';

            pending_timers.push(setTimeout(() => {
                style.value.opacity = 0;
                pending_timers.push(setTimeout(() => {
                    modal_store.toggle(id.value);
                }, 300));
            }, 1));

        }


    };

    const open = () => {

        // Idempotente: já aberto (ou abrindo), não faz nada.
        if (intent === 'open') return;

        intent = 'open';

        // Cancela qualquer fechamento (via toggle/close) ainda em andamento,
        // para que ele não desfaça esta reabertura mais tarde.
        clearPendingTimers();

        if (style.value.opacity !== 0) style.reset();

        modal_store.show(id.value);
        pending_timers.push(setTimeout(() => {
            const data = {
                isTop: false,
                isLeft: false,
                opacity: 0
            };

            style.value = data;
            style.value.opacity = 1;
        }, 1));

    };

    const close = () => {

        // Idempotente: já fechado (ou fechando), não faz nada.
        if (intent === 'closed') return;

        intent = 'closed';

        // Cancela qualquer abertura (via toggle/open) ainda em andamento,
        // para que ela não sobreponha este fechamento mais tarde.
        clearPendingTimers();

        pending_timers.push(setTimeout(() => {
            style.value.opacity = 0;
            pending_timers.push(setTimeout(() => {
                modal_store.hide();
            }, 300));
        }, 1));

    };

    defineExpose({
        toggle,
        is_show,
        show,
        hide,
        open,
        close
    });

</script>

<style lang="scss">

    .max-modal-item {
        &.no-button {
            position: fixed !important;
            width: 0  !important;
            height: 0 !important;
            top: 0 !important;
            left: 0 !important;
        }
    }

    .background-modal {
        background-color: rgb(0 0 0 / 60%);
        height: 100vh;
        width: 100vw;
        position: fixed;
        z-index: 59;
        top: 0;
        left: 0;
        transition: opacity 0.3s ease;

        .max-modal {
            position: fixed;
            background-color: var(--background-0);
            z-index: 2;
            border: 1px solid var(--surface-border);
            display: grid;
            grid-template-rows: auto 1fr;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);

            /* O drop-shadow traça o contorno real do elemento + seus ::before, criando o balão perfeito */
            filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
            border-radius: 0.75rem;
            padding: 10px;

            .max-modal-content {
                width: auto;
                position: relative;
            }

        }
    }
</style>
