<template>
    <div class="scenario-content" data-scenario="inputs-coords">
        <ScenarioCard
            title="Cenário inputs-coords"
            family="generica"
            description="Demonstração interativa dos componentes do cenário inputs-coords."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para inputs-coords</p>
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
