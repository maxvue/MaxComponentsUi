import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';

function mountOtp(props: Record<string, any> = {}) {
    return mount(MaxInputOTP, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                InputBase: {
                    template: '<div class="input-base-stub"><slot /></div>',
                    props: ['error', 'caution', 'done', 'required', 'label', 'noStatus']
                },
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputOTP', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza 6 caixas de entrada por padrão e 1 separador', () => {
        const wrapper = mountOtp();
        const inputs = wrapper.findAll('input.max-input-otp-cell');
        expect(inputs.length).toBe(6);

        const separator = wrapper.find('.max-input-otp-separator');
        expect(separator.exists()).toBe(true);
        expect(separator.text()).toBe('-');
    });

    it('renderiza quantidade customizada com prop length ou len', () => {
        const wrapper = mountOtp({ length: 4 });
        const inputs = wrapper.findAll('input.max-input-otp-cell');
        expect(inputs.length).toBe(4);
    });

    it('permite desativar o separador com separator=false', () => {
        const wrapper = mountOtp({ separator: false });
        const separator = wrapper.find('.max-input-otp-separator');
        expect(separator.exists()).toBe(false);
    });

    it('customiza o caractere do separador', () => {
        const wrapper = mountOtp({ separatorChar: '—' });
        const separator = wrapper.find('.max-input-otp-separator');
        expect(separator.text()).toBe('—');
    });

    it('preenche os dígitos e emite update:modelValue ao digitar', async () => {
        const wrapper = mountOtp();
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        await inputs[0].setValue('5');
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['5']);

        await inputs[1].setValue('9');
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['59']);
    });

    it('ignora caracteres não numéricos quando integerOnly=true', async () => {
        const wrapper = mountOtp({ integerOnly: true });
        const input = wrapper.find('input.max-input-otp-cell');

        await input.setValue('a');
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();
    });

    it('emite evento @complete quando todas as caixas forem preenchidas', async () => {
        const wrapper = mountOtp({ length: 4 });
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        await inputs[0].setValue('1');
        await inputs[1].setValue('2');
        await inputs[2].setValue('3');
        await inputs[3].setValue('4');

        expect(wrapper.emitted('complete')).toBeTruthy();
        expect(wrapper.emitted('complete')?.pop()).toEqual(['1234']);
    });

    it('suporta colar código completo (paste) e remove formatação', async () => {
        const wrapper = mountOtp({ length: 6 });
        const input = wrapper.find('input.max-input-otp-cell');

        const pasteEvent = {
            preventDefault: vi.fn(),
            clipboardData: {
                getData: (format: string) => (format === 'text' ? '123-456' : '')
            }
        };

        await input.trigger('paste', pasteEvent);

        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['123456']);
        expect(wrapper.emitted('complete')?.pop()).toEqual(['123456']);

        const inputs = wrapper.findAll('input.max-input-otp-cell');
        expect((inputs[0].element as HTMLInputElement).value).toBe('1');
        expect((inputs[5].element as HTMLInputElement).value).toBe('6');
    });

    it('comportamento de Backspace em caixa preenchida apaga o dígito', async () => {
        const wrapper = mountOtp({ modelValue: '123456' });
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        await inputs[2].trigger('keydown', { key: 'Backspace' });

        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['12456']);
    });

    it('comportamento de Backspace em caixa vazia apaga o dígito anterior', async () => {
        const wrapper = mountOtp({ modelValue: '12' });
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        // input 2 é vazio (índice 2, 3º dígito)
        await inputs[2].trigger('keydown', { key: 'Backspace' });

        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['1']);
    });

    it('comportamento de Delete apaga o dígito da caixa atual', async () => {
        const wrapper = mountOtp({ modelValue: '123456' });
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        await inputs[0].trigger('keydown', { key: 'Delete' });

        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['23456']);
    });

    it('atualiza valores internos quando modelValue muda externamente', async () => {
        const wrapper = mountOtp({ modelValue: '12' });
        let inputs = wrapper.findAll('input.max-input-otp-cell');
        expect((inputs[0].element as HTMLInputElement).value).toBe('1');
        expect((inputs[1].element as HTMLInputElement).value).toBe('2');

        await wrapper.setProps({ modelValue: '987654' });
        inputs = wrapper.findAll('input.max-input-otp-cell');
        expect((inputs[0].element as HTMLInputElement).value).toBe('9');
        expect((inputs[5].element as HTMLInputElement).value).toBe('4');
    });

    it('aplica type="password" quando mask=true', () => {
        const wrapper = mountOtp({ mask: true });
        const inputs = wrapper.findAll('input.max-input-otp-cell');
        inputs.forEach((input) => {
            expect(input.attributes('type')).toBe('password');
        });
    });

    it('desabilita todos os inputs quando disabled=true', () => {
        const wrapper = mountOtp({ disabled: true });
        const inputs = wrapper.findAll('input.max-input-otp-cell');
        inputs.forEach((input) => {
            expect(input.attributes('disabled')).toBeDefined();
        });
    });

    it('método clear() limpa todas as caixas', async () => {
        const wrapper = mountOtp({ modelValue: '123456' });
        (wrapper.vm as any).clear();
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['']);
        const inputs = wrapper.findAll('input.max-input-otp-cell');
        inputs.forEach((input) => {
            expect((input.element as HTMLInputElement).value).toBe('');
        });
    });

    it('valida erro de campo obrigatório e código incompleto ao blur', async () => {
        const wrapper = mountOtp({ required: true, length: 6 });
        const inputs = wrapper.findAll('input.max-input-otp-cell');

        await inputs[0].trigger('blur');
        expect((wrapper.vm as any).done).toBe(false);
        expect((wrapper.vm as any).error_msg).toBe('Campo obrigatório');

        await inputs[0].setValue('1');
        await inputs[0].trigger('blur');
        expect((wrapper.vm as any).done).toBe(false);
        expect((wrapper.vm as any).error_msg).toBe('Código incompleto');
    });
});
