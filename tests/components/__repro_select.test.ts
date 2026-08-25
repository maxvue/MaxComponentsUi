import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';

function mountSelect(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputSelect, {
        props: { modelValue: null, ...props },
        attrs,
        global: { stubs: { Icon: true, MaxIcon: true } }
    });
}

describe('REPRO: placeholder + valor simultaneos', () => {
    beforeEach(() => setActivePinia(createPinia()));

    const casos: Array<[string, any]> = [
        ['valor 0', 0],
        ['valor false', false],
        ['valor null', null]
    ];

    for (const [nome, valor] of casos) it(`${nome}: nao deve mostrar placeholder e valor juntos`, async () => {
        const options = [{ value: valor, name: 'Opcao Escolhida' }];
        const wrapper = mountSelect({ modelValue: valor, options }, { placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        const temPlaceholder = wrapper.find('.placeholder-select').exists();
        const temValor = wrapper.find('.value-div').exists();

        console.log(`[${nome}] placeholder=${temPlaceholder} valor=${temValor}`);
        expect(temPlaceholder && temValor).toBe(false);
    });


    it('valor sem opcao correspondente: deve mostrar placeholder', async () => {
        const options = [{ value: 'a', name: 'A' }];
        const wrapper = mountSelect({ modelValue: 'zzz', options }, { placeholder: 'Selecione' });
        await wrapper.vm.$nextTick();

        console.log(`[orfao] placeholder=${wrapper.find('.placeholder-select').exists()} valor=${wrapper.find('.value-div').exists()}`);
        expect(wrapper.find('.placeholder-select').exists()).toBe(true);
    });
});
