import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputUrl from '../../src/components/MaxInputUrl.vue';
import InputBase from '../../src/components/InputBase.vue';

describe('MaxInputUrl', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente com input type=url e atributos adequados', () => {
        const wrapper = mount(MaxInputUrl, {
            props: { modelValue: '' }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(InputBase).exists()).toBe(true);

        const input = wrapper.find('input');
        expect(input.attributes('type')).toBe('url');
        expect(input.attributes('inputmode')).toBe('url');
        expect(input.attributes('autocomplete')).toBe('url');
        expect(wrapper.findComponent(InputBase).props('label')).toBe('URL');
    });

    it('aceita URLs válidas http e https incluindo localhost, ip e porta', async () => {
        const validUrls = [
            'https://engeapp.com.br',
            'http://localhost:3000',
            'http://127.0.0.1:8000/api/v1',
            'https://sub.dominio.org/path/resource?param=1&foo=bar#section'
        ];

        for (const url of validUrls) {
            const wrapper = mount(MaxInputUrl, {
                props: { modelValue: url }
            });
            await wrapper.find('input').trigger('blur');
            const base = wrapper.findComponent(InputBase);
            expect(base.props('error')).toBeFalsy();
        }
    });

    it('rejeita URLs inválidas, relativas, sem esquema ou com esquemas inseguros', async () => {
        const invalidUrls = [
            'exemplo.com', // sem esquema
            '/api/endpoint', // relativo
            'javascript:alert(1)', // esquema não http(s)
            'ftp://files.example.com', // ftp
            'http://user:password@host.com', // credenciais embutidas
            'https://exemplo .com', // espaço interno
            ' https://exemplo.com ' // whitespace nas bordas
        ];

        for (const url of invalidUrls) {
            const wrapper = mount(MaxInputUrl, {
                props: { modelValue: url }
            });
            await wrapper.find('input').trigger('blur');
            const base = wrapper.findComponent(InputBase);
            expect(base.props('error')).toBe('URL inválida');
        }
    });

    it('exibe erro de campo obrigatório quando vazio', async () => {
        const wrapper = mount(MaxInputUrl, {
            props: { modelValue: '', required: true }
        });
        await wrapper.find('input').trigger('blur');
        expect(wrapper.findComponent(InputBase).props('error')).toBe('Campo obrigatório');
    });

    it('expõe métodos focus e setFocus', () => {
        const wrapper = mount(MaxInputUrl);
        expect(typeof wrapper.vm.focus).toBe('function');
        expect(typeof wrapper.vm.setFocus).toBe('function');
    });
});
