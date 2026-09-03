import { describe, it, expect } from 'vitest';
import { svgToDataUri } from '../../src/helpers/svgToDataUri';

describe('svgToDataUri', () => {
    it('converte string SVG simples em Data URI base64 válida', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
        const uri = svgToDataUri(svg);

        expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);

        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');
        expect(decoded).toBe(svg);
    });

    it('remove prólogo XML (<?xml ...?>) antes da codificação', () => {
        const svgWithXml = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>';
        const uri = svgToDataUri(svgWithXml);

        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

        expect(decoded).not.toContain('<?xml');
        expect(decoded).toMatch(/^<svg/);
        expect(decoded).toContain('<rect width="10" height="10"/>');
    });

    it('remove declaração DOCTYPE antes da codificação', () => {
        const svgWithDoctype = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
        const uri = svgToDataUri(svgWithDoctype);

        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

        expect(decoded).not.toContain('<!DOCTYPE');
        expect(decoded).toMatch(/^<svg/);
        expect(decoded).toContain('<circle r="5"/>');
    });

    it('remove comentários XML (<!-- ... -->) antes da codificação', () => {
        const svgWithComments = '<!-- Creator: CorelDRAW -->\n<svg xmlns="http://www.w3.org/2000/svg"><!-- comment --><path d="M0 0"/></svg>';
        const uri = svgToDataUri(svgWithComments);

        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

        expect(decoded).not.toContain('<!--');
        expect(decoded).not.toContain('CorelDRAW');
        expect(decoded).toMatch(/^<svg/);
    });

    it('remove prólogo XML, DOCTYPE e comentários combinados', () => {
        const rawSvg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<!-- Creator: CorelDRAW -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 430">
    <rect width="700" height="430" fill="#336699"/>
</svg>`;

        const uri = svgToDataUri(rawSvg);
        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

        expect(decoded).not.toContain('<?xml');
        expect(decoded).not.toContain('<!DOCTYPE');
        expect(decoded).not.toContain('<!--');
        expect(decoded).toMatch(/^<svg/);
        expect(decoded).toContain('fill="#336699"');
    });

    it('retorna string vazia para entradas nulas, indefinidas ou vazias', () => {
        expect(svgToDataUri('')).toBe('');
        expect(svgToDataUri(null as any)).toBe('');
        expect(svgToDataUri(undefined as any)).toBe('');
        expect(svgToDataUri('   ')).toBe('');
    });

    it('suporta caracteres UTF-8 e acentuação', () => {
        const svgUtf8 = '<svg xmlns="http://www.w3.org/2000/svg"><text>Cartão de Crédito</text></svg>';
        const uri = svgToDataUri(svgUtf8);

        const base64Data = uri.replace('data:image/svg+xml;base64,', '');
        const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

        expect(decoded).toContain('Cartão de Crédito');
    });
});
