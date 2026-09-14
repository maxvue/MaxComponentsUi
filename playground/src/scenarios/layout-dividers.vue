<template>
    <div class="scenario-content" data-scenario="layout-dividers">
        <ScenarioCard
            title="Cenário layout-dividers"
            family="generica"
            description="Demonstração interativa dos componentes do cenário layout-dividers."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para layout-dividers</p>
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
