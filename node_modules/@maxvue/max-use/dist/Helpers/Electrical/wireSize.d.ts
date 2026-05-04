import { MaybeRefOrGetter } from 'vue';
type T = MaybeRefOrGetter<string | number | null>;
type Material = 'copper' | 'aluminum' | 'cobre' | 'aluminio' | 'alumínio' | 'cu' | 'al';
type Temperature = '90' | '70' | 90 | 70;
type Isolation = 'pvc' | 'epr' | 'xlpe';
type Phases = 1 | 2 | 3 | '1' | '2' | '3';
export type WireOptions = {
    material?: Material;
    isolation?: Temperature | Isolation;
    method?: 'b1' | 'b2' | 'c1' | 'c2' | 'd';
    length?: number;
    voltage: 115 | 120 | 127 | 220 | 230 | 240 | 380 | 400 | 440 | 480;
    phases?: Phases;
    max_loss?: number;
    voltage_drop?: number;
};
/**
 * Calcula a seção nominal de um cabo elétrico com base na corrente, opções de material, isolação, entre outros.
 *
 * @param current A corrente elétrica do circuito.
 * @param options Opções do cálculo, como material, tensão, método de instalação e distância.
 * @returns Um objeto com a bitola do cabo, a corrente máxima, a queda de tensão e a porcentagem de perda.
 */
export declare function wireSize(current: T, options: WireOptions): Promise<{
    wire: number;
    max_current: number;
    voltage_drop: number;
    loss_percent: number;
} | null>;
export {};
//# sourceMappingURL=wireSize.d.ts.map