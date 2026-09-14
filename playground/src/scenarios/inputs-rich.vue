<template>
    <div class="scenario-content" data-scenario="inputs-rich">
        <ScenarioCard
            title="Cenário inputs-rich"
            family="generica"
            description="Demonstração interativa dos componentes do cenário inputs-rich."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para inputs-rich</p>
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
