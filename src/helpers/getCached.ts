export function getCached(key: string | null): any | null {
    if (!key) return null;

    const data = localStorage.getItem(key);

    if (!data) return null;

    return JSON.parse(data).data;
}
