import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';
import fs from 'node:fs';
import path from 'node:path';

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

describe('MaxInputOTP - Acessibilidade e Semântica', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('contêiner possui role="group" e aria-label padrão descrevendo a quantidade de dígitos', () => {
        const wrapper = mountOtp();
        const container = wrapper.find('.max-input-otp-container');
        expect(container.attributes('role')).toBe('group');
        expect(container.attributes('aria-label')).toBe('Código de verificação de 6 dígitos');
    });

    it('contêiner utiliza a prop label no aria-label se fornecida', () => {
        const wrapper = mountOtp({ label: 'Código de confirmação 2FA' });
        const container = wrapper.find('.max-input-otp-container');
        expect(container.attributes('aria-label')).toBe('Código de confirmação 2FA');
    });

    it('contêiner adapta o aria-label dinamicamente conforme a prop length', () => {
        const wrapper = mountOtp({ length: 4 });
        const container = wrapper.find('.max-input-otp-container');
        expect(container.attributes('aria-label')).toBe('Código de verificação de 4 dígitos');
    });

    it('cada célula possui aria-label posicional "Dígito X de Y"', () => {
        const wrapper = mountOtp({ length: 6 });
        const cells = wrapper.findAll('input.max-input-otp-cell');
        expect(cells.length).toBe(6);
        expect(cells[0].attributes('aria-label')).toBe('Dígito 1 de 6');
        expect(cells[1].attributes('aria-label')).toBe('Dígito 2 de 6');
        expect(cells[2].attributes('aria-label')).toBe('Dígito 3 de 6');
        expect(cells[3].attributes('aria-label')).toBe('Dígito 4 de 6');
        expect(cells[4].attributes('aria-label')).toBe('Dígito 5 de 6');
        expect(cells[5].attributes('aria-label')).toBe('Dígito 6 de 6');
    });

    it('células adaptam o aria-label quando length for 4', () => {
        const wrapper = mountOtp({ length: 4 });
        const cells = wrapper.findAll('input.max-input-otp-cell');
        expect(cells.length).toBe(4);
        expect(cells[0].attributes('aria-label')).toBe('Dígito 1 de 4');
        expect(cells[3].attributes('aria-label')).toBe('Dígito 4 de 4');
    });

    it('possui regra de estilo :focus-visible no SCSS scoped para a célula OTP', () => {
        const filePath = path.resolve(__dirname, '../../src/components/MaxInputOTP.vue');
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('.max-input-otp-cell');
        expect(content).toContain(':focus-visible');
    });

    it('permite preenchimento e emite update:modelValue', async () => {
        const wrapper = mountOtp({ length: 4 });
        const cells = wrapper.findAll('input.max-input-otp-cell');
        await cells[0].setValue('1');
        await cells[1].setValue('2');

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['12']);
    });
});
