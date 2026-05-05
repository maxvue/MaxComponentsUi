import { getCssSize } from './getCssSize';

type Params = (number | string)[];

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
