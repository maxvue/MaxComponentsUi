import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxCard from '../../src/components/MaxCard.vue';

function mountCard(options: { props?: Record<string, any>; slots?: Record<string, any> } = {}) {
    return mount(MaxCard, {
        props: options.props ?? {},
        slots: options.slots ?? {},
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon-stub" :data-icon="icon"></span>',
                    props: ['icon']
                },
                MaxLoaderIcon: {
                    template: '<span class="max-loader-icon-stub"></span>'
                }
            }
        }
    });
}

describe('MaxCard', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    describe('Renderização básica e Props', () => {
        it('renderiza com classe base e variante default por padrão', () => {
            const wrapper = mountCard();
            expect(wrapper.classes()).toContain('max-card');
            expect(wrapper.classes()).toContain('max-card--default');
        });

        it('renderiza título e subtítulo quando informados via props', () => {
            const wrapper = mountCard({
                props: {
                    title: 'Meu Cartão',
                    subtitle: 'Subtítulo descritivo'
                }
            });
            expect(wrapper.find('.max-card-title').text()).toBe('Meu Cartão');
            expect(wrapper.find('.max-card-subtitle').text()).toBe('Subtítulo descritivo');
        });

        it('renderiza ícone no cabeçalho quando informado', () => {
            const wrapper = mountCard({
                props: {
                    title: 'Com Ícone',
                    icon: 'mdi:credit-card'
                }
            });
            const icon = wrapper.find('.max-icon-stub');
            expect(icon.exists()).toBe(true);
            expect(icon.attributes('data-icon')).toBe('mdi:credit-card');
        });
    });

    describe('Variantes', () => {
        it('renderiza com classe max-card--add na variante add', () => {
            const wrapper = mountCard({
                props: {
                    variant: 'add'
                }
            });
            expect(wrapper.classes()).toContain('max-card--add');
        });

        it('renderiza placeholder padrão na variante add sem slots', () => {
            const wrapper = mountCard({
                props: {
                    variant: 'add',
                    title: 'Adicionar novo item'
                }
            });
            expect(wrapper.find('.max-card-add-placeholder').exists()).toBe(true);
            expect(wrapper.text()).toContain('Adicionar novo item');
        });

        it('renderiza addLabel na variante add com precedência sobre title', () => {
            const wrapper = mountCard({
                props: {
                    variant: 'add',
                    addLabel: 'Adicionar Homologação de Projeto',
                    title: 'Título Secundário'
                }
            });
            expect(wrapper.find('.max-card-add-placeholder').exists()).toBe(true);
            expect(wrapper.find('.max-card-add-title').text()).toBe('Adicionar Homologação de Projeto');
        });

        it('é interativo por padrão na variante add', () => {
            const wrapper = mountCard({
                props: {
                    variant: 'add'
                }
            });
            expect(wrapper.attributes('role')).toBe('button');
            expect(wrapper.attributes('tabindex')).toBe('0');
        });
    });

    describe('Slots', () => {
        it('renderiza slot customizado de header substituindo o padrão', () => {
            const wrapper = mountCard({
                slots: {
                    header: '<div class="custom-header">Cabeçalho Personalizado</div>'
                }
            });
            expect(wrapper.find('.custom-header').exists()).toBe(true);
            expect(wrapper.text()).toContain('Cabeçalho Personalizado');
        });

        it('renderiza slot media para imagens ou banners', () => {
            const wrapper = mountCard({
                slots: {
                    media: '<img src="/test.jpg" alt="Teste" class="banner" />'
                }
            });
            expect(wrapper.find('.max-card-media').exists()).toBe(true);
            expect(wrapper.find('img.banner').exists()).toBe(true);
        });

        it('renderiza slot content, body ou default', () => {
            const wrapperContent = mountCard({
                slots: {
                    content: '<p class="slot-content">Conteúdo Nomeado</p>'
                }
            });
            expect(wrapperContent.find('.slot-content').text()).toBe('Conteúdo Nomeado');

            const wrapperBody = mountCard({
                slots: {
                    body: '<p class="slot-body">Conteúdo Body</p>'
                }
            });
            expect(wrapperBody.find('.slot-body').text()).toBe('Conteúdo Body');

            const wrapperDefault = mountCard({
                slots: {
                    default: '<p class="slot-default">Conteúdo Default</p>'
                }
            });
            expect(wrapperDefault.find('.slot-default').text()).toBe('Conteúdo Default');
        });

        it('renderiza slot body como alias de content e default', () => {
            const wrapperBody = mountCard({
                slots: {
                    body: '<div class="solar-body">Conteúdo no Body</div>'
                }
            });
            expect(wrapperBody.find('.max-card-content').exists()).toBe(true);
            expect(wrapperBody.find('.solar-body').text()).toBe('Conteúdo no Body');

            const wrapperPrecedence = mountCard({
                slots: {
                    body: '<div class="body-slot">Prioridade Body</div>',
                    content: '<div class="content-slot">Ignorado</div>'
                }
            });
            expect(wrapperPrecedence.find('.body-slot').text()).toBe('Prioridade Body');
            expect(wrapperPrecedence.find('.content-slot').exists()).toBe(false);
        });

        it('renderiza slot status no cabeçalho', () => {
            const wrapper = mountCard({
                props: {
                    title: 'Card com Status Customizado'
                },
                slots: {
                    status: '<span class="custom-status-tag">Em Produção</span>'
                }
            });
            expect(wrapper.find('.custom-status-tag').exists()).toBe(true);
            expect(wrapper.find('.custom-status-tag').text()).toBe('Em Produção');
        });

        it('renderiza slot actions no cabeçalho padrão', () => {
            const wrapper = mountCard({
                props: {
                    title: 'Card com Ações'
                },
                slots: {
                    actions: '<button class="act-btn">Editar</button>'
                }
            });
            expect(wrapper.find('.max-card-header-actions .act-btn').exists()).toBe(true);
        });

        it('renderiza slot footer no rodapé do card', () => {
            const wrapper = mountCard({
                slots: {
                    footer: '<div class="custom-footer">Rodapé do Card</div>'
                }
            });
            expect(wrapper.find('.max-card-footer').exists()).toBe(true);
            expect(wrapper.find('.custom-footer').text()).toBe('Rodapé do Card');
        });
    });

    describe('Status e Badges no Cabeçalho', () => {
        it('renderiza status semântico e classes adequadas', () => {
            const wrapperSuccess = mountCard({
                props: { title: 'Projeto Solar', status: 'Ativo' }
            });
            const statusSuccess = wrapperSuccess.find('.max-card-status');
            expect(statusSuccess.exists()).toBe(true);
            expect(statusSuccess.classes()).toContain('max-card-status--success');
            expect(statusSuccess.text()).toBe('Ativo');

            const wrapperWarning = mountCard({
                props: { title: 'Projeto Solar', status: 'Em Homologação' }
            });
            expect(wrapperWarning.find('.max-card-status').classes()).toContain('max-card-status--warning');

            const wrapperDanger = mountCard({
                props: { title: 'Projeto Solar', status: 'Offline' }
            });
            expect(wrapperDanger.find('.max-card-status').classes()).toContain('max-card-status--danger');

            const wrapperInfo = mountCard({
                props: { title: 'Projeto Solar', status: 'Em Andamento' }
            });
            expect(wrapperInfo.find('.max-card-status').classes()).toContain('max-card-status--info');
        });

        it('aplica cor customizada via statusColor', () => {
            const wrapper = mountCard({
                props: { title: 'Projeto Solar', status: 'Custom', statusColor: '#ff00aa' }
            });
            const statusEl = wrapper.find('.max-card-status');
            expect(statusEl.attributes('style')).toContain('--card-status-color: #ff00aa');
        });
    });

    describe('Estados (loading e disabled)', () => {
        it('aplica estado de loading com overlay e aria-busy', () => {
            const wrapper = mountCard({
                props: {
                    loading: true
                }
            });
            expect(wrapper.classes()).toContain('is-loading');
            expect(wrapper.attributes('aria-busy')).toBe('true');
            expect(wrapper.find('.max-card-loading-overlay').exists()).toBe(true);
        });

        it('aplica estado de disabled com aria-disabled', () => {
            const wrapper = mountCard({
                props: {
                    disabled: true,
                    clickable: true
                }
            });
            expect(wrapper.classes()).toContain('is-disabled');
            expect(wrapper.attributes('aria-disabled')).toBe('true');
            expect(wrapper.attributes('tabindex')).toBeUndefined();
        });

        it('não emite click quando loading=true', async () => {
            const wrapper = mountCard({
                props: {
                    clickable: true,
                    loading: true
                }
            });
            await wrapper.trigger('click');
            expect(wrapper.emitted('click')).toBeUndefined();
        });

        it('não emite click quando disabled=true', async () => {
            const wrapper = mountCard({
                props: {
                    clickable: true,
                    disabled: true
                }
            });
            await wrapper.trigger('click');
            expect(wrapper.emitted('click')).toBeUndefined();
        });
    });

    describe('Interatividade e Eventos (@click)', () => {
        it('emite evento click quando clickable=true', async () => {
            const wrapper = mountCard({
                props: {
                    clickable: true
                }
            });
            await wrapper.trigger('click');
            expect(wrapper.emitted('click')).toBeTruthy();
            expect(wrapper.emitted('click')!.length).toBe(1);
        });

        it('dispara click ao pressionar tecla Enter ou Space quando interativo', async () => {
            const wrapper = mountCard({
                props: {
                    clickable: true
                }
            });
            await wrapper.trigger('keydown', { key: 'Enter' });
            expect(wrapper.emitted('click')!.length).toBe(1);

            await wrapper.trigger('keydown', { key: ' ' });
            expect(wrapper.emitted('click')!.length).toBe(2);
        });
    });
});
