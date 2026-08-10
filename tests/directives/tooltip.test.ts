import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { defineComponent } from 'vue';
import { mount, VueWrapper } from '@vue/test-utils';
import { Tooltip } from '../../src/directives/tooltip';

function mockCenteredRect(el: HTMLElement) {
    el.getBoundingClientRect = () => ({
        top: 300, left: 300, right: 340, bottom: 320, width: 40, height: 20, x: 300, y: 300,
        toJSON: () => ({})
    } as DOMRect);
}

function mountWithTooltip(bindingExpr: string, modifiers: string[] = [], extra: Record<string, any> = {}) {
    const directiveString = `v-tooltip${modifiers.map((m) => `.${m}`).join('')}="${bindingExpr}"`;
    const Comp = defineComponent({
        directives: { tooltip: Tooltip },
        template: `<button ${directiveString}>trigger</button>`,
        data() {
            return extra;
        },
        mounted() {
            mockCenteredRect(this.$el as HTMLElement);
        }
    });
    return mount(Comp);
}

function getTooltipNode() {
    return document.body.querySelector('.max-tooltip');
}

describe('v-tooltip directive', () => {
    let wrapper: VueWrapper | null;

    beforeEach(() => {
        vi.useFakeTimers();
        wrapper = null;
    });

    afterEach(() => {
        wrapper?.unmount();
        document.querySelectorAll('.max-tooltip').forEach((el) => el.remove());
        vi.useRealTimers();
    });

    it('mouseenter cria um no .max-tooltip no document.body', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()).not.toBeNull();
    });

    it('mouseleave remove o no', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();
        expect(getTooltipNode()).not.toBeNull();

        await wrapper.find('button').trigger('mouseleave');
        vi.runAllTimers();

        expect(getTooltipNode()).toBeNull();
    });

    it('renderiza o texto do binding', async () => {
        wrapper = mountWithTooltip('\'Ola mundo\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        const textEl = document.querySelector('.max-tooltip-text');
        expect(textEl?.textContent).toBe('Ola mundo');
    });

    it('v-tooltip.top aplica max-tooltip-top', async () => {
        wrapper = mountWithTooltip('\'Texto\'', ['top']);
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()?.classList.contains('max-tooltip-top')).toBe(true);
    });

    it('v-tooltip.right aplica max-tooltip-right', async () => {
        wrapper = mountWithTooltip('\'Texto\'', ['right']);
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()?.classList.contains('max-tooltip-right')).toBe(true);
    });

    it('v-tooltip.bottom aplica max-tooltip-bottom', async () => {
        wrapper = mountWithTooltip('\'Texto\'', ['bottom']);
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()?.classList.contains('max-tooltip-bottom')).toBe(true);
    });

    it('v-tooltip.left aplica max-tooltip-left', async () => {
        wrapper = mountWithTooltip('\'Texto\'', ['left']);
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()?.classList.contains('max-tooltip-left')).toBe(true);
    });

    it('sem modificador de posicao, o default e max-tooltip-right (protege o default do PrimeVue)', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()?.classList.contains('max-tooltip-right')).toBe(true);
    });

    it('showDelay adia a criacao do tooltip', async () => {
        wrapper = mountWithTooltip('{ value: \'Texto\', showDelay: 300 }');
        await wrapper.find('button').trigger('mouseenter');

        vi.advanceTimersByTime(299);
        expect(getTooltipNode()).toBeNull();

        vi.advanceTimersByTime(1);
        expect(getTooltipNode()).not.toBeNull();
    });

    it('hideDelay adia a remocao do tooltip', async () => {
        wrapper = mountWithTooltip('{ value: \'Texto\', hideDelay: 300 }');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();
        expect(getTooltipNode()).not.toBeNull();

        await wrapper.find('button').trigger('mouseleave');
        vi.advanceTimersByTime(299);
        expect(getTooltipNode()).not.toBeNull();

        vi.advanceTimersByTime(1);
        expect(getTooltipNode()).toBeNull();
    });

    it('disabled: true nao cria nada', async () => {
        wrapper = mountWithTooltip('{ value: \'Texto\', disabled: true }');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        expect(getTooltipNode()).toBeNull();
    });

    it('escape true (default): HTML no valor aparece escapado como texto', async () => {
        wrapper = mountWithTooltip('\'<b>bold</b>\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        const textEl = document.querySelector('.max-tooltip-text');
        expect(textEl?.textContent).toBe('<b>bold</b>');
        expect(textEl?.querySelector('b')).toBeNull();
    });

    it('escape false: HTML e interpretado', async () => {
        wrapper = mountWithTooltip('{ value: \'<b>bold</b>\', escape: false }');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        const textEl = document.querySelector('.max-tooltip-text');
        expect(textEl?.querySelector('b')).not.toBeNull();
        expect(textEl?.querySelector('b')?.textContent).toBe('bold');
    });

    it('focus e blur tambem disparam o tooltip (acessibilidade por teclado)', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('focus');
        vi.runAllTimers();
        expect(getTooltipNode()).not.toBeNull();

        await wrapper.find('button').trigger('blur');
        vi.runAllTimers();
        expect(getTooltipNode()).toBeNull();
    });

    it('modificador focus troca os gatilhos: mouseenter nao dispara, focus dispara', async () => {
        wrapper = mountWithTooltip('\'Texto\'', ['focus']);

        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();
        expect(getTooltipNode()).toBeNull();

        await wrapper.find('button').trigger('focus');
        vi.runAllTimers();
        expect(getTooltipNode()).not.toBeNull();
    });

    it('unmounted limpa tudo: nenhum no orfao no body, nenhum timer pendente', async () => {
        wrapper = mountWithTooltip('{ value: \'Texto\', showDelay: 500 }');
        await wrapper.find('button').trigger('mouseenter');

        // desmonta antes do showDelay disparar
        wrapper.unmount();
        wrapper = null;

        vi.runAllTimers();
        expect(getTooltipNode()).toBeNull();
    });

    it('unmounted remove o tooltip ja visivel, sem no orfao', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();
        expect(getTooltipNode()).not.toBeNull();

        wrapper.unmount();
        wrapper = null;

        expect(getTooltipNode()).toBeNull();
    });

    it('mudar o valor do binding atualiza o texto de um tooltip visivel', async () => {
        const Comp = defineComponent({
            directives: { tooltip: Tooltip },
            template: '<button v-tooltip="text">trigger</button>',
            data() {
                return { text: 'Primeiro' };
            }
        });
        wrapper = mount(Comp);

        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();
        expect(document.querySelector('.max-tooltip-text')?.textContent).toBe('Primeiro');

        await wrapper.setData({ text: 'Segundo' });
        await wrapper.vm.$nextTick();

        expect(document.querySelector('.max-tooltip-text')?.textContent).toBe('Segundo');
    });

    it('nao emite classes ou dependencias do PrimeVue', () => {
        const source = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../src/directives/tooltip.ts'),
            'utf-8'
        );
        expect(source).not.toContain('primevue');
        expect(source).not.toContain('@primeuix');
        expect(/\.p-[a-z-]/.test(source)).toBe(false);
    });

    it('aplica role="tooltip" e aria-describedby no gatilho', async () => {
        wrapper = mountWithTooltip('\'Texto\'');
        await wrapper.find('button').trigger('mouseenter');
        vi.runAllTimers();

        const tooltipEl = getTooltipNode();
        expect(tooltipEl?.getAttribute('role')).toBe('tooltip');
        const button = wrapper.find('button').element;
        expect(button.getAttribute('aria-describedby')).toBe(tooltipEl?.id);
    });
});
