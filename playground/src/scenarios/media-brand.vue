<template>
    <div class="scenario-content" data-scenario="media-brand">
        <ScenarioCard
            title="Cenário media-brand"
            family="generica"
            description="Demonstração interativa dos componentes do cenário media-brand."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para media-brand</p>
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
