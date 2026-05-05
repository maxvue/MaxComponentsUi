export function setCached(key, data) {
    if (!key)
        return;
    const data_save = { key: key, data: data };
    const clean_data = JSON.stringify(data_save);
    localStorage.setItem(key, clean_data);
}
