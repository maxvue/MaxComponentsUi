<template>
    <div class="max-chart-main-div">
        <canvas ref="canvas_ref" :aria-label="effectiveAriaLabel" :role="effectiveAriaLabel ? 'img' : undefined"></canvas>

        <!-- Botão alternativo acessível para exibir/ocultar a tabela de dados -->
        <button
            v-if="accessibleRows.length > 0"
            type="button"
            class="max-chart-toggle-table-btn"
            :aria-expanded="isTableExpanded"
            :aria-label="isTableExpanded ? 'Ocultar tabela de dados do gráfico' : 'Exibir tabela de dados do gráfico'"
            @click="isTableExpanded = !isTableExpanded"
        >
            {{ isTableExpanded ? 'Ocultar dados' : 'Ver dados em tabela' }}
        </button>

        <!-- Tabela acessível alternativa para navegação por teclado e tecnologias assistivas -->
        <div
            v-if="accessibleRows.length > 0"
            class="max-chart-accessible-table"
            :class="{ 'is-expanded': isTableExpanded }"
        >
            <table :aria-label="effectiveAriaLabel || 'Tabela de dados do gráfico'">
                <caption>{{ effectiveAriaLabel || 'Dados do gráfico' }}</caption>
                <thead>
                    <tr>
                        <th scope="col">Item</th>
                        <th v-for="(dataset, dIdx) in (props.data?.datasets ?? [])" :key="dIdx" scope="col">
                            {{ dataset.label || `Série ${dIdx + 1}` }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, rIdx) in accessibleRows" :key="rIdx">
                        <th scope="row">{{ row.label }}</th>
                        <td v-for="(val, dIdx) in row.values" :key="dIdx">
                            <button
                                type="button"
                                class="max-chart-cell-btn"
                                :aria-label="`Selecionar ${row.label}, série ${(props.data?.datasets?.[dIdx]?.label) || (dIdx + 1)}: ${val}`"
                                @click="onAccessibleSelect($event, rIdx, dIdx)"
                            >
                                {{ val }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
    import type { MaxChartData, MaxChartInstance, MaxChartOptions, MaxChartPlugin, MaxChartType } from '../types/chart';

    const props = withDefaults(defineProps<{
        /** Tipo do gráfico — o mesmo vocabulário do chart.js. */
        type?: MaxChartType;
        /** Dados no formato chart.js: `{ labels, datasets }`. */
        data?: MaxChartData | null;
        /** Opções do chart.js. `maintainAspectRatio: false` é o padrão. */
        options?: MaxChartOptions | null;
        /** Plugins do chart.js aplicados só a esta instância. */
        plugins?: MaxChartPlugin[] | null;
        /** Rótulo acessível do canvas. Sem ele o gráfico fica invisível ao leitor de tela. */
        ariaLabel?: string;
    }>(), {
        type: 'line',
        data: null,
        options: null,
        plugins: null,
        ariaLabel: ''
    });

    const emit = defineEmits<{
        /** Emitido quando a instância do chart.js termina de montar. */
        loaded: [chart: MaxChartInstance];
        /** Emitido ao clicar sobre um ponto/fatia/barra do gráfico ou selecionar via tabela acessível. */
        select: [payload: { originalEvent: MouseEvent | UIEvent; index: number; datasetIndex: number }];
    }>();

    const effectiveAriaLabel = computed(() => {
        if (props.ariaLabel) return props.ariaLabel;
        if (props.data?.datasets?.[0]?.label) return `Gráfico: ${props.data.datasets[0].label}`;
        return 'Gráfico de dados';
    });

    const isTableExpanded = ref(false);

    const accessibleRows = computed(() => {
        if (!props.data || !props.data.labels || !props.data.datasets) return [];
        const labels = props.data.labels;
        const datasets = props.data.datasets;
        return labels.map((label: string | number, rIdx: number) => ({
            label: String(label),
            values: datasets.map((ds) => {
                const val = ds.data?.[rIdx];
                return val !== undefined && val !== null ? String(val) : '';
            })
        }));
    });

    const onAccessibleSelect = (event: MouseEvent | UIEvent, index: number, datasetIndex: number) => {
        emit('select', { originalEvent: event, index, datasetIndex });
    };

    const canvas_ref = useTemplateRef<HTMLCanvasElement>('canvas_ref');
    // shallowRef: a instância do chart.js é um objeto grande e mutável por fora;
    // deixar o Vue observá-la em profundidade custa caro e não serve pra nada.
    const chart = shallowRef<MaxChartInstance | null>(null);
    const is_mounted = ref(false);

    /** Opções padrão do projeto — o gráfico preenche o container em vez de impor proporção. */
    const baseOptions = (): MaxChartOptions => ({
        maintainAspectRatio: false,
        responsive: true
    });

    const destroyChart = () => {
        chart.value?.destroy();
        chart.value = null;
    };

    const onCanvasClick = (event: MouseEvent) => {
        if (!chart.value) return;
        const elements = chart.value.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
        const first = elements[0];
        if (!first) return;
        emit('select', { originalEvent: event, index: first.index, datasetIndex: first.datasetIndex });
    };

    const initChart = async () => {
        if (!canvas_ref.value || !props.data) return;

        // Import dinâmico: o chart.js (~200 KB) só entra no bundle de quem usa o gráfico.
        // Mesmo padrão dos componentes de dependência pesada da lib (MaxMaps, MaxInputMarkdown).
        const { default: Chart } = await import('chart.js/auto');

        // Entre o await e aqui o componente pode ter sido desmontado.
        if (!is_mounted.value || !canvas_ref.value) return;

        destroyChart();

        // Fronteira de tipos: `MaxChartData`/`MaxChartOptions` são estruturais e
        // deliberadamente mais frouxos que os genéricos do chart.js (que variam
        // por `type` e não são expressáveis sem depender do pacote). O cast fica
        // confinado a esta única linha — a validação real é a do chart.js em runtime.
        const config = {
            type: props.type,
            data: props.data,
            options: { ...baseOptions(), ...(props.options ?? {}) },
            plugins: props.plugins ?? []
        } as unknown as ConstructorParameters<typeof Chart>[1];

        chart.value = new Chart(canvas_ref.value, config) as unknown as MaxChartInstance;

        emit('loaded', chart.value);
    };

    const updateChartData = () => {
        if (!props.data) {
            destroyChart();
            return;
        }

        if (!chart.value) {
            void initChart();
            return;
        }

        // Atualização eficiente in-place compatível com Chart.js
        chart.value.data = props.data;
        if (props.options) chart.value.options = { ...baseOptions(), ...props.options };

        chart.value.update();
    };

    // Observadores reativos otimizados
    watch(() => props.data, updateChartData, { deep: true });
    watch(() => props.options, updateChartData, { deep: true });
    watch(() => props.type, () => void initChart());

    onMounted(() => {
        is_mounted.value = true;
        canvas_ref.value?.addEventListener('click', onCanvasClick);
        void initChart();
    });

    onBeforeUnmount(() => {
        is_mounted.value = false;
        canvas_ref.value?.removeEventListener('click', onCanvasClick);
        destroyChart();
    });

    defineExpose({
        /** Instância do chart.js, ou `null` antes da montagem. */
        getChart: (): MaxChartInstance | null => chart.value,
        /** Canvas nativo, para exportar imagem ou medir. */
        getCanvas: (): HTMLCanvasElement | null => canvas_ref.value,
        /** Redesenha sem recriar a instância — use após mutar os dados no lugar. */
        refresh: () => chart.value?.update(),
        /** Recria a instância do zero. */
        reinit: () => void initChart(),
        /** PNG em base64 do estado atual. */
        toBase64Image: (): string | undefined => chart.value?.toBase64Image()
    });
</script>

<style lang="scss" scoped>
    .max-chart-main-div {
        // O canvas é dimensionado pelo container: sem altura definida por quem usa,
        // o chart.js com maintainAspectRatio:false colapsa para 0px de altura.
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 0;

        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }

        .max-chart-toggle-table-btn {
            position: absolute;
            top: 6px;
            right: 6px;
            z-index: 12;
            padding: 4px 8px;
            font-size: 0.75rem;
            border-radius: 4px;
            background: var(--background-100, #f1f5f9);
            color: var(--background-800, #001524);
            border: 1px solid var(--background-300, #cbd5e1);
            cursor: pointer;
            font-family: inherit;

            &:not(:focus-visible):not(:hover) {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
                border: 0;
            }

            &:focus-visible {
                outline: none;
                box-shadow: var(--max-focus-ring);
            }

            &:hover {
                background: var(--background-200, #e2e8f0);
            }
        }

        .max-chart-accessible-table {
            &:not(:focus-within):not(.is-expanded) {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip-path: inset(50%);
                white-space: nowrap;
                border: 0;
            }

            &:focus-within,
            &.is-expanded {
                position: absolute;
                inset: 0;
                z-index: 10;
                background: var(--background-0, #ffffff);
                color: var(--background-800, #001524);
                padding: 1rem;
                overflow: auto;
                border-radius: 0.5rem;
                border: 1px solid var(--background-300, #cbd5e1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.85rem;

                caption {
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    text-align: left;
                }

                th, td {
                    padding: 0.4rem 0.6rem;
                    border: 1px solid var(--background-200, #e2e8f0);
                    text-align: left;
                }

                th {
                    background: var(--background-50, #f8fafc);
                    font-weight: 600;
                }

                .max-chart-cell-btn {
                    background: var(--background-100, #f1f5f9);
                    border: 1px solid var(--background-300, #cbd5e1);
                    border-radius: 4px;
                    padding: 0.2rem 0.5rem;
                    cursor: pointer;
                    color: inherit;
                    font-family: inherit;
                    font-size: inherit;

                    &:focus-visible {
                        outline: none;
                        box-shadow: var(--max-focus-ring);
                    }

                    &:hover {
                        background: var(--background-200, #e2e8f0);
                    }
                }
            }
        }
    }
</style>
