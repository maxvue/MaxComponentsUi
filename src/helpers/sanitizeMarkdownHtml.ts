import DOMPurify from 'dompurify';

/**
 * Escapa caracteres HTML para exibição segura como texto puro em SSR ou fallback.
 */
export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const ALLOWED_TAGS = [
    'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'del',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre', 'ul', 'ol', 'li', 'hr',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img', 'span'
];

const ALLOWED_ATTR = [
    'href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'width', 'height'
];

/**
 * Valida se uma URL é segura para navegação ou carregamento de imagem.
 * Rejeita esquemas perigosos (javascript:, vbscript:, data:, blob:, file:).
 */
export function isSafeMarkdownUrl(url: string | null | undefined): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Bloqueia esquemas perigosos explicitamente
    if (/^(?:javascript|vbscript|data|blob|file):/i.test(trimmed)) return false;


    // Aceita URLs relativas e âncoras locais
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('#')) return true;


    // Aceita http, https, mailto e tel
    try {
        const parsed = new URL(trimmed, 'https://example.com');
        return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Sanitiza o HTML produzido por renderizadores de Markdown de acordo com a política de segurança C09.
 * Em ambiente SSR ou quando o ambiente de DOM seguro não estiver disponível, escapa o conteúdo como texto.
 */
export function sanitizeMarkdownHtml(rawHtml: string | null | undefined): string {
    if (!rawHtml) return '';

    // Se estiver em SSR (sem window ou document disponível), degrada estritamente para texto seguro escapado.
    if (typeof window === 'undefined' || typeof document === 'undefined') return escapeHtml(rawHtml);


    try {
        const purifier = (typeof DOMPurify.sanitize === 'function')
            ? DOMPurify
            : ((typeof (DOMPurify as any) === 'function') ? (DOMPurify as any)(window) : null);

        if (!purifier || typeof purifier.sanitize !== 'function') return escapeHtml(rawHtml);


        // Configuração estrita de sanitização
        const sanitized = purifier.sanitize(rawHtml, {
            ALLOWED_TAGS,
            ALLOWED_ATTR,
            ALLOW_DATA_ATTR: false,
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg', 'math'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style']
        });

        // Pós-processamento seguro via DOM Parser para adicionar atributos em links/imagens e filtrar URLs inseguras
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${sanitized}</div>`, 'text/html');
        const root = doc.body.firstElementChild;
        if (!root) return '';

        // Processar links
        const links = root.querySelectorAll('a');
        links.forEach((a) => {
            const href = a.getAttribute('href');
            if (!isSafeMarkdownUrl(href)) a.removeAttribute('href');
            else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });

        // Processar imagens
        const images = root.querySelectorAll('img');
        images.forEach((img) => {
            const src = img.getAttribute('src');
            if (!isSafeMarkdownUrl(src)) img.removeAttribute('src');
            else img.setAttribute('loading', 'lazy');

            if (!img.hasAttribute('alt')) img.setAttribute('alt', '');

        });

        return root.innerHTML;
    } catch {
        return escapeHtml(rawHtml);
    }
}
