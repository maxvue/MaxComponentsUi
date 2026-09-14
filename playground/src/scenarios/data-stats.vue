<template>
    <div class="scenario-content" data-scenario="data-stats">
        <ScenarioCard
            title="Cenário data-stats"
            family="generica"
            description="Demonstração interativa dos componentes do cenário data-stats."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para data-stats</p>
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
