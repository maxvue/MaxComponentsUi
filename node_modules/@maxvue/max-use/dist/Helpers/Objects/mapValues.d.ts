import { MaybeRefOrGetter } from 'vue';
/**
 * Cria um novo objeto transformando apenas os valores, mas mantendo as chaves originais.
 *
 * @param obj O objeto original.
 * @param fn A função de transformação que recebe (valor, chave, objeto).
 * @returns Um novo objeto com os valores transformados.
 */
export declare function mapValues<T extends object, V>(obj: MaybeRefOrGetter<T>, fn: (value: T[keyof T], key: keyof T, object: T) => V): {
    [K in keyof T]: V;
};
//# sourceMappingURL=mapValues.d.ts.map