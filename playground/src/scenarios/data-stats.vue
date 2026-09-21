<template>
    <div class="scenario-content" data-scenario="data-stats">
        <h2>Cenário data-stats</h2>
        <div class="scenario-inner">
            <div class="variants">
                <div class="component-block">
                    <h3>MaxStats com Prefix e Suffix (Cards)</h3>
                    <div class="states">
                        <div class="state-col w-full">
                            <span>Indicadores Financeiros e Metas (Cards)</span>
                            <MaxStats :items="statsItems" layout="cards" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxStats no modo Pílulas (Mobile / Compacto)</h3>
                    <div class="states">
                        <div class="state-col w-full">
                            <span>Pílulas com Prefix e Suffix</span>
                            <MaxStats :items="statsItems" layout="pills" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxStats com Slots Customizados (#prefix e #suffix)</h3>
                    <div class="states">
                        <div class="state-col w-full">
                            <span>Slots com Ícones e Badges</span>
                            <MaxStats :items="customSlotItems" layout="cards">
                                <template #prefix="{ item }">
                                    <span class="custom-slot-prefix">[{{ item.prefix }}]</span>
                                </template>
                                <template #suffix="{ item }">
                                    <span class="custom-slot-suffix">{{ item.suffix }}*</span>
                                </template>
                            </MaxStats>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { MaxStats, type MaxStatsItem } from '@maxvue/max-components-ui';

    const statsItems: MaxStatsItem[] = [
        {
            label: 'Faturamento Mensal',
            value: '450',
            prefix: 'R$',
            suffix: 'mil',
            sublabel: 'Meta atingida em 108%',
            icon: 'mdi:cash-multiple',
            color: '#10b981'
        },
        {
            label: 'Taxa de Conversão',
            value: 24.8,
            sufix: '%',
            sublabel: '+3.2% vs mês anterior',
            icon: 'mdi:chart-line-variant',
            color: '#0ea5e9'
        },
        {
            label: 'Novos Assinantes',
            value: '1.240',
            prefix: '+',
            suffix: 'un',
            sublabel: 'Últimos 30 dias',
            icon: 'mdi:account-group',
            color: '#8b5cf6'
        }
    ];

    const customSlotItems: MaxStatsItem[] = [
        {
            label: 'Temperatura Sala',
            value: 23.5,
            prefix: 'IN',
            suffix: '°C',
            sublabel: 'Climatização ativa',
            icon: 'mdi:thermometer',
            color: '#f59e0b'
        }
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
        width: 100%;

        span {
            font-size: 0.8rem;
            color: #666;
        }
    }

    .custom-slot-prefix,
    .custom-slot-suffix {
        font-size: 0.8rem;
        font-weight: 700;
        opacity: 0.8;
    }
</style>
