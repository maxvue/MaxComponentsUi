<template>
    <div class="scenario-content" data-scenario="inputs-files">
        <ScenarioCard
            title="Cenário inputs-files"
            family="generica"
            description="Demonstração interativa dos componentes do cenário inputs-files."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para inputs-files</p>
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
