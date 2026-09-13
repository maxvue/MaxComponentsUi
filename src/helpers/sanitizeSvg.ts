import DOMPurify from 'dompurify';

declare const __sanitizedSvgBrand: unique symbol;

/**
 * Tipo nominal seguro representando um SVG que atravessou com sucesso
 * a verificação do DOMPurify, DOMParser e inspeção de scripts/handlers.
 */
export type SanitizedSvg = string & { readonly [__sanitizedSvgBrand]: true };

/**
 * Sanitiza um SVG recebido de fonte externa (API, MITM, cache local) antes de ser
 * armazenado em memória, persistido em cache ou injetado via v-html.
 *
 * Rejeita (retorna string vazia) quando:
 * - o conteúdo não começa (após trim) com `<svg` (case-insensitive);
 * - após a sanitização pelo DOMPurify, ainda restarem elementos <script> ou atributos de evento inline on*.
 */
export function sanitizeSvg(raw: string | null | undefined): SanitizedSvg | '' {
    if (!raw) return '';

    const trimmed = raw.trim();
    if (!/^<svg/i.test(trimmed)) return '';

    const sanitized = DOMPurify.sanitize(trimmed, {
        USE_PROFILES: { svg: true, svgFilters: true }
    });

    if (!sanitized || typeof sanitized !== 'string') return '';

    // Inspeciona o DOM gerado para defesa em profundidade estrutural (evita falsos positivos em nós de texto)
    try {
        if (typeof DOMParser !== 'undefined') {
            const doc = new DOMParser().parseFromString(sanitized, 'image/svg+xml');

            // 1. Se contiver a tag <script> ou erro de parse que contenha script
            if (doc.getElementsByTagName('script').length > 0) {
                console.warn('[sanitizeSvg] SVG descartado por conter elemento <script> remanescente.');
                return '';
            }

            // 2. Inspeciona atributos de todos os elementos para proibir handlers inline (onload, onerror, onclick, etc)
            const allElements = doc.querySelectorAll('*');
            for (let i = 0; i < allElements.length; i++) {
                const el = allElements[i];
                for (let j = 0; j < el.attributes.length; j++) {
                    const attrName = el.attributes[j].name.toLowerCase();
                    if (/^on\w+/.test(attrName)) {
                        console.warn(`[sanitizeSvg] SVG descartado por conter atributo de evento inline: ${attrName}`);
                        return '';
                    }
                }
            }
        }
    } catch {
        // Se falhar o parse por qualquer motivo em ambiente exótico, cai para fallback seguro
        if (/<script/i.test(sanitized)) return '';
    }

    return sanitized as SanitizedSvg;
}
