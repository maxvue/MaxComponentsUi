export async function getCached(key: string | null): Promise<any> {
    if (!key) return null;

    try {
        const data = localStorage.getItem(key);
        if (!data) return null;

        return JSON.parse(data).data;
    } catch (error) {
        console.error('Erro ao ler localStorage:', error);
        return null;
    }
}
