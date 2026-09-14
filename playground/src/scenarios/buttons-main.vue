<template>
    <div class="scenario-content" data-scenario="buttons-main">
        <ScenarioCard
            title="Cenário buttons-main"
            family="generica"
            description="Demonstração interativa dos componentes do cenário buttons-main."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para buttons-main</p>
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
