import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPopoverMenu from '../../src/components/MaxPopoverMenu.vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        goToRoute: vi.fn()
    };
});

let activeWrapper: any = null;

function mountPopoverMenu(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    activeWrapper = mount(MaxPopoverMenu, {
        props,
        attrs,
        attachTo: document.body
    });
    return activeWrapper;
}

describe('MaxPopoverMenu', () => {
    afterEach(() => {
        if (activeWrapper) {
            activeWrapper.unmount();
            activeWrapper = null;
        }
    });

    it('renderiza corretamente sem PrimeVue', () => {
        const wrapper = mountPopoverMenu({
            items: [{ label: 'Item 1', icon: 'mdi:home' }]
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.html()).not.toContain('data-pc-name');
    });

    it('expõe e chama os métodos imperativos toggle, show e hide', async () => {
        const wrapper = mountPopoverMenu({
            items: [{ label: 'Item 1' }]
        });
        const vm = wrapper.vm as any;

        expect(document.body.querySelector('.p-menu')).toBeNull();
        vm.toggle();
        await wrapper.vm.$nextTick();
        expect(document.body.querySelector('.p-menu')).not.toBeNull();

        vm.hide();
        await wrapper.vm.$nextTick();
        expect(document.body.querySelector('.p-menu')).toBeNull();

        vm.show();
        await wrapper.vm.$nextTick();
        expect(document.body.querySelector('.p-menu')).not.toBeNull();
    });

    it('onClick chama goToRoute se o item tiver route', async () => {
        const { goToRoute } = await import('@maxvue/max-use');
        const wrapper = mountPopoverMenu();
        const vm = wrapper.vm as any;

        vm.onClick(new MouseEvent('click'), { route: 'home.index', data: { id: 1 } });
        expect(goToRoute).toHaveBeenCalledWith('home.index', { id: 1 });
    });

    it('onClick chama action se o item não tiver route', async () => {
        const wrapper = mountPopoverMenu();
        const actionMock = vi.fn();
        const vm = wrapper.vm as any;

        vm.onClick(new MouseEvent('click'), { action: actionMock, data: { id: 2 } });
        expect(actionMock).toHaveBeenCalled();
    });

    it('onClick bloqueia chamadas duplicadas', async () => {
        const wrapper = mountPopoverMenu();
        const actionMock = vi.fn();
        const vm = wrapper.vm as any;

        vm.onClick(new MouseEvent('click'), { action: actionMock });
        expect(actionMock).toHaveBeenCalledTimes(1);

        vm.onClick(new MouseEvent('click'), { action: actionMock });
        expect(actionMock).toHaveBeenCalledTimes(1);
    });

    it('chama item.action ao clicar no item do overlay', async () => {
        const actionMock = vi.fn();
        const wrapper = mountPopoverMenu({
            items: [{ label: 'Ação 1', action: actionMock, data: { foo: 'bar' } }]
        });

        (wrapper.vm as any).show();
        await wrapper.vm.$nextTick();

        const itemEl = document.body.querySelector('.p-menu-item') as HTMLElement;
        expect(itemEl).not.toBeNull();
        itemEl?.click();

        expect(actionMock).toHaveBeenCalledWith(expect.objectContaining({ data: { foo: 'bar' } }));
    });
});
