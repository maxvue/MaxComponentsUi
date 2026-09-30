import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxSubCard from '../../src/components/MaxSubCard.vue';

function mountSubCard(options: { props?: Record<string, any>; slots?: Record<string, any> } = {}) {
    return mount(MaxSubCard, {
        props: options.props ?? {},
        slots: options.slots ?? {},
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub" :data-icon="icon"></span>',
                    props: ['icon']
                }
            }
        }
    });
}

describe('MaxSubCard', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('Renderização básica e Props', () => {
        it('renderiza com classe base max-subcard', () => {
            const wrapper = mountSubCard();
            expect(wrapper.classes()).toContain('max-subcard');
        });

        it('renderiza título e subtítulo', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Item Aninhado',
                    subtitle: 'Descrição detalhada'
                }
            });
            expect(wrapper.find('.max-subcard-title').text()).toBe('Item Aninhado');
            expect(wrapper.find('.max-subcard-subtitle').text()).toBe('Descrição detalhada');
        });

        it('renderiza ícone no cabeçalho compacto', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Com Ícone',
                    icon: 'mdi:file-document'
                }
            });
            const icon = wrapper.find('.max-icon-stub');
            expect(icon.exists()).toBe(true);
            expect(icon.attributes('data-icon')).toBe('mdi:file-document');
        });
    });

    describe('Status', () => {
        it('renderiza badge/tag de status com a classe semântica correta para sucesso', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Tarefa Concluída',
                    status: 'done'
                }
            });
            const statusEl = wrapper.find('.max-subcard-status');
            expect(statusEl.exists()).toBe(true);
            expect(statusEl.classes()).toContain('max-subcard-status--success');
            expect(statusEl.text()).toContain('done');
        });

        it('renderiza badge/tag de status com classe semântica para perigo/erro', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Falha no processamento',
                    status: 'error'
                }
            });
            const statusEl = wrapper.find('.max-subcard-status');
            expect(statusEl.classes()).toContain('max-subcard-status--danger');
        });

        it('renderiza badge/tag de status com classe semântica para alerta/aviso', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Pendente',
                    status: 'warning'
                }
            });
            const statusEl = wrapper.find('.max-subcard-status');
            expect(statusEl.classes()).toContain('max-subcard-status--warning');
        });

        it('renderiza badge/tag de status com classe semântica para informação', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Em andamento',
                    status: 'info'
                }
            });
            const statusEl = wrapper.find('.max-subcard-status');
            expect(statusEl.classes()).toContain('max-subcard-status--info');
        });
    });

    describe('Slots', () => {
        it('renderiza slot customizado de header', () => {
            const wrapper = mountSubCard({
                slots: {
                    header: '<div class="sub-header-custom">Header Customizado</div>'
                }
            });
            expect(wrapper.find('.sub-header-custom').exists()).toBe(true);
            expect(wrapper.text()).toContain('Header Customizado');
        });

        it('renderiza slot content, metrics ou default', () => {
            const wrapper = mountSubCard({
                slots: {
                    content: '<div class="sub-content">Conteúdo do SubCard</div>'
                }
            });
            expect(wrapper.find('.sub-content').text()).toBe('Conteúdo do SubCard');

            const wrapperMetrics = mountSubCard({
                slots: {
                    metrics: '<div class="sub-metrics">Métricas</div>'
                }
            });
            expect(wrapperMetrics.find('.sub-metrics').text()).toBe('Métricas');

            const wrapperDef = mountSubCard({
                slots: {
                    default: '<div class="sub-default">Conteúdo Default</div>'
                }
            });
            expect(wrapperDef.find('.sub-default').text()).toBe('Conteúdo Default');
        });

        it('renderiza slot actions e footer no rodapé quando header customizado for informado', () => {
            const wrapperWithFooter = mountSubCard({
                slots: {
                    footer: '<div class="sub-footer">Rodapé Customizado</div>'
                }
            });
            expect(wrapperWithFooter.find('.max-subcard-footer .sub-footer').exists()).toBe(true);

            const wrapperHeaderActions = mountSubCard({
                slots: {
                    header: '<div class="custom-header">Header</div>',
                    actions: '<button class="act-btn">Ação Rodapé</button>'
                }
            });
            expect(wrapperHeaderActions.find('.max-subcard-footer .act-btn').exists()).toBe(true);
        });

        it('renderiza slot actions', () => {
            const wrapper = mountSubCard({
                props: {
                    title: 'Item com Ações'
                },
                slots: {
                    actions: '<button class="sub-act-btn">Remover</button>'
                }
            });
            expect(wrapper.find('.max-subcard-actions .sub-act-btn').exists()).toBe(true);
        });
    });

    describe('Estados e Interatividade (@click)', () => {
        it('adiciona is-clickable e role button quando clickable=true', () => {
            const wrapper = mountSubCard({
                props: {
                    clickable: true
                }
            });
            expect(wrapper.classes()).toContain('is-clickable');
            expect(wrapper.attributes('role')).toBe('button');
            expect(wrapper.attributes('tabindex')).toBe('0');
        });

        it('emite evento click ao clicar quando interativo', async () => {
            const wrapper = mountSubCard({
                props: {
                    clickable: true
                }
            });
            await wrapper.trigger('click');
            expect(wrapper.emitted('click')).toBeTruthy();
            expect(wrapper.emitted('click')!.length).toBe(1);
        });

        it('aciona click via teclado Enter ou Space quando interativo', async () => {
            const wrapper = mountSubCard({
                props: {
                    clickable: true
                }
            });
            await wrapper.trigger('keydown', { key: 'Enter' });
            expect(wrapper.emitted('click')!.length).toBe(1);

            await wrapper.trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('click')!.length).toBe(2);
        });

        it('aplica estado disabled e impede clique', async () => {
            const wrapper = mountSubCard({
                props: {
                    clickable: true,
                    disabled: true
                }
            });
            expect(wrapper.classes()).toContain('is-disabled');
            expect(wrapper.attributes('aria-disabled')).toBe('true');
            expect(wrapper.attributes('tabindex')).toBeUndefined();

            await wrapper.trigger('click');
            expect(wrapper.emitted('click')).toBeUndefined();
        });
    });
});
