import { getCssSize } from './getCssSize';

type Params = (number | string)[];

/**
 * Resolve regras e atalhos de padding e margin para o preset UnoCSS (`presetMaxUno`).
 *
 * Suporta direções atômicas, eixos ortogonais padrão (`x`, `y`) e aliases dimensionais
 * de caixa (`w` para largura/horizontal, `h` para altura/vertical).
 *
 * @param params - Vetor de parâmetros fornecido pelo motor de regras do UnoCSS:
 *   - `params[0]`: Classe ou identificador contendo os modificadores de prefixo e eixo (ex.: `'p'`, `'pt'`, `'mx'`, `'ph'`, `'mw'`).
 *   - `params[1]`: Tamanho ou valor dimensional a ser processado por `getCssSize` (ex.: `10`, `'2rem'`).
 * @returns Objeto Record com as propriedades CSS e sufixo `!important`, ou `undefined` se a classe não contiver `'p'` nem `'m'`.
 *
 * @remarks
 * **Atenção aos modificadores dimensionais:**
 * - `'h'` refere-se a **Height (Altura / Vertical)**: aplica estilos simultâneos para `top` e `bottom` (equivalente ao eixo `y`). **Não** representa horizontal.
 * - `'w'` refere-se a **Width (Largura / Horizontal)**: aplica estilos simultâneos para `left` e `right` (equivalente ao eixo `x`).
 *
 * @example
 * ```typescript
 * paddingMargin(['p', 10]); // { padding: '10px !important' }
 * paddingMargin(['pt', 5]); // { 'padding-top': '5px !important' }
 * paddingMargin(['py', 8]); // { 'padding-top': '8px !important', 'padding-bottom': '8px !important' }
 * paddingMargin(['ph', 8]); // { 'padding-top': '8px !important', 'padding-bottom': '8px !important' }
 * paddingMargin(['pw', 8]); // { 'padding-left': '8px !important', 'padding-right': '8px !important' }
 * ```
 */
export function paddingMargin(params: Params): Record<string, string> | undefined {
    const fullClass = String(params[0]);
    const value = getCssSize(params[1]);

    if (!fullClass.includes('p') && !fullClass.includes('m')) return undefined;

    const operation = fullClass.includes('p') ? 'padding' : 'margin';

    const top = fullClass.includes('t') || fullClass.includes('y') || fullClass.includes('h');
    const bottom = fullClass.includes('b') || fullClass.includes('y') || fullClass.includes('h');
    const left = fullClass.includes('l') || fullClass.includes('x') || fullClass.includes('w');
    const right = fullClass.includes('r') || fullClass.includes('x') || fullClass.includes('w');

    // Se nenhuma direção foi especificada (ex: p-10)
    if (!top && !bottom && !left && !right) return { [operation]: String(value) + ' !important' };

    const css: Record<string, string> = {};
    if (top) css[`${operation}-top`] = String(value) + ' !important';
    if (bottom) css[`${operation}-bottom`] = String(value) + ' !important';
    if (left) css[`${operation}-left`] = String(value) + ' !important';
    if (right) css[`${operation}-right`] = String(value) + ' !important';

    return css;
}
