import { describe, it, expect, afterEach } from 'vitest';
import { userEvent } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import { createPinia } from 'pinia';
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
    hostElement.id = 'test-host';
    hostElement.style.width = '300px';
    hostElement.style.minHeight = '60px';
    document.body.appendChild(hostElement);

    const selectedVal = ref(props.modelValue ?? null);

    const app = createApp({
        render() {
            return h(MaxTagSelect, {
                modelValue: selectedVal.value,
                placeholder: 'Selecione uma tag...',
                'onUpdate:modelValue': (val: any) => {
                    selectedVal.value = val;
                },
                options: props.options ?? Array.from({ length: 1000 }, (_, i) => ({ value: `id-${i}`, label: `Option ${i}` })),
                ...props
            });
        }
    });

    activeApp = app;
    app.use(createPinia());
    app.directive('tooltip', {});
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

// Helper WCAG AA para cálculo de luminância e contraste relativo
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

describe('MaxTagSelect no Chromium (R11 / F16)', () => {
    it('opera isButton por Tab, Enter e Espaço sem emissão duplicada e respeita disabled', async () => {
        let beforeShowCalls = 0;
        const { host } = await mountTagSelect({
            isButton: true,
            icon: 'mdi:tag',
            placeholder: 'Gerenciar categorias',
            onBeforeShow: () => {
                beforeShowCalls += 1;
            }
        });

        const button = host.querySelector('button.max-icon-button') as HTMLButtonElement;
        expect(button).not.toBeNull();
        expect(button.getAttribute('aria-label')).toBe('Gerenciar categorias');

        await userEvent.keyboard('{Tab}');
        expect(document.activeElement).toBe(button);

        await userEvent.keyboard('{Enter}');
        await settle();
        expect(document.querySelector('[role="listbox"]')).not.toBeNull();
        expect(beforeShowCalls).toBe(1);

        await userEvent.keyboard('{Escape}');
        await settle();
        expect(document.querySelector('[role="listbox"]')).toBeNull();

        await userEvent.keyboard('{Space}');
        await settle();
        expect(document.querySelector('[role="listbox"]')).not.toBeNull();
        expect(beforeShowCalls).toBe(2);

        activeApp?.unmount();
        activeApp = null;
        hostElement?.remove();
        hostElement = null;

        const disabled = await mountTagSelect({
            isButton: true,
            icon: 'mdi:tag',
            placeholder: 'Gerenciar categorias',
            disabled: true,
            onBeforeShow: () => {
                beforeShowCalls += 1;
            }
        });
        const disabledButton = disabled.host.querySelector('button.max-icon-button') as HTMLButtonElement;
        expect(disabledButton.disabled).toBe(true);
        disabledButton.focus();
        await userEvent.keyboard('{Enter}');
        await userEvent.keyboard('{Space}');
        await settle();
        expect(document.querySelector('[role="listbox"]')).toBeNull();
        expect(beforeShowCalls).toBe(2);
    });

    it('valida first paint, virtualização de lista grande (>500 itens) e contraste em tema claro (default, hover, focus / active descendant)', async () => {
        const { host } = await mountTagSelect();

        // 1. First Paint: Trigger renderizado com dimensões reais
        const trigger = host.querySelector('.max-select') as HTMLElement;
        expect(trigger).not.toBeNull();
        const triggerRect = trigger.getBoundingClientRect();
        expect(triggerRect.width).toBeGreaterThan(0);

        // Abre o overlay
        trigger.click();
        await settle();

        const listbox = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(listbox).not.toBeNull();

        // 2. Preserva virtualização para listas grandes (>500 itens):
        // Spacer existe com altura compatível para 1000 itens (1000 * 36px = 36000px)
        const spacer = listbox.querySelector('.max-select-spacer') as HTMLElement;
        expect(spacer).not.toBeNull();
        expect(spacer.offsetHeight).toBeGreaterThanOrEqual(30000);

        // Quantidade de nós DOM montados é significativamente menor que o total (virtualização ativa)
        const renderedItems = listbox.querySelectorAll('.max-select-option');
        expect(renderedItems.length).toBeGreaterThan(0);
        expect(renderedItems.length).toBeLessThan(100);

        // 3. Contraste CSS Computado Real - Estado DEFAULT (light)
        const firstItem = renderedItems[0] as HTMLElement;
        const firstLabel = (firstItem.querySelector('.max-tag-select-option-label') ?? firstItem) as HTMLElement;

        let compLabel = window.getComputedStyle(firstLabel);
        let fgColor = parseRGB(compLabel.color);
        let bgColor = getEffectiveBackgroundColor(firstItem, 'rgb(255, 255, 255)');
        let contrastDefault = getContrast(bgColor, fgColor);
        expect(contrastDefault).toBeGreaterThanOrEqual(4.5);

        // 4. Contraste CSS Computado Real - Estado HOVER (light)
        firstItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();

        const hoveredLabel = (firstItem.querySelector('.max-tag-select-option-label') ?? firstItem) as HTMLElement;
        compLabel = window.getComputedStyle(hoveredLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(firstItem, 'rgb(255, 255, 255)');
        let contrastHover = getContrast(bgColor, fgColor);
        expect(contrastHover).toBeGreaterThanOrEqual(4.5);

        // 5. Contraste CSS Computado Real - Estado FOCUS / ACTIVE DESCENDANT via Teclado (light)
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        const activeDescendantAttr = trigger.getAttribute('aria-activedescendant');
        expect(activeDescendantAttr).toBeTruthy();
        const focusedItem = document.getElementById(activeDescendantAttr!) as HTMLElement;
        expect(focusedItem).not.toBeNull();
        expect(focusedItem.classList.contains('is-focused') || focusedItem.classList.contains('max-select-option-highlighted')).toBe(true);

        const focusedLabel = (focusedItem.querySelector('.max-tag-select-option-label') ?? focusedItem) as HTMLElement;
        compLabel = window.getComputedStyle(focusedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(focusedItem, 'rgb(255, 255, 255)');
        let contrastFocus = getContrast(bgColor, fgColor);
        expect(contrastFocus).toBeGreaterThanOrEqual(4.5);
    });

    it('valida scroll real, reciclagem de nós virtuais, seleção e contraste do estado selecionado e selecionado+hover (light)', async () => {
        const { host, selectedVal } = await mountTagSelect({ modelValue: null });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        trigger.click();
        await settle();

        const listbox = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(listbox).not.toBeNull();

        // Scroll real no Chromium
        listbox.scrollTop = 3600;
        listbox.dispatchEvent(new Event('scroll'));
        await settle();

        // Verifica reciclagem de nós após o scroll
        const scrolledItems = listbox.querySelectorAll('.max-select-option');
        expect(scrolledItems.length).toBeGreaterThan(0);
        const scrolledFirstItem = scrolledItems[0] as HTMLElement;
        expect(scrolledFirstItem.textContent).not.toContain('Option 0');

        // Seleção via clique na opção reciclada
        scrolledFirstItem.click();
        await settle();

        expect(selectedVal.value).toBeTruthy();
        expect(selectedVal.value).toMatch(/^id-/);

        // Reabre o dropdown para verificar o estado selecionado
        trigger.click();
        await settle();

        // Encontra a opção selecionada
        const currentListbox = document.querySelector('.max-select-list-container') as HTMLElement;
        const selectedItem = currentListbox.querySelector('.max-select-option.is-selected, .max-select-option-selected') as HTMLElement;
        expect(selectedItem).not.toBeNull();
        expect(selectedItem.getAttribute('aria-selected')).toBe('true');

        // Contraste do estado SELECIONADO (light)
        const selectedLabel = (selectedItem.querySelector('.max-tag-select-option-label') ?? selectedItem) as HTMLElement;
        let compLabel = window.getComputedStyle(selectedLabel);
        let fgColor = parseRGB(compLabel.color);
        let bgColor = getEffectiveBackgroundColor(selectedItem, 'rgb(255, 255, 255)');
        let contrastSelected = getContrast(bgColor, fgColor);
        expect(contrastSelected).toBeGreaterThanOrEqual(4.5);

        // Contraste do estado SELECIONADO + HOVER/FOCUS (light)
        selectedItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();

        compLabel = window.getComputedStyle(selectedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(selectedItem, 'rgb(255, 255, 255)');
        let contrastSelectedHover = getContrast(bgColor, fgColor);
        expect(contrastSelectedHover).toBeGreaterThanOrEqual(4.5);
    });

    it('valida contraste acessível WCAG AA em todos os estados no tema escuro (dark): default, hover, focus, seleção e seleção+hover', async () => {
        // Ativa tema escuro no documento
        document.documentElement.classList.add('dark');
        await settle();

        const { host } = await mountTagSelect({
            modelValue: 'id-0',
            options: Array.from({ length: 100 }, (_, i) => ({ value: `id-${i}`, label: `Tema Escuro ${i}` }))
        });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        trigger.click();
        await settle();

        const listbox = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(listbox).not.toBeNull();

        const overlay = document.querySelector('.max-select-overlay') as HTMLElement;
        const overlayBg = getEffectiveBackgroundColor(overlay, 'rgb(23, 41, 61)');

        // 1. Estado SELECIONADO (dark)
        const selectedItem = listbox.querySelector('.max-select-option.is-selected') as HTMLElement;
        expect(selectedItem).not.toBeNull();

        const selectedLabel = (selectedItem.querySelector('.max-tag-select-option-label') ?? selectedItem) as HTMLElement;
        let compLabel = window.getComputedStyle(selectedLabel);
        let fgColor = parseRGB(compLabel.color);
        let bgColor = getEffectiveBackgroundColor(selectedItem, 'rgb(23, 41, 61)');
        let contrastSelectedDark = getContrast(bgColor, fgColor);
        expect(contrastSelectedDark).toBeGreaterThanOrEqual(4.5);

        // 2. Estado SELECIONADO + HOVER / FOCUS (dark)
        selectedItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();

        compLabel = window.getComputedStyle(selectedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(selectedItem, 'rgb(23, 41, 61)');
        let contrastSelectedHoverDark = getContrast(bgColor, fgColor);
        expect(contrastSelectedHoverDark).toBeGreaterThanOrEqual(4.5);

        // 3. Estado DEFAULT não selecionado (dark)
        const unselectedItem = listbox.querySelectorAll('.max-select-option')[1] as HTMLElement;
        expect(unselectedItem).not.toBeNull();

        const unselectedLabel = (unselectedItem.querySelector('.max-tag-select-option-label') ?? unselectedItem) as HTMLElement;
        compLabel = window.getComputedStyle(unselectedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(unselectedItem, overlayBg.join(','));
        let contrastDefaultDark = getContrast(bgColor, fgColor);
        expect(contrastDefaultDark).toBeGreaterThanOrEqual(4.5);

        // 4. Estado HOVER em item não selecionado (dark)
        unselectedItem.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        await settle();

        compLabel = window.getComputedStyle(unselectedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(unselectedItem, overlayBg.join(','));
        let contrastHoverDark = getContrast(bgColor, fgColor);
        expect(contrastHoverDark).toBeGreaterThanOrEqual(4.5);

        // 5. Estado FOCUS / ACTIVE DESCENDANT (dark)
        trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        const activeDescendantAttr = trigger.getAttribute('aria-activedescendant');
        expect(activeDescendantAttr).toBeTruthy();
        const focusedItem = document.getElementById(activeDescendantAttr!) as HTMLElement;
        expect(focusedItem).not.toBeNull();

        const focusedLabel = (focusedItem.querySelector('.max-tag-select-option-label') ?? focusedItem) as HTMLElement;
        compLabel = window.getComputedStyle(focusedLabel);
        fgColor = parseRGB(compLabel.color);
        bgColor = getEffectiveBackgroundColor(focusedItem, overlayBg.join(','));
        let contrastFocusDark = getContrast(bgColor, fgColor);
        expect(contrastFocusDark).toBeGreaterThanOrEqual(4.5);
    });

    it('preserva tags com cores personalizadas e garante contraste de texto e indicador não cromático na seleção', async () => {
        const customOptions = [
            { value: 'sucesso', label: 'Concluído', background_color: '#10B981' },
            { value: 'perigo', label: 'Urgente', background_color: '#EF4444' },
            { value: 'aviso', label: 'Pendente', background_color: '#F59E0B' }
        ];

        const { host } = await mountTagSelect({
            modelValue: 'sucesso',
            options: customOptions
        });

        const trigger = host.querySelector('.max-select') as HTMLElement;
        trigger.click();
        await settle();

        const listbox = document.querySelector('.max-select-list-container') as HTMLElement;
        expect(listbox).not.toBeNull();

        // 1. Contraste de texto em tags personalizadas
        const options = listbox.querySelectorAll('.max-select-option');
        expect(options.length).toBe(3);

        for (let i = 0; i < options.length; i++) {
            const optEl = options[i] as HTMLElement;
            const tagDiv = optEl.querySelector('.label-tag-div') as HTMLElement;
            expect(tagDiv).not.toBeNull();

            const tagLabel = optEl.querySelector('.max-tag-select-option-label') as HTMLElement;
            const compTagLabel = window.getComputedStyle(tagLabel);
            const compTagDiv = window.getComputedStyle(tagDiv);

            const fg = parseRGB(compTagLabel.color);
            const bg = parseRGB(compTagDiv.backgroundColor);
            expect(getContrast(bg, fg)).toBeGreaterThanOrEqual(4.5);
        }

        // 2. Opção selecionada possui indicador não-cromático de seleção (outline/borda de foco)
        const selectedCustomItem = options[0] as HTMLElement;
        expect(selectedCustomItem.classList.contains('is-selected')).toBe(true);

        const compSelected = window.getComputedStyle(selectedCustomItem);
        // Possui contorno acessível contrastante distinto do fundo
        expect(compSelected.outlineStyle).not.toBe('none');
        expect(parseFloat(compSelected.outlineWidth)).toBeGreaterThan(0);
    });
});
