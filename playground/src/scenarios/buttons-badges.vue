<template>
    <div class="scenario-content" data-scenario="buttons-badges">
        <h2>Cenário buttons-badges</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxBadgeButton</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxBadgeButton label="Ativo" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxBadgeButton label="Desabilitado" disabled />
                        </div>
                        <!-- Neon -->
                        <div class="state-col">
                            <span>Neon</span>
                            <MaxBadgeButton label="Neon" neon />
                        </div>
                        <!-- Múltiplos Overlays com Cores -->
                        <div class="state-col">
                            <span>Múltiplos Overlays</span>
                            <MaxBadgeButton label="Filtros" :overlay="coloredOverlays" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxBadgeButtonsGroup</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxBadgeButtonsGroup v-model="selectedBadges" :items="badgeItems" />
                        </div>
                        <!-- Sem itens -->
                        <div class="state-col">
                            <span>Vazio</span>
                            <MaxBadgeButtonsGroup :items="[]" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxBadge</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxBadge label="Ativo" />
                        </div>
                        <!-- Neon -->
                        <div class="state-col">
                            <span>Neon</span>
                            <MaxBadge label="Neon" neon />
                        </div>
                        <!-- Com status -->
                        <div class="state-col">
                            <span>Com status</span>
                            <MaxBadge label="Online" status="done" />
                        </div>
                        <!-- Múltiplos textos -->
                        <div class="state-col">
                            <span>Múltiplas strings</span>
                            <MaxBadge label="Usuário" :overlay="multiStringOverlay" />
                        </div>
                        <!-- Múltiplos números -->
                        <div class="state-col">
                            <span>Múltiplos números</span>
                            <MaxBadge label="Métricas" :overlay="multiNumberOverlay" />
                        </div>
                        <!-- Cores independentes -->
                        <div class="state-col">
                            <span>Cores independentes</span>
                            <MaxBadge label="Tickets" :overlay="coloredOverlays" />
                        </div>
                        <!-- Status e múltiplos overlays -->
                        <div class="state-col">
                            <span>Status + Overlays</span>
                            <MaxBadge label="Deploy" status="done" :overlay="coloredOverlays" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxBadgeComponent</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxBadgeComponent label="Badge" />
                        </div>
                        <!-- Numérico -->
                        <div class="state-col">
                            <span>Numérico</span>
                            <MaxBadgeComponent :label="42" />
                        </div>
                        <!-- Com ícone -->
                        <div class="state-col">
                            <span>Com ícone</span>
                            <MaxBadgeComponent label="Novo" icon="mdi:star" />
                        </div>
                        <!-- Múltiplos Overlays -->
                        <div class="state-col">
                            <span>Múltiplos Overlays</span>
                            <MaxBadgeComponent label="Wrapper" :overlay="multiStringOverlay" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTag</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTag label="Ativo" />
                        </div>
                        <!-- Neon -->
                        <div class="state-col">
                            <span>Neon</span>
                            <MaxTag label="Neon" neon />
                        </div>
                        <!-- Com ícone -->
                        <div class="state-col">
                            <span>Com ícone</span>
                            <MaxTag label="Verificado" icon="mdi:check-circle" />
                        </div>
                        <!-- Múltiplos Overlays -->
                        <div class="state-col">
                            <span>Múltiplos Overlays</span>
                            <MaxTag label="Versão" severity="info" :overlay="['v1.2', 'LTS']" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxBadgeButton, MaxBadgeButtonsGroup, MaxBadge, MaxBadgeComponent, MaxTag } from '@maxvue/max-components-ui';
    import type { MaxBadgeButtonsGroupItem, OverlayData } from '@maxvue/max-components-ui';

    const selectedBadges = ref<any[]>([]);

    const multiStringOverlay = ['Dev', 'Admin'];
    const multiNumberOverlay = [1, 99];
    const coloredOverlays: OverlayData[] = [
        { value: 'Novo', color: 'var(--max-success-500, #10b981)' },
        { value: 'Bug', color: 'var(--max-danger-500, #ef4444)' }
    ];

    const badgeItems: MaxBadgeButtonsGroupItem[] = [
        { label: 'Opção A', value: 'a', overlay: ['1', 'Novo'] },
        { label: 'Opção B', value: 'b', overlay: coloredOverlays },
        { label: 'Opção C', value: 'c' }
    ];
</script>

<style lang="scss" scoped>
    .scenario-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    .variants {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    .component-block {
        border: 1px solid var(--layout-border, #ccc);
        padding: 1rem;
        border-radius: 8px;
    }
    .states {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        margin-top: 1rem;
    }
    .state-col {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
