import { describe, it, expect } from 'vitest';
import { isSafeUrl } from '../../src/helpers/isSafeUrl';

describe('isSafeUrl', () => {
    it('permite URLs http e https validas', () => {
        expect(isSafeUrl('http://example.com')).toBe(true);
        expect(isSafeUrl('https://example.com/path?query=1#hash')).toBe(true);
    });

    it('permite esquemas mailto e tel', () => {
        expect(isSafeUrl('mailto:user@example.com')).toBe(true);
        expect(isSafeUrl('tel:+5511999999999')).toBe(true);
    });

    it('permite caminhos relativos e ancoras', () => {
        expect(isSafeUrl('#secao')).toBe(true);
        expect(isSafeUrl('/api/download')).toBe(true);
        expect(isSafeUrl('./relativo')).toBe(true);
        expect(isSafeUrl('../relativo')).toBe(true);
    });

    it('rejeita URLs maliciosas com javascript:, data:, vbscript: e file:', () => {
        expect(isSafeUrl('javascript:alert(1)')).toBe(false);
        expect(isSafeUrl('JAVASCRIPT:alert(document.cookie)')).toBe(false);
        expect(isSafeUrl('java\nscript:alert(1)')).toBe(false);
        expect(isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
        expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
        expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('retorna false para valores nulos ou vazios', () => {
        expect(isSafeUrl('')).toBe(false);
        expect(isSafeUrl(null)).toBe(false);
        expect(isSafeUrl(undefined)).toBe(false);
    });
});
