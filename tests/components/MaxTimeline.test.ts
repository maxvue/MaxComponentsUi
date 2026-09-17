import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxTimeline from '../../src/components/MaxTimeline.vue';
import { MaxTimeLine, Timeline } from '../../src/index';

describe('MaxTimeline', () => {
    const sampleEvents = [
        { id: 'ev-1', title: 'Passo 1', date: '10:00' },
        { id: 'ev-2', title: 'Passo 2', date: '11:00' },
        { id: 'ev-3', title: 'Passo 3', date: '12:00' }
    ];

    it('exporta MaxTimeline, MaxTimeLine e Timeline como aliases idênticos', () => {
        expect(MaxTimeline).toBeDefined();
        expect(MaxTimeLine).toBe(MaxTimeline);
        expect(Timeline).toBe(MaxTimeline);
    });

    it('renderiza o container raiz .max-timeline com classes padrão vertical e left', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: sampleEvents }
        });

        const root = wrapper.find('.max-timeline');
        expect(root.exists()).toBe(true);
        expect(root.classes()).toContain('max-timeline--vertical');
        expect(root.classes()).toContain('max-timeline--left');
    });

    it('renderiza o número correto de eventos', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: sampleEvents }
        });

        const events = wrapper.findAll('.max-timeline-event');
        expect(events.length).toBe(3);
    });

    it('aplica classes corretas para layout horizontal e alinhamento padrão top', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                layout: 'horizontal'
            }
        });

        const root = wrapper.find('.max-timeline');
        expect(root.classes()).toContain('max-timeline--horizontal');
        expect(root.classes()).toContain('max-timeline--top');
    });

    it('permite definir alinhamento customizado (right, alternate, bottom)', () => {
        const wrapperRight = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                align: 'right'
            }
        });
        expect(wrapperRight.find('.max-timeline').classes()).toContain('max-timeline--right');

        const wrapperAlternate = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                align: 'alternate'
            }
        });
        expect(wrapperAlternate.find('.max-timeline').classes()).toContain('max-timeline--alternate');

        const wrapperBottom = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                layout: 'horizontal',
                align: 'bottom'
            }
        });
        expect(wrapperBottom.find('.max-timeline').classes()).toContain('max-timeline--bottom');
    });

    it('renderiza slots customizados content, opposite, marker e connector', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: sampleEvents },
            slots: {
                opposite: '<template #opposite="{ item }"><span class="custom-opp">{{ item.date }}</span></template>',
                content: '<template #content="{ item }"><h4 class="custom-cnt">{{ item.title }}</h4></template>',
                marker: '<template #marker="{ item }"><i class="custom-mrk">{{ item.id }}</i></template>',
                connector: '<template #connector="{ index }"><hr class="custom-conn" :data-idx="index" /></template>'
            }
        });

        expect(wrapper.findAll('.custom-opp').length).toBe(3);
        expect(wrapper.findAll('.custom-cnt').length).toBe(3);
        expect(wrapper.findAll('.custom-mrk').length).toBe(3);
        // O conector só deve aparecer entre os nós (length - 1 = 2)
        expect(wrapper.findAll('.custom-conn').length).toBe(2);
    });

    it('oculta o conector padrão no último item da lista', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: sampleEvents }
        });

        const connectors = wrapper.findAll('.max-timeline-event-connector');
        expect(connectors.length).toBe(2);
    });

    it('renderiza representação simples no slot content caso seja string ou número', () => {
        const stringEvents = ['Início', 'Meio', 'Fim'];
        const wrapper = mount(MaxTimeline, {
            props: { value: stringEvents }
        });

        const contents = wrapper.findAll('.max-timeline-event-content');
        expect(contents[0].text()).toBe('Início');
        expect(contents[1].text()).toBe('Meio');
        expect(contents[2].text()).toBe('Fim');
    });

    it('aplica cores dinâmicas no marcador padrão a partir de item.color ou item.severity', () => {
        const coloredEvents = [
            { id: 1, title: 'Sucesso', severity: 'success' },
            { id: 2, title: 'Alerta', severity: 'warning' },
            { id: 3, title: 'Custom', color: '#ff00aa' },
            { id: 4, title: 'Neutro' }
        ];

        const wrapper = mount(MaxTimeline, {
            props: { value: coloredEvents }
        });

        const markers = wrapper.findAll('.max-timeline-event-marker');
        expect(markers.length).toBe(4);

        expect(markers[0].attributes('style')).toContain('var(--max-success-500, #10b981)');
        expect(markers[1].attributes('style')).toContain('var(--max-warning-500, #f59e0b)');
        expect(markers[2].attributes('style')).toContain('#ff00aa');
        expect(markers[3].attributes('style') || '').not.toContain('border-color');
    });

    it('utiliza dataKey para identificação estável dos itens quando fornecido', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                dataKey: 'id'
            }
        });

        expect(wrapper.findAll('.max-timeline-event').length).toBe(3);
    });

    it('renderiza com segurança quando value não é fornecido ou é vazio', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: [] }
        });

        expect(wrapper.find('.max-timeline').exists()).toBe(true);
        expect(wrapper.findAll('.max-timeline-event').length).toBe(0);
    });

    it('aplica classe max-timeline--icon-center por padrão e mantém estrutura padrão de 3 colunas', () => {
        const wrapper = mount(MaxTimeline, {
            props: { value: sampleEvents }
        });

        const root = wrapper.find('.max-timeline');
        expect(root.classes()).toContain('max-timeline--icon-center');

        const event = wrapper.find('.max-timeline-event');
        expect(event.find('.max-timeline-event-opposite').exists()).toBe(true);
        expect(event.find('.max-timeline-event-separator').exists()).toBe(true);
        expect(event.find('.max-timeline-event-content').exists()).toBe(true);
        expect(event.find('.max-timeline-event-body').exists()).toBe(false);
    });

    it('renderiza corretamente com iconPosition="left" (ícone à esquerda e textos à direita)', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                iconPosition: 'left'
            },
            slots: {
                opposite: '<template #opposite="{ item }"><span class="opp">{{ item.date }}</span></template>',
                content: '<template #content="{ item }"><span class="cnt">{{ item.title }}</span></template>'
            }
        });

        const root = wrapper.find('.max-timeline');
        expect(root.classes()).toContain('max-timeline--icon-left');

        const event = wrapper.find('.max-timeline-event');
        const children = event.element.children;
        // Primeiro filho é o separador, segundo é o body com os textos
        expect(children[0].classList.contains('max-timeline-event-separator')).toBe(true);
        expect(children[1].classList.contains('max-timeline-event-body')).toBe(true);

        const body = event.find('.max-timeline-event-body');
        expect(body.find('.max-timeline-event-opposite').exists()).toBe(true);
        expect(body.find('.opp').text()).toBe('10:00');
        expect(body.find('.max-timeline-event-content').exists()).toBe(true);
        expect(body.find('.cnt').text()).toBe('Passo 1');
    });

    it('não renderiza .max-timeline-event-opposite no modo left quando o slot opposite não for fornecido', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                iconPosition: 'left'
            }
        });

        const body = wrapper.find('.max-timeline-event-body');
        expect(body.find('.max-timeline-event-opposite').exists()).toBe(false);
        expect(body.find('.max-timeline-event-content').exists()).toBe(true);
    });

    it('renderiza corretamente com iconPosition="right" (textos à esquerda e ícone à direita)', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                iconPosition: 'right'
            },
            slots: {
                opposite: '<template #opposite="{ item }"><span class="opp">{{ item.date }}</span></template>',
                content: '<template #content="{ item }"><span class="cnt">{{ item.title }}</span></template>'
            }
        });

        const root = wrapper.find('.max-timeline');
        expect(root.classes()).toContain('max-timeline--icon-right');

        const event = wrapper.find('.max-timeline-event');
        const children = event.element.children;
        // Primeiro filho é o body com textos, segundo é o separador
        expect(children[0].classList.contains('max-timeline-event-body')).toBe(true);
        expect(children[1].classList.contains('max-timeline-event-separator')).toBe(true);

        const body = event.find('.max-timeline-event-body');
        expect(body.find('.max-timeline-event-opposite').exists()).toBe(true);
        expect(body.find('.max-timeline-event-content').exists()).toBe(true);
    });

    it('mantém comportamento horizontal inalterado com layout="horizontal" mesmo com iconPosition', () => {
        const wrapper = mount(MaxTimeline, {
            props: {
                value: sampleEvents,
                layout: 'horizontal',
                iconPosition: 'left'
            }
        });

        const event = wrapper.find('.max-timeline-event');
        expect(event.find('.max-timeline-event-body').exists()).toBe(false);
        expect(event.find('.max-timeline-event-opposite').exists()).toBe(true);
        expect(event.find('.max-timeline-event-separator').exists()).toBe(true);
        expect(event.find('.max-timeline-event-content').exists()).toBe(true);
    });
});
