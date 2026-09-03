<template>
    <teleport to="body">
        <transition name="max-drawer-fade" @after-leave="emit('after-hide')">
            <div
                v-if="props.visible"
                class="max-drawer-mask"
                :class="{ 'max-drawer-mask-modal': props.modal }"
                :style="{ zIndex: z_index }"
                @click.self="onMaskClick"
            >
                <slot name="container" :close-callback="close">
                    <div
                        ref="panel_el"
                        class="max-drawer"
                        :class="[`max-drawer-${props.position}`, { 'max-drawer-no-padding': props.noPadding }, $attrs.class]"
                        role="complementary"
                        aria-modal="true"
                        @keydown="trap.onKeydown"
                    >
                        <div v-if="props.header || $slots.header || props.showCloseIcon" class="max-drawer-header">
                            <slot name="header">
                                <span class="max-drawer-title">{{ props.header }}</span>
                            </slot>
                            <!--
                                `v-bind="close_button_attrs"` fica depois de `type`/`aria-label` para que o
                                consumidor possa sobrescrever ambos (ex.: customizar o aria-label). A
                                `class` e tratada a parte para que `max-drawer-close` nunca seja perdida:
                                a classe do consumidor e mesclada, nao substitui a nossa. `close_button_attrs`
                                ja remove as chaves severity/text/rounded do default (props de <Button> do
                                PrimeVue, sem efeito num <button> nativo) antes do v-bind.
                            -->
                            <button
                                v-if="props.showCloseIcon"
                                type="button"
                                aria-label="Fechar"
                                v-bind="close_button_attrs"
                                :class="['max-drawer-close', props.closeButtonProps?.class]"
                                @click="close"
                            >
                                <slot name="closeicon">
                                    <MaxIcon :i="props.closeIcon ?? 'iconoir:xmark'" size="1.3" />
                                </slot>
                            </button>
                        </div>
                        <div class="max-drawer-content">
                            <slot></slot>
                        </div>
                        <div v-if="$slots.footer" class="max-drawer-footer">
                            <slot name="footer"></slot>
                        </div>
                    </div>
                </slot>
            </div>
        </transition>
    </teleport>
</template>

<script setup lang="ts">
    import { useFocusTrap } from '../helpers/useFocusTrap';
    import { useScrollLock } from '../helpers/useScrollLock';
    import { computed, watch, onBeforeUnmount, useTemplateRef } from 'vue';
    import MaxIcon from './MaxIcon.vue';

    defineOptions({
        inheritAttrs: false
    });

    const props = withDefaults(defineProps<{
        /** Controla a visibilidade. Funciona com v-model:visible ou como prop controlada. */
        visible?: boolean;
        /** Borda a partir da qual o painel desliza. */
        position?: 'left' | 'right' | 'top' | 'bottom' | 'full';
        /** Texto do cabecalho. */
        header?: string | null;
        /** Permite fechar clicando na mascara (fora do painel). Independente de closeOnEscape. */
        dismissable?: boolean;
        /** Permite fechar com a tecla Escape. Independente de dismissable. */
        closeOnEscape?: boolean;
        /** Exibe o botao de fechar no cabecalho. */
        showCloseIcon?: boolean;
        /** Exibe a mascara escura atras do painel. */
        modal?: boolean;
        /** Trava o scroll do body enquanto aberto. */
        blockScroll?: boolean;
        /** Nome do icone do botao de fechar. */
        closeIcon?: string;
        /** Atributos extras aplicados ao botao de fechar (ex.: title, data-testid). */
        closeButtonProps?: Record<string, unknown>;
        /** z-index base somado ao incremento automatico. */
        baseZIndex?: number;
        /** Calcula o z-index automaticamente a partir do baseZIndex. */
        autoZIndex?: boolean;
        /** Desativa o padding padrão (1rem) de .max-drawer-content. */
        noPadding?: boolean;
    }>(), {
        visible: false,
        position: 'left',
        header: null,
        dismissable: true,
        closeOnEscape: true,
        showCloseIcon: true,
        modal: true,
        blockScroll: false,
        closeIcon: undefined,
        closeButtonProps: () => ({ severity: 'secondary', text: true, rounded: true }),
        baseZIndex: 0,
        autoZIndex: true,
        noPadding: false
    });

    const emit = defineEmits<{
        'update:visible': [visible: boolean];
        'show': [];
        'hide': [];
        'after-hide': [];
    }>();

    const panel_el = useTemplateRef<HTMLElement>('panel_el');

    const trap = useFocusTrap(panel_el);

    const scroll_lock = useScrollLock();

    const is_show = computed(() => props.visible);

    /**
     * As chaves do default de closeButtonProps (severity/text/rounded) sao
     * props do componente <Button> do PrimeVue — nosso botao de fechar e um
     * <button> nativo, entao repassa-las via v-bind poluiria o DOM com
     * atributos HTML invalidos e sem efeito visual. Removemos essas tres
     * chaves antes do v-bind; qualquer outra chave em closeButtonProps (ex.:
     * title, data-testid) continua repassada normalmente. `class` tambem e
     * removida daqui porque ja e tratada a parte no `:class` do template
     * (mesclada com `max-drawer-close`) — mante-la em close_button_attrs
     * faria o v-bind aplicar a mesma classe do consumidor duas vezes.
     */
    const close_button_attrs = computed(() => {
        const props_to_strip = ['severity', 'text', 'rounded', 'class'];
        return Object.fromEntries(Object.entries(props.closeButtonProps ?? {}).filter(([key]) => ! props_to_strip.includes(key)));
    });

    /** Fica acima do MaxModal (z-index 59) quando autoZIndex esta ligado. */
    const z_index = computed(() => (props.autoZIndex ? props.baseZIndex + 60 : props.baseZIndex));

    /**
     * O componente nunca muta o proprio estado: apenas emite a intencao e
     * deixa o consumidor decidir, o que faz v-model:visible e :visible
     * controlado funcionarem igualmente.
     */
    const close = () => emit('update:visible', false);

    const open = () => emit('update:visible', true);

    const toggle = () => emit('update:visible', ! props.visible);

    const onMaskClick = () => {
        if (props.dismissable) close();
    };

    const onEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && props.closeOnEscape) close();
    };

    /**
     * Evita disparar `hide` no mount quando o drawer ja comeca fechado: o
     * watch com immediate roda antes de qualquer abertura real ter
     * acontecido, entao so reagimos a partir da segunda execucao (ou quando
     * o valor inicial ja e true, caso em que "abrir" e o comportamento
     * esperado no mount).
     */
    let is_first_run = true;

    /**
     * Rastreia se ESTA instancia foi quem aplicou o lock de scroll, em vez
     * de reconsultar `props.blockScroll` no fechamento. Isso evita destravar
     * o scroll para sempre quando o consumidor alterna `blockScroll` para
     * false enquanto o drawer segue aberto: sem essa flag, o guard
     * `if (props.blockScroll)` no fechamento veria `false` e nunca chamaria
     * `scroll_lock.unlock()`, deixando o contador compartilhado positivo
     * indefinidamente.
     */
    let has_scroll_lock = false;

    watch(() => props.visible, (value) => {

        const first_run = is_first_run;
        is_first_run = false;

        if (value) {
            emit('show');
            trap.activate();
            document.addEventListener('keydown', onEscape);
            if (props.blockScroll) {
                scroll_lock.lock();
                has_scroll_lock = true;
            }
            return;
        }

        if (! first_run) emit('hide');
        trap.deactivate();
        document.removeEventListener('keydown', onEscape);
        if (has_scroll_lock) {
            scroll_lock.unlock();
            has_scroll_lock = false;
        }

    }, { immediate: true });

    onBeforeUnmount(() => {
        document.removeEventListener('keydown', onEscape);
        if (has_scroll_lock) {
            scroll_lock.unlock();
            has_scroll_lock = false;
        }
    });

    defineExpose({ open, close, toggle, is_show });
</script>

<style lang="scss">
    .max-drawer-mask {
        position: fixed;
        inset: 0;
        display: flex;

        &.max-drawer-mask-modal {
            background-color: rgb(0 0 0 / 40%);
        }

        .max-drawer {
            background-color: var(--background-0);
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 16px rgb(0 0 0 / 20%);
            transition: transform 0.3s ease;

            &.max-drawer-left {
                width: 20rem;
                height: 100%;
                margin-right: auto;
            }

            &.max-drawer-right {
                width: 20rem;
                height: 100%;
                margin-left: auto;
            }

            &.max-drawer-top {
                width: 100%;
                height: 10rem;
                margin-bottom: auto;
            }

            &.max-drawer-bottom {
                width: 100%;
                height: 10rem;
                margin-top: auto;
            }

            &.max-drawer-full {
                width: 100%;
                height: 100%;
            }

            .max-drawer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 0.5rem;
                padding: 1rem;
                border-bottom: 1px solid var(--background-300);

                .max-drawer-title {
                    font-weight: 600;
                }

                .max-drawer-close {
                    background: none;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    color: inherit;
                }
            }

            .max-drawer-content {
                flex: 1;
                overflow: auto;
                padding: 1rem;
            }

            &.max-drawer-no-padding {
                .max-drawer-content {
                    padding: 0 !important;
                }
            }

            .max-drawer-footer {
                padding: 1rem;
                border-top: 1px solid var(--background-300);
            }
        }
    }

    .max-drawer-fade-enter-active,
    .max-drawer-fade-leave-active {
        transition: opacity 0.3s ease;
    }

    .max-drawer-fade-enter-from,
    .max-drawer-fade-leave-to {
        opacity: 0;
    }

    @media (prefers-reduced-motion: reduce) {
        .max-drawer-mask .max-drawer,
        .max-drawer-fade-enter-active,
        .max-drawer-fade-leave-active {
            transition: none;
        }
    }
</style>
