<template>
    <div class="max-popover-div" ref="icon_ref" :style="{top: confirm_store.y + 'px', left: confirm_store.x + 'px'}" v-if="confirm_store.show">
        MaxPopover
    </div>
</template>

<script setup lang="ts">
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();
</script>

<style lang="scss">
    .max-popover-div {
        display: fixed;
        z-index:3;
        min-width: 100px;
        min-height: 100px;
        background-color: var(--background-0);
    }
</style>
