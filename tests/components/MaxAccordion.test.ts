import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAccordion from '../../src/components/MaxAccordion.vue';
import MaxAccordionItem from '../../src/components/MaxAccordionItem.vue';

/** Monta a estrutura completa do accordion usada nos testes. */
const mountFull = (props: Record<string, unknown> = {}) => mount(MaxAccordion, {
    props,
    slots: {
        default: `
            <MaxAccordionItem value="a">
                <template #header>Um</template>
                <template #content><span class="c-a">Conteudo A</span></template>
            </MaxAccordionItem>
            <MaxAccordionItem value="b" disabled>
                <template #header>Dois</template>
                <template #content><span class="c-b">Conteudo B</span></template>
            </MaxAccordionItem>
            <MaxAccordionItem value="c">
                <template #header>Tres</template>
                <template #content><span class="c-c">Conteudo C</span></template>
            </MaxAccordionItem>
        `
    },
    global: { components: { MaxAccordionItem } }
});

describe('MaxAccordion', () => {
    it('renderiza o slot default', () => {
        const wrapper = mount(MaxAccordion, {
            slots: { default: '<div class="filho">Conteudo</div>' }
        });
        expect(wrapper.find('.max-accordion').exists()).toBe(true);
        expect(wrapper.find('.filho').exists()).toBe(true);
    });

    it('emite update:value ao abrir um item no modo single', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: undefined },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('no modo single, abrir um item substitui o anterior', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<div>x</div>' }
        });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
    });

    it('no modo single, alternar o item aberto emite undefined', () => {
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
});

describe('MaxAccordionItem', () => {
    it('renderiza header e conteudo do mesmo item', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.findAll('.max-accordion-item')).toHaveLength(3);
        expect(wrapper.findAll('.max-accordion-item-header')[0].text()).toContain('Um');
        expect(wrapper.find('.c-a').isVisible()).toBe(true);
    });

    it('renderiza como botao com aria-expanded', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.findAll('.max-accordion-item-header')[0].attributes('aria-expanded')).toBe('true');
        expect(wrapper.findAll('.max-accordion-item-header')[2].attributes('aria-expanded')).toBe('false');
    });

    it('liga aria-controls ao conteudo', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-item-header').attributes('aria-controls')).toContain('-content-a');
    });

    it('alterna o item ao clicar', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-item-header')[0].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('nao alterna quando o item esta desabilitado', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-item-header')[1].trigger('click');
        expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('marca aria-disabled no header desabilitado', () => {
        const wrapper = mountFull({ value: undefined });
        expect(wrapper.findAll('.max-accordion-item-header')[1].attributes('aria-disabled')).toBe('true');
    });

    it('usa headerAriaLevel 2 por padrao', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-item-header-wrapper').attributes('aria-level')).toBe('2');
    });

    it('aceita title como alternativa ao slot header', () => {
        const wrapper = mount(MaxAccordion, {
            slots: { default: '<MaxAccordionItem value="a" title="Titulo por prop" />' },
            global: { components: { MaxAccordionItem } }
        });
        expect(wrapper.find('.max-accordion-item-header').text()).toContain('Titulo por prop');
    });

    it('aceita o slot default como atalho para #content', () => {
        const wrapper = mount(MaxAccordion, {
            props: { value: 'a' },
            slots: { default: '<MaxAccordionItem value="a"><span class="atalho">X</span></MaxAccordionItem>' },
            global: { components: { MaxAccordionItem } }
        });
        expect(wrapper.find('.atalho').isVisible()).toBe(true);
    });

    it('gera value automatico por ordem de montagem quando nao informado', async () => {
        const wrapper = mount(MaxAccordion, {
            slots: {
                default: `
                    <MaxAccordionItem><template #header>Um</template></MaxAccordionItem>
                    <MaxAccordionItem><template #header>Dois</template></MaxAccordionItem>
                `
            },
            global: { components: { MaxAccordionItem } }
        });
        await wrapper.findAll('.max-accordion-item-header')[1].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['item-2']);
    });

    it('aplica role region e aria-labelledby', () => {
        const wrapper = mountFull({ value: 'a' });
        const content = wrapper.find('.max-accordion-item-content');
        expect(content.attributes('role')).toBe('region');
        expect(content.attributes('aria-labelledby')).toContain('-header-a');
    });

    it('mantem o conteudo fechado montado, porem oculto', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.c-c').exists()).toBe(true);
        expect(wrapper.find('.c-c').isVisible()).toBe(false);
    });

    it('com lazy, conteudo fechado nunca foi montado', () => {
        const wrapper = mountFull({ value: 'a', lazy: true });
        expect(wrapper.find('.c-c').exists()).toBe(false);
    });

    it('no modo multiple exibe varios conteudos', () => {
        const wrapper = mountFull({ multiple: true, value: ['a', 'c'] });
        expect(wrapper.find('.c-a').isVisible()).toBe(true);
        expect(wrapper.find('.c-c').isVisible()).toBe(true);
    });

    it('usa os icones customizados de expandir e recolher', () => {
        const wrapper = mountFull({ value: 'a', expandIcon: 'i:down', collapseIcon: 'i:up' });
        const icons = wrapper.findAllComponents({ name: 'MaxIcon' });
        expect(icons[0].props('i')).toBe('i:up');
        expect(icons[2].props('i')).toBe('i:down');
    });
});
