import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTopMenuSearchBar from '../../src/components/MaxTopMenuSearchBar.vue';
import { useSearchBarStore } from '../../src/stores/useSearchBar.Store';

describe('MaxTopMenuSearchBar', () => {
    let pinia: ReturnType<typeof createPinia>;
    const mountedWrappers: any[] = [];

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    afterEach(() => {
        while (mountedWrappers.length > 0) {
            const w = mountedWrappers.pop();
            try { w.unmount(); } catch {}
        }
    });

    function mountSearchBar(options: any = {}) {
        const wrapper = mount(MaxTopMenuSearchBar, {
            ...options,
            global: {
                plugins: [pinia],
                ...(options.global || {})
            }
        });
        mountedWrappers.push(wrapper);
        return wrapper;
    }

    it('renderiza o campo desktop com placeholder customizado', () => {
        const wrapper = mountSearchBar({
            props: { placeholder: 'Buscar clientes...', screen: 'desktop' }
        });

        expect(wrapper.find('.max-top-menu-search-bar').exists()).toBe(true);
        const input = wrapper.find('input');
        expect(input.attributes('placeholder')).toBe('Buscar clientes...');
    });

    it('sincroniza o valor digitado com a useSearchBarStore', async () => {
        const wrapper = mountSearchBar({
            props: { screen: 'desktop' }
        });
        const store = useSearchBarStore();

        const input = wrapper.find('input');
        await input.setValue('Projeto Solar');

        expect(store.input_value).toBe('Projeto Solar');
    });

    it('renderiza botão mobile quando screen="mobile"', () => {
        const wrapper = mountSearchBar({
            props: { screen: 'mobile' },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        });

        expect(wrapper.find('.search-top-bar-mobile').exists()).toBe(true);
        expect(wrapper.find('.max-top-menu-search-bar').exists()).toBe(false);
    });

    it('abre e fecha o painel de busca no modo mobile', async () => {
        const wrapper = mountSearchBar({
            props: { screen: 'mobile' },
            global: {
                stubs: {
                    Teleport: true
                }
            }
        });

        const btn = wrapper.find('.search-top-bar-mobile .max-icon-button');
        expect(btn.exists()).toBe(true);
        await btn.trigger('click');

        expect(wrapper.find('.mobile-search-panel').exists()).toBe(true);

        const closeBtn = wrapper.find('.btn-close-search');
        if (closeBtn.exists()) {
            await closeBtn.trigger('click');
            expect(wrapper.find('.mobile-search-panel').exists()).toBe(false);
        }
    });

    it('exibe o badge de atalho kbd por padrão no modo desktop', () => {
        const wrapper = mountSearchBar({
            props: { screen: 'desktop' }
        });

        const badge = wrapper.find('.search-shortcut-badge');
        expect(badge.exists()).toBe(true);
        expect(['⌘K', 'Ctrl+K']).toContain(badge.text());
    });

    it('não exibe o badge quando showShortcutBadge=false ou shortcut=false', () => {
        const wrapper1 = mountSearchBar({
            props: { screen: 'desktop', showShortcutBadge: false }
        });
        expect(wrapper1.find('.search-shortcut-badge').exists()).toBe(false);

        const wrapper2 = mountSearchBar({
            props: { screen: 'desktop', shortcut: false }
        });
        expect(wrapper2.find('.search-shortcut-badge').exists()).toBe(false);
    });

    it('NÃO sequestra nem previne o comportamento nativo de Ctrl+F / Meta+F', () => {
        const _wrapper = mountSearchBar({
            props: { screen: 'desktop' }
        });

        const ctrlFEvent = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, cancelable: true });
        const preventSpy = vi.spyOn(ctrlFEvent, 'preventDefault');

        document.dispatchEvent(ctrlFEvent);
        expect(preventSpy).not.toHaveBeenCalled();
    });

    it('intercepta o atalho mod+k prevenindo o comportamento padrão', () => {
        const _wrapper = mountSearchBar({
            props: { screen: 'desktop' }
        });

        const modKEvent = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
        const preventSpy = vi.spyOn(modKEvent, 'preventDefault');

        document.dispatchEvent(modKEvent);
        expect(preventSpy).toHaveBeenCalledTimes(1);
    });
});
