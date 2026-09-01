export function setCached(key: string | null, data: any) {
    if (!key) return;

    try {
        const data_save = { key: key, data: data };
        const clean_data = JSON.stringify(data_save);
        localStorage.setItem(key, clean_data);
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
    }
}
