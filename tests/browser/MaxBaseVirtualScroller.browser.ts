import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, type App } from 'vue';
import MaxBaseVirtualScroller from '../../src/components/base/MaxBaseVirtualScroller.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

async function settle(): Promise<void> {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountListbox() {
    hostElement = document.createElement('div');
    hostElement.style.width = '320px';
    document.body.appendChild(hostElement);

    activeApp = createApp({
        render: () => h(MaxBaseVirtualScroller, {
            items: Array.from({ length: 10000 }, (_, index) => `Opção ${index}`),
            itemSize: 40,
            style: { height: '200px' },
            role: 'listbox',
            ariaLabel: 'Opções virtualizadas',
            idPrefix: 'browser-virtual'
        }, {
            item: ({ item }: { item: string }) => h('span', { class: 'row-item' }, item)
        })
    });
    activeApp.mount(hostElement);
    await settle();

    return hostElement.querySelector<HTMLElement>('.max-base-virtual-scroller')!;
}

afterEach(() => {
    activeApp?.unmount();
    activeApp = null;
    hostElement?.remove();
    hostElement = null;
});

describe('MaxBaseVirtualScroller no Chromium real (F14)', () => {
    it('expõe listbox nomeado, opções válidas e nunca conserva active-descendant de nó desmontado após scroll', async () => {
        const scroller = await mountListbox();
        const listbox = page.getByRole('listbox', { name: 'Opções virtualizadas' });
        await expect.element(listbox).toBeVisible();

        scroller.focus();
        scroller.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        await settle();

        expect(scroller.getAttribute('aria-activedescendant')).toBe('browser-virtual-option-0');
        expect(document.getElementById('browser-virtual-option-0')?.getAttribute('role')).toBe('option');

        scroller.scrollTop = 4000;
        scroller.dispatchEvent(new Event('scroll'));
        await settle();

        expect(document.getElementById('browser-virtual-option-0')).toBeNull();
        expect(scroller.getAttribute('aria-activedescendant')).toBeNull();
        expect(scroller.querySelectorAll('[role="option"]')).not.toHaveLength(0);
    });
});
