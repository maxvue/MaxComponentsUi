export function normalizeToSearch (string: string) {
    if (!string) return '';

    return string
        .normalize('NFD') // separa letras de acentos
        .replace(/[\u0300-\u036f]/g, '') // remove os acentos
        .replace(/[^a-zA-Z0-9]/g, '') // remove caracteres especiais
        .replace(/\s+/g, '') // remove espaços
        .toLowerCase();
}
