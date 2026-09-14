<template>
    <div class="scenario-content" data-scenario="nav-side">
        <ScenarioCard
            title="Cenário nav-side"
            family="generica"
            description="Demonstração interativa dos componentes do cenário nav-side."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para nav-side</p>
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
