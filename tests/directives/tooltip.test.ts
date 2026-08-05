import { describe, it, expect, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Tooltip from '../../src/directives/tooltip';
import type { TooltipOptions } from '../../src/directives/tooltip';

const tooltipNo = () => document.querySelector('.p-tooltip');
const textoDo = () => document.querySelector('.p-tooltip-text');

const montar = (template: string, data: Record<string, unknown> = {}) =>
    mount(
        {
            template,
            data: () => ({ ...data })
        },
        { global: { directives: { tooltip: Tooltip } }, attachTo: document.body }
    );

const disparar = async (wrapper: ReturnType<typeof montar>, evento: string) => {
    const alvo = wrapper.find('button').element;
    alvo.dispatchEvent(new Event(evento));
    await nextTick();
};

describe('diretiva v-tooltip', () => {
    afterEach(() => {
        document.body.innerHTML = '';
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('mouseenter cria o nó .p-tooltip no document.body', async () => {
        const wrapper = montar('<button v-tooltip="\'Ajuda\'">b</button>');
        expect(tooltipNo()).toBeNull();

        await disparar(wrapper, 'mouseenter');

        const no = tooltipNo();
        expect(no).not.toBeNull();
        expect(no?.parentElement).toBe(document.body);
        expect(no?.getAttribute('role')).toBe('tooltip');
    });

    it('mouseleave remove o nó', async () => {
        const wrapper = montar('<button v-tooltip="\'Ajuda\'">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'mouseleave');
        expect(tooltipNo()).toBeNull();
    });

    it('o texto renderizado é o do binding', async () => {
        const wrapper = montar('<button v-tooltip="\'Texto do binding\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(textoDo()?.textContent).toBe('Texto do binding');
    });

    it('sem modificador a posição é RIGHT (default do PrimeVue)', async () => {
        // trocar este default reposicionaria todos os tooltips das apps consumidoras
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()?.classList.contains('p-tooltip-right')).toBe(true);
    });

    it.each([
        ['top', 'p-tooltip-top'],
        ['right', 'p-tooltip-right'],
        ['bottom', 'p-tooltip-bottom'],
        ['left', 'p-tooltip-left']
    ])('o modificador .%s aplica a classe %s', async (mod, classe) => {
        const wrapper = montar(`<button v-tooltip.${mod}="'x'">b</button>`);
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()?.classList.contains(classe)).toBe(true);
    });

    it('faz flip quando o lado pedido não cabe na viewport', async () => {
        const wrapper = montar('<button v-tooltip.right="\'x\'">b</button>');
        const botao = wrapper.find('button').element;

        // gatilho encostado na borda direita: não há espaço à direita
        botao.getBoundingClientRect = () => ({
            x: 1000, y: 100, top: 100, left: 1000, right: 1020, bottom: 130,
            width: 20, height: 30, toJSON: () => ({})
        } as DOMRect);

        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
        Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });

        // o tooltip é medido logo após ser inserido; dá largura a qualquer nó criado
        const rectOriginal = HTMLDivElement.prototype.getBoundingClientRect;
        HTMLDivElement.prototype.getBoundingClientRect = function () {
            return { x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 40, width: 200, height: 40, toJSON: () => ({}) } as DOMRect;
        };

        botao.dispatchEvent(new Event('mouseenter'));
        await nextTick();

        const classes = tooltipNo()?.classList;
        HTMLDivElement.prototype.getBoundingClientRect = rectOriginal;

        expect(classes?.contains('p-tooltip-left')).toBe(true);
        expect(classes?.contains('p-tooltip-right')).toBe(false);
    });

    it('sem medição de layout NÃO faz flip (mantém a posição pedida)', async () => {
        // rects zerados não significam "não cabe": virar aqui seria falso positivo
        const wrapper = montar('<button v-tooltip.top="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()?.classList.contains('p-tooltip-top')).toBe(true);
        expect(tooltipNo()?.classList.contains('p-tooltip-bottom')).toBe(false);
    });

    it('click esconde o tooltip', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'click');
        expect(tooltipNo()).toBeNull();
    });

    it('o modo .focus NÃO registra click (só o ramo de mouse registra)', async () => {
        const wrapper = montar('<button v-tooltip.focus="\'x\'">b</button>');
        await disparar(wrapper, 'focus');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'click');
        expect(tooltipNo()).not.toBeNull();
    });

    it('click esconde mesmo com autoHide: false', async () => {
        // autoHide vale só para o mouseleave; blur e click escondem sempre
        const wrapper = montar('<button v-tooltip="{ value: \'x\', autoHide: false }">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'click');
        expect(tooltipNo()).toBeNull();
    });

    it('blur esconde mesmo com autoHide: false', async () => {
        const wrapper = montar('<button v-tooltip="{ value: \'x\', autoHide: false }">b</button>');
        await disparar(wrapper, 'focus');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'blur');
        expect(tooltipNo()).toBeNull();
    });

    it('Escape dispensa o tooltip (padrão WAI-ARIA)', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        const botao = wrapper.find('button').element;
        botao.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
        await nextTick();

        expect(tooltipNo()).toBeNull();
    });

    it('Escape dispensa o tooltip também no modo .focus', async () => {
        const wrapper = montar('<button v-tooltip.focus="\'x\'">b</button>');
        await disparar(wrapper, 'focus');
        expect(tooltipNo()).not.toBeNull();

        const botao = wrapper.find('button').element;
        botao.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
        await nextTick();

        expect(tooltipNo()).toBeNull();
    });

    it('outra tecla não esconde o tooltip', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        const botao = wrapper.find('button').element;
        botao.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
        await nextTick();

        expect(tooltipNo()).not.toBeNull();
    });

    describe('coordenadas', () => {
        const HOST = { x: 300, y: 200, top: 200, left: 300, right: 400, bottom: 240, width: 100, height: 40 };
        const TIP = { width: 200, height: 50 };

        const posicionar = async (mod: string) => {
            const wrapper = montar(`<button v-tooltip.${mod}="'x'">b</button>`);
            const botao = wrapper.find('button').element;
            botao.getBoundingClientRect = () => ({ ...HOST, toJSON: () => ({}) }) as DOMRect;

            const rectOriginal = HTMLDivElement.prototype.getBoundingClientRect;
            HTMLDivElement.prototype.getBoundingClientRect = function () {
                return { x: 0, y: 0, top: 0, left: 0, right: TIP.width, bottom: TIP.height, ...TIP, toJSON: () => ({}) } as DOMRect;
            };

            botao.dispatchEvent(new Event('mouseenter'));
            await nextTick();

            const no = tooltipNo() as HTMLElement;
            const pos = { top: no.style.top, left: no.style.left };
            HTMLDivElement.prototype.getBoundingClientRect = rectOriginal;
            return pos;
        };

        it('right: à direita do gatilho, centralizado na vertical', async () => {
            const { top, left } = await posicionar('right');
            expect(left).toBe('408px'); // host.right(400) + gap(8)
            expect(top).toBe('195px'); // 200 + (40 - 50) / 2
        });

        it('left: à esquerda do gatilho, centralizado na vertical', async () => {
            const { top, left } = await posicionar('left');
            expect(left).toBe('92px'); // host.left(300) - 200 - 8
            expect(top).toBe('195px');
        });

        it('top: acima do gatilho, centralizado na horizontal', async () => {
            const { top, left } = await posicionar('top');
            expect(top).toBe('142px'); // host.top(200) - 50 - 8
            expect(left).toBe('250px'); // 300 + (100 - 200) / 2
        });

        it('bottom: abaixo do gatilho, centralizado na horizontal', async () => {
            const { top, left } = await posicionar('bottom');
            expect(top).toBe('248px'); // host.bottom(240) + gap(8)
            expect(left).toBe('250px');
        });

        it('soma o scroll da página (o nó é absolute no body)', async () => {
            const scrollYOriginal = window.scrollY;
            const scrollXOriginal = window.scrollX;
            Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 });
            Object.defineProperty(window, 'scrollX', { configurable: true, value: 300 });

            const { top, left } = await posicionar('bottom');

            Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollYOriginal });
            Object.defineProperty(window, 'scrollX', { configurable: true, value: scrollXOriginal });

            // sem somar o scroll, o tooltip fica preso na posição da viewport
            expect(top).toBe('748px'); // 248 + 500
            expect(left).toBe('550px'); // 250 + 300
        });
    });

    it('showDelay adia a criação', async () => {
        vi.useFakeTimers();
        const wrapper = montar('<button v-tooltip="{ value: \'x\', showDelay: 300 }">b</button>');

        wrapper.find('button').element.dispatchEvent(new Event('mouseenter'));

        // ignorar showDelay renderizaria já aqui, de forma síncrona
        expect(tooltipNo()).toBeNull();
        expect(vi.getTimerCount()).toBeGreaterThan(0);

        vi.advanceTimersByTime(299);
        expect(tooltipNo()).toBeNull();

        vi.advanceTimersByTime(1);
        expect(tooltipNo()).not.toBeNull();
    });

    it('hideDelay adia a remoção', async () => {
        vi.useFakeTimers();
        const wrapper = montar('<button v-tooltip="{ value: \'x\', hideDelay: 200 }">b</button>');

        wrapper.find('button').element.dispatchEvent(new Event('mouseenter'));
        expect(tooltipNo()).not.toBeNull();

        wrapper.find('button').element.dispatchEvent(new Event('mouseleave'));
        expect(tooltipNo()).not.toBeNull();

        vi.advanceTimersByTime(199);
        expect(tooltipNo()).not.toBeNull();

        vi.advanceTimersByTime(1);
        expect(tooltipNo()).toBeNull();
    });

    it('disabled: true não cria nada', async () => {
        const wrapper = montar('<button v-tooltip="{ value: \'x\', disabled: true }">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()).toBeNull();
    });

    it('escape default (true) mostra o HTML ESCAPADO como texto', async () => {
        // inverter isto abre XSS em texto vindo de API
        const wrapper = montar('<button v-tooltip="\'<img src=x onerror=alert(1)>\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(textoDo()?.querySelector('img')).toBeNull();
        expect(textoDo()?.textContent).toBe('<img src=x onerror=alert(1)>');
    });

    it('escape: false interpreta o HTML', async () => {
        const wrapper = montar('<button v-tooltip="{ value: \'<b>ok</b>\', escape: false }">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(textoDo()?.querySelector('b')).not.toBeNull();
        expect(textoDo()?.textContent).toBe('ok');
    });

    it('focus e blur também disparam o tooltip (acesso por teclado)', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');

        await disparar(wrapper, 'focus');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'blur');
        expect(tooltipNo()).toBeNull();
    });

    it('o modificador .focus NÃO responde ao mouse', async () => {
        const wrapper = montar('<button v-tooltip.focus="\'x\'">b</button>');

        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).toBeNull();

        await disparar(wrapper, 'focus');
        expect(tooltipNo()).not.toBeNull();
    });

    it('aria-describedby liga o gatilho ao tooltip e some ao fechar', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        const botao = wrapper.find('button').element;
        const id = botao.getAttribute('aria-describedby');
        expect(id).toBeTruthy();
        expect(tooltipNo()?.id).toBe(id);

        await disparar(wrapper, 'mouseleave');
        expect(botao.getAttribute('aria-describedby')).toBeNull();
    });

    it('unmounted limpa tudo: sem nó órfão e sem timer pendente', async () => {
        vi.useFakeTimers();
        const wrapper = montar('<button v-tooltip="{ value: \'x\', showDelay: 500 }">b</button>');

        wrapper.find('button').element.dispatchEvent(new Event('mouseenter'));
        wrapper.unmount();

        // o timer pendente não pode materializar um tooltip depois do desmonte
        vi.advanceTimersByTime(1000);
        expect(tooltipNo()).toBeNull();
    });

    it('unmounted remove um tooltip já visível', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        wrapper.unmount();
        expect(tooltipNo()).toBeNull();
    });

    it('unmounted remove os listeners do elemento', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        const botao = wrapper.find('button').element;
        const removeSpy = vi.spyOn(botao, 'removeEventListener');

        wrapper.unmount();

        const removidos = removeSpy.mock.calls.map((c) => c[0]);
        expect(removidos).toContain('mouseenter');
        expect(removidos).toContain('mouseleave');
        expect(removidos).toContain('focus');
        expect(removidos).toContain('blur');
    });

    it('mudar o valor do binding atualiza um tooltip VISÍVEL', async () => {
        const wrapper = montar('<button v-tooltip="texto">b</button>', { texto: 'antes' });
        await disparar(wrapper, 'mouseenter');
        expect(textoDo()?.textContent).toBe('antes');

        await wrapper.setData({ texto: 'depois' });
        await nextTick();

        expect(textoDo()?.textContent).toBe('depois');
    });

    it('mudar o valor do binding vale para a próxima exibição', async () => {
        const wrapper = montar('<button v-tooltip="texto">b</button>', { texto: 'antes' });

        await wrapper.setData({ texto: 'depois' });
        await disparar(wrapper, 'mouseenter');

        expect(textoDo()?.textContent).toBe('depois');
    });

    it('v-tooltip="null" não cria tooltip algum', async () => {
        // usado deliberadamente para SUPRIMIR tooltip (MaxPopover, MaxModal, etc.)
        const wrapper = montar('<button v-tooltip="null">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()).toBeNull();
    });

    it('valor que vira null em runtime esconde o tooltip visível', async () => {
        const wrapper = montar('<button v-tooltip.top="texto">b</button>', { texto: 'algo' });
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        // o padrão `cond ? texto : null` de MaxUserAvatar.vue
        await wrapper.setData({ texto: null });
        await nextTick();

        expect(tooltipNo()).toBeNull();
    });

    it('string vazia não cria tooltip', async () => {
        const wrapper = montar('<button v-tooltip="\'\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()).toBeNull();
    });

    it('autoHide: false mantém o tooltip ao sair do gatilho', async () => {
        const wrapper = montar('<button v-tooltip="{ value: \'x\', autoHide: false }">b</button>');
        await disparar(wrapper, 'mouseenter');
        expect(tooltipNo()).not.toBeNull();

        await disparar(wrapper, 'mouseleave');
        expect(tooltipNo()).not.toBeNull();
    });

    it('a classe extra do options é aplicada ao nó', async () => {
        const wrapper = montar('<button v-tooltip="{ value: \'x\', class: \'minha-classe\' }">b</button>');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()?.classList.contains('minha-classe')).toBe(true);
    });

    it('mantém a estrutura de markup do PrimeVue', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');
        await disparar(wrapper, 'mouseenter');

        const no = tooltipNo();
        expect(no?.classList.contains('p-tooltip')).toBe(true);
        expect(no?.classList.contains('p-component')).toBe(true);
        expect(no?.querySelector('.p-tooltip-arrow')).not.toBeNull();
        expect(no?.querySelector('.p-tooltip-text')).not.toBeNull();
    });

    it('reexibir depois de esconder funciona (sem estado preso)', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');

        await disparar(wrapper, 'mouseenter');
        await disparar(wrapper, 'mouseleave');
        await disparar(wrapper, 'mouseenter');

        expect(tooltipNo()).not.toBeNull();
        expect(document.querySelectorAll('.p-tooltip').length).toBe(1);
    });

    it('mouseenter repetido não duplica o nó', async () => {
        const wrapper = montar('<button v-tooltip="\'x\'">b</button>');

        await disparar(wrapper, 'mouseenter');
        await disparar(wrapper, 'mouseenter');

        expect(document.querySelectorAll('.p-tooltip').length).toBe(1);
    });

    it('aceita as opções tipadas de TooltipOptions', async () => {
        const opcoes: TooltipOptions = { value: 'tipado', showDelay: 0, escape: true };
        const wrapper = mount(
            { template: '<button v-tooltip="opcoes">b</button>', data: () => ({ opcoes }) },
            { global: { directives: { tooltip: Tooltip } }, attachTo: document.body }
        );

        wrapper.find('button').element.dispatchEvent(new Event('mouseenter'));
        await nextTick();

        expect(textoDo()?.textContent).toBe('tipado');
    });
});
