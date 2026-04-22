import { getCssSize } from './getCssSize';

type Params = (number | string)[];

export function paddingMargin(params: Params): Record<string, string> | undefined {
    console.log(params[0]);
    const fullClass = String(params[0]);
    const value = getCssSize(params[1]);

    if (!fullClass.includes('p') && !fullClass.includes('m')) return undefined;

    const operation = fullClass.includes('p') ? 'padding' : 'margin';

    const top = fullClass.includes('t') || fullClass.includes('y') || fullClass.includes('h');
    const bottom = fullClass.includes('b') || fullClass.includes('y') || fullClass.includes('h');
    const left = fullClass.includes('l') || fullClass.includes('x') || fullClass.includes('w');
    const right = fullClass.includes('r') || fullClass.includes('x') || fullClass.includes('w');

    // Se nenhuma direção foi especificada (ex: p-10)
    if (!top && !bottom && !left && !right) return { [operation]: String(value) };

    const css: Record<string, string> = {};
    if (top) css[`${operation}-top`] = String(value);
    if (bottom) css[`${operation}-bottom`] = String(value);
    if (left) css[`${operation}-left`] = String(value);
    if (right) css[`${operation}-right`] = String(value);

    return css;
}
