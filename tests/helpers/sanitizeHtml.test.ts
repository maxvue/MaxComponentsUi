// @vitest-environment jsdom
//
// Este arquivo roda em jsdom, e não no happy-dom padrão do projeto, de propósito.
// O DOMPurify depende de `createNodeIterator` respeitar o bitmask `whatToShow` para
// percorrer a árvore. O happy-dom ignora esse bitmask, e o resultado é que o DOMPurify
// vira efetivamente um no-op nesse ambiente: ele desembrulha elementos seguros
// (`<p>ok</p>` -> `ok`) enquanto deixa passar `<script>` e `<iframe src="javascript:">`.
// Asserções de sanitização feitas sob happy-dom testam esse comportamento quebrado,
// não o comportamento real em navegador. Não troque este cabeçalho por happy-dom.

import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../src/helpers/sanitizeHtml';

describe('sanitizeHtml', () => {
    describe('entradas vazias', () => {
        it('retorna string vazia para null, undefined e ""', () => {
            expect(sanitizeHtml(null)).toBe('');
            expect(sanitizeHtml(undefined)).toBe('');
            expect(sanitizeHtml('')).toBe('');
        });
    });

    describe('allowlist de tags (asserções positivas)', () => {
        // Cada tag da ALLOWED_TAGS precisa sobreviver. Sem estas asserções, remover
        // qualquer uma delas do helper mantém a suíte verde.
        it.each([
            ['b', '<b>texto</b>'],
            ['strong', '<strong>texto</strong>'],
            ['i', '<i>texto</i>'],
            ['em', '<em>texto</em>'],
            ['span', '<span>texto</span>'],
            ['small', '<small>texto</small>'],
            ['p', '<p>texto</p>'],
            ['u', '<u>texto</u>'],
            ['sub', '<sub>texto</sub>'],
            ['sup', '<sup>texto</sup>'],
            ['code', '<code>texto</code>'],
            ['pre', '<pre>texto</pre>']
        ])('preserva <%s> e o seu conteúdo', (tag, input) => {
            const out = sanitizeHtml(input);

            expect(out).toContain(`<${tag}`);
            expect(out).toContain(`</${tag}>`);
            expect(out).toContain('texto');
        });

        it('preserva <br>', () => {
            const out = sanitizeHtml('antes<br>depois');

            expect(out).toMatch(/<br\s*\/?>/i);
            expect(out).toContain('antes');
            expect(out).toContain('depois');
        });

        it('preserva listas <ul>, <ol> e <li>', () => {
            const semOrdem = sanitizeHtml('<ul><li>um</li><li>dois</li></ul>');

            expect(semOrdem).toContain('<ul');
            expect(semOrdem).toContain('<li');
            expect(semOrdem).toContain('um');
            expect(semOrdem).toContain('dois');

            const comOrdem = sanitizeHtml('<ol><li>um</li></ol>');

            expect(comOrdem).toContain('<ol');
            expect(comOrdem).toContain('<li');
        });

        it('preserva <a> com href, target e rel', () => {
            const out = sanitizeHtml('<a href="https://exemplo.com" target="_blank" rel="noopener">link</a>');

            expect(out).toContain('<a');
            expect(out).toContain('href="https://exemplo.com"');
            expect(out).toContain('target="_blank"');
            expect(out).toContain('rel="noopener"');
            expect(out).toContain('link');
        });

        it('preserva <img> com src, alt, width e height', () => {
            const out = sanitizeHtml('<img src="https://exemplo.com/a.png" alt="alt" width="10" height="20">');

            expect(out).toContain('<img');
            expect(out).toContain('src="https://exemplo.com/a.png"');
            expect(out).toContain('alt="alt"');
            expect(out).toContain('width="10"');
            expect(out).toContain('height="20"');
        });
    });

    describe('allowlist de atributos', () => {
        it('preserva class, style e title', () => {
            const out = sanitizeHtml('<span class="c1" style="color: red" title="t">x</span>');

            expect(out).toContain('class="c1"');
            expect(out).toContain('style=');
            expect(out).toContain('color: red');
            expect(out).toContain('title="t"');
        });

        it('remove atributos fora da allowlist preservando os permitidos', () => {
            const out = sanitizeHtml('<span id="i" role="button" class="c1">x</span>');

            expect(out).toContain('class="c1"');
            expect(out).not.toContain('id="i"');
            expect(out).not.toContain('role=');
            expect(out).toContain('x');
        });

        it('mantém atributos data-* (padrão ALLOW_DATA_ATTR do DOMPurify)', () => {
            // Documenta comportamento real, não desejo: o DOMPurify libera `data-*`
            // independentemente da ALLOWED_ATTR, porque `ALLOW_DATA_ATTR` é `true` por
            // padrão. São atributos inertes (não executam nada), então isso não abre
            // vetor de XSS — mas quem ler a allowlist do helper pode presumir o
            // contrário. Se um dia isso precisar mudar, é passando
            // `ALLOW_DATA_ATTR: false` em sanitizeHtml.ts, e este teste é quem avisa.
            const out = sanitizeHtml('<span data-x="1">x</span>');

            expect(out).toContain('data-x="1"');
        });
    });

    describe('tags perigosas (asserções negativas)', () => {
        it.each([
            ['script', '<script>alert(1)</script>'],
            ['iframe', '<iframe src="https://mal.com"></iframe>'],
            ['object', '<object data="x.swf"></object>'],
            ['embed', '<embed src="x.swf">'],
            ['form', '<form action="/x"><input name="a"></form>'],
            ['style', '<style>body{display:none}</style>']
        ])('remove <%s>', (tag, input) => {
            const out = sanitizeHtml(input);

            expect(out).not.toMatch(new RegExp(`<${tag}`, 'i'));
        });

        it('remove <script> mas preserva o texto ao redor', () => {
            const out = sanitizeHtml('antes<script>alert(1)</script>depois');

            expect(out).not.toMatch(/<script/i);
            expect(out).not.toContain('alert(1)');
            expect(out).toContain('antes');
            expect(out).toContain('depois');
        });

        it('remove <input> solto', () => {
            const out = sanitizeHtml('<input name="a">');

            expect(out).not.toMatch(/<input/i);
        });

        it('remove tags fora da allowlist preservando o conteúdo de texto', () => {
            const div = sanitizeHtml('<div>conteudo</div>');

            expect(div).not.toMatch(/<div/i);
            expect(div).toContain('conteudo');

            const titulo = sanitizeHtml('<h1>titulo</h1>');

            expect(titulo).not.toMatch(/<h1/i);
            expect(titulo).toContain('titulo');
        });
    });

    describe('handlers inline e URLs perigosas', () => {
        it.each([
            ['onerror', '<img src="x" onerror="alert(1)">'],
            ['onload', '<img src="x" onload="alert(1)">'],
            ['onclick', '<span onclick="alert(1)">x</span>']
        ])('remove o handler %s preservando o elemento', (_handler, input) => {
            const out = sanitizeHtml(input);

            expect(out).not.toMatch(/\son\w+\s*=/i);
            expect(out).not.toContain('alert(1)');
        });

        it('neutraliza href com scheme javascript:', () => {
            const out = sanitizeHtml('<a href="javascript:alert(1)">link</a>');

            expect(out).not.toContain('javascript:');
            expect(out).toContain('link');
        });
    });
});
