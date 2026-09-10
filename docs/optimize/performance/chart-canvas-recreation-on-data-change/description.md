# Destruição e Recriação de Instância do Chart.js em Mutações de Dados

## Categoria
Watchers e Reatividade / Layout Thrashing / Desempenho Gráfico

## Severidade
Média-Alta

## Componentes Envolvidos
- [MaxChart.vue](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxChart.vue#L62-L105)

## Descrição do Problema
No `MaxChart.vue`, watchers profundos observam alterações em `props.data` e `props.options`:

```typescript
// MaxChart.vue L90-L94
// `deep` porque mutar um dataset no lugar (padrão comum) não troca a referência.
watch(() => props.data, () => void initChart(), { deep: true });
watch(() => props.type, () => void initChart());
watch(() => props.options, () => void initChart(), { deep: true });
```

Em cada alteração de dados, ao invés de atualizar os datasets e chamar o método nativo `chart.update()`, a função `initChart()` é invocada:

```typescript
// MaxChart.vue L62-L88
const initChart = async () => {
    if (!canvas_ref.value || !props.data) return;

    const { default: Chart } = await import('chart.js/auto');
    if (!is_mounted.value || !canvas_ref.value) return;

    destroyChart(); // <-- Destrói a instância anterior via chart.value?.destroy()

    const config = {
        type: props.type,
        data: props.data,
        options: { ...baseOptions(), ...(props.options ?? {}) },
        plugins: props.plugins ?? []
    } as unknown as ConstructorParameters<typeof Chart>[1];

    chart.value = new Chart(canvas_ref.value, config) as unknown as MaxChartInstance; // <-- Recria do zero
    emit('loaded', chart.value);
};
```

## Causa Raiz
O Chart.js foi projetado para ser atualizado de maneira reativa e eficiente através de mutação de `chart.data` seguida de `chart.update()`. A chamada `chart.destroy()` destrói todos os buffers internos do canvas, cancela as animações em andamento e força a desalocação e realocação do contexto 2D/WebGL do elemento `<canvas>`.

Além disso, como o watcher possui `{ deep: true }` e não possui nenhum debounce, se um componente consumidor emitir atualizações sucessivas de dados (ex: recebimento via WebSocket, telemetria em tempo real, slider de período de datas), `initChart()` é disparado repetidamente.

## Impacto na Performance
1. **Perda de Animações Fluídas**: A recriação do gráfico destrói o ciclo de interpolação e animação nativo do Chart.js, fazendo com que o gráfico pisque na tela (*flicker*) ao atualizar.
2. **Layout Thrashing e Alocação de Memória**: O ciclo `destroy()` + `new Chart()` descarta e recria buffers gráficos no canvas, aumentando a pressão sobre o Garbage Collector e causando engasgos na renderização.
3. **Overhead de Import Dinâmico**: A cada reatividade, o código executa `await import('chart.js/auto')`, resolvendo a promessa repetidamente.

## Solução Recomendada
Diferenciar mutação de dados da mudança de tipo de gráfico:
1. Se `props.type` mudar, sim, deve-se reinicializar o gráfico.
2. Se apenas `props.data` ou `props.options` mudarem, verificar se a instância `chart.value` já existe. Se existir, atualizar as propriedades e chamar `chart.update()`:

```typescript
const updateChartData = () => {
    if (!chart.value) {
        void initChart();
        return;
    }
    chart.value.data = props.data;
    if (props.options) {
        chart.value.options = { ...baseOptions(), ...props.options };
    }
    chart.value.update();
};

watch(() => props.data, updateChartData, { deep: true });
watch(() => props.options, updateChartData, { deep: true });
watch(() => props.type, () => void initChart());
```
Isso mantém as animações suaves, preserva os contextos de renderização do canvas e reduz o processamento da CPU para frações de milissegundo.
