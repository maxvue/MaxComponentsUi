import type { DomainSelectOption, PhaseValue, WireSizeValue, WireTypeValue } from '../types/domainInputs';

export const PHASE_OPTIONS: readonly DomainSelectOption<PhaseValue>[] = Object.freeze([
    { value: 1, label: 'Monofásico', name: 'Monofásico' },
    { value: 2, label: 'Bifásico', name: 'Bifásico' },
    { value: 3, label: 'Trifásico', name: 'Trifásico' }
]);

const RAW_WIRE_SIZES: readonly WireSizeValue[] = [
    0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000
];

function formatWireSizeLabel(size: number): string {
    const formatted = size.toString().replace('.', ',');
    return `${formatted} mm²`;
}

export const WIRE_SIZE_OPTIONS: readonly DomainSelectOption<WireSizeValue>[] = Object.freeze(
    RAW_WIRE_SIZES.map((size) => {
        const text = formatWireSizeLabel(size);
        return {
            value: size,
            label: text,
            name: text
        };
    })
);

export const WIRE_TYPE_OPTIONS: readonly DomainSelectOption<WireTypeValue>[] = Object.freeze([
    { value: 'copper-70', label: 'Cobre — PVC 70 °C', name: 'Cobre — PVC 70 °C' },
    { value: 'copper-90', label: 'Cobre — EPR/XLPE 90 °C', name: 'Cobre — EPR/XLPE 90 °C' },
    { value: 'aluminum-70', label: 'Alumínio — PVC 70 °C', name: 'Alumínio — PVC 70 °C' },
    { value: 'aluminum-90', label: 'Alumínio — EPR/XLPE 90 °C', name: 'Alumínio — EPR/XLPE 90 °C' }
]);
