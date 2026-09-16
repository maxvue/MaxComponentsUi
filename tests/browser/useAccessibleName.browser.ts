import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import axe from 'axe-core';
import {
    resolveAriaLabelledby,
    isElementAccessible,
    validateDialogA11y,
    runAxeCoreDialogValidation,
    computeAccessibleName
} from '../../src/helpers/useAccessibleName';

describe('useAccessibleName no Chromium Real com axe-core (R08)', () => {
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

        const resolved = resolveAriaLabelledby('el-css-display el-css-vis el-css-ok');
        expect(resolved).toBe('el-css-ok');
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
        expect(resolveAriaLabelledby('title-inside-inert')).toBeUndefined();
    });

    it('resolve múltiplos IDREFs no Chromium real e valida via page.getByRole e axe-core real', async () => {
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

        // Validação combinada: helper canônico e axe-core real no motor do navegador
        const a11yResult = validateDialogA11y(dialog);
        expect(a11yResult.passes).toBe(true);
        expect(a11yResult.accessibleName).toBe('Painel Administrativo Configurações de Acesso');

        const axeValidation = await runAxeCoreDialogValidation(dialog, axe);
        expect(axeValidation.passes).toBe(true);
        expect(axeValidation.violations).toHaveLength(0);
    });

    it('descarta ID órfão e preserva conformidade WCAG do diálogo validada por axe-core', async () => {
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');

        // Consumidor passou apenas ID órfão
        const resolved = resolveAriaLabelledby('orfao-total');
        expect(resolved).toBeUndefined();

        // Diálogo não deve emitir aria-labelledby inválido, e sim aplicar fallback aria-label estável
        if (resolved) dialog.setAttribute('aria-labelledby', resolved);
        else dialog.setAttribute('aria-label', 'Diálogo Estável');

        dialog.style.display = 'block';
        dialog.style.width = '200px';
        dialog.style.height = '100px';
        container.appendChild(dialog);

        const a11yResult = validateDialogA11y(dialog);
        expect(a11yResult.passes).toBe(true);
        expect(a11yResult.accessibleName).toBe('Diálogo Estável');

        const axeValidation = await runAxeCoreDialogValidation(dialog, axe);
        expect(axeValidation.passes).toBe(true);
        expect(axeValidation.violations).toHaveLength(0);
    });

    it('reprova via axe-core real quando diálogo não possui nome acessível (aria-dialog-name)', async () => {
        const dialogSemNome = document.createElement('div');
        dialogSemNome.setAttribute('role', 'dialog');
        dialogSemNome.style.display = 'block';
        dialogSemNome.style.width = '200px';
        dialogSemNome.style.height = '100px';
        // Sem aria-label, sem aria-labelledby e sem qualquer texto visível interno
        container.appendChild(dialogSemNome);

        // O validador canônico e o axe-core real acusam violação aria-dialog-name
        const a11yResult = validateDialogA11y(dialogSemNome);
        expect(a11yResult.passes).toBe(false);
        expect(a11yResult.violations.some((v) => v.id === 'aria-dialog-name')).toBe(true);

        const axeValidation = await runAxeCoreDialogValidation(dialogSemNome, axe);
        expect(axeValidation.passes).toBe(false);
        expect(axeValidation.violations.some((v) => v.id === 'aria-dialog-name')).toBe(true);
    });

    it('cenário slot vazio: elemento de slot com whitespace puro é descartado e aciona fallback acessível no Chromium', async () => {
        // Simula slot de cabeçalho renderizando apenas elementos vazios ou com espaço
        const slotEl = document.createElement('h2');
        slotEl.id = 'slot-header-vazio';
        slotEl.innerHTML = '   <span>   </span> \n\t  ';
        container.appendChild(slotEl);

        // resolveAriaLabelledby deve descartar nó vazio
        const resolved = resolveAriaLabelledby('slot-header-vazio');
        expect(resolved).toBeUndefined();

        // Diálogo adota fallback e define dimensões visíveis
        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-label', 'Diálogo com Fallback de Slot');
        dialog.style.display = 'block';
        dialog.style.width = '250px';
        dialog.style.height = '120px';
        dialog.textContent = 'Corpo do diálogo';
        container.appendChild(dialog);

        expect(computeAccessibleName(dialog)).toBe('Diálogo com Fallback de Slot');

        const axeValidation = await runAxeCoreDialogValidation(dialog, axe);
        expect(axeValidation.passes).toBe(true);
    });

    it('cenário ancestral oculto por CSS/inert: descarta nós inacessíveis e aceita referências externas válidas', async () => {
        // Ancestral com display: none contendo idref
        const hiddenSection = document.createElement('section');
        hiddenSection.style.display = 'none';
        const hiddenHeader = document.createElement('h3');
        hiddenHeader.id = 'ext-hidden-header';
        hiddenHeader.textContent = 'Título Oculto';
        hiddenSection.appendChild(hiddenHeader);
        container.appendChild(hiddenSection);

        // Ancestral com inert contendo idref
        const inertSection = document.createElement('section');
        inertSection.setAttribute('inert', '');
        const inertHeader = document.createElement('h3');
        inertHeader.id = 'ext-inert-header';
        inertHeader.textContent = 'Título Inerte';
        inertSection.appendChild(inertHeader);
        container.appendChild(inertSection);

        // Referência externa visível e acessível fora do contêiner do diálogo
        const externalValidHeader = document.createElement('h2');
        externalValidHeader.id = 'ext-external-header';
        externalValidHeader.textContent = 'Referência Externa Válida';
        container.appendChild(externalValidHeader);

        // Resolução com múltiplos IDREFs: deve filtrar os ocultos/inertes e manter apenas o externo válido
        const resolved = resolveAriaLabelledby('ext-hidden-header ext-inert-header ext-external-header');
        expect(resolved).toBe('ext-external-header');

        const dialog = document.createElement('div');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', resolved!);
        dialog.style.display = 'block';
        dialog.style.width = '250px';
        dialog.style.height = '120px';
        dialog.textContent = 'Corpo com ref externa';
        container.appendChild(dialog);

        expect(computeAccessibleName(dialog)).toBe('Referência Externa Válida');

        const axeValidation = await runAxeCoreDialogValidation(dialog, axe);
        expect(axeValidation.passes).toBe(true);
        expect(axeValidation.violations).toHaveLength(0);
    });
});

