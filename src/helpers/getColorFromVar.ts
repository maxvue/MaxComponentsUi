export function getColorFromVar(color_var_value: string) {
    color_var_value = color_var_value.replace(/^var\((--.*?)\)$/, '$1').trim();
    const root: HTMLElement = document.documentElement;
    const style: CSSStyleDeclaration = window.getComputedStyle(root);
    return style.getPropertyValue(color_var_value).trim();
}