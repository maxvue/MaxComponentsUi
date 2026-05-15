import Color from 'color';
import type { ColorInstance } from 'color';

export function getColorFromVar(color_var_value: string): ColorInstance {
    color_var_value = String(color_var_value).trim();

    if (color_var_value.startsWith('rgb')) return Color(color_var_value);

    if (! color_var_value.startsWith('--') && ! color_var_value.includes('var')) return Color(color_var_value);

    color_var_value = color_var_value.replace(/^var\((--.*?)\)$/, '$1').trim();

    const root: HTMLElement = document.documentElement;
    const style: CSSStyleDeclaration = window.getComputedStyle(root);
    return Color(style.getPropertyValue(color_var_value).trim());
}