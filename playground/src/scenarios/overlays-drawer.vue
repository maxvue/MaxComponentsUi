<template>
    <div class="scenario-content" data-scenario="overlays-drawer">
        <ScenarioCard
            title="Cenário overlays-drawer"
            family="generica"
            description="Demonstração interativa dos componentes do cenário overlays-drawer."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para overlays-drawer</p>
            </div>
        </ScenarioCard>
    </div>
</template>

<script setup lang="ts">
    import ScenarioCard from '../components/ScenarioCard.vue';
</script>

<style lang="scss" scoped>
    .scenario-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
</style>
