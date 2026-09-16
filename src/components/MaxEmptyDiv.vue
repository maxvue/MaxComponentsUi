<template>
    <div
        class="max-empty-div"
        :class="{ 'is-transparent': props.transparent, 'is-nospace': props.nospace }"
        :transparent="props.transparent ? '' : undefined"
        :nospace="props.nospace ? '' : undefined"
    >
        <div class="inner">
            <slot>
                <slot name="icon">
                    <MaxIcon :icon="String(props.icon ?? props.i ?? 'ph:empty')" :size="Number(props.iconSize ?? 2)" />
                </slot>
                <slot name="label">
                    <div v-html="sanitizedLabel" class="label" />
                </slot>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { sanitizeHtml } from '../helpers/sanitizeHtml';

    export interface MaxEmptyDivProps {
        /** Mensagem textual ou HTML sanitizado exibido como rótulo */
        label?: string;
        /** Identificador do ícone (Iconify) */
        icon?: string;
        /** Alias para icon */
        i?: string;
        /** Tamanho do ícone */
        iconSize?: number | string;
        /** Renderiza fundo transparente e sem borda */
        transparent?: boolean;
        /** Posiciona o container com posicionamento absoluto no topo */
        nospace?: boolean;
    }

    const props = withDefaults(defineProps<MaxEmptyDivProps>(), {
        label: 'Sem Registros',
        iconSize: 2,
        transparent: false,
        nospace: false
    });

    const sanitizedLabel = computed(() => sanitizeHtml(String(props.label ?? 'Sem Registros')));
</script>

<style scoped lang="scss">
    .max-empty-div {
        background-color: var(--background-100);
        width: 100%;
        height: 100%;
        border-radius: 0.7rem;
        display: grid;
        place-items: center;
        color: var(--background-650);
        border: 1px solid var(--background-200);

        &[transparent],
        &.is-transparent {
            background-color: transparent !important;
            border: none !important;
        }

        &[nospace],
        &.is-nospace {
            position: absolute;
            top: 0;
            left: 0;
        }

        .inner {
            display: grid;
            place-items: center;
            text-align: center;
            gap: 10px;

            .icon-div {
                position: relative;
                color: var(--background-650);
            }
        }
    }
</style>
