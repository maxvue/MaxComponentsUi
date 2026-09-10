# Construtor de Painéis e Dashboards Modulares (Directus Insights & Dashboard Builder)

## 1. Visão Geral no Directus

O módulo **Directus Insights** transforma o Directus Studio em uma plataforma completa de inteligência operacional e Business Intelligence (BI) sem código (*no-code*):

### Como Funciona a Experiência no Directus:
- **Canvas de Grade Interativo (Drag & Drop + Resize):**
  - O usuário organiza seus painéis em uma grade flexível de 12 ou 24 colunas.
  - Os cartões/widgets podem ser arrastados livremente, redimensionados puxando as bordas e reorganizados com reflow automático suave.
- **Catálogo Modular de Painéis (Widget Registry):**
  - **Métricas Chave (KPI Cards):** Valor numérico central, variação percentual comparativa (ex: `+18% vs mês anterior`), ícone temático, formatação monetária ou de potência.
  - **Gráficos de Séries Temporais:** Linhas, barras ou áreas com agrupamento cronológico (diário, semanal, mensal) e filtros dinâmicos de agregação (`COUNT`, `SUM`, `AVG`).
  - **Gráficos Categóricos:** Donut / Pizza para distribuição percentual de status ou categorias.
  - **Listas Rápidas Filtradas:** Exibição compacta de registros recentes que atendem a condições críticas.
  - **Blocos de Alerta / Markdown:** Instruções operacionais, avisos da diretoria e metas da semana.
- **Configurador Visual por Drawer (Panel Settings):**
  - Ao criar ou editar qualquer widget, um Drawer lateral desliza permitindo definir: coleção de origem, agregações numéricas, construtor de filtros condicionais (GUI) e intervalo de atualização automática (*auto-refresh* a cada 30s, 1m, 5m).
- **Gestão Multi-Dashboard por Perfil:**
  - Criação de múltiplos painéis segmentados: "Painel da Engenharia", "SLA Concessionárias", "Diretoria Financeira", "Portal do Integrador".

---

## 2. Situação Atual no Engeapp / MaxComponentsUi

No **Engeapp**, a camada de visualização analítica é estática e engessada:

1. **Telas de Dashboard Codificadas Manualmente (Hardcoded):**
   - As páginas de dashboard atuais são visualizações rígidas em Vue (ex: `Dashboard.vue`).
   - Qualquer nova métrica ou gráfico solicitado pela equipe técnica precisa ser programado do zero por um desenvolvedor front-end e back-end.
2. **Componente `MaxChart.vue` Elementar:**
   - O MaxComponentsUi dispõe apenas de uma implementação mínima em torno do Chart.js.
   - Não há conceitos de cartões de KPI integrados com cálculos de tendência, nem componentes de grade configuráveis pelo usuário.
3. **Incapacidade de Customização por Filial ou Concessionária:**
   - Cada distribuidora de energia no Brasil (CEMIG, CPFL, Enel, Coelba) possui dinâmicas e exigências distintas. Um gestor da região Sudeste quer acompanhar prazos de vistoria, enquanto o gestor do Nordeste quer monitorar reprovações de parecer de acesso.
   - Hoje não existe forma de um gestor de operações do Engeapp criar ou organizar seus próprios indicadores sem intervenção no código-fonte.

---

## 3. Valor Agregado para o Engeapp

A gestão de centenas de projetos de energia solar exige controle rígido de prazos legais e operacionais regulados pela ANEEL (Resolução 1.000/2021):

### Indicadores Críticos que Operadores Podem Montar Sozinhos:
- **Painel de Risco de Estouro de SLA de Parecer de Acesso:**
  - Card de alerta destacando "14 Projetos com Parecer vencendo em menos de 48h na CEMIG".
- **Taxa de Aprovação por Concessionária:**
  - Gráfico de barras comparativo: % de aprovação de primeira em cada distribuidora (identificando concessionárias com exigências abusivas).
- **Capacidade Fotovoltaica Homologada (kWp / MWp):**
  - Métrica somatória em tempo real da potência de pico das usinas que tiveram o medidor bidirecional instalado no mês.
- **Fila de Trabalho de Vistorias:**
  - Lista com os 10 projetos pendentes de agendamento de vistoria técnica.

### Vantagens Competitivas:
- **Eliminação de Demandas Recorrentes de Relatórios:** Libera a equipe de desenvolvimento de software para focar em novas integrações e regras de negócio.
- **Tomada de Decisão Baseada em Dados em Tempo Real:** Coordenadores de engenharia identificam gargalos no mesmo dia em que ocorrem.
- **Painéis Personalizados para Grandes Integradores:** Possibilidade de oferecer a integradores parceiros um dashboard exclusivo com a velocidade das suas próprias aprovações.

---

## 4. Especificação Técnica Proposta

### 4.1 Schema de Configuração dos Widgets

```typescript
export type WidgetType = 'metric_kpi' | 'chart_timeseries' | 'chart_pie' | 'records_list' | 'markdown_note';

export interface DashboardWidgetConfig {
    id: string;
    title: string;
    type: WidgetType;
    // Posição no grid (12 colunas)
    grid: {
        x: number;
        y: number;
        w: number; // Largura em colunas (ex: 3, 4, 6, 12)
        h: number; // Altura em unidades de linha
        minW?: number;
        minH?: number;
    };
    // Definição de dados
    dataSource: {
        endpoint: string;
        metricField?: string;
        aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
        groupBy?: string;
        filters?: Array<{
            field: string;
            operator: 'eq' | 'neq' | 'gt' | 'lt' | 'in';
            value: any;
        }>;
    };
    // Opções visuais
    appearance: {
        colorScheme?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
        icon?: string;
        prefix?: string;
        suffix?: string;
        refreshIntervalSeconds?: number;
    };
}

export interface DashboardLayout {
    id: string;
    name: string;
    description?: string;
    role_permissions: string[];
    widgets: DashboardWidgetConfig[];
}
```

### 4.2 Store Pinia: `useDashboardBuilderStore`

```typescript
// src/stores/useDashboardBuilder.Store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';
import type { DashboardLayout, DashboardWidgetConfig } from '../types';

export const useDashboardBuilderStore = defineStore('dashboardBuilder', () => {
    const activeDashboard = ref<DashboardLayout | null>(null);
    const isEditMode = ref(false);
    const selectedWidgetForConfig = ref<DashboardWidgetConfig | null>(null);
    const loading = ref(false);

    const loadDashboard = async (dashboardId: string) => {
        loading.value = true;
        try {
            const res = await axios.get(`/api/v1/dashboards/${dashboardId}`);
            activeDashboard.value = res.data.data;
        } finally {
            loading.value = false;
        }
    };

    const updateWidgetLayout = (widgetId: string, newGrid: { x: number; y: number; w: number; h: number }) => {
        if (!activeDashboard.value) return;
        const widget = activeDashboard.value.widgets.find(w => w.id === widgetId);
        if (widget) {
            widget.grid = { ...widget.grid, ...newGrid };
        }
    };

    const addWidget = (widget: DashboardWidgetConfig) => {
        if (!activeDashboard.value) return;
        activeDashboard.value.widgets.push(widget);
    };

    const removeWidget = (widgetId: string) => {
        if (!activeDashboard.value) return;
        activeDashboard.value.widgets = activeDashboard.value.widgets.filter(w => w.id !== widgetId);
    };

    const saveLayout = async () => {
        if (!activeDashboard.value) return;
        await axios.put(`/api/v1/dashboards/${activeDashboard.value.id}`, {
            widgets: activeDashboard.value.widgets
        });
        isEditMode.value = false;
    };

    return {
        activeDashboard,
        isEditMode,
        selectedWidgetForConfig,
        loading,
        loadDashboard,
        updateWidgetLayout,
        addWidget,
        removeWidget,
        saveLayout
    };
});
```

---

## 5. Componentes de UI Sugeridos para o MaxComponentsUi

### 5.1 `MaxDashboardGrid.vue`

Componente de tela analítica que renderiza o canvas responsivo com alternância entre modo de visualização e edição (arrastar/redimensionar).

```html
<template>
    <div class="max-dashboard-container">
        <!-- Barra de Controle do Dashboard -->
        <header class="dashboard-header">
            <div class="header-titles">
                <h2 class="dashboard-name">{{ dashboardStore.activeDashboard?.name ?? 'Painel de Controle' }}</h2>
                <span v-if="dashboardStore.isEditMode" class="edit-badge">Modo de Edição Ativo</span>
            </div>

            <div class="header-actions">
                <template v-if="!dashboardStore.isEditMode">
                    <button type="button" class="btn-action" @click="dashboardStore.isEditMode = true">
                        <MaxIcon i="iconoir:view-grid-plus" size="1.1" />
                        Personalizar Painel
                    </button>
                </template>
                <template v-else>
                    <button type="button" class="btn-add-widget" @click="handleOpenAddWidget">
                        <MaxIcon i="iconoir:plus" size="1.1" />
                        Adicionar Widget
                    </button>
                    <button type="button" class="btn-save" @click="dashboardStore.saveLayout">
                        <MaxIcon i="iconoir:check" size="1.1" />
                        Salvar Layout
                    </button>
                </template>
            </div>
        </header>

        <!-- Grade Dinâmica de Widgets (12 Colunas) -->
        <div class="dashboard-grid">
            <div
                v-for="widget in dashboardStore.activeDashboard?.widgets"
                :key="widget.id"
                class="widget-cell"
                :style="{
                    gridColumn: `span ${widget.grid.w}`,
                    gridRow: `span ${widget.grid.h}`
                }"
            >
                <div class="widget-box">
                    <header class="widget-header">
                        <div class="widget-title-group">
                            <MaxIcon v-if="widget.appearance.icon" :i="widget.appearance.icon" size="1.1" />
                            <h3 class="widget-title">{{ widget.title }}</h3>
                        </div>

                        <div v-if="dashboardStore.isEditMode" class="widget-admin-actions">
                            <button
                                type="button"
                                class="btn-icon-subtle"
                                @click="dashboardStore.selectedWidgetForConfig = widget"
                            >
                                <MaxIcon i="iconoir:settings" size="0.95" />
                            </button>
                            <button
                                type="button"
                                class="btn-icon-subtle btn-danger"
                                @click="dashboardStore.removeWidget(widget.id)"
                            >
                                <MaxIcon i="iconoir:trash" size="0.95" />
                            </button>
                        </div>
                    </header>

                    <div class="widget-body">
                        <!-- Renderização Dinâmica conforme o Tipo de Widget -->
                        <MaxWidgetMetricCard
                            v-if="widget.type === 'metric_kpi'"
                            :config="widget"
                        />
                        <MaxChart
                            v-else-if="widget.type === 'chart_timeseries' || widget.type === 'chart_pie'"
                            :config="widget"
                        />
                        <div v-else class="widget-placeholder">
                            <span>Tipo de widget não configurado</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Drawer de Configuração de Widgets -->
        <MaxDrawer
            v-if="dashboardStore.selectedWidgetForConfig"
            :visible="true"
            position="right"
            header="Configurar Widget"
            @update:visible="(val: boolean) => { if (!val) dashboardStore.selectedWidgetForConfig = null; }"
        >
            <div class="widget-config-form">
                <label class="form-label">Título do Widget</label>
                <input
                    v-model="dashboardStore.selectedWidgetForConfig.title"
                    type="text"
                    class="form-input"
                />

                <label class="form-label">Largura em Colunas (1 a 12)</label>
                <input
                    v-model.number="dashboardStore.selectedWidgetForConfig.grid.w"
                    type="number"
                    min="2"
                    max="12"
                    class="form-input"
                />

                <label class="form-label">Cor de Destaque</label>
                <select v-model="dashboardStore.selectedWidgetForConfig.appearance.colorScheme" class="form-input">
                    <option value="primary">Azul Primário</option>
                    <option value="success">Verde Sucesso</option>
                    <option value="warning">Âmbar Atenção</option>
                    <option value="danger">Vermelho Perigo</option>
                </select>
            </div>
        </MaxDrawer>
    </div>
</template>

<script setup lang="ts">
    import { onMounted } from 'vue';
    import { useDashboardBuilderStore } from '../stores/useDashboardBuilder.Store';
    import MaxIcon from './MaxIcon.vue';
    import MaxDrawer from './MaxDrawer.vue';
    import MaxChart from './MaxChart.vue';
    import MaxWidgetMetricCard from './MaxWidgetMetricCard.vue';

    const dashboardStore = useDashboardBuilderStore();

    onMounted(() => {
        dashboardStore.loadDashboard('geral_engenharia');
    });

    const handleOpenAddWidget = () => {
        dashboardStore.addWidget({
            id: `widget_${Date.now()}`,
            title: 'Novo Indicador',
            type: 'metric_kpi',
            grid: { x: 0, y: 0, w: 3, h: 2 },
            dataSource: { endpoint: '/api/v1/metrics/example' },
            appearance: { colorScheme: 'primary', icon: 'iconoir:activity' }
        });
    };
</script>

<style lang="scss" scoped>
.max-dashboard-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 1.5rem;
    padding: 1.5rem;

    .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .header-titles {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .dashboard-name {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--background-850);
                margin: 0;
            }

            .edit-badge {
                background-color: var(--yellow-600);
                color: #ffffff;
                font-size: 0.6875rem;
                font-weight: 700;
                text-transform: uppercase;
                padding: 0.2rem 0.5rem;
                border-radius: 0.25rem;
            }
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .btn-action,
            .btn-add-widget,
            .btn-save {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.5rem 0.875rem;
                border-radius: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                border: 1px solid var(--background-300);
                background-color: var(--background-0);
                color: var(--background-800);
                transition: all 0.2s ease;

                &:hover {
                    background-color: var(--background-100);
                }
            }

            .btn-save {
                background-color: var(--primary-600);
                border-color: var(--primary-600);
                color: #ffffff;

                &:hover {
                    background-color: var(--primary-700);
                }
            }
        }
    }

    .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        gap: 1.25rem;
        width: 100%;

        .widget-cell {
            min-height: 10rem;
            display: flex;

            .widget-box {
                flex: 1;
                display: flex;
                flex-direction: column;
                background-color: var(--background-0);
                border: 1px solid var(--background-200);
                border-radius: 0.75rem;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

                .widget-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.875rem 1rem;
                    border-bottom: 1px solid var(--background-150);

                    .widget-title-group {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;

                        .widget-title {
                            font-size: 0.9375rem;
                            font-weight: 600;
                            color: var(--background-800);
                            margin: 0;
                        }
                    }

                    .widget-admin-actions {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;

                        .btn-icon-subtle {
                            background: none;
                            border: none;
                            color: var(--background-500);
                            cursor: pointer;
                            padding: 0.35rem;
                            border-radius: 0.375rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;

                            &:hover {
                                background-color: var(--background-100);
                                color: var(--background-800);
                            }

                            &.btn-danger:hover {
                                background-color: rgba(239, 68, 68, 0.1);
                                color: var(--red-600);
                            }
                        }
                    }
                }

                .widget-body {
                    flex: 1;
                    padding: 1rem;
                    display: flex;
                    flex-direction: column;
                }
            }
        }
    }

    .widget-config-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .form-label {
            font-size: 0.8125rem;
            font-weight: 600;
            color: var(--background-700);
        }

        .form-input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid var(--background-300);
            background-color: var(--background-0);
            color: var(--background-800);
            font-size: 0.875rem;

            &:focus {
                outline: none;
                border-color: var(--primary-500);
            }
        }
    }
}
</style>
```

### 5.2 `MaxWidgetMetricCard.vue` (Componente de KPI Reusável)

Renderizador dedicado para cartões de métrica operacional:
- Exibe o valor calculado com máscara de formato (ex: `142 usinas`, `R$ 450.200,00`, `1.450 kWp`).
- Indicador com seta de tendência positiva ou negativa comparando com período anterior.
- Barra sutil de progresso ou meta operacional.
