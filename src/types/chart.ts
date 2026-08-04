/**
 * Tipos do MaxChart.
 *
 * Espelham o contrato do chart.js sem `import type` dele: o `chart.js` não é
 * dependência declarada da lib (entra por import dinâmico, resolvido pelo app
 * consumidor). Tipar contra o pacote quebraria o `vue-tsc` da lib em qualquer
 * ambiente onde ele não esteja instalado.
 */

/** Tipos de gráfico registrados pelo `chart.js/auto`. */
export type MaxChartType =
    | 'line'
    | 'bar'
    | 'doughnut'
    | 'pie'
    | 'polarArea'
    | 'radar'
    | 'bubble'
    | 'scatter';

/** Ponto de série. `null` cria uma lacuna na linha. */
export type MaxChartValue = number | null | { x: number; y: number; r?: number };

/**
 * Dataset do chart.js. As chaves conhecidas são tipadas; o índice aberto
 * acomoda as dezenas de opções por tipo de gráfico (`tension`, `segment`,
 * `cutout`, `fill`, callbacks de cor…) sem repetir o pacote inteiro aqui.
 */
export interface MaxChartDataset {
    label?: string;
    data: MaxChartValue[];
    backgroundColor?: unknown;
    borderColor?: unknown;
    borderWidth?: number;
    [key: string]: unknown;
}

/** Formato de dados do chart.js — o mesmo que os endpoints de agregação devolvem. */
export interface MaxChartData {
    labels?: (string | number)[];
    datasets: MaxChartDataset[];
}

/** Opções do chart.js (`scales`, `plugins`, `responsive`…). */
export type MaxChartOptions = Record<string, unknown>;

/** Plugin do chart.js aplicado a uma instância. */
export interface MaxChartPlugin {
    id: string;
    [hook: string]: unknown;
}

/** Elemento retornado por `getElementsAtEventForMode`. */
export interface MaxChartElement {
    index: number;
    datasetIndex: number;
    element: unknown;
}

/**
 * Recorte da instância do chart.js efetivamente usado pelo MaxChart e exposto
 * por `defineExpose`.
 */
export interface MaxChartInstance {
    data: MaxChartData;
    options: MaxChartOptions;
    update(mode?: string): void;
    destroy(): void;
    resize(): void;
    toBase64Image(type?: string, quality?: number): string;
    getElementsAtEventForMode(
        event: Event,
        mode: string,
        options: { intersect?: boolean },
        useFinalPosition: boolean,
    ): MaxChartElement[];
}
