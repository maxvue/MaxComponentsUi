<template>
    <div class="scenario-content" data-scenario="nav-side">
        <h2>Navegação lateral</h2>
        <div class="desktop-menu">
            <MaxSideMenu screen="desktop" :items="menuItems" logo-alt="MaxComponentsUi" />
        </div>
        <MaxMenuVerticalItem :items="menuItems" />
        <MaxSideMenuMobile :items="menuItems" show-theme-toggle />
    </div>
</template>

<script setup lang="ts">
    import { MaxMenuVerticalItem, MaxSideMenu, MaxSideMenuMobile } from '@maxvue/max-components-ui';

    const menuItems = [
        {
            id: 'playground-home',
            route: '/',
            label: 'Início',
            icon: 'iconoir:home',
            details: { route: '/', label: 'Início', tooltip: 'Início', icon: 'iconoir:home' }
        },
        {
            id: 'playground-projects',
            route: '/projects',
            label: 'Projetos',
            icon: 'material-symbols:solar-power-rounded',
            details: { route: '/projects', label: 'Projetos', tooltip: 'Projetos', icon: 'material-symbols:solar-power-rounded' },
            subitems: [
                { id: 'sub-proposals', label: 'Propostas', route: '/proposals', icon: 'material-symbols:description-outline' },
                { id: 'sub-contracts', label: 'Contratos', route: '/contracts', icon: 'material-symbols:edit-document-outline-rounded' },
                { id: 'sub-inspections', label: 'Vistorias', route: '/inspections', icon: 'material-symbols:fact-check-outline-rounded' }
            ]
        }
    ];
</script>

<style lang="scss" scoped>
    .scenario-content { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
    .desktop-menu { height: 16rem; overflow: visible; }
</style>
