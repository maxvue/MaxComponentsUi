import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        goToRoute: vi.fn()
    };
});

function mountIconButton(props: Record<string, any> = {}) {
    return mount(MaxIconButton, {
        props: { icon: 'mdi:pencil', ...props },
        global: {
            stubs: {
                MaxIcon: {
                    template: '<span class="max-icon" :data-size="String(size)" :data-color="color !== undefined ? String(color) : undefined"></span>',
                    props: ['icon', 'i', 'size', 'dark', 'light', 'pointer', 'color', 'iconColor']
                }
            }
        }
    });
}

describe('MaxIconButton', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    it('renderiza corretamente', () => {
        const wrapper = mountIconButton();
        expect(wrapper.exists()).toBe(true);
    });

    it('calcula tamanho com base na prop size', () => {
        const wrapper = mountIconButton({ size: 2 });
        // Tamanho: 16 * 2 = 32px
        expect(wrapper.element.style.width).toBe('32px');
        expect(wrapper.element.style.height).toBe('32px');
    });

    it('tamanho padrão é 16px (size=1)', () => {
        const wrapper = mountIconButton();
        expect(wrapper.element.style.width).toBe('16px');
    });

    it('emite evento action ao clicar', async () => {
        const wrapper = mountIconButton();
        await wrapper.trigger('click');

        expect(wrapper.emitted('action')).toBeTruthy();
        expect(wrapper.emitted('action')![0]).toEqual([true]);
    });

    it('proteção contra clique duplo concorrente durante ação pendente', async () => {
        let resolvePromise: any;
        const pendingAction = vi.fn(() => new Promise((res) => { resolvePromise = res; }));
        const wrapper = mountIconButton({ action: pendingAction });

        const p1 = wrapper.trigger('click');
        const p2 = wrapper.trigger('click'); // Segundo clique enquanto a primeira ação está pendente

        expect(pendingAction).toHaveBeenCalledTimes(1);
        resolvePromise();
        await Promise.all([p1, p2]);
    });

    it('aplica hover scale ao mouseenter', async () => {
        const wrapper = mountIconButton({ hoverScale: 1.5 });
        await wrapper.trigger('mouseenter');

        expect(wrapper.element.style.transform).toContain('1.5');
    });

    it('executa action callback quando fornecido', async () => {
        let chamado = false;
        const wrapper = mountIconButton({
            action: () => { chamado = true; }
        });
        await wrapper.trigger('click');

        expect(chamado).toBe(true);
    });

    it('chama goToRoute quando route for passado e não emite action', async () => {
        const wrapper = mountIconButton({
            route: 'dashboard',
            data: { filter: 'active' },
            params: { id: 1 },
            query: { q: 'search' }
        });
        await wrapper.trigger('click');

        expect(maxUse.goToRoute).toHaveBeenCalledWith('dashboard', { filter: 'active', id: 1, q: 'search' });
        expect(wrapper.emitted('action')).toBeFalsy();
    });

    it('libera o guard de execução após a conclusão de uma ação assíncrona', async () => {
        let contador = 0;
        const asyncAction = vi.fn(async () => {
            contador++;
        });

        const wrapper = mountIconButton({ action: asyncAction });
        await wrapper.trigger('click');
        expect(asyncAction).toHaveBeenCalledTimes(1);

        await wrapper.trigger('click');
        expect(asyncAction).toHaveBeenCalledTimes(2);
        expect(contador).toBe(2);
    });

    it('libera o guard de execução no bloco finally mesmo quando a ação lança uma exceção', async () => {
        const failingAction = vi.fn(() => {
            throw new Error('Falha na ação');
        });

        const wrapper = mountIconButton({ action: failingAction });
        await expect((wrapper.vm as any).onClick(new MouseEvent('click'))).rejects.toThrow('Falha na ação');
        expect((wrapper.vm as any).executing).toBe(false);
    });

    describe('tamanho do ícone', () => {
        // `size` textual é tamanho de BOTÃO. Antes, 16 * Number('small') gerava
        // 'NaNpx' — CSS inválido descartado pelo navegador; como o svg interno é
        // width:100%, o ícone esticava até o contêiner pai.
        it.each(['small', 'sm', 'large', 'lg'])('size="%s" não produz NaN', (size) => {
            const wrapper = mountIconButton({ size });
            const value = wrapper.find('.max-icon').attributes('data-size');

            expect(value).not.toContain('NaN');
            expect(value).toBe('16px');
        });

        it('size numérico continua dimensionando o ícone', () => {
            const wrapper = mountIconButton({ size: 2 });
            expect(wrapper.find('.max-icon').attributes('data-size')).toBe('32px');
        });

        it('sem size usa o padrão', () => {
            const wrapper = mountIconButton();
            expect(wrapper.find('.max-icon').attributes('data-size')).toBe('16px');
        });
    });

    describe('cor do ícone', () => {
        it('repassa a prop color para o MaxIcon interno', () => {
            const wrapper = mountIconButton({ color: '#ffffff' });
            expect(wrapper.find('.max-icon').attributes('data-color')).toBe('#ffffff');
        });

        it('repassa a prop iconColor como fallback para o MaxIcon interno', () => {
            const wrapper = mountIconButton({ iconColor: '#ff0000' });
            expect(wrapper.find('.max-icon').attributes('data-color')).toBe('#ff0000');
        });

        it('prop color tem precedência sobre iconColor', () => {
            const wrapper = mountIconButton({ color: '#00ff00', iconColor: '#ff0000' });
            expect(wrapper.find('.max-icon').attributes('data-color')).toBe('#00ff00');
        });
    });
});
