<template>
    <div class="max-query-state" :class="`max-query-state--${props.state}`">
        <template v-if="props.state === 'loading'">
            <slot name="loading">
                <div class="max-query-state__loading" role="status" aria-live="polite" aria-busy="true">
                    <MaxLoader :label="props.message ?? props.title ?? 'Carregando dados...'" />
                </div>
            </slot>
        </template>
        <template v-else-if="props.state === 'ready-empty'">
            <slot name="empty">
                <div class="max-query-state__empty">
                    <MaxEmptyDiv :label="props.message ?? props.title ?? 'Nenhum registro encontrado'">
                        <template v-if="$slots.actions" #actions>
                            <slot name="actions" />
                        </template>
                    </MaxEmptyDiv>
                </div>
            </slot>
        </template>
        <template v-else-if="props.state === 'error'">
            <slot name="error">
                <div class="max-query-state__error">
                    <MaxAlert severity="danger" :title="props.title ?? 'Erro ao carregar dados'" :message="props.message ?? 'Não foi possível carregar as informações solicitadas.'">
                        <template v-if="props.retryable || $slots.actions" #actions>
                            <slot name="actions" />
                            <MaxButton v-if="props.retryable" size="small" severity="danger" :disabled="props.retrying" :loading="props.retrying" label="Tentar novamente" icon="lucide:refresh-cw" @click="emit('retry')" />
                        </template>
                    </MaxAlert>
                </div>
            </slot>
        </template>
        <template v-else-if="props.state === 'ready-with-data'">
            <slot />
        </template>
        <template v-else-if="props.state === 'stale'">
            <div class="max-query-state__stale-wrapper">
                <slot name="stale">
                    <div class="max-query-state__stale-banner">
                        <MaxAlert severity="warning" :title="props.title ?? 'Dados em cache'" :message="props.message ?? 'As informações exibidas podem estar desatualizadas.'">
                            <template v-if="props.retryable || $slots.actions" #actions>
                                <slot name="actions" />
                                <MaxButton v-if="props.retryable" size="small" severity="warning" :disabled="props.retrying" :loading="props.retrying" label="Recarregar" icon="lucide:refresh-cw" @click="emit('retry')" />
                            </template>
                        </MaxAlert>
                    </div>
                </slot>
                <div class="max-query-state__stale-content">
                    <slot />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
    import MaxLoader from './MaxLoader.vue';
    import MaxEmptyDiv from './MaxEmptyDiv.vue';
    import MaxAlert from './MaxAlert.vue';
    import MaxButton from './MaxButton.vue';
    import type { MaxQueryStateProps } from '../types/feedback';

    const props = withDefaults(defineProps<MaxQueryStateProps>(), {
        title: undefined,
        message: undefined,
        retryable: false,
        retrying: false
    });

    const emit = defineEmits<{
        retry: [];
    }>();
</script>

<style lang="scss" scoped>
.max-query-state {
    width: 100%;
    min-height: 48px;
    position: relative;
    font-family: Quicksand, sans-serif;

    &__loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 180px;
        padding: 24px;
    }

    &__empty {
        min-height: 180px;
        padding: 16px;
    }

    &__error {
        padding: 16px 0;
    }

    &__stale-wrapper {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
    }

    &__stale-banner {
        width: 100%;
    }

    &__stale-content {
        width: 100%;
    }
}
</style>
