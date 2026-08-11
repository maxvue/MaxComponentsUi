/**
 * Valida se uma URL é segura contra vetores de XSS (como javascript:, data:, vbscript:).
 * Permite apenas http, https, mailto, tel e caminhos relativos.
 */
export function isSafeUrl(url: string | null | undefined): boolean {
    if (!url) return false;

    // Remove caracteres nulos, espaços em branco e quebras de linha para evitar bypasses (ex: java\nscript:)
    const sanitizedUrl = url.replace(/[\x00-\x20\x7F-\x9F]+/g, '').trim();

    if (!sanitizedUrl) return false;

    // Se for caminho relativo (#hash, /path, ./path, ../path ou caminho simples sem esquema)
    if (/^(?:[#/.]|\w+[/\\])/i.test(sanitizedUrl) && !/^[a-z0-9+.-]+:/i.test(sanitizedUrl)) return true;


    // Esquemas permitidos explicitamente
    const safeSchemes = ['http:', 'https:', 'mailto:', 'tel:'];
    const lowerUrl = sanitizedUrl.toLowerCase();

    // Rejeitar expressamente esquemas conhecidos de execução de script / data perigosos
    if (/^(?:javascript|data|vbscript|file):/i.test(lowerUrl)) return false;


    return safeSchemes.some((scheme) => lowerUrl.startsWith(scheme));
}
