import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import axe from 'axe-core';
import {
    resolveAriaLabelledby,
    isElementAccessible,
    validateDialogA11y
} from '../../src/helpers/useAccessibleName';

describe('useAccessibleName no Chromium Real (R08)', () => {
    let container: HTMLElement;
    let styleTag: HTMLStyleElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'chromium-a11y-root';
        document.body.appendChild(container);

        styleTag = document.createElement('style');
        styleTag.textContent = `
            .css-hidden-display { display: none !important; }
            .css-hidden-visibility { visibility: hidden !important; }
            .css-visible-override { visibility: visible !important; }
        `;
        document.head.appendChild(styleTag);
    });

    afterEach(() => {
        if (container && container.parentNode) container.parentNode.removeChild(container);

        if (styleTag && styleTag.parentNode) styleTag.parentNode.removeChild(styleTag);

        document.body.innerHTML = '';
    });

    it('avalia CSS computado real pelo motor Blink do Chromium (display: none e visibility: hidden em stylesheet)', () => {
        const elDisplay = document.createElement('span');
        elDisplay.id = 'el-css-display';
        elDisplay.className = 'css-hidden-display';
        elDisplay.textContent = 'Oculto via StyleSheet';
        container.appendChild(elDisplay);

        const elVis = document.createElement('span');
        elVis.id = 'el-css-vis';
        elVis.className = 'css-hidden-visibility';
        elVis.textContent = 'Invisível via StyleSheet';
        container.appendChild(elVis);

        const elVisible = document.createElement('span');
        elVisible.id = 'el-css-ok';
        elVisible.textContent = 'Visível Normal';
        container.appendChild(elVisible);

        // O Chromium real calcula o CSS nas tags
        expect(isElementAccessible(elDisplay)).toBe(false);
        expect(isElementAccessible(elVis)).toBe(false);
        expect(isElementAccessible(elVisible)).toBe(true);

        // Referências explícitas de aria-labelledby preservam conteúdo oculto
        // pelo algoritmo de nome acessível; CSS não pode apagar IDREFs.
        const resolved = resolveAriaLabelledby('el-css-display el-css-vis el-css-ok');
        expect(resolved).toBe('el-css-display el-css-vis el-css-ok');
    });

    it('avalia suporte nativo a atributo inert e ancestrais inert no Chromium', () => {
        const inertSection = document.createElement('section');
        inertSection.setAttribute('inert', '');
        const titleInert = document.createElement('h3');
        titleInert.id = 'title-inside-inert';
        titleInert.textContent = 'Título Sob Inércia';
        inertSection.appendChild(titleInert);
        container.appendChild(inertSection);

        expect(isElementAccessible(titleInert)).toBe(false);
        expect(resolveAriaLabelledby('title-inside-inert')).toBe('title-inside-inert');
    });

    it('resolve múltiplos IDREFs no Chromium real e valida via page.getByRole', async () => {
        const part1 = document.createElement('h2');
        part1.id = 'dialog-part-1';
        part1.textContent = 'Painel Administrativo';
        container.appendChild(part1);

        const part2 = document.createElement('span');
        part2.id = 'dialog-part-2';
        part2.textContent = 'Configurações de Acesso';
        container.appendChild(part2);

        const dialog = document.createElement('div');
        dialog.id = 'test-dialog-chromium';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.style.display = 'block';
        dialog.style.width = '300px';
        dialog.style.height = '150px';
        dialog.textContent = 'Conteúdo do Diálogo no Chromium';

        // Múltiplos IDs intercalados com espaços extras e ID órfão
        const resolvedIds = resolveAriaLabelledby('dialog-part-1   id-fantasma-orfao   dialog-part-2');
        expect(resolvedIds).toBe('dialog-part-1 dialog-part-2');
        dialog.setAttribute('aria-labelledby', resolvedIds!);
        container.appendChild(dialog);

        // Validação da árvore de acessibilidade nativa do Chromium via page.getByRole
        const dialogLocator = page.getByRole('dialog', { name: 'Painel Administrativo Configurações de Acesso' });
        await expect.element(dialogLocator).toBeVisible();

        // Validação estrutural local; a auditoria axe-core é responsabilidade
        // do gate browser após a dependência ser provisionada.
        const a11yResult = validateDialogA11y(dialog);
        expect(a11yResult.passes).toBe(true);
        expect(a11yResult.accessibleName).toBe('Painel Administrativo Configurações de Acesso');
    });

    it('executa axe-core real mantendo IDREFs ocultos e ancestrais no nome do diálogo', async () => {
        const cssHidden = document.createElement('h2');
        cssHidden.id = 'axe-css-hidden-title';
        cssHidden.className = 'css-hidden-display';
        cssHidden.textContent = 'Título oculto por CSS';
        container.appendChild(cssHidden);

        const inertAncestor = document.createElement('section');
        inertAncestor.inert = true;
        const nestedTitle = document.createElement('span');
        nestedTitle.id = 'axe-inert-title';
        nestedTitle.textContent = ' complemento em ancestral inerte';
        inertAncestor.appendChild(nestedTitle);
        container.appendChild(inertAncestor);

        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', resolveAriaLabelledby('axe-css-hidden-title axe-inert-title')!);
        dialog.textContent = 'Conteúdo do diálogo';
        container.appendChild(dialog);

        const result = await axe.run(container, {
            runOnly: {
                type: 'rule',
                values: ['aria-dialog-name', 'aria-valid-attr-value']
            }
        });

        expect(result.violations).toEqual([]);

        // Mutação adversarial: o mesmo motor real deve acusar a perda de um
        // nome acessível, sem recorrer ao validador local.
        const action = document.createElement('button');
        action.setAttribute('aria-label', 'Confirmar alterações');
        container.appendChild(action);
        action.removeAttribute('aria-label');
        const mutated = await axe.run(container, {
            runOnly: {
                type: 'rule',
                values: ['button-name']
            }
        });
        expect(mutated.violations.some(({ id }) => id === 'button-name')).toBe(true);
    });

    it('descarta ID órfão e preserva conformidade WCAG do diálogo', () => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');

        // Consumidor passou apenas ID órfão
        const resolved = resolveAriaLabelledby('orfao-total');
        expect(resolved).toBeUndefined();

        // Diálogo não deve emitir aria-labelledby inválido, e sim aplicar fallback aria-label estável
        if (resolved) dialog.setAttribute('aria-labelledby', resolved);
        else dialog.setAttribute('aria-label', 'Diálogo Estável');

        container.appendChild(dialog);

        const a11yResult = validateDialogA11y(dialog);
        expect(a11yResult.passes).toBe(true);
        expect(a11yResult.accessibleName).toBe('Diálogo Estável');
    });
});
