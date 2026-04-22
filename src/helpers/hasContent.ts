import { type Ref, unref } from 'vue';

type T = Record<string, any> | string | number | null | undefined;
export function hasContent(value: T | Ref<T>, if_zero: boolean = false): boolean {
    const data: any = unref(value);

    if (!data || data === 'null' || data === 'undefined') return false;
    if (typeof data === 'number') return data === 0 ? if_zero : true;
    if (typeof data === 'string') return data.trim().length > 0;
    if (Array.isArray(data)) return data.length > 0;
    if (String(data) !== '[object Object]') return String(data).length > 0;
    if (data instanceof Map || data instanceof Set) return data.size > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    return data.length > 0;
}
