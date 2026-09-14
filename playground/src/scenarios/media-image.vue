<template>
    <div class="scenario-content" data-scenario="media-image">
        <ScenarioCard
            title="Cenário media-image"
            family="generica"
            description="Demonstração interativa dos componentes do cenário media-image."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para media-image</p>
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
