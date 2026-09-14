<template>
    <div class="scenario-content" data-scenario="inputs-special">
        <ScenarioCard
            title="Cenário inputs-special"
            family="generica"
            description="Demonstração interativa dos componentes do cenário inputs-special."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para inputs-special</p>
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
