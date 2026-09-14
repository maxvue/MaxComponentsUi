<template>
    <div class="scenario-content" data-scenario="panels-tabs">
        <ScenarioCard
            title="Cenário panels-tabs"
            family="generica"
            description="Demonstração interativa dos componentes do cenário panels-tabs."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para panels-tabs</p>
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
