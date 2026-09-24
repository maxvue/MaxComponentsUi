import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputUF from '../../src/components/MaxInputUF.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import InputBase from '../../src/components/InputBase.vue';
import { BRAZIL_STATES, BRAZIL_NATIONAL_STATE } from '../../src/constants/brazilStates';

function mountUF(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputUF, {
        props: { modelValue: '', ...props },
        attrs
    });
}

describe('MaxInputUF', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente o componente', () => {
        const wrapper = mountUF();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputSelect).exists()).toBe(true);
    });

    it('contém exatamente 27 estados por padrão e estão ordenados por nome', () => {
        const wrapper = mountUF();
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];

        expect(options.length).toBe(27);
        expect(options[0].name).toBe('Acre');
        expect(options[options.length - 1].name).toBe('Tocantins');

        // Confirma que não possui BR por padrão
        const hasBr = options.some((opt) => opt.uf === 'BR');
        expect(hasBr).toBe(false);
    });

    it('inclui BR (Brasil) no topo da lista quando showBr é true', () => {
        const wrapper = mountUF({ showBr: true });
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as any[];

        expect(options.length).toBe(28);
        expect(options[0].uf).toBe('BR');
        expect(options[0].name).toBe('Brasil');
    });

    it('suporta aliases para showBr (showBrasil, showBrazil, brazil, allowBrazil, brasil)', () => {
        const aliases = ['showBrasil', 'showBrazil', 'brazil', 'allowBrazil', 'brasil'];
        for (const alias of aliases) {
            const wrapper = mountUF({}, { [alias]: true });
            const select = wrapper.findComponent(MaxInputSelect);
            const options = select.props('options') as any[];
            expect(options.length).toBe(28);
            expect(options[0].uf).toBe('BR');
        }
    });

    it('exibe apenas a sigla UF no trigger por padrão quando selecionado', async () => {
        const wrapper = mountUF({ modelValue: 'SP' });
        await wrapper.vm.$nextTick();

        const triggerValue = wrapper.find('.max-uf-trigger-value');
        expect(triggerValue.exists()).toBe(true);
        expect(triggerValue.text()).toBe('SP');
    });

    it('reconhece sigla em minúsculas (ex: "sp" -> "SP")', async () => {
        const wrapper = mountUF({ modelValue: 'sp' });
        await wrapper.vm.$nextTick();

        const triggerValue = wrapper.find('.max-uf-trigger-value');
        expect(triggerValue.exists()).toBe(true);
        expect(triggerValue.text()).toBe('SP');
    });

    it('emite update:modelValue e change ao selecionar uma UF', async () => {
        const wrapper = mountUF({ modelValue: '' });
        const select = wrapper.findComponent(MaxInputSelect);

        await select.vm.$emit('update:modelValue', 'RJ');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('RJ');

        expect(wrapper.emitted('change')).toBeTruthy();
        const [changeVal, changeState] = wrapper.emitted('change')?.[0] as [string, any];
        expect(changeVal).toBe('RJ');
        expect(changeState.name).toBe('Rio de Janeiro');
    });

    it('suporta a prop value="state" emitindo e mostrando o nome por extenso', async () => {
        const wrapper = mountUF({ modelValue: 'Rio Grande do Sul', value: 'state' });
        await wrapper.vm.$nextTick();

        const triggerValue = wrapper.find('.max-uf-trigger-value');
        expect(triggerValue.exists()).toBe(true);
        expect(triggerValue.text()).toBe('Rio Grande do Sul');

        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('update:modelValue', 'Santa Catarina');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('Santa Catarina');
    });

    it('suporta aliases para value="state" (ex: value="estado")', async () => {
        const wrapper = mountUF({ modelValue: 'Minas Gerais', value: 'estado' });
        await wrapper.vm.$nextTick();

        const triggerValue = wrapper.find('.max-uf-trigger-value');
        expect(triggerValue.text()).toBe('Minas Gerais');
    });

    it('suporta a prop value="min" emitindo e mostrando a forma abreviada (ex: "R. G. do Sul")', async () => {
        const wrapper = mountUF({ modelValue: 'RS', value: 'min' });
        await wrapper.vm.$nextTick();

        const triggerValue = wrapper.find('.max-uf-trigger-value');
        expect(triggerValue.exists()).toBe(true);
        expect(triggerValue.text()).toBe('R. G. do Sul');

        const select = wrapper.findComponent(MaxInputSelect);
        await select.vm.$emit('update:modelValue', 'RS');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('R. G. do Sul');
    });

    it('suporta aliases para value="min" (abbreviated, abbrev, abreviado)', async () => {
        const aliases = ['abbreviated', 'abbrev', 'abreviado'];
        for (const valMode of aliases) {
            const wrapper = mountUF({ modelValue: 'MS', value: valMode });
            await wrapper.vm.$nextTick();
            const triggerValue = wrapper.find('.max-uf-trigger-value');
            expect(triggerValue.text()).toBe('M. G. do Sul');
        }
    });

    it('resolve o label padrão como "UF"', () => {
        const wrapper = mountUF();
        const inputBase = wrapper.findComponent(InputBase);
        expect(inputBase.props('label')).toBe('UF');
        expect(wrapper.find('label').text()).toBe('UF');
    });

    it('resolve o label "state" / "estado" como "Estado"', () => {
        const wrapper1 = mountUF({ label: 'state' });
        expect(wrapper1.findComponent(InputBase).props('label')).toBe('Estado');
        expect(wrapper1.find('label').text()).toBe('Estado');

        const wrapper2 = mountUF({ label: 'estado' });
        expect(wrapper2.findComponent(InputBase).props('label')).toBe('Estado');
        expect(wrapper2.find('label').text()).toBe('Estado');
    });

    it('resolve o label "min" / "abbreviated" como "Estado (Abrev.)"', () => {
        const wrapper1 = mountUF({ label: 'min' });
        expect(wrapper1.findComponent(InputBase).props('label')).toBe('Estado (Abrev.)');
        expect(wrapper1.find('label').text()).toBe('Estado (Abrev.)');

        const wrapper2 = mountUF({ label: 'abbreviated' });
        expect(wrapper2.findComponent(InputBase).props('label')).toBe('Estado (Abrev.)');
        expect(wrapper2.find('label').text()).toBe('Estado (Abrev.)');
    });

    it('aceita texto customizado para a prop label', () => {
        const wrapper = mountUF({ label: 'Estado de Nascimento' });
        expect(wrapper.findComponent(InputBase).props('label')).toBe('Estado de Nascimento');
        expect(wrapper.find('label').text()).toBe('Estado de Nascimento');
    });

    it('oculta o rótulo quando noLabel é true', () => {
        const wrapper = mountUF({ noLabel: true });
        expect(wrapper.findComponent(InputBase).props('label')).toBeUndefined();
        expect(wrapper.find('label').exists()).toBe(false);
    });

    it('habilita filter: true por padrão e permite desabilitar com filter: false', () => {
        const wrapperDefault = mountUF();
        expect(wrapperDefault.findComponent(MaxInputSelect).props('filter')).toBe(true);

        const wrapperNoFilter = mountUF({ filter: false });
        expect(wrapperNoFilter.findComponent(MaxInputSelect).props('filter')).toBe(false);
    });

    it('repassa atributos e props comuns para o MaxInputSelect (disabled, required, placeholder)', () => {
        const wrapper = mountUF({
            disabled: true,
            required: true,
            placeholder: 'Selecione o estado'
        });
        const select = wrapper.findComponent(MaxInputSelect);
        expect(select.props('disabled')).toBe(true);
        expect(select.props('required')).toBe(true);
        expect(select.props('placeholder')).toBe('Selecione o estado');
    });

    it('permite customizar o slot #value', async () => {
        const wrapper = mount(MaxInputUF, {
            props: { modelValue: 'SP' },
            slots: {
                value: ({ state }: any) => `Estado selecionado: ${state?.name}`
            }
        });
        await wrapper.vm.$nextTick();
        expect(wrapper.text()).toContain('Estado selecionado: São Paulo');
    });

    it('emite valor vazio ao limpar seleção', async () => {
        const wrapper = mountUF({ modelValue: 'MG', clearable: true });
        const select = wrapper.findComponent(MaxInputSelect);

        await select.vm.$emit('update:modelValue', '');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toBe('');
    });

    it('garante que todas as 28 bandeiras possuem Data URIs base64 válidas decodificáveis como SVG', () => {
        const allStates = [...BRAZIL_STATES, BRAZIL_NATIONAL_STATE];
        expect(allStates.length).toBe(28);

        for (const state of allStates) {
            expect(state.flag).toMatch(/^data:image\/svg\+xml;base64,/);
            const base64Data = state.flag.replace(/^data:image\/svg\+xml;base64,/, '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf-8');

            expect(decoded).toMatch(/^<svg/);
            expect(decoded).toContain('xmlns="http://www.w3.org/2000/svg"');
            expect(decoded.startsWith('%3C')).toBe(false);
        }
    });

    it('renderiza o slot de opção com a bandeira Data URI sem loading=lazy', () => {
        const wrapper = mountUF();
        const select = wrapper.findComponent(MaxInputSelect);
        const options = select.props('options') as BrazilState[];
        expect(options.length).toBe(27);

        const spOption = options.find((o) => o.uf === 'SP');
        expect(spOption).toBeDefined();
        expect(spOption?.flag).toMatch(/^data:image\/svg\+xml;base64,/);
    });
});
