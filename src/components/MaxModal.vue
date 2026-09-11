<template>
    <div ref="btn_el" :class="['max-modal-item', { 'no-button': props.noButton }, props.class]">
        <div v-tooltip="null" @click.stop="toggle" class="max-modal-trigger" v-if="!props.noButton">
            <slot name="button" v-bind="props">
                <MaxButton v-bind="props" :size="props.size || props.sizeIcon ? String(props.size ?? props.sizeIcon) : ''" />
            </slot>
        </div>
        <teleport to="body">
            <Transition name="max-modal-fade" @after-leave="emit('after-hide')">
                <div
                    class="background-modal"
                    @click.stop="onBackdropClick"
                    v-if="is_show"
                    :style="{ zIndex: backdropZIndex }"
                    :data-html2canvas-ignore="props.ignoreCanvas"
                >
                    <div
                        class="max-modal"
                        ref="el"
                        role="dialog"
                        aria-modal="true"
                        :aria-labelledby="title_id"
                        :aria-label="!title_id ? (props.title ?? undefined) : undefined"
                        :style="{ zIndex: dialogZIndex, padding: modal_padding, width: modal_width, height: modal_height }"
                        @click.stop="() => {}"
                        @keydown="trap.onKeydown"
                        :class="[{ 'is-shaking': isShaking }, props.class]"
                    >
                        <slot name="header" v-if="!props.noHeader">
                            <MaxGrid class="max-modal-header" :id="title_id">
                                <slot name="title" v-bind="props">
                                    <MaxTitle1 class="max-modal-title" :title="props.title ?? 'Titulo'" :subtitle="props.subTitle ?? 'Sub Titulo'" />
                                </slot>
                                <div class="max-modal-close-wrapper">
                                    <slot name="close" :close="handleClose" :hide="handleClose">
                                        <MaxIconButton i="iconoir:xmark" size="1.3" aria-label="Fechar" @click.stop="handleClose" class="close-btn" />
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
            </Transition>
        </teleport>
    </div>
</template>

<script setup lang="ts">
    import { useModalStore } from '../stores/useModal.Store';
    import { useTemplateRef, computed, ref, watch, useId, onBeforeUnmount } from 'vue';
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useScrollLock } from '../helpers/useScrollLock';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import MaxTitle1 from './MaxTitle1.vue';
    import MaxGrid from './MaxGrid.vue';

    const props = withDefaults(defineProps<{
        /** ID único do modal (se omitido, gerado automaticamente via useId()) */
        id?: string;
        /** Controla visibilidade declarativa (suporte a v-model:visible) */
        visible?: boolean;
        class?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rota para navegação ao clicar */
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
        /** Trava o scroll do body enquanto aberto. Default true. */
        blockScroll?: boolean;
        /** Permite fechar com a tecla Escape. Default true. */
        closeOnEscape?: boolean;
        /** Permite fechar ao clicar no backdrop/máscara. Default true. */
        dismissable?: boolean;
        /** Hook chamado antes de fechar o modal, permitindo cancelar ou confirmar o descarte */
        beforeClose?: (done: () => void) => void;
    }>(), {
        visible: undefined,
        dark: 0.4,
        light: undefined,
        loading: false,
        ignoreCanvas: false,
        noButton: false,
        noHeader: false,
        dismissable: true,
        blockScroll: true,
        closeOnEscape: true
    });

    const emit = defineEmits<{
        'update:visible': [value: boolean];
        'before-close': [done: () => void];
        'after-hide': [];
        'show': [];
        'hide': [];
    }>();

    const isShaking = ref(false);

    const triggerShake = () => {
        isShaking.value = true;
        setTimeout(() => {
            isShaking.value = false;
        }, 400);
    };

    const handleClose = () => {
        if (props.beforeClose) {
            props.beforeClose(() => close());
            return;
        }
        emit('before-close', () => close());
        close();
    };

    const onBackdropClick = () => {
        if (!props.dismissable) {
            triggerShake();
            return;
        }
        handleClose();
    };

    const modal_store = useModalStore();
    const generatedId = useId();
    const id = computed(() => props.id ?? generatedId);

    const isControlled = computed(() => props.visible !== undefined);
    const is_show = computed(() => {
        if (isControlled.value) return Boolean(props.visible);
        return modal_store.isOpen(id.value);
    });

    const modalDepth = computed(() => {
        const idx = modal_store.getIndex(id.value);
        return idx >= 0 ? idx : 0;
    });

    const backdropZIndex = computed(() => 1200 + modalDepth.value * 20);
    const dialogZIndex = computed(() => backdropZIndex.value + 10);

    const modal_padding = computed(() => {
        if (props.padding === undefined) return undefined;
        return typeof props.padding === 'number' ? `${props.padding}px` : props.padding;
    });

    const modal_width = computed(() => {
        if (props.width === undefined) return undefined;
        return typeof props.width === 'number' ? `${props.width}px` : props.width;
    });

    const modal_height = computed(() => {
        if (props.height === undefined) return undefined;
        return typeof props.height === 'number' ? `${props.height}px` : props.height;
    });

    const el = useTemplateRef<HTMLElement>('el');
    const trap = useFocusTrap(el);
    const scroll_lock = useScrollLock();

    const title_id = computed(() => (!props.noHeader ? 'max-modal-title-' + id.value : undefined));

    const style = ref({
        opacity: 1
    });

    const is_changing = ref(false);
    let has_scroll_lock = false;

    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && props.closeOnEscape && modal_store.isTop(id.value)) handleClose();

    };

    watch(
        () => props.visible,
        (val) => {
            if (val === true) modal_store.push(id.value);
            else if (val === false) modal_store.pop(id.value);

        },
        { immediate: true }
    );

    watch(
        is_show,
        (value) => {
            if (value) {
                trap.activate();
                document.addEventListener('keydown', onEscape);
                if (props.blockScroll && !has_scroll_lock) {
                    scroll_lock.lock();
                    has_scroll_lock = true;
                }
            } else {
                trap.deactivate();
                document.removeEventListener('keydown', onEscape);
                if (has_scroll_lock) {
                    scroll_lock.unlock();
                    has_scroll_lock = false;
                }
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(() => {
        trap.deactivate();
        document.removeEventListener('keydown', onEscape);
        if (has_scroll_lock) {
            scroll_lock.unlock();
            has_scroll_lock = false;
        }
        if (modal_store.isOpen(id.value)) modal_store.pop(id.value);

    });

    const open = () => {
        emit('update:visible', true);
        modal_store.push(id.value);
        emit('show');
    };

    const close = () => {
        emit('update:visible', false);
        modal_store.pop(id.value);
        emit('hide');
    };

    const toggle = () => {
        if (is_show.value) close();
        else open();

    };

    defineExpose({
        toggle,
        is_show,
        show: open,
        hide: close,
        open,
        close,
        id,
        style,
        is_changing
    });
</script>

<style lang="scss" scoped>
    .max-modal-fade-enter-active,
    .max-modal-fade-leave-active {
        transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);

        .max-modal {
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
    }

    .max-modal-fade-enter-from,
    .max-modal-fade-leave-to {
        opacity: 0;

        .max-modal {
            transform: translate(-50%, -50%) scale(0.96) translateY(-8px);
        }
    }

    .max-modal-item {
        &.no-button {
            position: fixed !important;
            width: 0 !important;
            height: 0 !important;
            top: 0 !important;
            left: 0 !important;
        }

        .max-modal-trigger {
            cursor: pointer;
        }
    }

    .background-modal {
        background-color: rgb(0 0 0 / 60%);
        height: 100vh;
        width: 100vw;
        position: fixed;
        top: 0;
        left: 0;

        .max-modal {
            position: fixed;
            background-color: var(--background-0);
            color: var(--background-700);
            border: 1px solid var(--surface-border);
            display: grid;
            grid-template-rows: auto 1fr;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);

            /* O drop-shadow traça o contorno real do elemento + seus ::before, criando o balão perfeito */
            filter: drop-shadow(0 4px 8px rgb(0 0 0 / 20%));
            border-radius: 0.75rem;
            padding: 20px;
            box-sizing: border-box;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 40px);
            overflow: hidden;
            scrollbar-width: none;
            -ms-overflow-style: none;

            &::-webkit-scrollbar {
                width: 0;
                height: 0;
                display: none;
            }

            * {
                scrollbar-width: none;
                -ms-overflow-style: none;

                &::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }
            }

            @media (width <= 768px) {
                padding: 12px;
                max-width: calc(100vw - 50px);
            }

            .max-modal-header {
                flex: 1 0 calc(100% - 8px);
                padding-top: 0;
                margin-top: 0;
                margin-bottom: 15px;

                .max-modal-title {
                    flex: 1 0 calc(90% - 8px);
                    padding: 0;
                    margin: 0;
                }

                .max-modal-close-wrapper {
                    flex: 1 0 calc(1% - 8px);
                    max-width: 23px;
                }
            }

            .max-modal-content {
                width: auto;
                position: relative;
                flex: 1 1 0;
                min-height: 0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            &.is-shaking {
                animation: max-modal-shake 0.4s ease-in-out;
            }
        }
    }

    @keyframes max-modal-shake {
        0%,
        100% {
            transform: translate(-50%, -50%) translateX(0);
        }

        20%,
        60% {
            transform: translate(-50%, -50%) translateX(-8px);
        }

        40%,
        80% {
            transform: translate(-50%, -50%) translateX(8px);
        }
    }
</style>
