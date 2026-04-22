export function getCssSize(value: string | number): string {
    if (typeof value === 'number') return `${value}px`;
    return /^[0-9.]+$/.test(value) ? `${value}px` : value;
}
