import { getCssSize } from './getCssSize';
import { hasContent } from './hasContent';

type Params = (number | string)[];

export function gap(params: Params): Record<string, string> | {} {
    if (params.length < 3 || !hasContent(params[2])) return {};


    console.log(params[0], params[1], params[2]);

    const gap_value = String(params[2]).replace(':', '');
    if (params[1] && String(params[1]).toLowerCase() === 'row') return { 'row-gap': getCssSize(gap_value) };
    else if (params[1] && String(params[1]).toLowerCase() === 'gap') return { 'column-gap': getCssSize(gap_value) };


    return { gap: getCssSize(gap_value) };
}
