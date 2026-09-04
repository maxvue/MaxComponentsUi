import { getCssSize } from './getCssSize';
import { hasContent } from '@maxvue/max-use';

type Params = (number | string)[];

/**
 * Resolve propriedades CSS de espaçamento (gap, row-gap, column-gap)
 * para o preset UnoCSS e utilitários de layout flex/grid.
 *
 * @param params - Vetor de captura regex do UnoCSS ou argumentos posicionais:
 *   - `params[0]`: Classe completa combinada (ex.: `'col-gap-4'`, `'row-gap-2'`).
 *   - `params[1]`: Identificador de direção (`'row'` para row-gap; `'col'`, `'column'` ou alias `'gap'` para column-gap).
 *   - `params[2]`: Valor dimensional numérico ou com unidade (ex.: `'10'`, `':10'`, `'2rem'`).
 * @returns Declaração CSS contendo `row-gap`, `column-gap` ou `gap`, ou objeto vazio caso inválido.
 *
 * @remarks
 * O modificador direcional `'gap'` é mantido como alias compatível para `column-gap`,
 * enquanto `'col'` e `'column'` são os identificadores canônicos gerados pelo preset.
 *
 * @example
 * ```typescript
 * gap(['row-gap-10', 'row', '10']); // { 'row-gap': '10px !important' }
 * gap(['col-gap-15', 'col', '15']); // { 'column-gap': '15px !important' }
 * gap(['column-gap-15', 'column', '15']); // { 'column-gap': '15px !important' }
 * gap(['gap-20', undefined, '20']); // { gap: '20px' }
 * ```
 */
export function gap(params: Params): Record<string, string> | {} {
    if (params.length < 3 || !hasContent(params[2])) return {};

    const gap_value = String(params[2]).replace(':', '');
    const direction = params[1] ? String(params[1]).toLowerCase() : '';

    if (direction === 'row') return { 'row-gap': getCssSize(gap_value) + ' !important' };
    if (direction === 'col' || direction === 'column' || direction === 'gap') return { 'column-gap': getCssSize(gap_value) + ' !important' };

    return { gap: getCssSize(gap_value) };
}
