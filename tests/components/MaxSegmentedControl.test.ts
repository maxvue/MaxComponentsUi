import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxSegmentedControl from '../../src/components/MaxSegmentedControl.vue';

describe('MaxSegmentedControl.vue', () => {
    const options = [
        { value: 'dia', label: 'Diário' },
        { value: 'mes', label: 'Mensal' },
        { value: 'ano', label: 'Anual', disabled: true },
        { value: 0, label: 'Zero Numérico' },
        { value: '0', label: 'Zero String' }
    ];

    it('deve renderizar container radiogroup com rótulo acessível e botões radio', () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'dia',
                options,
                ariaLabel: 'Frequência de envio'
            }
        });

        expect(wrapper.attributes('role')).toBe('radiogroup');
        expect(wrapper.attributes('aria-label')).toBe('Frequência de envio');

        const radios = wrapper.findAll('button[role="radio"]');
        expect(radios).toHaveLength(5);
        expect(radios[0].attributes('aria-checked')).toBe('true');
        expect(radios[1].attributes('aria-checked')).toBe('false');
    });

    it('deve fazer comparação estrita diferenciando número 0 e string "0"', () => {
        const wrapperNum = mount(MaxSegmentedControl, {
            props: {
                modelValue: 0,
                options,
                ariaLabel: 'Valores'
            }
        });
        const radiosNum = wrapperNum.findAll('button[role="radio"]');
        expect(radiosNum[3].attributes('aria-checked')).toBe('true');
        expect(radiosNum[4].attributes('aria-checked')).toBe('false');

        const wrapperStr = mount(MaxSegmentedControl, {
            props: {
                modelValue: '0',
                options,
                ariaLabel: 'Valores'
            }
        });
        const radiosStr = wrapperStr.findAll('button[role="radio"]');
        expect(radiosStr[3].attributes('aria-checked')).toBe('false');
        expect(radiosStr[4].attributes('aria-checked')).toBe('true');
    });

    it('deve emitir update:modelValue ao clicar em opção habilitada', async () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'dia',
                options,
                ariaLabel: 'Frequência'
            }
        });

        const radios = wrapper.findAll('button[role="radio"]');
        await radios[1].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['mes']);
    });

    it('não deve emitir update:modelValue ao clicar em opção desabilitada', async () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'dia',
                options,
                ariaLabel: 'Frequência'
            }
        });

        const radios = wrapper.findAll('button[role="radio"]');
        await radios[2].trigger('click');

        expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('deve manter um único tabstop no grupo para o item selecionado', () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'mes',
                options,
                ariaLabel: 'Frequência'
            }
        });

        const radios = wrapper.findAll('button[role="radio"]');
        expect(radios[0].attributes('tabindex')).toBe('-1');
        expect(radios[1].attributes('tabindex')).toBe('0');
        expect(radios[2].attributes('tabindex')).toBe('-1');
    });

    it('se o item selecionado estiver desabilitado, o primeiro habilitado recebe tabstop', () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'ano',
                options,
                ariaLabel: 'Frequência'
            }
        });

        const radios = wrapper.findAll('button[role="radio"]');
        expect(radios[0].attributes('tabindex')).toBe('0');
        expect(radios[2].attributes('tabindex')).toBe('-1');
    });

    it('navega com setas pulando itens desabilitados', async () => {
        const wrapper = mount(MaxSegmentedControl, {
            props: {
                modelValue: 'mes',
                options,
                ariaLabel: 'Frequência'
            },
            attachTo: document.body
        });

        const radios = wrapper.findAll('button[role="radio"]');
        const radio0 = radios[0].element as HTMLButtonElement;
        const radio3 = radios[3].element as HTMLButtonElement;


        const focus0 = vi.spyOn(radio0, 'focus');
        const focus3 = vi.spyOn(radio3, 'focus');

        // Pressionar ArrowRight na opção 1 ('mes'): próxima é 'ano' (disabled), deve pular para opção 3 (0)
        await radios[1].trigger('keydown', { key: 'ArrowRight' });
        expect(focus3).toHaveBeenCalled();

        // Pressionar ArrowLeft na opção 1 ('mes'): anterior é 'dia' (índice 0)
        await radios[1].trigger('keydown', { key: 'ArrowLeft' });
        expect(focus0).toHaveBeenCalled();

        wrapper.unmount();
    });
});
