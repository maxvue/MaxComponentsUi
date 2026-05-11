<template>
    <div class="max-icon-confirm-dialog" ref="icon_ref" :style="{top: confirm_store.y + 'px', left: confirm_store.x + 'px'}" v-if="confirm_store.show">
        MaxPopover
    </div>
</template>

<script setup lang="ts">
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();
</script>

<style lang="scss">
    .max-icon-confirm-dialog {
        position: fixed;
        min-width: 100px;
        min-height: 100px;
        background-color: var(--background-0);
        z-index: 2;
        border: 1px solid var(--surface-border);
        box-shadow: 0 1px 6px 3px var(--primary-500);
        border-radius: 0.75rem;
        padding: 5px 15px;
    }
</style>
