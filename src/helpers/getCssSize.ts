export function getCssSize(value: string | number | Function): string {
    if (typeof value === 'number') return `${value}px`;
    if (typeof value === 'function') return value();

    return /^[0-9.]+$/.test(value) ? `${value}px` : value;
}
