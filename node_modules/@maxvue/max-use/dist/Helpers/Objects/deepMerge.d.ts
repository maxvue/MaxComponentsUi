import { MaybeRefOrGetter } from 'vue';
/**
 * Une dois ou mais objetos de forma profunda, mesclando inclusive propriedades aninhadas.
 * Útil para lidar com configurações padrão que precisam ser sobrescritas parcialmente por configurações do usuário.
 *
 * @param target O objeto alvo que receberá as propriedades.
 * @param sources Um ou mais objetos de origem para mesclar.
 * @returns O objeto mesclado (modifica o primeiro objeto e o retorna).
 */
export declare function deepMerge<T extends object>(target: MaybeRefOrGetter<T>, ...sources: any[]): T;
//# sourceMappingURL=deepMerge.d.ts.map