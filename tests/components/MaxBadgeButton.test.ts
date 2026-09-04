import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadgeButton from '../../src/components/MaxBadgeButton.vue';

function mountBadgeButton(props: Record<string, any> = {}) {
    return mount(MaxBadgeButton, {
        props,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon"></span>'
                }
            }
        }
    });
}

describe('MaxBadgeButton', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza como elemento button semântico', () => {
        const wrapper = mountBadgeButton({ label: 'Filtrar' });
        expect(wrapper.element.tagName).toBe('BUTTON');
        expect(wrapper.attributes('type')).toBe('button');
        expect(wrapper.text()).toContain('Filtrar');
    });

    it('possui toggle interno autônomo quando modelValue é omitido', async () => {
        const onActive = vi.fn();
        const onDeactive = vi.fn();
        const onClick = vi.fn();

        const wrapper = mountBadgeButton({
            label: 'Toggle Test',
            onActive,
            onDeactive,
            onClick
        });

        // Inicialmente inativo
        expect(wrapper.classes()).not.toContain('is-active');
        expect(wrapper.attributes('aria-pressed')).toBe('false');

        // Primeiro clique: deve ativar
        await wrapper.trigger('click');
        expect(wrapper.classes()).toContain('is-active');
        expect(wrapper.attributes('aria-pressed')).toBe('true');
        expect(onActive).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
        expect(wrapper.emitted('active')?.length).toBe(1);

        // Segundo clique: deve desativar
        await wrapper.trigger('click');
        expect(wrapper.classes()).not.toContain('is-active');
        expect(wrapper.attributes('aria-pressed')).toBe('false');
        expect(onDeactive).toHaveBeenCalledTimes(1);
        expect(onClick).toHaveBeenCalledTimes(2);
        expect(wrapper.emitted('update:modelValue')?.[1]).toEqual([false]);
        expect(wrapper.emitted('deactive')?.length).toBe(1);
    });

    it('controla alternância via v-model booleano', async () => {
        const wrapper = mountBadgeButton({
            label: 'Boolean Toggle',
            modelValue: true
        });

        expect(wrapper.classes()).toContain('is-active');

        await wrapper.trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    });

    it('controla alternância via v-model numérico (0 e 1)', async () => {
        const wrapper = mountBadgeButton({
            label: 'Numeric Toggle',
            modelValue: 1
        });

        expect(wrapper.classes()).toContain('is-active');

        await wrapper.trigger('click');
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([0]);
    });

    it('suporta aliases onTrue e onFalse', async () => {
        const onTrue = vi.fn();
        const onFalse = vi.fn();

        const wrapper = mountBadgeButton({
            label: 'Aliases Test',
            onTrue,
            onFalse
        });

        await wrapper.trigger('click');
        expect(onTrue).toHaveBeenCalledTimes(1);
        expect(onFalse).not.toHaveBeenCalled();

        await wrapper.trigger('click');
        expect(onFalse).toHaveBeenCalledTimes(1);
    });

    it('aplica cor normal da prop quando ativo e var(--background-400) quando inativo', async () => {
        const wrapper = mountBadgeButton({
            label: 'Color Toggle',
            color: 'var(--purple-600)',
            modelValue: true
        });

        const badgeComponent = wrapper.findComponent({ name: 'MaxBadge' });
        expect(badgeComponent.exists()).toBe(true);
        expect(badgeComponent.props('color')).toBe('var(--purple-600)');

        await wrapper.setProps({ modelValue: false });
        expect(badgeComponent.props('color')).toBe('var(--background-400)');
    });

    it('não dispara cliques nem altera estado quando disabled é true', async () => {
        const onClick = vi.fn();
        const onActive = vi.fn();

        const wrapper = mountBadgeButton({
            label: 'Desabilitado',
            disabled: true,
            onClick,
            onActive
        });

        expect(wrapper.attributes('disabled')).toBeDefined();
        expect(wrapper.classes()).toContain('is-disabled');

        await wrapper.trigger('click');
        expect(onClick).not.toHaveBeenCalled();
        expect(onActive).not.toHaveBeenCalled();
        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
});
