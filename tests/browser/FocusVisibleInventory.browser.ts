import { afterEach, describe, expect, it } from 'vitest';
import { cdp, userEvent } from 'vitest/browser';
import { createApp, h, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import InputBase from '../../src/components/InputBase.vue';
import MaxLikeButton from '../../src/components/MaxLikeButton.vue';
import '../../src/themes/all.scss';

let app: App | undefined;
let host: HTMLElement | undefined;

// Categorias de alvo extraídas pelo gate arquitetural: nativos, ARIA e tabindex.
// Não é um catálogo de componentes; cada item materializa uma família de DOM.
const ariaFocusFamilies = ['link', 'menuitem', 'option', 'tab', 'checkbox', 'switch', 'slider', 'combobox', 'listbox'];

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function expectVisibleFocus(target: HTMLElement) {
    // Inputs delegados desenham o anel no owner :focus-within; controles diretos
    // o desenham no próprio alvo. Ambos são políticas válidas do inventário.
    let owner: HTMLElement | undefined;
    for (let candidate: HTMLElement | null = target; candidate; candidate = candidate.parentElement) {
        const style = getComputedStyle(candidate);
        if (style.outlineStyle !== 'none' || style.boxShadow !== 'none') {
            owner = candidate;
            break;
        }
    }
    expect(owner).toBeTruthy();
    const style = getComputedStyle(owner!);
    expect(parseFloat(style.outlineWidth || '0')).toBeGreaterThanOrEqual(2);

    // O navegador não inclui outline no DOMRect. Verificamos o mecanismo que
    // causaria recorte (overflow) em cada ancestral até o host do cenário.
    for (let ancestor = owner!.parentElement; ancestor && ancestor !== host; ancestor = ancestor.parentElement) {
        const ancestorStyle = getComputedStyle(ancestor);
        expect([ancestorStyle.overflow, ancestorStyle.overflowX, ancestorStyle.overflowY])
            .not.toContain('hidden');
        expect([ancestorStyle.overflow, ancestorStyle.overflowX, ancestorStyle.overflowY])
            .not.toContain('clip');
    }
}

function channel(value: string) {
    return value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
}

function luminance(color: string) {
    const [red, green, blue] = channel(color).map((value) => {
        const normalized = value / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground: string, background: string) {
    const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    return (light + 0.05) / (dark + 0.05);
}

async function mountFixture() {
    host = document.createElement('div');
    host.style.cssText = 'padding: 12px; display: flex; gap: 20px; overflow: visible; background: var(--background-0, white);';
    document.body.append(host);
    app = createApp({
        render: () => h('div', { style: 'padding: 4px; overflow: visible;' }, [
            h(MaxButton, { label: 'Salvar', 'data-testid': 'button' }),
            h(MaxLikeButton, { label: 'Curtir', 'data-testid': 'like' }),
            // Cada família que o inventário de arquitetura encontra é materializada
            // aqui: controle de ação, campo delegado ao InputBase, link e ARIA/tabindex.
            h(InputBase, { label: 'Campo', 'data-testid': 'input-base' }, {
                default: () => h('input', { 'data-testid': 'input' })
            }),
            h('textarea', { class: 'r16-focus-family', 'data-testid': 'textarea' }),
            h('a', { href: '#r16', class: 'r16-focus-family', 'data-testid': 'link' }, 'Link'),
            h('div', { role: 'button', tabindex: 0, class: 'r16-focus-family', 'data-testid': 'role-button' }, 'Ação ARIA'),
            ...ariaFocusFamilies.map((role) => h('div', {
                role,
                tabindex: 0,
                class: 'r16-focus-family',
                'data-testid': `role-${role}`
            }, `Role ${role}`)),
            h('div', { tabindex: 0, class: 'r16-focus-family', 'data-testid': 'tabindex' }, 'Tabindex'),
            h('style', `.r16-focus-family:focus-visible {
                outline: var(--max-focus-outline);
                outline-offset: 2px;
                box-shadow: var(--max-focus-ring);
            }
            .r16-token-probe { color: var(--max-focus-ring-color); background-color: var(--max-focus-ring-offset-color); }`),
            h('span', { class: 'r16-token-probe', 'data-testid': 'token-probe' }, 'token')
        ])
    });
    app.directive('tooltip', {});
    app.use(createPinia());
    app.mount(host);
    await nextFrame();
}

afterEach(() => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
    document.documentElement.classList.remove('dark');
    document.documentElement.style.zoom = '';
});

describe('R16/F23 — foco computado em Chromium', () => {
    it.each([false, true])('navega por Tab e preserva indicador computado no tema %s', async (dark) => {
        if (dark) document.documentElement.classList.add('dark');
        await mountFixture();

        const expectedTargets = [
            '.max-button',
            '.max-like-button',
            '[data-testid="input"]',
            '[data-testid="textarea"]',
            '[data-testid="link"]',
            '[data-testid="role-button"]',
            ...ariaFocusFamilies.map((role) => `[data-testid="role-${role}"]`),
            '[data-testid="tabindex"]'
        ];
        for (const selector of expectedTargets) {
            await userEvent.keyboard('{Tab}');
            const target = document.activeElement as HTMLElement;
            expect(target).toBe(host!.querySelector(selector));
            expectVisibleFocus(target);
        }
    });

    it('mantém foco computado e sem recorte a 200% de zoom', async () => {
        document.documentElement.style.zoom = '200%';
        await mountFixture();
        await userEvent.keyboard('{Tab}');
        expectVisibleFocus(document.activeElement as HTMLElement);
    });

    it.each([false, true])('resolve cores dos tokens semânticos no CSSOM no tema %s', async (dark) => {
        if (dark) document.documentElement.classList.add('dark');
        await mountFixture();
        const style = getComputedStyle(host!.querySelector('[data-testid="token-probe"]')!);
        // Aceite por valores efetivamente resolvidos pelo Chromium, não por texto do SCSS.
        expect(channel(style.color)).toHaveLength(3);
        expect(channel(style.backgroundColor)).toHaveLength(3);
        expect(contrast(style.color, style.backgroundColor)).toBeGreaterThanOrEqual(3);
    });

    it('aplica o indicador computado em forced-colors', async () => {
        const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
        await session.send('Emulation.setEmulatedMedia', {
            features: [{ name: 'forced-colors', value: 'active' }]
        });
        try {
            expect(matchMedia('(forced-colors: active)').matches).toBe(true);
            await mountFixture();
            await userEvent.keyboard('{Tab}');
            const style = getComputedStyle(document.activeElement as HTMLElement);
            expect(style.outlineStyle).toBe('solid');
            expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
            expect(style.outlineColor).not.toBe('rgba(0, 0, 0, 0)');
        } finally {
            await session.send('Emulation.setEmulatedMedia', { features: [] });
        }
    });
});
