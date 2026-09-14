<template>
    <div class="scenario-content" data-scenario="trans-motion">
        <ScenarioCard
            title="Cenário trans-motion"
            family="generica"
            description="Demonstração interativa dos componentes do cenário trans-motion."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para trans-motion</p>
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
