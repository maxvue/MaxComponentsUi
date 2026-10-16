import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxProgressBar from '../../src/components/MaxProgressBar.vue';

describe('MaxProgressBar.vue', () => {
    it('deve renderizar role progressbar com valores ARIA corretos', () => {
        const wrapper = mount(MaxProgressBar, {
            props: {
                value: 60,
                max: 100,
                ariaLabel: 'Upload de arquivo'
            }
        });

        const track = wrapper.find('.max-progress-bar__track');
        expect(track.attributes('role')).toBe('progressbar');
        expect(track.attributes('aria-label')).toBe('Upload de arquivo');
        expect(track.attributes('aria-valuemin')).toBe('0');
        expect(track.attributes('aria-valuemax')).toBe('100');
        expect(track.attributes('aria-valuenow')).toBe('60');
        expect(track.attributes('aria-valuetext')).toBe('60%');

        const fill = wrapper.find('.max-progress-bar__fill');
        expect(fill.attributes('style')).toContain('width: 60%');
    });

    it('deve suportar mode meter com role meter', () => {
        const wrapper = mount(MaxProgressBar, {
            props: {
                value: 75,
                max: 100,
                mode: 'meter',
                ariaLabel: 'Uso de armazenamento'
            }
        });

        const track = wrapper.find('.max-progress-bar__track');
        expect(track.attributes('role')).toBe('meter');
        expect(track.attributes('aria-label')).toBe('Uso de armazenamento');
        expect(track.attributes('aria-valuenow')).toBe('75');
    });

    it('deve tratar valor null como indeterminado sem aria-valuenow', () => {
        const wrapper = mount(MaxProgressBar, {
            props: {
                value: null,
                ariaLabel: 'Processando'
            }
        });

        const track = wrapper.find('.max-progress-bar__track');
        expect(track.attributes('aria-valuenow')).toBeUndefined();
        expect(wrapper.classes()).toContain('is-indeterminate');
    });

    it('deve limitar a barra a 100% visualmente quando o valor exceder o máximo', () => {
        const wrapper = mount(MaxProgressBar, {
            props: {
                value: 130,
                max: 100,
                ariaLabel: 'Consumo do orçamento'
            }
        });

        const track = wrapper.find('.max-progress-bar__track');
        expect(track.attributes('aria-valuenow')).toBe('100');

        const fill = wrapper.find('.max-progress-bar__fill');
        expect(fill.attributes('style')).toContain('width: 100%');
    });

    it('deve respeitar valueText customizado', () => {
        const wrapper = mount(MaxProgressBar, {
            props: {
                value: 50,
                max: 100,
                ariaLabel: 'Etapa',
                valueText: 'Passo 2 de 4'
            }
        });

        const track = wrapper.find('.max-progress-bar__track');
        expect(track.attributes('aria-valuetext')).toBe('Passo 2 de 4');
    });
});
