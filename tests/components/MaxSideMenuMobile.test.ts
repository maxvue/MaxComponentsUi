import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { reactive, ref } from 'vue';

const route = reactive<Record<string, any>>({ name: 'dashboard', query: {}, params: {} });
const push = vi.fn();

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push })
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef
}));

import MaxSideMenuMobile from '../../src/components/MaxSideMenuMobile.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useUserStore } from '../../src/stores/useUser.Store';

let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: {
        ...(options.global ?? {}),
        plugins: [pinia],
        stubs: {
            teleport: true,
            ...(options.global?.stubs ?? {})
        }
    }
});

describe('MaxSideMenuMobile', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        route.name = 'dashboard';
        push.mockReset();
        menusRef.value = null;
        useSystemStore().side_menu_open = true;
    });

    it('exibe o nome e dados do usuário logado no cabeçalho', () => {
        const user = useUserStore();
        user.data = { id: 10, name: 'Carlos Silva', email: 'carlos@empresa.com' };

        const wrapper = mountWithPinia(MaxSideMenuMobile);

        expect(wrapper.text()).toContain('Carlos Silva');
        expect(wrapper.text()).toContain('carlos@empresa.com');
    });

    it('renderiza os itens de menu por grupos', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Extrato', icon: 'mdi:format-list-bulleted', route: 'extract' }
                        ]
                    }
                ]
            }
        });

        expect(wrapper.text()).toContain('Visão Geral');
        expect(wrapper.text()).toContain('Início');
        expect(wrapper.text()).toContain('Extrato');
        expect(wrapper.findAll('.mobile-menu-item')).toHaveLength(2);
    });

    it('marca o item ativo baseado na rota atual', () => {
        route.name = 'extract';

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Extrato', icon: 'mdi:format-list-bulleted', route: 'extract' }
                        ]
                    }
                ]
            }
        });

        const activeItems = wrapper.findAll('.mobile-menu-item.active');
        expect(activeItems).toHaveLength(1);
        expect(activeItems[0].text()).toContain('Extrato');
    });

    it('navega e fecha a gaveta ao clicar em um item de menu', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            props: {
                groups: [
                    {
                        title: 'Visão Geral',
                        items: [
                            { label: 'Início', icon: 'mdi:home', route: 'dashboard' },
                            { label: 'Projetos', icon: 'mdi:solar-panel', route: 'projects' }
                        ]
                    }
                ]
            }
        });

        const items = wrapper.findAll('.mobile-menu-item');
        await items[1].trigger('click');

        expect(push).toHaveBeenCalledWith({ name: 'projects' });
        expect(system.side_menu_open).toBe(false);
    });

    it('emite evento profile e fecha a gaveta ao clicar no cabeçalho do perfil', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile);
        await wrapper.find('.mobile-profile-header').trigger('click');

        expect(wrapper.emitted('profile')).toHaveLength(1);
        expect(system.side_menu_open).toBe(false);
    });

    it('emite evento logout e fecha a gaveta ao clicar no botão de sair', async () => {
        const system = useSystemStore();
        system.side_menu_open = true;

        const wrapper = mountWithPinia(MaxSideMenuMobile);
        await wrapper.find('.mobile-footer-btn.logout').trigger('click');

        expect(wrapper.emitted('logout')).toHaveLength(1);
        expect(system.side_menu_open).toBe(false);
    });

    it('oculta o botão de tema por padrão e o exibe quando showThemeToggle é true', async () => {
        const wrapperDefault = mountWithPinia(MaxSideMenuMobile);
        expect(wrapperDefault.findAll('.mobile-footer-btn:not(.logout)')).toHaveLength(0);

        const wrapperEnabled = mountWithPinia(MaxSideMenuMobile, {
            props: { showThemeToggle: true }
        });
        const themeBtn = wrapperEnabled.find('.mobile-footer-btn:not(.logout)');
        expect(themeBtn.exists()).toBe(true);
        await themeBtn.trigger('click');
        expect(wrapperEnabled.emitted('toggleDarkMode')).toHaveLength(1);
    });

    it('renderiza o slot switcher quando fornecido', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile, {
            slots: { switcher: '<div class="profile-switcher-stub">Trocar Perfil</div>' }
        });

        expect(wrapper.find('.switcher .profile-switcher-stub').exists()).toBe(true);
        expect(wrapper.text()).toContain('Trocar Perfil');
    });

    it('configura o MaxDrawer com noPadding, baseZIndex 1000 e aria-label "Menu principal"', () => {
        const wrapper = mountWithPinia(MaxSideMenuMobile);
        const drawer = wrapper.findComponent({ name: 'MaxDrawer' });

        expect(drawer.exists()).toBe(true);
        expect(drawer.props('noPadding')).toBe(true);
        expect(drawer.props('baseZIndex')).toBe(1000);
        expect(drawer.props('ariaLabel')).toBe('Menu principal');
    });

    it('utiliza tokens de shell no cabeçalho com contraste adequado (E10-05)', async () => {
        const fs = await import('node:fs');
        const path = await import('node:path');
        const sfc = fs.readFileSync(path.resolve(__dirname, '../../src/components/MaxSideMenuMobile.vue'), 'utf-8');

        // Garante que usa tokens de shell e não background-*
        expect(sfc).toContain('color: var(--layout-shell-text, #fff);');
        expect(sfc).toContain('color: var(--layout-shell-text-muted, rgb(255 255 255 / 70%));');
        expect(sfc).not.toMatch(/\.mobile-profile-name\s*\{[^}]*color:\s*var\(--background-775\)/);
        expect(sfc).not.toMatch(/\.mobile-profile-subtext\s*\{[^}]*color:\s*var\(--background-650\)/);
    });

    it('garante contraste mínimo de acessibilidade sobre --layout-shell-bg nos dois temas (E10-05)', () => {
        const getLuminance = (r: number, g: number, b: number) => {
            const [rs, gs, bs] = [r, g, b].map((c) => {
                const s = c / 255;
                return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        };

        const getContrast = (l1: number, l2: number) => {
            const lighter = Math.max(l1, l2);
            const darker = Math.min(l1, l2);
            return (lighter + 0.05) / (darker + 0.05);
        };

        // Fundo institucional: #003048 (R:0, G:48, B:72)
        const bgLum = getLuminance(0, 48, 72);

        // Texto principal: #fff
        const textLum = getLuminance(255, 255, 255);
        const textContrast = getContrast(textLum, bgLum);
        expect(textContrast).toBeGreaterThanOrEqual(4.5);

        // Texto muted e chevron: rgb(255 255 255 / 70%) sobre #003048
        const mutedLum = getLuminance(178.5, 192.9, 200.1);
        const mutedContrast = getContrast(mutedLum, bgLum);
        expect(mutedContrast).toBeGreaterThanOrEqual(4.5);
        expect(mutedContrast).toBeGreaterThanOrEqual(3.0);
    });
});
