<template>
    <div class="max-chart-main-div">
        <canvas ref="canvas_ref" :aria-label="ariaLabel || undefined" :role="ariaLabel ? 'img' : undefined"></canvas>
    </div>
</template>

<script setup lang="ts">
    import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
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
        /** Emitido ao clicar sobre um ponto/fatia/barra do gráfico. */
        select: [payload: { originalEvent: MouseEvent; index: number; datasetIndex: number }];
    }>();

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

    // `deep` porque mutar um dataset no lugar (padrão comum) não troca a referência.
    watch(() => props.data, () => void initChart(), { deep: true });
    watch(() => props.type, () => void initChart());
    watch(() => props.options, () => void initChart(), { deep: true });

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

<style lang="scss">
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
    }
</style>
