<template>
    <div
        v-if="should_render"
        v-show="is_active"
        class="max-tab-panel"
        role="tabpanel"
        :id="`${context.id_prefix}-panel-${value}`"
        :aria-labelledby="`${context.id_prefix}-tab-${value}`"
    >
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
    import { injectTabsContext } from '../helpers/tabsContext';
    import { computed, ref, watch } from 'vue';

    const props = defineProps<{
        /** Identificador do painel, casado com o MaxTab de mesmo value. */
        value: string;
    }>();

    const context = injectTabsContext('MaxTabPanel');

    const is_active = computed(() => context.effective_active_value.value === props.value);

    /**
     * No modo lazy o painel so entra no DOM na primeira ativacao; depois disso
     * permanece montado e apenas alterna a visibilidade, preservando o estado
     * interno dos componentes filhos.
     */
    const was_active = ref(is_active.value);

    watch(is_active, (value) => {
        if (value) was_active.value = true;
    });

    const should_render = computed(() => ! context.lazy.value || was_active.value);
</script>

<style lang="scss">
    .max-tab-panel {
        width: 100%;
    }
</style>
\