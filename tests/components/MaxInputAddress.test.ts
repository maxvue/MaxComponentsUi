import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAddress from '../../src/components/MaxInputAddress.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputUF from '../../src/components/MaxInputUF.vue';

describe('MaxInputAddress', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza os campos de endereço compostos', () => {
        const wrapper = mount(MaxInputAddress, {
            props: {
                modelValue: {}
            }
        });
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputCep).exists()).toBe(true);
        expect(wrapper.findComponent(MaxInputUF).exists()).toBe(true);
        expect(wrapper.findAllComponents(MaxInputText).length).toBeGreaterThanOrEqual(4);
    });

    it('recebe e repassa os valores do modelo aos campos internos', () => {
        const wrapper = mount(MaxInputAddress, {
            props: {
                modelValue: {
                    cep: '01001-000',
                    street: 'Praça da Sé',
                    number: '100',
                    neighborhood: 'Sé',
                    city: 'São Paulo',
                    state: 'SP'
                }
            }
        });
        const cepComponent = wrapper.findComponent(MaxInputCep);
        expect(cepComponent.props('modelValue')).toBe('01001-000');

        const ufComponent = wrapper.findComponent(MaxInputUF);
        expect(ufComponent.props('modelValue')).toBe('SP');
    });

    it('emite update:modelValue ao atualizar um campo', async () => {
        const wrapper = mount(MaxInputAddress, {
            props: {
                modelValue: {
                    city: 'São Paulo'
                }
            }
        });
        const textInputs = wrapper.findAllComponents(MaxInputText);
        // O primeiro MaxInputText é o logradouro (street)
        await textInputs[0].vm.$emit('update:modelValue', 'Av. Paulista');

        const emitted = wrapper.emitted('update:modelValue');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toEqual({
            city: 'São Paulo',
            street: 'Av. Paulista'
        });
    });

    it('repassa o evento cep-complete emitido pelo MaxInputCep', async () => {
        const wrapper = mount(MaxInputAddress, {
            props: {
                modelValue: {}
            }
        });
        const cepComponent = wrapper.findComponent(MaxInputCep);
        await cepComponent.vm.$emit('complete', '01001000');

        const emitted = wrapper.emitted('cep-complete');
        expect(emitted).toBeTruthy();
        expect(emitted![0][0]).toBe('01001000');
    });
});
