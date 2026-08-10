import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import { watch } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        watchDebounced: (source: any, cb: any) => watch(source, cb, { immediate: false })
    };
});
import InputBase from '../../src/components/InputBase.vue';

function mountCpfCnpj(props: Record<string, any> = {}) {
    return mount(MaxInputCpfCnpj, {
        props: { modelValue: '', ...props },
        global: {
            stubs: {
                InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] },
                InputText: { template: '<input />' },
                MaxIcon: true
            }
        }
    });
}

describe('MaxInputCpfCnpj', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountCpfCnpj();
        expect(wrapper.exists()).toBe(true);
    });

    it('aplica máscara de CPF quando prop cpf=true', () => {
        const wrapper = mountCpfCnpj({ cpf: true });
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toContain('###.###.###-##');
    });

    it('aplica máscara de CNPJ quando prop cnpj=true', () => {
        const wrapper = mountCpfCnpj({ cnpj: true });
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toContain('##.###.###/####-##');
    });

    // `done` e um computed derivado de temp_value — nao existe metodo
    // imperativo de validacao. Basta atribuir o valor e aguardar o ciclo.
    it('valida CPF correto e marca done=true', async () => {
        const wrapper = mountCpfCnpj({ cpf: true, modelValue: '52998224725' });
        (wrapper.vm as any).temp_value = '52998224725';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(true);
    });

    it('valida CPF inválido e não marca done=true', async () => {
        const wrapper = mountCpfCnpj({ cpf: true, modelValue: '11111111111' });
        (wrapper.vm as any).temp_value = '11111111111';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(false);
    });

    it('valida CNPJ correto e marca done=true', async () => {
        const wrapper = mountCpfCnpj({ cnpj: true, modelValue: '11222333000181' });
        (wrapper.vm as any).temp_value = '11222333000181';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(true);
    });

    it('exibe caution para CPF inválido com conteúdo', () => {
        const wrapper = mountCpfCnpj({ cpf: true, modelValue: '12345678900' });
        (wrapper.vm as any).temp_value = '12345678900';
        expect((wrapper.vm as any).caution).toBeTruthy();
    });

    it('detecta automaticamente tipo CPF vs CNPJ', () => {
        const wrapper = mountCpfCnpj();
        (wrapper.vm as any).temp_value = '123456789012';
        expect((wrapper.vm as any).maskValue.mask).toContain('##.###.###/####-##');

        (wrapper.vm as any).temp_value = '12345';
        expect((wrapper.vm as any).maskValue.mask).toContain('###.###.###-##');
    });

    it('done prop explicitly overrides internal logic', () => {
        const wrapper = mountCpfCnpj({ done: true });
        expect((wrapper.vm as any).done).toBe(true);
    });

    it('caution prop explicitly overrides internal logic', () => {
        const wrapper = mountCpfCnpj({ caution: true });
        expect((wrapper.vm as any).caution).toBe(true);
    });

    it('error returns custom attrs if any', () => {
        const wrapper = mountCpfCnpj({ errMsg: 'Custom error', caution: true });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Custom error');
    });

    it('error when required and empty', () => {
        const wrapper = mountCpfCnpj({ required: true, caution: true });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Campo obrigatório');
    });

    it('error returns default cnpj invalid msg', async () => {
        const wrapper = mountCpfCnpj();
        (wrapper.vm as any).temp_value = '123456789012'; // invalid
        await wrapper.vm.$nextTick();
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('CNPJ inválido');
    });

    it('error returns default cpf invalid msg', async () => {
        const wrapper = mountCpfCnpj();
        (wrapper.vm as any).temp_value = '11111111111'; // invalid
        await wrapper.vm.$nextTick();
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('CPF inválido');
    });

    it('updates temp_value when modelValue prop changes', async () => {
        const wrapper = mountCpfCnpj();
        await wrapper.setProps({ modelValue: '52998224725' });
        expect((wrapper.vm as any).temp_value).toBe('52998224725');
    });

    it('watchDebounced emits complete when done', async () => {
        const wrapper = mountCpfCnpj();
        (wrapper.vm as any).temp_value = '52998224725';
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('complete')).toBeTruthy();
    });

    it('watchDebounced emits only update when not done but 14 digits', async () => {
        const wrapper = mountCpfCnpj();
        (wrapper.vm as any).temp_value = '11111111111111';
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('complete')).toBeFalsy();
    });

    it('emite update:modelValue com valor reduzido ao apagar o documento (não fica congelado)', async () => {
        const wrapper = mountCpfCnpj({ cpf: true, modelValue: '52998224725' });
        (wrapper.vm as any).temp_value = '52998224725';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['52998224725']);

        (wrapper.vm as any).temp_value = '5299';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['5299']);

        (wrapper.vm as any).temp_value = '';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.pop()).toEqual(['']);
    });
});
