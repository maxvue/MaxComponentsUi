import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAccordion from '../../src/components/MaxAccordion.vue';
import MaxAccordionPanel from '../../src/components/MaxAccordionPanel.vue';
import MaxAccordionHeader from '../../src/components/MaxAccordionHeader.vue';
import MaxAccordionContent from '../../src/components/MaxAccordionContent.vue';

/** Monta a estrutura completa do accordion usada nos testes. */
const mountFull = (props: Record<string, unknown> = {}) => mount(MaxAccordion, {
    props,
    slots: {
        default: `
            <MaxAccordionPanel value="a">
                <MaxAccordionHeader>Um</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-a">Conteudo A</span></MaxAccordionContent>
            </MaxAccordionPanel>
            <MaxAccordionPanel value="b" disabled>
                <MaxAccordionHeader>Dois</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-b">Conteudo B</span></MaxAccordionContent>
            </MaxAccordionPanel>
            <MaxAccordionPanel value="c">
                <MaxAccordionHeader>Tres</MaxAccordionHeader>
                <MaxAccordionContent><span class="c-c">Conteudo C</span></MaxAccordionContent>
            </MaxAccordionPanel>
        `
    },
    global: { components: { MaxAccordionPanel, MaxAccordionHeader, MaxAccordionContent } }
});

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

    it('emite tab-open com value e index numerico ao abrir', () => {
        const wrapper = mountFull({ value: undefined });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-open')?.[0]).toEqual([{ originalEvent: undefined, index: 0, value: 'a' }]);
    });

    it('emite tab-open com o index correto para o segundo e terceiro painel', () => {
        const wrapper = mountFull({ value: undefined });
        wrapper.vm.toggle('b');
        expect(wrapper.emitted('tab-open')?.[0]).toEqual([{ originalEvent: undefined, index: 1, value: 'b' }]);
        wrapper.vm.toggle('c');
        expect(wrapper.emitted('tab-open')?.[1]).toEqual([{ originalEvent: undefined, index: 2, value: 'c' }]);
    });

    it('emite tab-close com value e index numerico ao fechar', () => {
        const wrapper = mountFull({ value: 'a' });
        wrapper.vm.toggle('a');
        expect(wrapper.emitted('tab-close')?.[0]).toEqual([{ originalEvent: undefined, index: 0, value: 'a' }]);
    });
});

describe('MaxAccordionHeader', () => {
    it('renderiza como botao com aria-expanded', () => {
        const wrapper = mountFull({ value: 'a' });
        const header = wrapper.findAll('.max-accordion-header')[0];
        expect(header.attributes('aria-expanded')).toBe('true');
        expect(wrapper.findAll('.max-accordion-header')[2].attributes('aria-expanded')).toBe('false');
    });

    it('liga aria-controls ao conteudo', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-header').attributes('aria-controls')).toContain('-content-a');
    });

    it('alterna o painel ao clicar', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[0].trigger('click');
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('nao alterna quando o painel esta desabilitado', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[1].trigger('click');
        expect(wrapper.emitted('update:value')).toBeFalsy();
    });

    it('marca aria-disabled no header desabilitado', () => {
        const wrapper = mountFull({ value: undefined });
        expect(wrapper.findAll('.max-accordion-header')[1].attributes('aria-disabled')).toBe('true');
    });

    it('seta para baixo pula o painel desabilitado', async () => {
        const wrapper = mountFull({ value: undefined, selectOnFocus: true });
        await wrapper.findAll('.max-accordion-header')[0].trigger('keydown', { key: 'ArrowDown' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['c']);
    });

    it('Enter alterna o painel focado', async () => {
        const wrapper = mountFull({ value: undefined });
        await wrapper.findAll('.max-accordion-header')[0].trigger('keydown', { key: 'Enter' });
        expect(wrapper.emitted('update:value')?.[0]).toEqual(['a']);
    });

    it('usa headerAriaLevel 2 por padrao', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.max-accordion-header-wrapper').attributes('aria-level')).toBe('2');
    });
});

describe('MaxAccordionContent', () => {
    it('mostra apenas o conteudo do painel aberto', () => {
        const wrapper = mountFull({ value: 'a' });
        expect(wrapper.find('.c-a').isVisible()).toBe(true);
        expect(wrapper.find('.c-c').exists()).toBe(true);
    });

    it('aplica role region e aria-labelledby', () => {
        const wrapper = mountFull({ value: 'a' });
        const content = wrapper.find('.max-accordion-content');
        expect(content.attributes('role')).toBe('region');
        expect(content.attributes('aria-labelledby')).toContain('-header-a');
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
});
