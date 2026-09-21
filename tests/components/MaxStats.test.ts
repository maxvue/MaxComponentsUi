import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxStats from '../../src/components/MaxStats.vue';
import MaxIcon from '../../src/components/MaxIcon.vue';
import type { MaxStatsItem } from '../../src/components/MaxStats.vue';

const sampleItems: MaxStatsItem[] = [
    {
        label: 'Total de Alunos',
        value: 125,
        sublabel: 'Em acompanhamento',
        icon: 'mdi:account-group',
        color: '#3b82f6'
    },
    {
        label: 'Em Andamento',
        value: '42',
        sublabel: 'Próximas lições',
        icon: 'mdi:book-open-page-variant',
        color: '#8b5cf6'
    },
    {
        label: 'Decisões Batismo',
        value: 18,
        icon: 'mdi:water',
        color: '#10b981'
    }
];

function mountStats(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxStats, {
        props: {
            items: sampleItems,
            ...props
        },
        attrs
    });
}

describe('MaxStats Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    describe('Renderização Básica', () => {
        it('renderiza o container de estatísticas com sucesso', () => {
            const wrapper = mountStats();
            expect(wrapper.exists()).toBe(true);
            expect(wrapper.find('.max-stats-container').exists()).toBe(true);
        });

        it('renderiza a quantidade correta de itens fornecidos', () => {
            const wrapper = mountStats();
            const items = wrapper.findAll('.max-stat-item');
            expect(items.length).toBe(3);
        });

        it('renderiza container vazio sem falhas se o array de items for vazio', () => {
            const wrapper = mountStats({ items: [] });
            expect(wrapper.find('.max-stats-container').exists()).toBe(true);
            expect(wrapper.findAll('.max-stat-item').length).toBe(0);
        });
    });

    describe('Layout Desktop (Cards)', () => {
        it('renderiza estrutura completa de card quando layout é "cards"', () => {
            const wrapper = mountStats({ layout: 'cards' });
            const firstCard = wrapper.findAll('.max-stat-card')[0];

            expect(firstCard.exists()).toBe(true);
            expect(firstCard.find('.max-stat-label').text()).toBe('Total de Alunos');
            expect(firstCard.find('.max-stat-value').text()).toBe('125');
            expect(firstCard.find('.max-stat-sublabel').text()).toBe('Em acompanhamento');
            expect(firstCard.find('.max-stat-icon-wrapper').exists()).toBe(true);
            const icon = firstCard.findComponent(MaxIcon);
            expect(icon.exists()).toBe(true);
            expect(icon.props('size')).toBe('24px');
        });

        it('oculta o sublabel quando o item não tiver sublabel definido', () => {
            const wrapper = mountStats({ layout: 'cards' });
            // Terceiro item não possui sublabel
            const thirdCard = wrapper.findAll('.max-stat-card')[2];
            expect(thirdCard.find('.max-stat-sublabel').exists()).toBe(false);
        });
    });

    describe('Layout Mobile (Pills)', () => {
        it('renderiza formato pílula compacto quando layout é "pills"', () => {
            const wrapper = mountStats({ layout: 'pills' });
            const pills = wrapper.findAll('.max-stat-pill');

            expect(pills.length).toBe(3);
            const firstPill = pills[0];
            expect(firstPill.find('.max-stat-pill-icon-wrapper').exists()).toBe(true);
            const pillIcon = firstPill.findComponent(MaxIcon);
            expect(pillIcon.exists()).toBe(true);
            expect(pillIcon.props('size')).toBe('18px');
            expect(firstPill.find('.max-stat-pill-value').text()).toBe('125');
            // No modo pílula não deve exibir o texto do label na interface visível
            expect(firstPill.find('.max-stat-label').exists()).toBe(false);
        });

        it('possui atributos title e aria-label para acessibilidade no modo pílula', () => {
            const wrapper = mountStats({ layout: 'pills' });
            const firstPill = wrapper.findAll('.max-stat-pill')[0];

            expect(firstPill.attributes('title')).toContain('Total de Alunos');
            expect(firstPill.attributes('aria-label')).toContain('Total de Alunos');
        });
    });

    describe('Controle de Quebra de Linha (allow-line-break)', () => {
        it('aplica classes de scroll horizontal suave quando allowLineBreak for false (padrão)', () => {
            const wrapper = mountStats({ allowLineBreak: false });
            const container = wrapper.find('.max-stats-container');

            expect(container.classes()).toContain('is-nowrap');
            expect(container.classes()).not.toContain('is-wrap');
        });

        it('aplica classe de quebra de linha (flex-wrap) quando allowLineBreak for true', () => {
            const wrapper = mountStats({ allowLineBreak: true });
            const container = wrapper.find('.max-stats-container');

            expect(container.classes()).toContain('is-wrap');
            expect(container.classes()).not.toContain('is-nowrap');
        });

        it('aceita prop em kebab-case allow-line-break', () => {
            const wrapper = mountStats({ 'allow-line-break': true });
            const container = wrapper.find('.max-stats-container');

            expect(container.classes()).toContain('is-wrap');
        });
    });

    describe('Cores e Estilos Derivados', () => {
        it('injeta estilos inline com as cores derivadas para cada item', () => {
            const wrapper = mountStats({ layout: 'cards' });
            const firstCard = wrapper.findAll('.max-stat-card')[0];

            const style = firstCard.attributes('style');
            expect(style).toBeDefined();
            // Deve conter variáveis CSS locais ou regras de background
            expect(style).toContain('--stat-bg');
            expect(style).toContain('--stat-icon-bg');
            expect(style).toContain('--stat-text');
            expect(style).toContain('--stat-accent');
        });
    });

    describe('Resiliência a Props Nulas/Indefinidas', () => {
        it('não quebra se items for undefined', () => {
            expect(() => {
                const wrapper = mountStats({ items: undefined });
                expect(wrapper.find('.max-stats-container').exists()).toBe(true);
                expect(wrapper.findAll('.max-stat-item')).toHaveLength(0);
            }).not.toThrow();
        });

        it('não quebra se items for null', () => {
            expect(() => {
                const wrapper = mountStats({ items: null as any });
                expect(wrapper.find('.max-stats-container').exists()).toBe(true);
                expect(wrapper.findAll('.max-stat-item')).toHaveLength(0);
            }).not.toThrow();
        });
    });

    describe('Prefix e Suffix', () => {
        it('renderiza prefixo e sufixo no modo cards', () => {
            const wrapper = mountStats({
                layout: 'cards',
                items: [
                    {
                        label: 'Faturamento',
                        value: '1.250',
                        prefix: 'R$',
                        suffix: 'mil',
                        icon: 'mdi:cash',
                        color: '#10b981'
                    }
                ]
            });

            const card = wrapper.find('.max-stat-card');
            expect(card.find('.max-stat-prefix').exists()).toBe(true);
            expect(card.find('.max-stat-prefix').text()).toBe('R$');
            expect(card.find('.max-stat-value').text()).toBe('1.250');
            expect(card.find('.max-stat-suffix').exists()).toBe(true);
            expect(card.find('.max-stat-suffix').text()).toBe('mil');
        });

        it('renderiza sufixo com alias sufix no modo cards', () => {
            const wrapper = mountStats({
                layout: 'cards',
                items: [
                    {
                        label: 'Conversão',
                        value: 85,
                        sufix: '%',
                        icon: 'mdi:percent',
                        color: '#3b82f6'
                    }
                ]
            });

            const card = wrapper.find('.max-stat-card');
            expect(card.find('.max-stat-prefix').exists()).toBe(false);
            expect(card.find('.max-stat-suffix').exists()).toBe(true);
            expect(card.find('.max-stat-suffix').text()).toBe('%');
        });

        it('renderiza prefixo e sufixo no modo pills', () => {
            const wrapper = mountStats({
                layout: 'pills',
                items: [
                    {
                        label: 'Temperatura',
                        value: 36.5,
                        prefix: '+',
                        suffix: '°C',
                        icon: 'mdi:thermometer',
                        color: '#f59e0b'
                    }
                ]
            });

            const pill = wrapper.find('.max-stat-pill');
            expect(pill.find('.max-stat-pill-prefix').exists()).toBe(true);
            expect(pill.find('.max-stat-pill-prefix').text()).toBe('+');
            expect(pill.find('.max-stat-pill-value').text()).toBe('36.5');
            expect(pill.find('.max-stat-pill-suffix').exists()).toBe(true);
            expect(pill.find('.max-stat-pill-suffix').text()).toBe('°C');
        });

        it('permite customização rica via slots #prefix e #suffix', () => {
            const wrapper = mount(MaxStats, {
                props: {
                    layout: 'cards',
                    items: [
                        {
                            label: 'Meta',
                            value: 100,
                            icon: 'mdi:flag',
                            color: '#06b6d4'
                        }
                    ]
                },
                slots: {
                    prefix: '<span class="custom-prefix">Pre-</span>',
                    suffix: '<span class="custom-suffix">-Pos</span>'
                }
            });

            expect(wrapper.find('.custom-prefix').exists()).toBe(true);
            expect(wrapper.find('.custom-prefix').text()).toBe('Pre-');
            expect(wrapper.find('.custom-suffix').exists()).toBe(true);
            expect(wrapper.find('.custom-suffix').text()).toBe('-Pos');
        });

        it('permite customização rica via slots no modo pills com escopo item e index', () => {
            const wrapper = mount(MaxStats, {
                props: {
                    layout: 'pills',
                    items: [
                        {
                            label: 'Taxa',
                            value: 12,
                            icon: 'mdi:percent',
                            color: '#10b981'
                        }
                    ]
                },
                slots: {
                    prefix: (scope: any) => `[#${scope.index}:${scope.item.label}]`,
                    suffix: '% a.m.'
                }
            });

            expect(wrapper.find('.max-stat-pill-prefix').text()).toBe('[#0:Taxa]');
            expect(wrapper.find('.max-stat-pill-suffix').text()).toBe('% a.m.');
        });

        it('não renderiza elementos de prefix ou suffix quando não definidos', () => {
            const wrapper = mountStats({
                layout: 'cards',
                items: [
                    {
                        label: 'Simples',
                        value: 10,
                        icon: 'mdi:check',
                        color: '#10b981'
                    }
                ]
            });

            const card = wrapper.find('.max-stat-card');
            expect(card.find('.max-stat-prefix').exists()).toBe(false);
            expect(card.find('.max-stat-suffix').exists()).toBe(false);
        });
    });
});

