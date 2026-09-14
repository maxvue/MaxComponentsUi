<template>
    <div class="scenario-content" data-scenario="media-icons">
        <ScenarioCard
            title="Cenário media-icons"
            family="generica"
            description="Demonstração interativa dos componentes do cenário media-icons."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para media-icons</p>
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
