// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { sanitizeMarkdownHtml, isSafeMarkdownUrl, escapeHtml } from '../../src/helpers/sanitizeMarkdownHtml';

describe('sanitizeMarkdownHtml', () => {
    it('deve escapar caracteres HTML usando escapeHtml', () => {
        const raw = '<script>alert("xss")</script>&"\'';
        const escaped = escapeHtml(raw);
        expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#39;');
    });

    it('deve validar URLs seguras e rejeitar protocolos perigosos', () => {
        expect(isSafeMarkdownUrl('https://example.com/image.png')).toBe(true);
        expect(isSafeMarkdownUrl('http://example.com')).toBe(true);
        expect(isSafeMarkdownUrl('/relativo/caminho')).toBe(true);
        expect(isSafeMarkdownUrl('./local.png')).toBe(true);
        expect(isSafeMarkdownUrl('#secao')).toBe(true);
        expect(isSafeMarkdownUrl('mailto:test@example.com')).toBe(true);
        expect(isSafeMarkdownUrl('tel:+5511999999999')).toBe(true);

        expect(isSafeMarkdownUrl('javascript:alert(1)')).toBe(false);
        expect(isSafeMarkdownUrl('vbscript:msgbox')).toBe(false);
        expect(isSafeMarkdownUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
        expect(isSafeMarkdownUrl('blob:http://example.com/uuid')).toBe(false);
        expect(isSafeMarkdownUrl('file:///etc/passwd')).toBe(false);
        expect(isSafeMarkdownUrl('')).toBe(false);
        expect(isSafeMarkdownUrl(null)).toBe(false);
    });

    it('deve remover scripts e event handlers maliciosos de HTML', () => {
        const malicious = '<p>Texto seguro<script>alert("hack")</script><img src="x" onerror="alert(1)" /></p>';
        const result = sanitizeMarkdownHtml(malicious);
        expect(result).not.toContain('<script');
        expect(result).not.toContain('onerror');
        expect(result).toContain('Texto seguro');
    });

    it('deve adicionar target e rel seguros a links externos', () => {
        const html = '<p><a href="https://example.com">Link externo</a></p>';
        const result = sanitizeMarkdownHtml(html);
        expect(result).toContain('target="_blank"');
        expect(result).toContain('rel="noopener noreferrer"');
        expect(result).toContain('href="https://example.com"');
    });

    it('deve remover href com protocolo inseguro como javascript:', () => {
        const html = '<p><a href="javascript:stealData()">Clique aqui</a></p>';
        const result = sanitizeMarkdownHtml(html);
        expect(result).not.toContain('href="javascript:');
        expect(result).toContain('Clique aqui');
    });

    it('deve adicionar loading="lazy" e alt vazio se ausente em imagens seguras', () => {
        const html = '<p><img src="https://example.com/logo.png" /></p>';
        const result = sanitizeMarkdownHtml(html);
        expect(result).toContain('loading="lazy"');
        expect(result).toContain('alt=""');
    });

    it('deve permitir tabelas, cabeçalhos e listas', () => {
        const html = `
            <h2>Título</h2>
            <ul><li>Item 1</li></ul>
            <table>
                <thead><tr><th>Col</th></tr></thead>
                <tbody><tr><td>Val</td></tr></tbody>
            </table>
        `;
        const result = sanitizeMarkdownHtml(html);
        expect(result).toContain('<h2>Título</h2>');
        expect(result).toContain('<ul><li>Item 1</li></ul>');
        expect(result).toContain('<table>');
        expect(result).toContain('<th>Col</th>');
    });
});
