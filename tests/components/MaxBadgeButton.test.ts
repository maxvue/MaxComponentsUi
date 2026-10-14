import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadgeButton from '../../src/components/MaxBadgeButton.vue';
import { getWcagRelativeLuminance, parseColorToRgb } from '../../src/helpers/colorLuminance';

function mountBadgeButton(props: Record<string, any> = {}) {
    return mount(MaxBadgeButton, {
        props: {
            label: '',
            ...props
        },
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

    it('repassa e renderiza o overlay corretamente dentro do botão', () => {
        const wrapper = mountBadgeButton({
            label: 'Notificações',
            overlay: 7
        });

        const overlayEl = wrapper.find('.max-badge-overlay');
        expect(overlayEl.exists()).toBe(true);
        expect(overlayEl.text()).toBe('7');
    });

    it('aplica outline ativo com luminância menor que o background quando ativo e ausente quando inativo', async () => {
        const wrapper = mountBadgeButton({
            label: 'Ativo Teste',
            color: 'var(--blue-600)',
            modelValue: true
        });

        const badgeComponent = wrapper.findComponent({ name: 'MaxBadge' });
        expect(badgeComponent.exists()).toBe(true);

        const outlineColor = badgeComponent.props('outlineColor') as string;
        expect(outlineColor).toBeDefined();
        expect(typeof outlineColor).toBe('string');
        expect(outlineColor.startsWith('#')).toBe(true);

        const badgeEl = wrapper.find('.max-badge');
        expect(badgeEl.attributes('style')).toMatch(/outline(?:-width)?:\s*1\.5px/i);
        expect(badgeEl.attributes('style')).toMatch(/outline(?:-style)?:\s*solid/i);

        const badgeStyle = badgeEl.attributes('style') ?? '';
        const bgMatch = badgeStyle.match(/background(?:-color)?:\s*([^;]+)/i);
        expect(bgMatch).toBeTruthy();
        const bgValue = bgMatch![1].trim();

        const [bgR, bgG, bgB] = parseColorToRgb(bgValue);
        const [outR, outG, outB] = parseColorToRgb(outlineColor);

        const bgLum = getWcagRelativeLuminance(bgR, bgG, bgB);
        const outLum = getWcagRelativeLuminance(outR, outG, outB);

        expect(outLum).toBeLessThan(bgLum);

        // Quando inativo, outline ativo deve ser removido
        await wrapper.setProps({ modelValue: false });
        expect(badgeComponent.props('outlineColor')).toBeUndefined();
        expect(wrapper.find('.max-badge').attributes('style') ?? '').not.toMatch(/outline/i);
    });

    it('calcula outline ativo mais escuro mesmo com background customizado', () => {
        const customBg = '#93c5fd';
        const wrapper = mountBadgeButton({
            label: 'Custom Bg',
            background: customBg,
            modelValue: true
        });

        const badgeComponent = wrapper.findComponent({ name: 'MaxBadge' });
        const outlineColor = badgeComponent.props('outlineColor') as string;
        expect(outlineColor).toBeDefined();

        const [bgR, bgG, bgB] = parseColorToRgb(customBg);
        const [outR, outG, outB] = parseColorToRgb(outlineColor);

        const bgLum = getWcagRelativeLuminance(bgR, bgG, bgB);
        const outLum = getWcagRelativeLuminance(outR, outG, outB);

        expect(outLum).toBeLessThan(bgLum);
    });

    it('aplica outline ativo dinamicamente em toggle autônomo por clique', async () => {
        const wrapper = mountBadgeButton({
            label: 'Toggle Autônomo'
        });

        const badgeComponent = wrapper.findComponent({ name: 'MaxBadge' });
        expect(badgeComponent.props('outlineColor')).toBeUndefined();

        await wrapper.trigger('click');
        expect(wrapper.classes()).toContain('is-active');
        expect(badgeComponent.props('outlineColor')).toBeDefined();

        await wrapper.trigger('click');
        expect(wrapper.classes()).not.toContain('is-active');
        expect(badgeComponent.props('outlineColor')).toBeUndefined();
    });
});
