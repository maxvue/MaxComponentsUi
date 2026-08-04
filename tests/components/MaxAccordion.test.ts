import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAccordion from '../../src/components/MaxAccordion.vue';

describe('MaxAccordion', () => {
    it('renderiza o slot default', () => {
        const wrapper = mount(MaxAccordion, {
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        expect(wrapper.find('.max-accordion').exists()).toBe(true);
        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('emite update:value ao abrir um painel no modo single', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: undefined },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('no modo single, abrir um painel substitui o anterior', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
    });

    it('no modo single, alternar o painel aberto emite undefined', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([undefined]);
    });

    it('no modo multiple, acumula valores em array', () => {
        const wrapper = mount(MaxAccordion, {
            props: { multiple: true, value: ['a'] },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([['a', 'b']]);
    });

    it('no modo multiple, alternar remove do array', () => {
        const wrapper = mount(MaxAccordion, {
            props: { multiple: true, value: ['a', 'b'] },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual([['b']]);
    });

    it('emite tab-open ao abrir', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: undefined },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-open')?.[0]).toEqual([{ value: 'a' }]);
    });

    it('emite tab-close ao fechar', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-close')?.[0]).toEqual([{ value: 'a' }]);
    });
});
