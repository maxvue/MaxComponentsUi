export function getCssSize(value: string | number | Function): string {
    if (typeof value === 'number') return `${value}px`;
    if (typeof value === 'function') {
        console.log('function', value);
        return value();
    }
    console.log('value', value);
    return /^[0-9.]+$/.test(value) ? `${value}px` : '0px';
}
