import { MaybeRefOrGetter } from 'vue';
/**
 * Compara dois objetos e retorna um novo objeto contendo apenas as propriedades que foram alteradas.
 * Útil para otimização de performance ao enviar apenas o que mudou para o backend (PATCH requests).
 *
 * @param oldObj O objeto original (estado anterior).
 * @param newObj O objeto atualizado (estado novo).
 * @param alwaysKeep Lista de chaves que devem ser obrigatoriamente mantidas no resultado, mesmo que não tenham mudado.
 */
export declare function diff<T extends Record<string, any>>(oldObj: MaybeRefOrGetter<T | null | undefined>, newObj: MaybeRefOrGetter<T | null | undefined>, alwaysKeep?: string[]): Partial<T>;
//# sourceMappingURL=diff.d.ts.map