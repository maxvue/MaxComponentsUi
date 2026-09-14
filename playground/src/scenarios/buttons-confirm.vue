<template>
    <div class="scenario-content" data-scenario="buttons-confirm">
        <ScenarioCard
            title="Cenário buttons-confirm"
            family="generica"
            description="Demonstração interativa dos componentes do cenário buttons-confirm."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para buttons-confirm</p>
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
