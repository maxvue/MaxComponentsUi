<template>
    <div class="scenario-content" data-scenario="buttons-badges">
        <ScenarioCard
            title="Cenário buttons-badges"
            family="generica"
            description="Demonstração interativa dos componentes do cenário buttons-badges."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para buttons-badges</p>
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
