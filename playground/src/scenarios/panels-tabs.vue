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

        <h2 style="margin-top: 2rem;">Steps (Wizard)</h2>
        <p>Assistente linear com status por etapa (Concluído, Erro, Pendência) e indicador do passo ativo.</p>
        <MaxSteps v-model:value="activeStep" id="playground-steps" showBorder :cached="false">
            <MaxStepItem value="step-1" title="Dados Pessoais" status="concluido" icon="ph:user">
                <div class="step-card-content">
                    <h3>Etapa 1: Dados Pessoais</h3>
                    <p>Status: <strong>Concluído</strong> (borda e ícone verdes, badge de confirmação).</p>
                </div>
            </MaxStepItem>

            <MaxStepItem value="step-2" title="Endereço" status="erro" icon="ph:map-pin">
                <div class="step-card-content">
                    <h3>Etapa 2: Endereço</h3>
                    <p>Status: <strong>Erro</strong> (borda e ícone vermelhos, badge de exclamação).</p>
                </div>
            </MaxStepItem>

            <MaxStepItem value="step-3" title="Documentos" status="pendencia" icon="ph:file-text">
                <div class="step-card-content">
                    <h3>Etapa 3: Documentos</h3>
                    <p>Status: <strong>Pendência</strong> (borda e ícone amarelos, badge de interrogação).</p>
                </div>
            </MaxStepItem>

            <MaxStepItem value="step-4" title="Confirmação" icon="ph:check-circle">
                <div class="step-card-content">
                    <h3>Etapa 4: Confirmação e Envio</h3>
                    <p>Etapa neutra aguardando finalização.</p>
                </div>
            </MaxStepItem>
        </MaxSteps>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import {
        MaxTab,
        MaxTabList,
        MaxTabPanel,
        MaxTabPanels,
        MaxTabs,
        MaxSteps,
        MaxStepItem
    } from '@maxvue/max-components-ui';

    const activeTab = ref<string | number>('overview');
    const activeStep = ref<string | number>('step-3');
</script>

<style lang="scss" scoped>
    .scenario-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .step-card-content {
        padding: 1.5rem;
        background-color: var(--background-50, #f8fafc);
        border: 1px dashed var(--background-200, #e2e8f0);
        border-radius: 8px;

        h3 {
            margin: 0 0 0.5rem;
            color: var(--background-800, #1e293b);
        }

        p {
            margin: 0;
            color: var(--background-600, #64748b);
        }
    }
</style>

