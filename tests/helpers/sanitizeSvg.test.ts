// @vitest-environment jsdom
//
// Este arquivo roda em jsdom, e não no happy-dom padrão do projeto, de propósito.
// O DOMPurify depende de `createNodeIterator` respeitar o bitmask `whatToShow` para
// percorrer a árvore. O happy-dom ignora esse bitmask, e o resultado é que o DOMPurify
// vira efetivamente um no-op nesse ambiente: ele desembrulha elementos seguros
// (`<p>ok</p>` -> `ok`) enquanto deixa passar `<script>` e `<iframe src="javascript:">`.
// Asserções de sanitização feitas sob happy-dom testam esse comportamento quebrado,
// não o comportamento real em navegador. Veja o relatório da Etapa 5 (Fix round 1).

import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../../src/helpers/sanitizeSvg';

describe('sanitizeSvg', () => {
    it('preserva o elemento <svg> raiz e o conteúdo seguro (asserção positiva)', () => {
        const out = sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24"/></svg>');

        // O <svg> raiz precisa sobreviver: MaxIcon.vue injeta isso via v-html num
        // <div> puro, e um <path> solto fora de um <svg> não renderiza nada.
        expect(out).toContain('<svg');
        expect(out).toContain('<path');
        expect(out).toContain('d="M0 0h24"');
    });

    it('remove handlers inline preservando o markup seguro ao redor', () => {
        const out = sanitizeSvg('<svg onload="alert(1)"><path d="M0 0"/></svg>');

        expect(out).toContain('<svg');
        expect(out).toContain('<path');
        expect(out).not.toMatch(/\son\w+\s*=/i);
        expect(out).not.toContain('alert');
    });

    it('neutraliza xlink:href com scheme javascript:', () => {
        const out = sanitizeSvg('<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>');

        expect(out).toContain('<svg');
        expect(out).not.toContain('javascript:');
    });

    it('remove payloads baseados em <animate> e <set>', () => {
        const animate = sanitizeSvg('<svg><animate attributeName="href" values="javascript:alert(1)"/></svg>');
        expect(animate).toContain('<svg');
        expect(animate).not.toContain('javascript:');
        expect(animate).not.toContain('<animate');

        const set = sanitizeSvg('<svg><set attributeName="onmouseover" to="alert(1)"/></svg>');
        expect(set).toContain('<svg');
        expect(set).not.toContain('<set');
        expect(set).not.toContain('alert');
    });

    it('rejeita conteúdo que não começa com <svg>', () => {
        expect(sanitizeSvg('<div>oi</div>')).toBe('');
        expect(sanitizeSvg('texto puro')).toBe('');
        expect(sanitizeSvg('')).toBe('');
        expect(sanitizeSvg(null)).toBe('');
        expect(sanitizeSvg(undefined)).toBe('');
    });

    it('descarta o conteúdo inteiro se um <script> sobreviver (defesa em profundidade)', () => {
        const out = sanitizeSvg('<svg><script>alert(2)</script><path d="M0 0"/></svg>');
        expect(out).not.toContain('<script');
        expect(out).not.toContain('alert');
    });
});
