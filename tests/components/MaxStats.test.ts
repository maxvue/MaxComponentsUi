import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxStats from '../../src/components/MaxStats.vue';
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
});
