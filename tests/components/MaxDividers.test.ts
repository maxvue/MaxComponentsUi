import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxDividers from '../../src/components/MaxDividers.vue';
import { MaxDividers as MaxDividersIndex, MaxDivider as MaxDividerIndex } from '../../src/index';

describe('MaxDividers', () => {
    it('exporta MaxDividers e MaxDivider a partir do index', () => {
        expect(MaxDividersIndex).toBeDefined();
        expect(MaxDividerIndex).toBeDefined();
        expect(MaxDividersIndex).toBe(MaxDividerIndex);
    });

    it('renderiza os slots first e second no modo desktop', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: false
            },
            slots: {
                first: '<div class="first-content">Coluna 1</div>',
                second: '<div class="second-content">Coluna 2</div>'
            }
        });

        expect(wrapper.find('.max-dividers').exists()).toBe(true);
        expect(wrapper.find('.first-content').exists()).toBe(true);
        expect(wrapper.find('.second-content').exists()).toBe(true);
        expect(wrapper.find('.first-content').text()).toBe('Coluna 1');
        expect(wrapper.find('.second-content').text()).toBe('Coluna 2');
    });

    it('aplica orientação padrão in-column e classe is-column', () => {
        const wrapper = mount(MaxDividers, {
            props: { mobile: false }
        });

        expect(wrapper.find('.max-dividers.is-column').exists()).toBe(true);
        expect(wrapper.find('.max-dividers.is-line').exists()).toBe(false);
    });

    it('aplica orientação in-line quando prop in-line ou direction="in-line" for fornecida', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                inLine: true,
                mobile: false
            }
        });

        expect(wrapper.find('.max-dividers.is-line').exists()).toBe(true);
        expect(wrapper.find('.max-dividers.is-column').exists()).toBe(false);

        const wrapperDirection = mount(MaxDividers, {
            props: {
                direction: 'in-line',
                mobile: false
            }
        });

        expect(wrapperDirection.find('.max-dividers.is-line').exists()).toBe(true);
    });

    it('aplica estilos de tamanhos proporcionais (sizes) no desktop', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                sizes: [35, 65],
                mobile: false
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        const firstPane = wrapper.find('.max-divider-pane--first');
        const secondPane = wrapper.find('.max-divider-pane--second');

        expect(firstPane.attributes('style')).toContain('35%');
        expect(secondPane.attributes('style')).toContain('65%');
    });

    it('aplica tamanho customizado firstSize no desktop', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                firstSize: '380px',
                mobile: false
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        const firstPane = wrapper.find('.max-divider-pane--first');
        expect(firstPane.attributes('style')).toContain('380px');
    });

    it('gerencia transição no mobile via modelValue/active', async () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 1
            },
            slots: {
                first: '<div class="content-1">Primeira tela</div>',
                second: '<div class="content-2">Segunda tela</div>'
            }
        });

        expect(wrapper.find('.max-dividers.is-mobile').exists()).toBe(true);
        expect(wrapper.find('.max-dividers-track.active-pane-1').exists()).toBe(true);

        // Atualiza para active 2
        await wrapper.setProps({ active: 2 });
        expect(wrapper.find('.max-dividers-track.active-pane-2').exists()).toBe(true);
        expect(wrapper.find('.max-divider-back-btn').exists()).toBe(true);
    });

    it('expõe métodos next e back nos scoped slots', async () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 1
            },
            slots: {
                first: `
                    <template #first="{ next }">
                        <button class="btn-next" @click="next">Avançar</button>
                    </template>
                `,
                second: `
                    <template #second="{ back }">
                        <button class="btn-back" @click="back">Voltar</button>
                    </template>
                `
            }
        });

        const btnNext = wrapper.find('.btn-next');
        expect(btnNext.exists()).toBe(true);

        await btnNext.trigger('click');
        expect(wrapper.emitted('update:active')).toBeTruthy();
        expect(wrapper.emitted('update:active')?.[0]).toEqual([2]);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([2]);
        expect(wrapper.emitted('next')).toBeTruthy();
    });

    it('emite back e volta para o painel 1 ao clicar no botão de voltar', async () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 2,
                secondTitle: 'Detalhes'
            },
            slots: {
                first: '<div>Lista</div>',
                second: '<div>Detalhes da Igreja</div>'
            }
        });

        expect(wrapper.find('.max-divider-mobile-title').text()).toBe('Detalhes');
        const backBtn = wrapper.find('.max-divider-back-btn');
        expect(backBtn.exists()).toBe(true);

        await backBtn.trigger('click');
        expect(wrapper.emitted('update:active')).toBeTruthy();
        expect(wrapper.emitted('update:active')?.[0]).toEqual([1]);
        expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
        expect(wrapper.emitted('back')).toBeTruthy();
    });

    it('renderiza divisor arrastável (gutter) quando resizable=true', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                resizable: true,
                mobile: false
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        expect(wrapper.find('.max-dividers-gutter').exists()).toBe(true);
    });

    it('suporta aninhamento de MaxDividers sem conflito', () => {
        const wrapper = mount(MaxDividers, {
            props: { mobile: false },
            slots: {
                first: '<div class="districts">Distritos</div>',
                second: {
                    components: { MaxDividers },
                    template: `
                        <MaxDividers :mobile="false">
                            <template #first><div class="churches">Igrejas</div></template>
                            <template #second><div class="details">Detalhes</div></template>
                        </MaxDividers>
                    `
                }
            }
        });

        expect(wrapper.find('.districts').exists()).toBe(true);
        expect(wrapper.find('.churches').exists()).toBe(true);
        expect(wrapper.find('.details').exists()).toBe(true);
        expect(wrapper.findAll('.max-dividers').length).toBe(2);
    });

    it('permite customizar o cabeçalho mobile via slot second-header', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 2
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>',
                'second-header': '<div class="custom-header">Cabeçalho Personalizado</div>'
            }
        });

        expect(wrapper.find('.custom-header').exists()).toBe(true);
        expect(wrapper.find('.custom-header').text()).toBe('Cabeçalho Personalizado');
    });

    it('não renderiza o botão voltar quando showBackButton for false', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 2,
                showBackButton: false
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        expect(wrapper.find('.max-divider-mobile-header').exists()).toBe(false);
        expect(wrapper.find('.max-divider-back-btn').exists()).toBe(false);
    });

    it('aplica disabledTransition para desabilitar animação', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                disabledTransition: true
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        const track = wrapper.find('.max-dividers-track');
        expect(track.attributes('style')).toContain('transition: none');
    });

    it('expõe métodos na instância (vm) para manipulação programática', () => {
        const wrapper = mount(MaxDividers, {
            props: {
                mobile: true,
                active: 1
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        expect(wrapper.vm.currentPane).toBe(1);
        wrapper.vm.next();
        expect(wrapper.vm.currentPane).toBe(2);
        wrapper.vm.back();
        expect(wrapper.vm.currentPane).toBe(1);
        wrapper.vm.setPane(2);
        expect(wrapper.vm.currentPane).toBe(2);
    });

    it('redimensiona proporção ao arrastar o divisor', async () => {
        const wrapper = mount(MaxDividers, {
            props: {
                resizable: true,
                mobile: false
            },
            slots: {
                first: '<div>1</div>',
                second: '<div>2</div>'
            }
        });

        // Simula dimensões do container
        const container = wrapper.find('.max-dividers').element as HTMLElement;
        Object.defineProperty(container, 'getBoundingClientRect', {
            value: () => ({
                left: 0,
                top: 0,
                width: 1000,
                height: 500
            })
        });

        const gutter = wrapper.find('.max-dividers-gutter');
        await gutter.trigger('mousedown', { clientX: 100, clientY: 100 });

        // Dispara mousemove e mouseup na janela
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: 400, clientY: 100 }));
        window.dispatchEvent(new MouseEvent('mouseup'));

        expect(wrapper.emitted('resize')).toBeTruthy();
        const emittedSizes = wrapper.emitted('resize')?.[0]?.[0] as [number, number];
        expect(emittedSizes[0]).toBe(40);
        expect(emittedSizes[1]).toBe(60);
    });
});

