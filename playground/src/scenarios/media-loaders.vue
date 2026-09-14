<template>
    <div class="scenario-content" data-scenario="media-loaders">
        <ScenarioCard
            title="Cenário media-loaders"
            family="generica"
            description="Demonstração interativa dos componentes do cenário media-loaders."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para media-loaders</p>
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
