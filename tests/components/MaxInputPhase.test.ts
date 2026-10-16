import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputPhase from '../../src/components/MaxInputPhase.vue';
import MaxDomainSelect from '../../src/components/base/MaxDomainSelect.vue';
import { PHASE_OPTIONS } from '../../src/constants/electricalInputs';

function mountPhase(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputPhase, {
        props: { modelValue: null, ...props },
        attrs
    });
}

describe('MaxInputPhase (D01)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza o adaptador MaxDomainSelect com catálogo de fases e label padrão', () => {
        const wrapper = mountPhase();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.exists()).toBe(true);
        expect(domainSelect.props('options')).toEqual(PHASE_OPTIONS);
        expect(domainSelect.props('label')).toBe('Número de fases');
        expect(domainSelect.props('filter')).toBe(false);
    });

    it('permite sobrescrever label e filter via props', () => {
        const wrapper = mountPhase({ label: 'Fase Elétrica', filter: true });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        expect(domainSelect.props('label')).toBe('Fase Elétrica');
        expect(domainSelect.props('filter')).toBe(true);
    });

    it('emite update:modelValue numérico e change ao selecionar fase', async () => {
        const wrapper = mountPhase();
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', 3);
        domainSelect.vm.$emit('change', 3);
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[3]]);
        expect(wrapper.emitted('change')).toEqual([[3]]);
    });

    it('emite null no update:modelValue e evento clear ao limpar seleção', async () => {
        const wrapper = mountPhase({ modelValue: 2, clearable: true });
        const domainSelect = wrapper.findComponent(MaxDomainSelect);

        domainSelect.vm.$emit('update:modelValue', null);
        domainSelect.vm.$emit('change', null);
        domainSelect.vm.$emit('clear');
        await wrapper.vm.$nextTick();

        expect(wrapper.emitted('update:modelValue')).toEqual([[null]]);
        expect(wrapper.emitted('change')).toEqual([[null]]);
        expect(wrapper.emitted('clear')).toBeDefined();
    });

    it('encaminha atributos extras para o adaptador', () => {
        const wrapper = mountPhase({}, { id: 'phase-select-test', 'data-qa': 'phase-input' });
        expect(wrapper.find('.max-select').attributes('id')).toBe('phase-select-test');
        expect(wrapper.find('[data-qa="phase-input"]').exists()).toBe(true);
    });
});
