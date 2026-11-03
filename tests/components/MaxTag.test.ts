import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxTag from '../../src/components/MaxTag.vue';

function mountTag(props: Record<string, any> = {}) {
    return mount(MaxTag, {
        props,
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon" :data-icon="icon"></span>',
                    props: ['icon']
                }
            }
        }
    });
}

describe('MaxTag', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com label ou value', () => {
        const wrapperLabel = mountTag({ label: 'Tag Label' });
        expect(wrapperLabel.text()).toContain('Tag Label');

        const wrapperValue = mountTag({ value: 'Tag Value' });
        expect(wrapperValue.text()).toContain('Tag Value');
    });

    it('aplica cores de acordo com severidade', () => {
        const wrapperSuccess = mountTag({ label: 'Sucesso', severity: 'success' });
        const badge = wrapperSuccess.findComponent({ name: 'MaxBadge' });
        expect(badge.props('color')).toContain('--max-success-500');

        const wrapperDanger = mountTag({ label: 'Perigo', severity: 'danger' });
        const badgeDanger = wrapperDanger.findComponent({ name: 'MaxBadge' });
        expect(badgeDanger.props('color')).toContain('--max-danger-500');
    });

    it('repassa overlay escalar para o MaxBadge interno', () => {
        const wrapper = mountTag({ label: 'Mensagens', overlay: 5 });
        const overlay = wrapper.find('.max-badge-overlay');
        expect(overlay.exists()).toBe(true);
        expect(overlay.text()).toBe('5');
    });

    it('repassa e renderiza múltiplos overlays em array de strings e números', () => {
        const wrapper = mountTag({
            label: 'Multitag',
            overlay: ['Alpha', 99]
        });

        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(2);
        expect(overlays[0].text()).toBe('Alpha');
        expect(overlays[1].text()).toBe('99');
    });

    it('repassa e renderiza OverlayData[] com cores customizadas', () => {
        const wrapper = mountTag({
            label: 'Tag Cores',
            overlay: [
                { value: 'Novo', color: '#10b981' },
                { value: 'Crítico', color: '#ef4444' }
            ]
        });

        const overlays = wrapper.findAll('.max-badge-overlay');
        expect(overlays).toHaveLength(2);
        expect(overlays[0].text()).toBe('Novo');
        expect(overlays[1].text()).toBe('Crítico');
    });
});
