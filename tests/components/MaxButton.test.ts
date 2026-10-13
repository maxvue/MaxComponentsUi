import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButton from '../../src/components/MaxButton.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        goToRoute: vi.fn()
    };
});

function mountButton(props: Record<string, any> = {}) {
    return mount(MaxButton, {
        props,
        global: {
            stubs: {
                MaxIconButton: {
                    template: '<button class="icon-button"><slot /></button>',
                    props: ['icon', 'i']
                },
                MaxIcon: {
                    // `flex` fica fora de props de propósito: assim cai em attrs
                    // e é renderizado no DOM, como no MaxIcon real.
                    template: '<div class="max-icon-stub" :data-size="String(size)"></div>',
                    props: ['icon', 'size']
                }
            }
        }
    });
}

describe('MaxButton', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('renderiza com label', () => {
        const wrapper = mountButton({ label: 'Salvar' });
        expect(wrapper.text()).toContain('Salvar');
    });

    it('renderiza como MaxIconButton quando não tem label', () => {
        const wrapper = mountButton({ icon: 'mdi:pencil' });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza botao normal quando conteudo for passado apenas via slot default', () => {
        const wrapper = mount(MaxButton, {
            slots: {
                default: 'Salvar Alterações'
            }
        });
        expect(wrapper.find('button.max-button').exists()).toBe(true);
        expect(wrapper.text()).toContain('Salvar Alterações');
    });

    it('aplica severity passada via props', () => {
        const wrapper = mountButton({ label: 'Excluir', severity: 'danger' });
        expect(wrapper.exists()).toBe(true);
    });

    it('fica desabilitado quando disabled=true', () => {
        const wrapper = mountButton({ label: 'Salvar', disabled: true });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza com ícone quando icon é passado', () => {
        const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check' });
        expect(wrapper.exists()).toBe(true);
    });

    it('renderiza ícone de loading quando loading=true', () => {
        const wrapper = mountButton({ label: 'Salvar', loading: true });
        // Line 10 (template #loadingicon) should be covered
        expect(wrapper.html()).toContain('max-icon-stub');
    });

    it('emite click quando não há route nem action', async () => {
        const wrapper = mountButton({ label: 'Click Me' });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
        expect(wrapper.emitted('click')?.[0]?.[0]).toBeInstanceOf(MouseEvent);
    });

    it('chama action ao invés de click se existir', () => {
        const actionMock = vi.fn();
        const wrapper = mountButton({ label: 'Action', action: actionMock, data: { id: 2 } });

        // Chamando onClick
        (wrapper.vm as any).onClick(new MouseEvent('click'));
        expect(actionMock).toHaveBeenCalled();
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('chama goToRoute quando route for passado', () => {
        const wrapper = mountButton({ label: 'Go', route: 'home', params: { id: 1 } });
        (wrapper.vm as any).onClick(new MouseEvent('click'));
        expect(maxUse.goToRoute).toHaveBeenCalledWith('home', { id: 1 });
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    describe('tamanho do ícone', () => {
        it('size textual dimensiona o botão, não o ícone', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check', size: 'small' });

            // 'small' é tamanho de BOTÃO: não pode vazar como tamanho do ícone.
            expect(wrapper.find('.max-icon-stub').attributes('data-size')).toBe('1.4');
            expect(wrapper.find('button').classes()).toContain('max-button-sm');
        });

        // params.scss:109 tem `[full],[flex] { width:100% !important }`, e o
        // seletor casa pela PRESENÇA do atributo. Com :flex="loading" o Vue
        // renderiza flex="false" quando loading é falso — o atributo existe, a
        // regra vence o estilo inline e o ícone estica até o contêiner.
        it.each([
            ['sem carregar', { label: 'Salvar', icon: 'mdi:check' }],
            ['carregando', { label: 'Salvar', icon: 'mdi:check', loading: true }]
        ])('não emite o atributo flex (%s)', (_caso, props) => {
            const wrapper = mountButton(props);

            expect(wrapper.find('.max-icon-stub').attributes('flex')).toBeUndefined();
        });

        it('size numérico ainda dimensiona o ícone (uso legado)', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check', size: 2 });
            expect(wrapper.find('.max-icon-stub').attributes('data-size')).toBe('2');
        });

        it('sizeIcon e iconSize têm precedência sobre o default', () => {
            const comSizeIcon = mountButton({ label: 'A', icon: 'mdi:check', sizeIcon: 3, size: 'large' });
            expect(comSizeIcon.find('.max-icon-stub').attributes('data-size')).toBe('3');

            const comIconSize = mountButton({ label: 'B', icon: 'mdi:check', iconSize: 2.5 });
            expect(comIconSize.find('.max-icon-stub').attributes('data-size')).toBe('2.5');
        });
    });

    it('respeita o type="submit" quando passado, permitindo submissão nativa', () => {
        const wrapper = mountButton({ label: 'Enviar', type: 'submit' });
        expect(wrapper.find('button').attributes('type')).toBe('submit');
    });

    it('usa type="button" por padrão caso nada seja passado', () => {
        const wrapper = mountButton({ label: 'Enviar' });
        expect(wrapper.find('button').attributes('type')).toBe('button');
    });

    describe('prop slim', () => {
        it('não aplica classe max-button-slim por padrão quando ausente ou false', () => {
            const wrapperDefault = mountButton({ label: 'Salvar' });
            expect(wrapperDefault.find('button').classes()).not.toContain('max-button-slim');

            const wrapperFalse = mountButton({ label: 'Salvar', slim: false });
            expect(wrapperFalse.find('button').classes()).not.toContain('max-button-slim');
        });

        it('aplica classe max-button-slim quando slim=true e não vaza atributo slim no DOM', () => {
            const wrapper = mountButton({ label: 'Salvar', slim: true });
            expect(wrapper.find('button').classes()).toContain('max-button-slim');
            expect(wrapper.find('button').attributes('slim')).toBeUndefined();
        });

        it('alterna classe reativamente via setProps', async () => {
            const wrapper = mountButton({ label: 'Salvar', slim: false });
            expect(wrapper.find('button').classes()).not.toContain('max-button-slim');

            await wrapper.setProps({ slim: true });
            expect(wrapper.find('button').classes()).toContain('max-button-slim');

            await wrapper.setProps({ slim: false });
            expect(wrapper.find('button').classes()).not.toContain('max-button-slim');
        });

        it('reconhece presença da prop no template como booleano true', () => {
            const wrapper = mount({
                components: { MaxButton },
                template: '<MaxButton label="Salvar" slim />'
            }, {
                global: {
                    stubs: {
                        MaxIcon: true,
                        MaxIconButton: true
                    }
                }
            });
            expect(wrapper.find('button').classes()).toContain('max-button-slim');
        });

        it('aplica compactação quando o texto vem exclusivamente do slot default', () => {
            const wrapper = mount(MaxButton, {
                props: { slim: true },
                slots: {
                    default: 'Salvar Alterações'
                }
            });
            expect(wrapper.find('button.max-button').exists()).toBe(true);
            expect(wrapper.find('button').classes()).toContain('max-button-slim');
            expect(wrapper.text()).toContain('Salvar Alterações');
        });

        it('compõe com tamanhos small/sm e large/lg preservando classes e dimensão do ícone', () => {
            const wrapperSmall = mountButton({ label: 'Pequeno', size: 'small', slim: true, icon: 'mdi:check' });
            expect(wrapperSmall.find('button').classes()).toContain('max-button-sm');
            expect(wrapperSmall.find('button').classes()).toContain('max-button-slim');
            expect(wrapperSmall.find('.max-icon-stub').attributes('data-size')).toBe('1.4');

            const wrapperSm = mountButton({ label: 'Pequeno Alias', size: 'sm', slim: true });
            expect(wrapperSm.find('button').classes()).toContain('max-button-sm');
            expect(wrapperSm.find('button').classes()).toContain('max-button-slim');

            const wrapperLarge = mountButton({ label: 'Grande', size: 'large', slim: true });
            expect(wrapperLarge.find('button').classes()).toContain('max-button-lg');
            expect(wrapperLarge.find('button').classes()).toContain('max-button-slim');

            const wrapperLg = mountButton({ label: 'Grande Alias', size: 'lg', slim: true });
            expect(wrapperLg.find('button').classes()).toContain('max-button-lg');
            expect(wrapperLg.find('button').classes()).toContain('max-button-slim');
        });

        it('preserva tamanho legado numérico do ícone quando combinado com slim', () => {
            const wrapper = mountButton({ label: 'Salvar', icon: 'mdi:check', size: 2, slim: true });
            expect(wrapper.find('button').classes()).toContain('max-button-slim');
            expect(wrapper.find('.max-icon-stub').attributes('data-size')).toBe('2');
        });

        it('preserva desabilitado e carregamento quando slim=true', () => {
            const wrapperDisabled = mountButton({ label: 'Salvar', disabled: true, slim: true });
            expect(wrapperDisabled.find('button').attributes('disabled')).toBeDefined();

            const wrapperLoading = mountButton({ label: 'Salvar', loading: true, slim: true });
            expect(wrapperLoading.find('button').attributes('disabled')).toBeDefined();
            expect(wrapperLoading.find('button').classes()).toContain('max-button-loading');
        });

        it('preserva click, action, rota e type nativo quando slim=true', async () => {
            const wrapperClick = mountButton({ label: 'Click', slim: true });
            await wrapperClick.find('button').trigger('click');
            expect(wrapperClick.emitted('click')).toBeTruthy();

            const actionMock = vi.fn();
            const wrapperAction = mountButton({ label: 'Action', slim: true, action: actionMock, data: { id: 10 } });
            (wrapperAction.vm as any).onClick(new MouseEvent('click'));
            expect(actionMock).toHaveBeenCalled();

            const wrapperRoute = mountButton({ label: 'Route', slim: true, route: 'dashboard', params: { tab: 'main' } });
            (wrapperRoute.vm as any).onClick(new MouseEvent('click'));
            expect(maxUse.goToRoute).toHaveBeenCalledWith('dashboard', { tab: 'main' });

            const wrapperSubmit = mountButton({ label: 'Enviar', slim: true, type: 'submit' });
            expect(wrapperSubmit.find('button').attributes('type')).toBe('submit');
        });

        it('preserva fallback para MaxIconButton sem label nem slot, sem classe compacta textual', () => {
            const wrapper = mount(MaxButton, {
                props: { icon: 'mdi:pencil', slim: true },
                global: {
                    stubs: {
                        MaxIcon: {
                            template: '<div class="max-icon-stub" :data-size="String(size)"></div>',
                            props: ['icon', 'size']
                        }
                    }
                }
            });
            expect(wrapper.find('button.max-icon-button').exists()).toBe(true);
            expect(wrapper.find('button.max-button').exists()).toBe(false);
            expect(wrapper.find('button.max-icon-button').classes()).not.toContain('max-button-slim');
        });
    });
});
