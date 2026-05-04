import { MaybeRefOrGetter } from 'vue';
/**
 * Obtém o valor no caminho específico de um objeto.
 * Semelhante ao _.get do Lodash.
 *
 * @param object O objeto para consultar.
 * @param path O caminho da propriedade a ser obtida (string ou array).
 * @param defaultValue O valor retornado se o caminho resolvido for undefined.
 * @returns Retorna o valor resolvido.
 */
export declare function get<T = any>(object: MaybeRefOrGetter<any>, path: string | string[], defaultValue?: T): T;
//# sourceMappingURL=get.d.ts.map