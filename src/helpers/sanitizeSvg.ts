import DOMPurify from 'dompurify';

/**
 * Regex de defesa em profundidade: detecta tags <script ou atributos on*= remanescentes.
 * Não substitui o DOMPurify (barreira principal), é uma checagem redundante e barata.
 */
const DANGEROUS_CONTENT_REGEX = /<script|\son\w+\s*=/i;

/**
 * Sanitiza um SVG recebido de fonte externa (API, MITM, cache local) antes de ser
 * armazenado em memória, persistido em cache ou injetado via v-html.
 *
 * Rejeita (retorna string vazia) quando:
 * - o conteúdo não começa (após trim) com `<svg` (case-insensitive);
 * - após a sanitização pelo DOMPurify, ainda restarem indícios de script/handlers inline.
 */
export function sanitizeSvg(raw: string | null | undefined): string {
    if (!raw) return '';

    const trimmed = raw.trim();
    if (!/^<svg/i.test(trimmed)) return '';

    const sanitized = DOMPurify.sanitize(trimmed, {
        USE_PROFILES: { svg: true, svgFilters: true }
    });

    if (DANGEROUS_CONTENT_REGEX.test(sanitized)) return '';

    return sanitized;
}
