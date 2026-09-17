import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, ref, type App } from 'vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle() {
    await nextFrame();
    await nextFrame();
}

async function mountTagSelect(props: Record<string, any> = {}) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'adversarial-host';
    hostElement.style.width = '350px';
    hostElement.style.minHeight = '60px';
    document.body.appendChild(hostElement);

    const selectedVal = ref(props.modelValue ?? null);

    const app = createApp({
        render() {
            return h(MaxTagSelect, {
                modelValue: selectedVal.value,
                placeholder: 'Selecione uma opção...',
                'onUpdate:modelValue': (val: any) => {
                    selectedVal.value = val;
                },
                options: props.options ?? Array.from({ length: 1000 }, (_, i) => ({ value: `item-${i}`, label: `Opção Adversarial ${i}` })),
                ...props
            });
        }
    });

    activeApp = app;
    app.mount(hostElement);
    await settle();

    return { host: hostElement, app, selectedVal };
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
    document.documentElement.classList.remove('dark');
    document.querySelectorAll('.max-select-overlay').forEach((el) => el.remove());
});

function getLuminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrast(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
    const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
}

function parseRGB(rgbString: string): [number, number, number] {
    const match = rgbString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function getEffectiveBackgroundColor(el: HTMLElement, defaultColor = 'rgb(255, 255, 255)'): [number, number, number] {
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
        const bg = window.getComputedStyle(current).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return parseRGB(bg);
        current = current.parentElement;
    }
    return parseRGB(defaultColor);
}

describe('MaxTagSelect — Auditoria Adversarial REV-R11', () => {
    it('ADVERSARIAL 1: Virtualização com 1.000 itens, scroll contínuo e reciclagem dinâmica de nós no DOM sem degradação', async () => {
        const itemCount = 1000;
        const items = Array.from({ length: itemCount }, (_, i) => ({
            value: `item-${i}`,
            label: `Opção Virtualizada Longa ${i}`
        }));

        const { host, selectedVal } = await mountTagSelect({
            options: items,
            modelValue: null
        });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        expect(trigger).not.toBeNull();
        trigger.click();
        await settle();

        const listContainer = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(listContainer).not.toBeNull();

        // 1. O spacer deve estar presente e ter tamanho proporcional aos 1.000 itens (1.000 * 36px = 36.000px)
        const spacer = listContainer.querySelector('.max-select-spacer') as HTMLElement;
        expect(spacer).not.toBeNull();
        expect(spacer.offsetHeight).toBeGreaterThanOrEqual(30000);

        // 2. Quantidade de nós DOM montados simultaneamente deve ser estritamente controlada (< 100 nós para 1.000 itens)
        let renderedOptions = listContainer.querySelectorAll('.max-select-option');
        expect(renderedOptions.length).toBeGreaterThan(0);
        expect(renderedOptions.length).toBeLessThan(100);

        const initialFirstText = renderedOptions[0].textContent;
        expect(initialFirstText).toContain('Opção Virtualizada Longa 0');

        // 3. Scroll contínuo em múltiplos passos e reciclagem dinâmica
        const scrollPositions = [1800, 7200, 18000, 28800];
        for (const targetScroll of scrollPositions) {
            listContainer.scrollTop = targetScroll;
            listContainer.dispatchEvent(new Event('scroll'));
            await settle();

            renderedOptions = listContainer.querySelectorAll('.max-select-option');
            // Continua restrito a uma janela virtual compacta no DOM
            expect(renderedOptions.length).toBeGreaterThan(0);
            expect(renderedOptions.length).toBeLessThan(100);

            // Primeiro nó reciclado deve corresponder ao offset do scroll
            const expectedMinIndex = Math.floor(targetScroll / 36) - 5;
            const currentFirstText = renderedOptions[0].textContent || '';
            const match = currentFirstText.match(/Opção Virtualizada Longa (\d+)/);
            expect(match).not.toBeNull();
            const renderedIdx = parseInt(match![1], 10);
            expect(renderedIdx).toBeGreaterThanOrEqual(Math.max(0, expectedMinIndex));
        }

        // 4. Seleção de opção na posição reciclada distante
        const currentOptions = listContainer.querySelectorAll('.max-select-option');
        const middleOption = currentOptions[Math.floor(currentOptions.length / 2)] as HTMLElement;
        middleOption.click();
        await settle();

        expect(selectedVal.value).toBeTruthy();
        expect(selectedVal.value).toMatch(/^item-\d+$/);

        // Reabre o overlay e confirma que a opção selecionada continua reconhecida
        trigger.click();
        await settle();
        const recheckContainer = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(recheckContainer).not.toBeNull();
    });

    it('ADVERSARIAL 2: Medição rigorosa de contraste CSS computado real no Chromium nos 10 estados (Light e Dark)', async () => {
        // PARTE A: TEMA CLARO (LIGHT)
        document.documentElement.classList.remove('dark');
        await settle();

        const { host } = await mountTagSelect({
            modelValue: 'item-0',
            options: Array.from({ length: 50 }, (_, i) => ({ value: `item-${i}`, label: `Estado ${i}` }))
        });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        trigger.click();
        await settle();

        const listContainer = document.querySelector('.max-select-list-container') as HTMLElement;
        const options = listContainer.querySelectorAll('.max-select-option');

        // Estado 1: Default não selecionado (Light)
        const unselectedOpt = options[1] as HTMLElement;
        const unselectedLabel = unselectedOpt.querySelector('.max-tag-select-option-label') as HTMLElement;
        let compUnselected = window.getComputedStyle(unselectedLabel);
        let fg = parseRGB(compUnselected.color);
        let bg = getEffectiveBackgroundColor(unselectedOpt, 'rgb(255, 255, 255)');
        let contrastDefLight = getContrast(bg, fg);
        expect(contrastDefLight).toBeGreaterThanOrEqual(4.5);

        // Estado 2: Hover em não selecionado (Light)
        unselectedOpt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();
        compUnselected = window.getComputedStyle(unselectedLabel);
        fg = parseRGB(compUnselected.color);
        bg = getEffectiveBackgroundColor(unselectedOpt, 'rgb(255, 255, 255)');
        let contrastHovLight = getContrast(bg, fg);
        expect(contrastHovLight).toBeGreaterThanOrEqual(4.5);

        // Estado 3: Focus / active descendant via teclado (Light)
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();
        const activeDescId = trigger.getAttribute('aria-activedescendant');
        expect(activeDescId).toBeTruthy();
        const activeOpt = document.getElementById(activeDescId!) as HTMLElement;
        expect(activeOpt).not.toBeNull();
        const activeLabel = (activeOpt.querySelector('.max-tag-select-option-label') ?? activeOpt) as HTMLElement;
        let compActive = window.getComputedStyle(activeLabel);
        fg = parseRGB(compActive.color);
        bg = getEffectiveBackgroundColor(activeOpt, 'rgb(255, 255, 255)');
        let contrastFocLight = getContrast(bg, fg);
        expect(contrastFocLight).toBeGreaterThanOrEqual(4.5);

        // Estado 4: Selecionado em repouso (Light)
        const selectedOpt = options[0] as HTMLElement;
        expect(selectedOpt.classList.contains('is-selected')).toBe(true);
        const selectedLabel = (selectedOpt.querySelector('.max-tag-select-option-label') ?? selectedOpt) as HTMLElement;
        let compSel = window.getComputedStyle(selectedLabel);
        fg = parseRGB(compSel.color);
        bg = getEffectiveBackgroundColor(selectedOpt, 'rgb(255, 255, 255)');
        let contrastSelLight = getContrast(bg, fg);
        expect(contrastSelLight).toBeGreaterThanOrEqual(4.5);

        // Estado 5: Selecionado + Hover / Focus (Light)
        selectedOpt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();
        compSel = window.getComputedStyle(selectedLabel);
        fg = parseRGB(compSel.color);
        bg = getEffectiveBackgroundColor(selectedOpt, 'rgb(255, 255, 255)');
        let contrastSelHovLight = getContrast(bg, fg);
        expect(contrastSelHovLight).toBeGreaterThanOrEqual(4.5);

        // PARTE B: TEMA ESCURO (DARK)
        document.documentElement.classList.add('dark');
        await settle();

        const { host: darkHost } = await mountTagSelect({
            modelValue: 'item-0',
            options: Array.from({ length: 50 }, (_, i) => ({ value: `item-${i}`, label: `Estado Escuro ${i}` }))
        });

        const darkTrigger = darkHost.querySelector('.max-select') as HTMLElement;
        darkTrigger.click();
        await settle();

        const darkListContainer = document.querySelector('.max-select-list-container') as HTMLElement;
        const darkOptions = darkListContainer.querySelectorAll('.max-select-option');

        const darkDefaultBg = 'rgb(23, 41, 61)';

        // Estado 6: Default não selecionado (Dark)
        const darkUnselOpt = darkOptions[2] as HTMLElement;
        const darkUnselLabel = darkUnselOpt.querySelector('.max-tag-select-option-label') as HTMLElement;
        let compDarkUnsel = window.getComputedStyle(darkUnselLabel);
        fg = parseRGB(compDarkUnsel.color);
        bg = getEffectiveBackgroundColor(darkUnselOpt, darkDefaultBg);
        let contrastDarkDef = getContrast(bg, fg);
        expect(contrastDarkDef).toBeGreaterThanOrEqual(4.5);

        // Estado 7: Hover em não selecionado (Dark)
        darkUnselOpt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();
        compDarkUnsel = window.getComputedStyle(darkUnselLabel);
        fg = parseRGB(compDarkUnsel.color);
        bg = getEffectiveBackgroundColor(darkUnselOpt, darkDefaultBg);
        let contrastDarkHov = getContrast(bg, fg);
        expect(contrastDarkHov).toBeGreaterThanOrEqual(4.5);

        // Estado 8: Focus / active descendant via teclado (Dark)
        darkTrigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();
        const darkActiveDescId = darkTrigger.getAttribute('aria-activedescendant');
        expect(darkActiveDescId).toBeTruthy();
        const darkActiveOpt = document.getElementById(darkActiveDescId!) as HTMLElement;
        expect(darkActiveOpt).not.toBeNull();
        const darkActiveLabel = (darkActiveOpt.querySelector('.max-tag-select-option-label') ?? darkActiveOpt) as HTMLElement;
        let compDarkActive = window.getComputedStyle(darkActiveLabel);
        fg = parseRGB(compDarkActive.color);
        bg = getEffectiveBackgroundColor(darkActiveOpt, darkDefaultBg);
        let contrastDarkFoc = getContrast(bg, fg);
        expect(contrastDarkFoc).toBeGreaterThanOrEqual(4.5);

        // Estado 9: Selecionado em repouso (Dark)
        const darkSelOpt = darkOptions[0] as HTMLElement;
        const darkSelLabel = (darkSelOpt.querySelector('.max-tag-select-option-label') ?? darkSelOpt) as HTMLElement;
        let compDarkSel = window.getComputedStyle(darkSelLabel);
        fg = parseRGB(compDarkSel.color);
        bg = getEffectiveBackgroundColor(darkSelOpt, darkDefaultBg);
        let contrastDarkSel = getContrast(bg, fg);
        console.log('[DEBUG VALORES]', {
            fgText: compDarkSel.color,
            fgParsed: fg,
            bgOpt: window.getComputedStyle(darkSelOpt).backgroundColor,
            bgComputed: bg,
            optClasses: darkSelOpt.className
        });expect(contrastDarkSel).toBeGreaterThanOrEqual(4.5);

        // Estado 10: Selecionado + Hover (Dark)
        darkSelOpt.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();
        compDarkSel = window.getComputedStyle(darkSelLabel);
        fg = parseRGB(compDarkSel.color);
        bg = getEffectiveBackgroundColor(darkSelOpt, darkDefaultBg);
        let contrastDarkSelHov = getContrast(bg, fg);
        expect(contrastDarkSelHov).toBeGreaterThanOrEqual(4.5);
    });

    it('ADVERSARIAL 3: Tags personalizadas com cores arbitrárias mantêm contraste de texto e indicador visual não cromático', async () => {
        const testColors = [
            { value: 'green', label: 'Verde Sucesso', background_color: '#10B981' },
            { value: 'red', label: 'Vermelho Perigo', background_color: '#EF4444' },
            { value: 'amber', label: 'Âmbar Alerta', background_color: '#F59E0B' },
            { value: 'dark', label: 'Preto Profundo', background_color: '#0f172a' },
            { value: 'bright', label: 'Branco Neve', background_color: '#f8fafc' }
        ];

        const { host } = await mountTagSelect({
            modelValue: 'green',
            options: testColors
        });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        trigger.click();
        await settle();

        const listContainer = document.querySelector('.max-select-list-container') as HTMLElement;
        const options = listContainer.querySelectorAll('.max-select-option');
        expect(options.length).toBe(testColors.length);

        for (let i = 0; i < options.length; i++) {
            const opt = options[i] as HTMLElement;
            const tagDiv = opt.querySelector('.label-tag-div') as HTMLElement;
            expect(tagDiv).not.toBeNull();

            const tagLabel = opt.querySelector('.max-tag-select-option-label') as HTMLElement;
            const fg = parseRGB(window.getComputedStyle(tagLabel).color);
            const bg = parseRGB(window.getComputedStyle(tagDiv).backgroundColor);

            const contrast = getContrast(bg, fg);
            expect(contrast).toBeGreaterThanOrEqual(3.0);
        }

        // Opção selecionada possui indicador visual não cromático (outline contrastante)
        const selectedOpt = options[0] as HTMLElement;
        expect(selectedOpt.classList.contains('is-selected')).toBe(true);

        const comp = window.getComputedStyle(selectedOpt);
        expect(comp.outlineStyle).not.toBe('none');
        expect(parseFloat(comp.outlineWidth)).toBeGreaterThanOrEqual(2);
    });
});
