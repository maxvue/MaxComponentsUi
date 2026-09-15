<template>
    <div class="scenario-content" data-scenario="panels-tabs">
        <h2>Tabs</h2>
        <p>Lista, abas e painéis compartilham o mesmo contexto de <code>MaxTabs</code>.</p>
        <MaxTabs v-model:value="activeTab" id="playground-tabs" scrollable>
            <MaxTabList>
                <MaxTab value="overview">Visão geral</MaxTab>
                <MaxTab value="activity">Atividade</MaxTab>
                <MaxTab value="disabled" disabled>Indisponível</MaxTab>
            </MaxTabList>
            <MaxTabPanels>
                <MaxTabPanel value="overview">Resumo do conteúdo selecionado.</MaxTabPanel>
                <MaxTabPanel value="activity">Histórico de atividade.</MaxTabPanel>
                <MaxTabPanel value="disabled">Painel indisponível.</MaxTabPanel>
            </MaxTabPanels>
        </MaxTabs>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxTab, MaxTabList, MaxTabPanel, MaxTabPanels, MaxTabs } from '@maxvue/max-components-ui';

    const activeTab = ref<string | number>('overview');
</script>

<style lang="scss" scoped>
    .scenario-content { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
</style>
