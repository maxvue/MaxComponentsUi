<template>
    <div class="scenario-content" data-scenario="nav-toolbars">
        <ScenarioCard
            title="Cenário nav-toolbars"
            family="generica"
            description="Demonstração interativa dos componentes do cenário nav-toolbars."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para nav-toolbars</p>
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
