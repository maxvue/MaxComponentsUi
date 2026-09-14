<template>
    <div class="scenario-content" data-scenario="inputs-masks">
        <ScenarioCard
            title="Cenário inputs-masks"
            family="generica"
            description="Demonstração interativa dos componentes do cenário inputs-masks."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para inputs-masks</p>
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
