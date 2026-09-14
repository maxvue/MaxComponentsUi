<template>
    <div class="scenario-content" data-scenario="layout-grid">
        <ScenarioCard
            title="Cenário layout-grid"
            family="generica"
            description="Demonstração interativa dos componentes do cenário layout-grid."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para layout-grid</p>
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
