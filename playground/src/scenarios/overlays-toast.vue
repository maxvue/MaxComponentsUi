<template>
    <div class="scenario-content" data-scenario="overlays-toast">
        <ScenarioCard
            title="Cenário overlays-toast"
            family="generica"
            description="Demonstração interativa dos componentes do cenário overlays-toast."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para overlays-toast</p>
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
