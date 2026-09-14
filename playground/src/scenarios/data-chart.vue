<template>
    <div class="scenario-content" data-scenario="data-chart">
        <ScenarioCard
            title="Cenário data-chart"
            family="generica"
            description="Demonstração interativa dos componentes do cenário data-chart."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para data-chart</p>
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
