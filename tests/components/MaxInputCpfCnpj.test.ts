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

    it('rejeita CPF com comprimento correto mas dígito verificador errado', async () => {
        const wrapper = mountCpfCnpj({ cpf: true, modelValue: '52998224724' });
        (wrapper.vm as any).temp_value = '52998224724';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(false);
    });

    it('rejeita CNPJ com comprimento correto mas dígito verificador errado', async () => {
        const wrapper = mountCpfCnpj({ cnpj: true, modelValue: '11222333000182' });
        (wrapper.vm as any).temp_value = '11222333000182';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(false);
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
        const wrapper = mountCpfCnpj({ errMsg: 'Custom error', modelValue: '123' });
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('error')).toBe('Custom error');
    });

    it('exibe erro de Campo obrigatório quando required=true e o campo está vazio (sem caution manual)', () => {
        const wrapper = mountCpfCnpj({ required: true });
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

    // Cobre a separação exibição/valor introduzida na migração do InputText do PrimeVue para
    // <input> nativo: o v-model nativo recebe o valor mascarado, então a máscara alimenta
    // `masked_value` (exibição) enquanto a diretiva escreve só os dígitos em `temp_value`.
    // Sem estes casos, uma troca no template quebraria a exibição sem nenhum teste acusar.
    it('exibe o valor mascarado no <input> e mantém temp_value só com dígitos', async () => {
        const wrapper = mountCpfCnpj();
        const input = wrapper.find('input');

        await input.setValue('52998224725');

        expect(input.element.value).toBe('529.982.247-25');
        expect((wrapper.vm as any).temp_value).toBe('52998224725');
    });

    it('reflete no <input> um valor que chega pela prop', async () => {
        const wrapper = mountCpfCnpj();
        await wrapper.setProps({ modelValue: '52998224725' });
        await wrapper.vm.$nextTick();

        expect(wrapper.find('input').element.value).toBe('529.982.247-25');
    });

    it('preserva as classes visuais p-inputtext/p-component no <input> nativo', () => {
        const input = mountCpfCnpj().find('input');
        expect(input.classes()).toContain('p-inputtext');
        expect(input.classes()).toContain('p-component');
    });

    it('campo vazio não-obrigatório permanece com done=null e sem caution', () => {
        const wrapper = mountCpfCnpj();
        expect((wrapper.vm as any).done).toBeNull();
        expect((wrapper.vm as any).caution).toBe(false);
    });

    it('valida CPF com zeros à esquerda corretamente e marca done=true', async () => {
        const wrapper = mountCpfCnpj({ modelValue: '00793746973' });
        (wrapper.vm as any).temp_value = '00793746973';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(true);
        expect((wrapper.vm as any).caution).toBe(false);
        expect((wrapper.vm as any).error_msg).toBeNull();
    });

    it('valida CNPJ com zeros à esquerda corretamente e marca done=true', async () => {
        const wrapper = mountCpfCnpj({ modelValue: '00000000000191' });
        (wrapper.vm as any).temp_value = '00000000000191';
        await wrapper.vm.$nextTick();
        expect((wrapper.vm as any).done).toBe(true);
        expect((wrapper.vm as any).caution).toBe(false);
        expect((wrapper.vm as any).error_msg).toBeNull();
    });

    it('utiliza array nativo do Maska para máscara dinâmica', () => {
        const wrapper = mountCpfCnpj();
        const maskValue = (wrapper.vm as any).maskValue;
        expect(maskValue.mask).toEqual(['###.###.###-##', '##.###.###/####-##']);
    });

    it('repassa a prop disabled para o elemento <input>', () => {
        const wrapper = mountCpfCnpj({ disabled: true });
        const input = wrapper.find('input');
        expect(input.attributes('disabled')).toBeDefined();
    });

    it('formata adequadamente ao colar CNPJ de 14 dígitos', async () => {
        const wrapper = mountCpfCnpj();
        const input = wrapper.find('input');
        await input.setValue('11222333000181');
        expect(input.element.value).toBe('11.222.333/0001-81');
        expect((wrapper.vm as any).done).toBe(true);
        expect((wrapper.vm as any).error_msg).toBeNull();
    });

    it('formata adequadamente ao receber CNPJ formatado via modelValue', async () => {
        const wrapper = mountCpfCnpj();
        await wrapper.setProps({ modelValue: '11.222.333/0001-81' });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input').element.value).toBe('11.222.333/0001-81');
        expect((wrapper.vm as any).done).toBe(true);
    });

    it('formata adequadamente ao receber CPF formatado via modelValue', async () => {
        const wrapper = mountCpfCnpj();
        await wrapper.setProps({ modelValue: '007.937.469-73' });
        await wrapper.vm.$nextTick();
        expect(wrapper.find('input').element.value).toBe('007.937.469-73');
        expect((wrapper.vm as any).done).toBe(true);
        expect((wrapper.vm as any).caution).toBe(false);
        expect((wrapper.vm as any).error_msg).toBeNull();
    });
});
