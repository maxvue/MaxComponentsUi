<template>
    <div class="scenario-content" data-scenario="inputs-specialized">
        <h2>Cenário Inputs Especializados (15 Novos Componentes)</h2>
        <div class="scenario-inner">
            <div class="variants">
                <div class="component-block">
                    <h3>Financiamento e Serviços (Engeapp)</h3>
                    <div class="states-grid">
                        <div class="state-col">
                            <span>MaxInputOccupation ({{ occupation || 'null' }})</span>
                            <MaxInputOccupation v-model="occupation" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputFinancingTerm ({{ financingTerm || 'null' }})</span>
                            <MaxInputFinancingTerm v-model="financingTerm" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputFinancingGracePeriod ({{ gracePeriod || 'null' }})</span>
                            <MaxInputFinancingGracePeriod v-model="gracePeriod" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputServicePricingUnit ({{ pricingUnit || 'null' }})</span>
                            <MaxInputServicePricingUnit v-model="pricingUnit" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputServiceAudience ({{ audience || 'null' }})</span>
                            <MaxInputServiceAudience v-model="audience" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputInverterType ({{ inverterType || 'null' }})</span>
                            <MaxInputInverterType v-model="inverterType" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputMonitoringAuthType ({{ authType || 'null' }})</span>
                            <MaxInputMonitoringAuthType v-model="authType" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputMonitoringCredentialFlow ({{ credentialFlow || 'null' }})</span>
                            <MaxInputMonitoringCredentialFlow v-model="credentialFlow" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputConsumerUnit ({{ consumerUnit || 'null' }})</span>
                            <MaxInputConsumerUnit v-model="consumerUnit" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>Inteligência Artificial & RAG (MaxAiManager)</h3>
                    <div class="states-grid">
                        <div class="state-col">
                            <span>MaxInputAiModelStatus ({{ aiStatus || 'null' }})</span>
                            <MaxInputAiModelStatus v-model="aiStatus" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputAiPriceItemType ({{ priceItemType || 'null' }})</span>
                            <MaxInputAiPriceItemType v-model="priceItemType" filter clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputAiCacheOperation ({{ cacheOperation || 'null' }})</span>
                            <MaxInputAiCacheOperation v-model="cacheOperation" clearable />
                        </div>
                        <div class="state-col">
                            <span>MaxInputRagSourceType ({{ ragSource || 'null' }})</span>
                            <MaxInputRagSourceType v-model="ragSource" clearable />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>Composição Social Media</h3>
                    <div class="states-column">
                        <div class="state-col full">
                            <span>MaxInputColorPalette ({{ palette.length }} cores)</span>
                            <MaxInputColorPalette v-model="palette" />
                        </div>
                        <div class="state-col full">
                            <span>MaxInputScheduleRules ({{ rules.length }} regras)</span>
                            <MaxInputScheduleRules v-model="rules" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import {
        MaxInputAiCacheOperation,
        MaxInputAiModelStatus,
        MaxInputAiPriceItemType,
        MaxInputColorPalette,
        MaxInputConsumerUnit,
        MaxInputFinancingGracePeriod,
        MaxInputFinancingTerm,
        MaxInputInverterType,
        MaxInputMonitoringAuthType,
        MaxInputMonitoringCredentialFlow,
        MaxInputOccupation,
        MaxInputRagSourceType,
        MaxInputScheduleRules,
        MaxInputServiceAudience,
        MaxInputServicePricingUnit
    } from '@maxvue/max-components-ui';
    import type { ColorPaletteItem, ScheduleRule } from '@maxvue/max-components-ui';

    const occupation = ref<string | null>('CLT');
    const financingTerm = ref<number | null>(48);
    const gracePeriod = ref<number | null>(60);
    const pricingUnit = ref<string | null>('kwp');
    const audience = ref<string | null>('final_consumer');
    const inverterType = ref<string | null>('String');
    const authType = ref<string | null>('global_api_keys');
    const credentialFlow = ref<string | null>('direct');
    const consumerUnit = ref<string | null>('1234567-8');
    const aiStatus = ref<string | null>('approved');
    const priceItemType = ref<string | null>('text');
    const cacheOperation = ref<string | null>('read');
    const ragSource = ref<string | null>('document');

    const palette = ref<ColorPaletteItem[]>([
        { color: '#00768e', details: 'Cor primária institucional' },
        { color: '#10b981', details: 'Cor de sucesso' }
    ]);

    const rules = ref<ScheduleRule[]>([
        { type: 'weekly', weekdays: ['monday', 'wednesday', 'friday'], interval_weeks: 1, time: '09:00' }
    ]);
</script>

<style lang="scss" scoped>
    .scenario-content {
        padding: 24px;
    }

    .component-block {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--border-color, #e2e8f0);

        h3 {
            margin-bottom: 16px;
            font-size: 16px;
            color: var(--max-text-primary, #1e293b);
        }
    }

    .states-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
    }

    .states-column {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .state-col {
        display: flex;
        flex-direction: column;
        gap: 6px;

        span {
            font-size: 12px;
            color: var(--max-text-secondary, #64748b);
        }

        &.full {
            width: 100%;
        }
    }
</style>
