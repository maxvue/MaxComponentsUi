<template>
    <div class="max-grid">
        <div class="label-grid" v-if="props.label" :class="props.labelCenter ? 'label-center' : ''">{{ props.label }}</div>
        <GridSlotRows :isMobile="isMobile"><slot></slot></GridSlotRows>
    </div>
</template>

<script setup lang="ts">
    import { useMediaQuery } from '@maxvue/max-use';
    import { GridSlotRows } from './base/gridSlotRows';

    /**
     * Sistema de grid flexível para organizar componentes.
     * Utiliza flexbox com wrap e gap padronizado, organizando linhas
     * explícitas sob demanda através de marcadores start e end.
     */
    const props = defineProps<{
        label?: string | null;
        labelCenter?: boolean;
    }>();

    const isMobile = useMediaQuery('(max-width: 767.98px)');
</script>

<style lang="scss" scoped>
.max-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 13px 8px;
    padding-top: 14px;
    position: relative;

    > :deep(.max-grid-row),
    > .max-grid-row {
        display: flex;
        flex-wrap: wrap;
        flex: 0 0 100%;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        box-sizing: border-box;
        padding: 0;
        margin: 0;
        border: none;
        gap: inherit;
        align-items: inherit;
        justify-content: inherit;
    }

    /* Quando o grid recebe a flag no-message, força o colapso da linha de
       mensagem em todos os inputs internos (MaxInput*). */
    &[no-message],
    &[no-messages] {
        :deep(.max-input-main-div) {
            grid-template-rows: 1fr;

            .message-spacer {
                display: none !important;
            }
        }
    }

    .label-grid {
        position: absolute;
        top: -10px;
        left: 20px;
        background-color: var(--background-0);
        padding: 0 10px;
        font-size: 0.8rem;
        color: var(--background-750);

        &.label-center {
            transform: translateX(-50%) !important;
            left: calc(50%) !important;
        }
    }
}
</style>

