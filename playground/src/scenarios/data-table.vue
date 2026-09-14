<template>
    <div class="scenario-content" data-scenario="data-table">
        <ScenarioCard
            title="Cenário data-table"
            family="generica"
            description="Demonstração interativa dos componentes do cenário data-table."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para data-table</p>
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
