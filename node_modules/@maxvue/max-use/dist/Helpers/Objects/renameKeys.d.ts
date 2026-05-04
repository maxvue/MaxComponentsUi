import { MaybeRefOrGetter } from 'vue';
/**
 * Altera os nomes das chaves de um objeto usando um mapa de "de/para".
 * Útil para adaptar dados da API para o seu padrão.
 *
 * @param object O objeto original.
 * @param map O mapa de renomeação { chaveAntiga: chaveNova }.
 * @returns Um novo objeto com as chaves renomeadas.
 */
export declare function renameKeys(object: MaybeRefOrGetter<Record<string, any>>, map: MaybeRefOrGetter<Record<string, string>>): Record<string, any>;
//# sourceMappingURL=renameKeys.d.ts.map