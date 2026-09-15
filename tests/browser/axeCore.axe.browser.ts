import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

describe('gate axe-core no Chromium', () => {
    let host: HTMLElement | undefined;

    afterEach(() => host?.remove());

    it('executa o motor real e detecta a mutação de nome do diálogo', async () => {
        host = document.createElement('main');
        host.innerHTML = `
            <h1 id="axe-title">Configurações</h1>
            <div role="dialog" aria-modal="true" aria-labelledby="axe-title">
                <p>Conteúdo acessível.</p>
                <button type="button">Salvar</button>
            </div>`;
        document.body.appendChild(host);

        const options = { runOnly: { type: 'tag' as const, values: ['wcag2a', 'wcag2aa'] } };
        const approved = await axe.run(host, options);
        expect(approved.violations).toEqual([]);

        host.querySelector('button')!.textContent = '';
        const mutated = await axe.run(host, options);
        expect(mutated.violations.some(({ id }) => id === 'button-name')).toBe(true);
    });
});
