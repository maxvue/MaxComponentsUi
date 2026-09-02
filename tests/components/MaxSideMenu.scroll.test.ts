import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

const menusRef = ref<any>({
    side: [
        { name: 'm1', label: 'Item 1', icone: 'mdi:home' },
        { name: 'm2', label: 'Item 2', icone: 'mdi:star' },
        { name: 'm3', label: 'Item 3', icone: 'mdi:account' },
        { name: 'm4', label: 'Item 4', icone: 'mdi:settings', details: { settings: true } }
    ]
});

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: (name: string) => `https://app.test/${name}`
}));

import MaxSideMenu from '../../src/components/MaxSideMenu.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';

let pinia: Pinia;

describe('MaxSideMenu - Rolagem e Renderização', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        useSystemStore().type_device = 'desktop';
    });

    it('renderiza os itens de navegação e configurações no menu lateral', () => {
        const wrapper = mount(MaxSideMenu, {
            global: {
                plugins: [pinia],
                stubs: {
                    teleport: true,
                    MaxLogo: { template: '<div class="max-logo-stub" />' },
                    MaxMenuVerticalItem: { template: '<div class="max-menu-item-stub" />' }
                }
            }
        });

        expect(wrapper.find('.side-menu').exists()).toBe(true);
        expect(wrapper.find('.menu').exists()).toBe(true);
        expect(wrapper.find('.grupo.items').exists()).toBe(true);
        expect(wrapper.find('.grupo.settings').exists()).toBe(true);
    });
});
