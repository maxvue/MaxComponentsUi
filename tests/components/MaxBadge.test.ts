import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadge from '../../src/components/MaxBadge.vue';
import { BADGE_STATUS_COLORS } from '../../src/helpers/colorLuminance';

function mountBadge(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxBadge, {
        props,
        attrs,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon" :data-icon="icon" :data-color="color"></span>',
                    props: ['icon', 'color']
                }
            }
        }
    });
}

describe('MaxBadge', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com label obrigatório', () => {
        const wrapper = mountBadge({ label: 'Ativo' });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.max-badge-label').text()).toBe('Ativo');
    });

    it('renderiza ícone à esquerda do label quando prop icon é fornecida', () => {
        const wrapper = mountBadge({ label: 'Sucesso', icon: 'solar:check-circle-bold' });
        const icon = wrapper.find('.max-badge-icon');
        expect(icon.exists()).toBe(true);
        expect(icon.attributes('data-icon')).toBe('solar:check-circle-bold');
    });

    it('não renderiza ícone quando prop icon não é fornecida', () => {
        const wrapper = mountBadge({ label: 'Sem Icone' });
        expect(wrapper.find('.max-badge-icon').exists()).toBe(false);
    });

    it('calcula cores WCAG para cor base escura no modo padrão', () => {
        // Cor escura: preto #000000
        const wrapper = mountBadge({ label: 'Dark Base', color: '#000000' });
        const style = wrapper.attributes('style') || '';
        // Deve ter backgroundColor e color
        expect(style).toContain('background-color');
        expect(style).toContain('color');
    });

    it('calcula cores WCAG para cor base clara no modo padrão', () => {
        // Cor clara: amarelo claro #fef08a
        const wrapper = mountBadge({ label: 'Light Base', color: '#fef08a' });
        const style = wrapper.attributes('style') || '';
        expect(style).toContain('background-color');
        expect(style).toContain('color');
    });

    it('aplica estilo neon quando prop neon é true', () => {
        const wrapper = mountBadge({ label: 'Neon Tag', neon: true });
        expect(wrapper.classes()).toContain('is-neon');
        const style = wrapper.attributes('style') || '';
        expect(style).toContain('border');
        expect(style).toContain('box-shadow');
    });

    it('renderiza círculo de status para valores mapeados', () => {
        const wrapperDone = mountBadge({ label: 'Concluído', status: 'done' });
        const dotDone = wrapperDone.find('.max-badge-status-dot');
        expect(dotDone.exists()).toBe(true);
        expect(dotDone.attributes('style')).toContain(BADGE_STATUS_COLORS.done);

        const wrapperError = mountBadge({ label: 'Erro', status: 'error' });
        const dotError = wrapperError.find('.max-badge-status-dot');
        expect(dotError.exists()).toBe(true);
        expect(dotError.attributes('style')).toContain(BADGE_STATUS_COLORS.error);

        const wrapperWarn = mountBadge({ label: 'Aviso', status: 'warn' });
        const dotWarn = wrapperWarn.find('.max-badge-status-dot');
        expect(dotWarn.exists()).toBe(true);
        expect(dotWarn.attributes('style')).toContain(BADGE_STATUS_COLORS.warn);
    });

    it('trata overlay=true como alias de status=done e overlay=false como status=error', () => {
        const wrapperTrue = mountBadge({ label: 'OK', overlay: true });
        const dotTrue = wrapperTrue.find('.max-badge-status-dot');
        expect(dotTrue.exists()).toBe(true);
        expect(dotTrue.attributes('style')).toContain(BADGE_STATUS_COLORS.done);

        const wrapperFalse = mountBadge({ label: 'Falha', overlay: false });
        const dotFalse = wrapperFalse.find('.max-badge-status-dot');
        expect(dotFalse.exists()).toBe(true);
        expect(dotFalse.attributes('style')).toContain(BADGE_STATUS_COLORS.error);
    });

    it('renderiza overlay de notificação à direita quando overlay é número ou string', () => {
        const wrapperNum = mountBadge({ label: 'Emails', overlay: 2 });
        const overlayNum = wrapperNum.find('.max-badge-overlay');
        expect(overlayNum.exists()).toBe(true);
        expect(overlayNum.text()).toBe('2');

        const wrapperStr = mountBadge({ label: 'Messages', overlay: '99+' });
        const overlayStr = wrapperStr.find('.max-badge-overlay');
        expect(overlayStr.exists()).toBe(true);
        expect(overlayStr.text()).toBe('99+');
    });

    it('permite coexistência de status à esquerda e overlay de notificação à direita', () => {
        const wrapper = mountBadge({ label: 'Processando', status: 'warn', overlay: 5 });
        expect(wrapper.find('.max-badge-status-dot').exists()).toBe(true);
        expect(wrapper.find('.max-badge-overlay').exists()).toBe(true);
        expect(wrapper.find('.max-badge-overlay').text()).toBe('5');
    });

    it('controla text-transform via uppercase e no-uppercase', () => {
        const wrapperDefault = mountBadge({ label: 'minúsculo' });
        expect(wrapperDefault.classes()).not.toContain('no-uppercase');

        const wrapperFalse = mountBadge({ label: 'Emails', uppercase: false });
        expect(wrapperFalse.classes()).toContain('no-uppercase');
        expect(wrapperFalse.attributes('style')).toContain('text-transform: none');

        const wrapperAttr = mountBadge({ label: 'Messages' }, { 'no-uppercase': true });
        expect(wrapperAttr.classes()).toContain('no-uppercase');
        expect(wrapperAttr.attributes('style')).toContain('text-transform: none');
    });
});
