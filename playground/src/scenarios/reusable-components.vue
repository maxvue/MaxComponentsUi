<template>
    <div class="scenario-content" data-scenario="reusable-components">
        <h2>Cenário: Dez Componentes Reutilizáveis (C01–C10)</h2>
        <div class="scenario-inner">
            <div class="variants">
                <!-- C01: MaxAlert -->
                <div class="component-block">
                    <h3>C01: MaxAlert</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxAlert severity="info" title="Informação" message="Este é um alerta informativo persistente." />
                        </div>
                        <div class="state-col">
                            <MaxAlert severity="success" title="Sucesso" message="Registro sincronizado com êxito." />
                        </div>
                        <div class="state-col">
                            <MaxAlert severity="warning" title="Atenção" message="Verifique as pendências antes de prosseguir." />
                        </div>
                        <div class="state-col">
                            <MaxAlert severity="danger" title="Erro" message="Falha ao processar solicitação." closable @close="onAlertClose" />
                        </div>
                    </div>
                </div>

                <!-- C02: MaxQueryState -->
                <div class="component-block">
                    <h3>C02: MaxQueryState</h3>
                    <div class="states">
                        <div class="state-col">
                            <h4>Estado: loading</h4>
                            <MaxQueryState state="loading" message="Consultando faturas..." />
                        </div>
                        <div class="state-col">
                            <h4>Estado: ready-empty</h4>
                            <MaxQueryState state="ready-empty" message="Nenhuma fatura encontrada no período." />
                        </div>
                        <div class="state-col">
                            <h4>Estado: error com retry</h4>
                            <MaxQueryState state="error" title="Falha de conexão" message="Não foi possível obter dados." retryable @retry="onQueryRetry" />
                        </div>
                        <div class="state-col">
                            <h4>Estado: stale (conteúdo mantido)</h4>
                            <MaxQueryState state="stale" retryable @retry="onQueryRetry">
                                <div class="p-3 bg-white border rounded">
                                    <strong>Dados do Cliente:</strong> John Doe (R$ 1.500,00)
                                </div>
                            </MaxQueryState>
                        </div>
                        <div class="state-col">
                            <h4>Estado: ready-with-data</h4>
                            <MaxQueryState state="ready-with-data">
                                <div class="p-3 bg-white border rounded">
                                    <strong>Dados Atuais:</strong> Operação normal.
                                </div>
                            </MaxQueryState>
                        </div>
                    </div>
                </div>

                <!-- C03: MaxFormValidationSummary -->
                <div class="component-block">
                    <h3>C03: MaxFormValidationSummary</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxFormValidationSummary :errors="validationErrors" general-error="Existem pendências nos campos abaixo:" />
                            <div class="form-sample mt-3">
                                <input id="field-nome" v-model="formSample.nome" placeholder="Nome" class="p-2 border rounded" />
                                <input id="field-email" v-model="formSample.email" placeholder="E-mail" class="p-2 border rounded ml-2" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- C04: MaxSegmentedControl -->
                <div class="component-block">
                    <h3>C04: MaxSegmentedControl</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Frequência selecionada: {{ selectedFrequency }}</span>
                            <MaxSegmentedControl v-model="selectedFrequency" :options="frequencyOptions" aria-label="Frequência de relatórios" />
                        </div>
                    </div>
                </div>

                <!-- C05: MaxPeriodNavigator -->
                <div class="component-block">
                    <h3>C05: MaxPeriodNavigator</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxPeriodNavigator v-model="activePeriod" :current-period="currentPeriodRef" />
                        </div>
                    </div>
                </div>

                <!-- C06: MaxProgressBar -->
                <div class="component-block">
                    <h3>C06: MaxProgressBar</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Progresso normal (65%):</span>
                            <MaxProgressBar :value="65" :max="100" severity="info" aria-label="Progresso de envio" />
                        </div>
                        <div class="state-col">
                            <span>Consumo excedido (125% - barra em 100%):</span>
                            <MaxProgressBar :value="125" :max="100" severity="danger" mode="meter" aria-label="Limite de consumo" />
                        </div>
                        <div class="state-col">
                            <span>Indeterminado:</span>
                            <MaxProgressBar :value="null" aria-label="Aguardando resposta" />
                        </div>
                    </div>
                </div>

                <!-- C07: MaxFilterBar -->
                <div class="component-block">
                    <h3>C07: MaxFilterBar</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxFilterBar :active-count="activeFilterCount" show-apply @clear="activeFilterCount = 0" @apply="onFilterApply">
                                <input v-model="filterText" placeholder="Buscar por nome..." class="p-2 border rounded" />
                                <select v-model="filterCategory" class="p-2 border rounded">
                                    <option value="">Todas as categorias</option>
                                    <option value="solar">Solar</option>
                                    <option value="eolica">Eólica</option>
                                </select>
                            </MaxFilterBar>
                        </div>
                    </div>
                </div>

                <!-- C08: MaxFilePreview -->
                <div class="component-block">
                    <h3>C08: MaxFilePreview</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxFilePreview :file="sampleRemoteImage" @open="onFileOpen" />
                        </div>
                        <div class="state-col">
                            <MaxFilePreview :file="sampleRemotePdf" @open="onFileOpen" />
                        </div>
                    </div>
                </div>

                <!-- C09: MaxMarkdownViewer -->
                <div class="component-block">
                    <h3>C09: MaxMarkdownViewer</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxMarkdownViewer :source="markdownSample" :render-markdown="simpleMarkdownRenderer" @image-click="onImageClick" />
                        </div>
                    </div>
                </div>

                <!-- C10: MaxCalendar -->
                <div class="component-block">
                    <h3>C10: MaxCalendar</h3>
                    <div class="states">
                        <div class="state-col">
                            <MaxCalendar v-model:period="activeCalendarPeriod" v-model:selected-date="selectedCalendarDate" :today="'2026-10-16'" :events="calendarEvents" @event-click="onCalendarEventClick" />
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
        MaxAlert,
        MaxQueryState,
        MaxFormValidationSummary,
        MaxSegmentedControl,
        MaxPeriodNavigator,
        MaxProgressBar,
        MaxFilterBar,
        MaxFilePreview,
        MaxMarkdownViewer,
        MaxCalendar
    } from '@maxvue/max-components-ui';
    import type {
        MaxValidationIssue,
        MaxSegmentOption,
        MaxMonthPeriod,
        MaxPreviewFileRemote,
        MaxCalendarEvent,
        MaxLocalDate
    } from '@maxvue/max-components-ui';

    const onAlertClose = (): void => {
        alert('Alerta fechado!');
    };

    const onQueryRetry = (): void => {
        alert('Tentando recarregar consulta...');
    };

    const formSample = ref({ nome: '', email: '' });
    const validationErrors = ref<MaxValidationIssue[]>([
        { key: 'nome', label: 'Nome', message: 'Preenchimento obrigatório', inputId: 'field-nome' },
        { key: 'email', label: 'E-mail', message: 'Formato de e-mail inválido', inputId: 'field-email' }
    ]);

    const selectedFrequency = ref<string | number | null>('mensal');
    const frequencyOptions: MaxSegmentOption[] = [
        { value: 'diario', label: 'Diário' },
        { value: 'semanal', label: 'Semanal' },
        { value: 'mensal', label: 'Mensal' },
        { value: 'anual', label: 'Anual', disabled: true }
    ];

    const activePeriod = ref<MaxMonthPeriod>({ year: 2026, month: 10 });
    const currentPeriodRef: MaxMonthPeriod = { year: 2026, month: 10 };

    const activeFilterCount = ref(2);
    const filterText = ref('');
    const filterCategory = ref('solar');
    const onFilterApply = (): void => {
        alert('Filtros aplicados!');
    };

    const sampleRemoteImage: MaxPreviewFileRemote = {
        kind: 'remote',
        id: 'img-1',
        name: 'planta-solar.png',
        size: 524288,
        url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200'
    };

    const sampleRemotePdf: MaxPreviewFileRemote = {
        kind: 'remote',
        id: 'pdf-1',
        name: 'memorial-descritivo.pdf',
        size: 1572864,
        url: 'https://example.com/memorial.pdf'
    };

    const onFileOpen = (file: any): void => {
        alert(`Abrir arquivo: ${file.name}`);
    };

    const markdownSample = ref(`
### Especificação de Engenharia
- **Módulos:** 550W Monocristalino
- **Inversor:** String 75kW

Consulte a documentação em [Engeapp Docs](https://example.com).
`);

    const simpleMarkdownRenderer = (md: string): string => {
        return md
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
    };

    const onImageClick = (payload: { src: string; alt: string }): void => {
        alert(`Imagem clicada: ${payload.alt}`);
    };

    const activeCalendarPeriod = ref<MaxMonthPeriod>({ year: 2026, month: 10 });
    const selectedCalendarDate = ref<MaxLocalDate | null>('2026-10-16');
    const calendarEvents = ref<MaxCalendarEvent[]>([
        { id: 'ev-vistoria', date: '2026-10-16', label: 'Vistoria Concessionária', severity: 'warning' },
        { id: 'ev-entrega', date: '2026-10-22', label: 'Entrega de Inversores', severity: 'success' }
    ]);

    const onCalendarEventClick = (id: string): void => {
        alert(`Evento clicado: ${id}`);
    };
</script>

<style lang="scss" scoped>
.scenario-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem;
    font-family: Quicksand, sans-serif;
}

.variants {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.component-block {
    border: 1px solid var(--background-200, #e2e8f0);
    padding: 1.25rem;
    border-radius: 8px;
    background-color: var(--background-0, #ffffff);

    h3 {
        margin: 0 0 1rem 0;
        font-size: 1.1rem;
        color: var(--max-primary-600, #00768e);
        border-bottom: 1px solid var(--background-100, #f1f5f9);
        padding-bottom: 0.5rem;
    }
}

.states {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.state-col {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    h4 {
        margin: 0;
        font-size: 0.85rem;
        color: var(--background-600, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}
</style>
