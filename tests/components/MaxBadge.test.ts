import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxBadge from '../../src/components/MaxBadge.vue';
import { BADGE_STATUS_COLORS } from '../../src/helpers/colorLuminance';

function mountBadge(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxBadge, {
        props: {
            label: '',
            ...props
        },
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

    it('renderiza múltiplos overlays a partir de array de strings mantendo a ordem', () => {
        const wrapper = mountBadge({ label: 'Tarefas', overlay: ['Novo', 'Pendente', 'Urgente'] });
        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(3);
        expect(overlays[0].text()).toBe('Novo');
        expect(overlays[1].text()).toBe('Pendente');
        expect(overlays[2].text()).toBe('Urgente');
    });

    it('renderiza múltiplos overlays numéricos incluindo zero e valores negativos', () => {
        const wrapper = mountBadge({ label: 'Métricas', overlay: [0, 2, -1] });
        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(3);
        expect(overlays[0].text()).toBe('0');
        expect(overlays[1].text()).toBe('2');
        expect(overlays[2].text()).toBe('-1');
    });

    it('descarta strings vazias ou só de espaços sem descartar o zero nem duplicatas', () => {
        const wrapper = mountBadge({ label: 'Filtro', overlay: ['A', '', '  ', 'A', 0] });
        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(3);
        expect(overlays[0].text()).toBe('A');
        expect(overlays[1].text()).toBe('A');
        expect(overlays[2].text()).toBe('0');
    });

    it('não renderiza pílula quando overlay é array vazio', () => {
        const wrapper = mountBadge({ label: 'Vazio', overlay: [] });
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(0);
    });

    it('renderiza OverlayData único com cores da paleta padrão quando color é omitido ou vazio', () => {
        const wrapper = mountBadge({ label: 'Item', color: '#00768e', overlay: { value: 'Novo' } });
        const overlay = wrapper.find('.max-badge-overlay');
        expect(overlay.exists()).toBe(true);
        expect(overlay.text()).toBe('Novo');
        expect(overlay.attributes('style')).toContain('background-color');
        expect(overlay.attributes('style')).toContain('color');

        const wrapperEmptyColor = mountBadge({ label: 'Item 2', overlay: { value: 'Vazio', color: '  ' } });
        expect(wrapperEmptyColor.find('.max-badge-overlay').text()).toBe('Vazio');
    });

    it('renderiza OverlayData com cores independentes por item', () => {
        const wrapper = mountBadge({
            label: 'Multicor',
            color: '#00768e',
            overlay: [
                { value: 1, color: '#ef4444' },
                { value: 'OK', color: '#10b981' }
            ]
        });

        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(2);
        expect(overlays[0].text()).toBe('1');
        expect(overlays[1].text()).toBe('OK');

        const style1 = overlays[0].attributes('style') ?? '';
        const style2 = overlays[1].attributes('style') ?? '';

        // Cores calculadas devem ser diferentes porque partem de bases distintas (#ef4444 vs #10b981)
        expect(style1).not.toBe(style2);
    });

    it('suporta cor via variável CSS em OverlayData', () => {
        const wrapper = mountBadge({
            label: 'Var CSS',
            overlay: { value: 'Var', color: 'var(--max-primary-500)' }
        });
        const overlay = wrapper.find('.max-badge-overlay');
        expect(overlay.exists()).toBe(true);
        expect(overlay.text()).toBe('Var');
    });

    it('preserva prioridade do status explícito mesmo quando overlay é booleano', () => {
        const wrapper = mountBadge({ label: 'Conflito', status: 'warn', overlay: true });
        const dot = wrapper.find('.max-badge-status-dot');
        expect(dot.exists()).toBe(true);
        expect(dot.attributes('style')).toContain(BADGE_STATUS_COLORS.warn);
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(0);
    });

    it('reage a atualizações de props mantendo imutabilidade de dados congelados', async () => {
        const frozenData = Object.freeze([
            Object.freeze({ value: 'F1', color: '#3b82f6' }),
            Object.freeze({ value: 'F2' })
        ]);

        const wrapper = mountBadge({ label: 'Reativo', overlay: frozenData });
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(2);

        await wrapper.setProps({ overlay: 'Único' });
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(1);
        expect(wrapper.find('.max-badge-overlay').text()).toBe('Único');

        await wrapper.setProps({ overlay: [10, 20] });
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(2);
        expect(wrapper.findAll('.max-badge-overlay')[0].text()).toBe('10');

        await wrapper.setProps({ overlay: false });
        expect(wrapper.findAll('.max-badge-overlay')).toHaveLength(0);
        expect(wrapper.find('.max-badge-status-dot').attributes('style')).toContain(BADGE_STATUS_COLORS.error);
    });
});
