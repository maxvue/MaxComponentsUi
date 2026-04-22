import { type MaybeRef, unref } from 'vue';

type NumericValue = MaybeRef<string | number | null | undefined>;

export function isNumeric(value: NumericValue): boolean {
    const data = unref(value);
    if (data === null || data === undefined) return false;
    if (typeof data === 'string' && data.trim() === '') return false;
    return !Number.isNaN(Number(data));
}
