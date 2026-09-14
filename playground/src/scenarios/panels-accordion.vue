<template>
    <div class="scenario-content" data-scenario="panels-accordion">
        <ScenarioCard
            title="Cenário panels-accordion"
            family="generica"
            description="Demonstração interativa dos componentes do cenário panels-accordion."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para panels-accordion</p>
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
