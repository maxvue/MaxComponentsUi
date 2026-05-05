export function getCached(key) {
    if (!key)
        return null;
    const data = localStorage.getItem(key);
    if (!data)
        return null;
    return JSON.parse(data).data;
}
