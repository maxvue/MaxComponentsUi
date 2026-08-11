import DOMPurify from 'dompurify';

/**
 * Sanitiza trechos de HTML para exibição segura via innerHTML em componentes e diretivas.
 * Permite apenas uma allowlist estrita de elementos de formatação visual e texto.
 */
export function sanitizeHtml(raw: string | null | undefined): string {
    if (!raw) return '';

    return DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'span', 'small', 'p', 'u', 'sub', 'sup', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel', 'src', 'alt', 'title', 'width', 'height']
    });
}
