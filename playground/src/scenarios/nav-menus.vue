<template>
    <div class="scenario-content" data-scenario="nav-menus">
        <ScenarioCard
            title="Cenário nav-menus"
            family="generica"
            description="Demonstração interativa dos componentes do cenário nav-menus."
        >
            <div class="scenario-inner">
                <p>Cenário interativo para nav-menus</p>
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
