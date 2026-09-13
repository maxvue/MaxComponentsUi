import DOMPurify from 'dompurify';

/**
 * Sanitiza trechos de HTML para exibição segura via innerHTML em componentes e diretivas.
 * Permite apenas uma allowlist estrita de elementos de formatação visual e texto.
 */
export function sanitizeHtml(raw: string | null | undefined): string {
    if (!raw) return '';

    if (typeof DOMPurify.sanitize === 'function') return DOMPurify.sanitize(raw, {
        ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'span', 'small', 'p', 'u', 'sub', 'sup', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel', 'src', 'alt', 'title', 'width', 'height']
    });


    if (typeof window !== 'undefined' && typeof (DOMPurify as any) === 'function') {
        const purify = (DOMPurify as any)(window);
        if (typeof purify?.sanitize === 'function') return purify.sanitize(raw, {
            ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'br', 'span', 'small', 'p', 'u', 'sub', 'sup', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'img'],
            ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'rel', 'src', 'alt', 'title', 'width', 'height']
        });

    }

    // Fallback para SSR em Node.js (remove scripts e event handlers inline)
    return raw.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');
}
