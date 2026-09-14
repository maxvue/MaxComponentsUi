<template>
    <div
        v-if="isMounted && isValidTarget && size(props.target.items ?? {}) > 0"
        class="max-load-screen-target"
        :data-target-status="targetStatus"
        :data-target-invalid="isInvalidTarget ? 'true' : undefined"
        :data-target="props.target?.target"
    >
        <Teleport v-if="isValidTarget && resolvedTarget" :to="resolvedTarget as string" :disabled="!isMounted">
            <div
                ref="loadScreenRef"
                v-if="size(props.target.items ?? {}) > 0"
                :class="['load-screen', { 'is-body-target': isBodyTarget, 'is-local-target': !isBodyTarget, 'is-global': isBodyTarget, 'is-local': !isBodyTarget }]"
            >
                <slot>
                    <div class="load-screen-messages">
                        <div
                            v-for="(item, index) in props.target.items"
                            :key="index"
                            class="load-screen-message-item"
                            :class="`status-${item.status}`"
                            :index="index"
                            :role="item.status === 'error' ? 'alert' : 'status'"
                            :aria-live="item.status === 'error' ? 'assertive' : 'polite'"
                            aria-atomic="true"
                        >
                            <DotLottieVue v-if="item.lottie_icon" class="load-screen-lottie" autoplay loop :src="item.lottie_icon" />
                            <MaxIcon v-if="item.icon" :icon="item.icon" :size="item.icon_size ?? 3" class="load-screen-icon" />
                            <MaxLoaderIcon v-if="item.status === 'loading'" class="load-screen-loader" />
                            <MaxDoneIcon v-else-if="item.status === 'done'" i="material-symbols:check-circle-outline-rounded" size="1.5" />
                            <MaxWaitIcon v-else-if="item.status === 'waiting'" i="eos-icons:hourglass" class="load-screen-wait" size="1.5" />
                            <MaxErrorIcon v-else-if="item.status === 'error'" i="mdi:error" size="1.5" />
                            <MaxIcon v-else i="fluent:border-none-24-filled" class="load-screen-default-icon" size="1.5" />
                            <div class="load-screen-text">
                                {{ item.message }}
                            </div>
                            <div v-if="item.status === 'error'" class="load-screen-item-actions">
                                <button
                                    v-if="item.retry"
                                    type="button"
                                    class="load-screen-action-btn action-retry"
                                    @click.stop="loadingStore.retry(item.key)"
                                >
                                    Tentar novamente
                                </button>
                                <button
                                    type="button"
                                    class="load-screen-action-btn action-dismiss"
                                    @click.stop="loadingStore.dismiss(item.key)"
                                >
                                    Dispensar
                                </button>
                            </div>
                        </div>
                    </div>
                </slot>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, defineAsyncComponent } from 'vue';
    import { size } from '@maxvue/max-use';
    import MaxIcon from './MaxIcon.vue';
    import MaxDoneIcon from './MaxDoneIcon.vue';
    import MaxWaitIcon from './MaxWaitIcon.vue';
    import MaxErrorIcon from './MaxErrorIcon.vue';
    import MaxLoaderIcon from './MaxLoaderIcon.vue';
    import type { LoadingTarget } from '../types/app';
    import { useLoadingStore } from '../stores/useLoading.Store';

    const loadingStore = useLoadingStore();

    // Async: o dotlottie (~1,2 MB) só é carregado quando um item traz lottie_icon.
    const DotLottieVue = defineAsyncComponent(() => import('@lottiefiles/dotlottie-vue').then((m) => m.DotLottieVue));

    const props = defineProps<{
        /** Alvo de renderização com seus itens de carregamento. */
        target: LoadingTarget;
    }>();

    const isMounted = ref(false);
    const loadScreenRef = ref<HTMLElement | null>(null);

    const isBodyTarget = computed(() => {
        const raw = props.target?.target;
        return !raw || raw === 'body';
    });

    /**
     * Resolve o seletor de destino de forma estrita.
     * Alvos locais inexistentes NÃO fazem fallback silencioso para 'body'.
     */
    const resolvedTarget = computed<string | null>(() => {
        const raw = props.target?.target;
        if (!raw || raw === 'body') return 'body';

        if (typeof document !== 'undefined') try {
            const el = document.querySelector(raw);
            if (el) return raw;
        } catch {
            // Sintaxe de seletor inválida
        }

        return null;
    });

    const isValidTarget = computed(() => resolvedTarget.value !== null);
    const isInvalidTarget = computed(() => !isValidTarget.value);

    const targetStatus = computed<'global' | 'local' | 'invalid'>(() => {
        if (!isValidTarget.value) return 'invalid';
        return isBodyTarget.value ? 'global' : 'local';
    });

    watch([() => props.target?.target, isMounted], ([targetVal, mountedVal]) => {
        if (mountedVal && targetVal && targetVal !== 'body') if (typeof document !== 'undefined') try {
            const el = document.querySelector(targetVal);
            if (!el) console.warn(`[MaxLoadScreenTarget] Alvo inválido ou inexistente "${targetVal}". Bloqueio global não foi acionado.`);
        } catch {
            console.warn(`[MaxLoadScreenTarget] Seletor inválido "${targetVal}". Bloqueio global não foi acionado.`);
        }
    }, { immediate: true });

    const hasPending = computed(() => {
        return Object.values(props.target?.items ?? {}).some(
            (item) => item.status === 'loading' || item.status === 'waiting'
        );
    });

    let previousAriaBusy: string | null = null;
    let modifiedTargetEl: HTMLElement | null = null;
    let originalPosition = '';
    const modifiedInertElements = new Map<HTMLElement, boolean>();

    const restoreInert = () => {
        modifiedInertElements.forEach((hadInert, el) => {
            if (!hadInert) {
                el.removeAttribute('inert');
                try {
                    (el as any).inert = false;
                } catch {}
            }
        });
        modifiedInertElements.clear();
    };

    const applyInert = (containerEl: HTMLElement) => {
        restoreInert();
        const overlay = loadScreenRef.value;
        Array.from(containerEl.children).forEach((child) => {
            const el = child as HTMLElement;
            if (el === overlay || (overlay && el.contains(overlay))) return;
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
            if (!modifiedInertElements.has(el)) {
                const hadInert = el.hasAttribute('inert');
                modifiedInertElements.set(el, hadInert);
                if (!hadInert) {
                    el.setAttribute('inert', '');
                    try {
                        (el as any).inert = true;
                    } catch {}
                }
            }
        });
    };

    const cleanupTargetAttributes = () => {
        restoreInert();
        if (!modifiedTargetEl) return;
        if (previousAriaBusy !== null) modifiedTargetEl.setAttribute('aria-busy', previousAriaBusy);
        else modifiedTargetEl.removeAttribute('aria-busy');

        if (originalPosition) {
            modifiedTargetEl.style.position = originalPosition;
            originalPosition = '';
        }
        previousAriaBusy = null;
        modifiedTargetEl = null;
    };

    const applyTargetAttributes = async () => {
        if (typeof document === 'undefined') return;
        const targetSelector = resolvedTarget.value;
        if (!targetSelector) {
            cleanupTargetAttributes();
            return;
        }

        const el = targetSelector === 'body'
            ? document.body
            : (document.querySelector(targetSelector) as HTMLElement | null);

        if (!el) {
            cleanupTargetAttributes();
            return;
        }

        if (el !== modifiedTargetEl) {
            cleanupTargetAttributes();
            modifiedTargetEl = el;
            previousAriaBusy = el.getAttribute('aria-busy');
            if (targetSelector !== 'body') {
                const computedPos = window.getComputedStyle(el).position;
                if (computedPos === 'static') {
                    originalPosition = el.style.position;
                    el.style.position = 'relative';
                }
            }
        }

        if (hasPending.value) {
            el.setAttribute('aria-busy', 'true');
            await nextTick();
            applyInert(el);
        } else {
            if (previousAriaBusy !== null) el.setAttribute('aria-busy', previousAriaBusy);
            else el.removeAttribute('aria-busy');
            restoreInert();
        }
    };

    watch([hasPending, resolvedTarget], () => {
        if (isMounted.value) applyTargetAttributes();
    });

    onMounted(() => {
        isMounted.value = true;
        applyTargetAttributes();
    });

    onBeforeUnmount(() => {
        cleanupTargetAttributes();
    });

    defineExpose({
        isMounted,
        isBodyTarget,
        isGlobal: isBodyTarget,
        isValidTarget,
        isInvalidTarget,
        targetStatus,
        resolvedTarget,
        hasPending,
        cleanupTargetAttributes
    });
</script>

<style lang="scss" scoped>
    .load-screen {
        display: grid;
        width: 100%;
        height: 100%;
        backdrop-filter: blur(4px);
        place-items: center;
        z-index: var(--max-layer-screen-block, 10000) !important;

        &.is-body-target,
        &.is-global {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;

            &::after {
                content: '';
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgb(0 0 0 / 10%);
                z-index: 1 !important;
            }
        }

        &.is-local-target,
        &.is-local {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            background-color: rgb(0 0 0 / 5%);
            border-radius: inherit;
            overflow: hidden;
        }

        .load-screen-messages {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: min(90%, 480px);
            max-width: 100%;
            padding: 1rem;
            border: 2px solid rgb(0 0 0 / 10%);
            border-radius: 1rem;
            background-color: rgb(255 255 255 / 85%);
            box-sizing: border-box;
            overflow-wrap: break-word;
            z-index: 2 !important;

            @media (width <= 768px) {
                width: calc(100% - 24px);
                max-width: calc(100vw - 32px);
            }

            .load-screen-message-item {
                display: grid;
                grid-template-columns: 20px 1fr;
                gap: 0.75rem 1rem;
                color: var(--background-700);
                place-items: center start;

                .load-screen-lottie {
                    width: 400px;
                    height: 400px;
                }

                .load-screen-icon {
                    color: var(--white-0, #fff);
                }

                .load-screen-loader {
                    width: 24px;
                    height: 24px;
                }

                .load-screen-wait {
                    color: var(--background-0);
                }

                .load-screen-default-icon {
                    color: var(--green-300);
                }

                .load-screen-text {
                    font-size: 0.875rem;
                    line-height: 1.35;
                    overflow-wrap: break-word;
                }

                .load-screen-item-actions {
                    grid-column: 2;
                    display: flex;
                    gap: 8px;
                    margin-top: 4px;

                    .load-screen-action-btn {
                        font-size: 0.75rem;
                        padding: 2px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        border: 1px solid var(--surface-border, #cbd5e1);
                        background: var(--background-0, #fff);
                        color: var(--background-700, #334155);
                        transition: background-color 0.15s ease;

                        &:hover {
                            background: var(--background-100, #f1f5f9);
                        }

                        &.action-retry {
                            border-color: var(--max-primary-500, #00768e);
                            color: var(--max-primary-500, #00768e);
                        }
                    }
                }
            }
        }
    }

    .max-load-screen-target {
        width: 100%;
        height: 100%;
    }
</style>
