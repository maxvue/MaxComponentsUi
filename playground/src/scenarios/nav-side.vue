<template>
    <div class="scenario-content" data-scenario="nav-side">
        <h2>Navegação lateral</h2>
        <div class="desktop-menu">
            <MaxSideMenu screen="desktop" logo-alt="MaxComponentsUi" />
        </div>
        <MaxMenuVerticalItem :items="menuItems" />
        <MaxSideMenuMobile :items="menuItems" show-theme-toggle />
    </div>
</template>

<script setup lang="ts">
    import { MaxMenuVerticalItem, MaxSideMenu, MaxSideMenuMobile } from '@maxvue/max-components-ui';

    const menuItems = [{
        id: 'playground-home',
        route: '/',
        label: 'Início',
        icon: 'iconoir:home',
        details: { route: '/', label: 'Início', tooltip: 'Início', icon: 'iconoir:home' }
    }];
</script>

<style lang="scss" scoped>
    .scenario-content { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
    .desktop-menu { height: 12rem; overflow: hidden; }
</style>
