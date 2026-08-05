import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MaxBaseOverlay from '../../../src/components/base/MaxBaseOverlay.vue';
import { resetOverlayStack } from '../../../src/helpers/overlayStack';

/**
 * happy-dom não faz layout: getBoundingClientRect() retorna zeros. Para testar
 * flip vertical e clamp horizontal de forma determinística, o rect do gatilho e o
 * do painel são mockados explicitamente.
 */
const makeTarget = (rect: Partial<DOMRect> = {}) => {
    const el = document.createElement('button');
    document.body.appendChild(el);

    const full: DOMRect = {
        x: 100, y: 100, top: 100, left: 100, right: 300, bottom: 140,
        width: 200, height: 40, toJSON: () => ({}), ...rect
    } as DOMRect;

    el.getBoundingClientRect = () => full;
    return el;
};

const mockPanelRect = (rect: Partial<DOMRect>) => {
    const panel = document.querySelector('.max-base-overlay') as HTMLElement;
    const full: DOMRect = {
        x: 0, y: 0, top: 0, left: 0, right: 200, bottom: 150,
        width: 200, height: 150, toJSON: () => ({}), ...rect
    } as DOMRect;

    panel.getBoundingClientRect = () => full;
    return panel;
};

const mountOverlay = (props: Record<string, unknown> = {}, slot = '<span class="conteudo">conteudo</span>') =>
    mount(MaxBaseOverlay, {
        props: { target: 'target' in props ? props.target : makeTarget(), ...props },
        slots: { default: slot },
        attachTo: document.body
    });

describe('MaxBaseOverlay', () => {
    beforeEach(() => {
        window.innerWidth = 1024;
        window.innerHeight = 768;
        resetOverlayStack();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        document.body.style.overflow = '';
        vi.restoreAllMocks();
    });

    it('com visible=false o painel não está no DOM', () => {
        mountOverlay({ visible: false });
        expect(document.querySelector('.max-base-overlay')).toBeNull();
    });

    it('com visible=true o painel é teleportado para document.body', async () => {
        mountOverlay({ visible: true });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay');
        expect(panel).not.toBeNull();
        // O <Transition> vira transition-stub no VTU e se interpõe entre o painel e o
        // destino do teleport; o que importa é o painel estar sob document.body.
        expect(document.body.contains(panel as Node)).toBe(true);
        expect(panel?.closest('#host-overlay')).toBeNull();
        expect(panel?.textContent).toContain('conteudo');
    });

    it('emite before-show e show ao abrir, before-hide e hide ao fechar', async () => {
        const wrapper = mountOverlay({ visible: false });
        await wrapper.setProps({ visible: true });
        await nextTick();

        expect(wrapper.emitted('before-show')).toBeTruthy();
        expect(wrapper.emitted('show')).toBeTruthy();
        expect(wrapper.emitted('hide')).toBeFalsy();

        await wrapper.setProps({ visible: false });
        await nextTick();

        expect(wrapper.emitted('before-hide')).toBeTruthy();
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('montar com visible=false não emite hide nem before-hide espúrios', async () => {
        const wrapper = mountOverlay({ visible: false });
        await nextTick();

        expect(wrapper.emitted('hide')).toBeFalsy();
        expect(wrapper.emitted('before-hide')).toBeFalsy();
        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('montar já com visible=true emite before-show e show', async () => {
        const wrapper = mountOverlay({ visible: true });
        await nextTick();

        expect(wrapper.emitted('before-show')).toBeTruthy();
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('clique fora fecha e emite update:visible com false', async () => {
        const wrapper = mountOverlay({ visible: true, dismissable: true });
        await nextTick();

        const outside = document.createElement('div');
        document.body.appendChild(outside);
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeTruthy();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);

        // before-hide/hide só saem quando o consumidor efetiva o fechamento
        expect(wrapper.emitted('before-hide')).toBeFalsy();
        await wrapper.setProps({ visible: false });
        await nextTick();
        expect(wrapper.emitted('before-hide')).toBeTruthy();
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('clique dentro do painel não fecha', async () => {
        const wrapper = mountOverlay({ visible: true, dismissable: true });
        await nextTick();

        const inner = document.querySelector('.conteudo') as HTMLElement;
        inner.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('clique no gatilho não fecha via click-outside', async () => {
        const target = makeTarget();
        const wrapper = mountOverlay({ visible: true, dismissable: true, target });
        await nextTick();

        target.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('clique num FILHO do gatilho também não fecha', async () => {
        // gatilhos reais são compostos (ícone + label dentro do botão); comparar por
        // identidade em vez de contains faria o toggle fechar e reabrir no mesmo evento
        const target = makeTarget();
        const icone = document.createElement('span');
        target.appendChild(icone);

        const wrapper = mountOverlay({ visible: true, dismissable: true, target });
        await nextTick();

        icone.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('o style calculado do painel vence um style colidente vindo de attrs', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 100, right: 300, width: 200 });
        const wrapper = mount(MaxBaseOverlay, {
            props: { visible: true, target, offset: 2 },
            attrs: { style: 'top: 999px; background: red' },
            slots: { default: '<span>c</span>' },
            attachTo: document.body
        });
        await nextTick();
        mockPanelRect({ height: 100, width: 200 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.top).toBe('142px'); // posicionamento prevalece
        expect(panel.style.background).toBe('red'); // o não-colidente sobrevive
    });

    it('dismissable=false ignora o clique fora', async () => {
        const wrapper = mountOverlay({ visible: true, dismissable: false });
        await nextTick();

        const outside = document.createElement('div');
        document.body.appendChild(outside);
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('Escape fecha e o foco volta ao gatilho', async () => {
        const target = makeTarget();
        const focusSpy = vi.spyOn(target, 'focus');
        const wrapper = mountOverlay({ visible: true, closeOnEscape: true, target });
        await nextTick();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);

        // o consumidor controla o v-model; simula o fechamento efetivo
        await wrapper.setProps({ visible: false });
        await nextTick();

        expect(focusSpy).toHaveBeenCalled();
    });

    it('o ESC consumido não chega a listeners externos', async () => {
        const externo = vi.fn();
        document.addEventListener('keydown', externo);

        mountOverlay({ visible: true, closeOnEscape: true });
        await nextTick();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        document.removeEventListener('keydown', externo);

        // o overlay trata o ESC em fase de captura e para a propagação, para que um
        // atalho global da app não reaja ao mesmo ESC que fechou o painel
        expect(externo).not.toHaveBeenCalled();
    });

    it('closeOnEscape=false faz o ESC não fechar', async () => {
        const wrapper = mountOverlay({ visible: true, closeOnEscape: false });
        await nextTick();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('matchTargetWidth aplica min-width igual à largura do gatilho', async () => {
        const target = makeTarget({ width: 250 });
        const wrapper = mountOverlay({ visible: false, matchTargetWidth: true, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.minWidth).toBe('250px');
    });

    it('matchTargetWidth=false não aplica min-width', async () => {
        const target = makeTarget({ width: 250 });
        const wrapper = mountOverlay({ visible: false, matchTargetWidth: false, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.minWidth).toBe('');
    });

    it('posiciona abaixo do gatilho quando há espaço', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, offset: 2 });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 150, width: 200 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.top).toBe('142px'); // bottom(140) + offset(2)
        expect(panel.style.left).toBe('100px');
        expect(panel.classList).not.toContain('max-base-overlay-up');
    });

    it('faz flip vertical quando não cabe abaixo', async () => {
        // gatilho perto do rodapé: 768 - 700 = 68px abaixo, 660px acima
        const target = makeTarget({ top: 660, bottom: 700, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, offset: 2 });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 150, width: 200 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.top).toBe('508px'); // top(660) - height(150) - offset(2)
        expect(panel.classList).toContain('max-base-overlay-up');
    });

    it('faz clamp horizontal quando o painel ultrapassa a borda direita', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 950, right: 1010, width: 60 });
        const wrapper = mountOverlay({ visible: false, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 100, width: 300 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.left).toBe('716px'); // vw(1024) - width(300) - 8
    });

    it('align=right alinha a borda direita do painel à do gatilho', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 300, right: 500, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, align: 'right' });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 100, width: 300 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.left).toBe('200px'); // right(500) - width(300)
    });

    it('reposiciona em scroll e resize', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, offset: 2 });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 100, width: 200 });

        // o gatilho "rola": novo rect
        target.getBoundingClientRect = () => ({
            x: 100, y: 50, top: 50, left: 100, right: 300, bottom: 90,
            width: 200, height: 40, toJSON: () => ({})
        } as DOMRect);

        window.dispatchEvent(new Event('scroll'));
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.top).toBe('92px'); // bottom(90) + offset(2)
    });

    it('atributos herdados (id, aria-*) chegam ao painel teleportado', async () => {
        // o consumidor aponta o aria-controls do gatilho para este id
        mount(MaxBaseOverlay, {
            props: { visible: true, target: makeTarget() },
            attrs: { id: 'painel-x', 'aria-label': 'opções' },
            slots: { default: '<span>c</span>' },
            attachTo: document.body
        });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.getAttribute('id')).toBe('painel-x');
        expect(panel.getAttribute('aria-label')).toBe('opções');
    });

    it('aplica o role recebido via prop', async () => {
        mountOverlay({ visible: true, role: 'listbox' });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.getAttribute('role')).toBe('listbox');
    });

    it('move o foco para o painel ao abrir quando focusOnShow', async () => {
        const wrapper = mountOverlay({ visible: false, focusOnShow: true });
        await wrapper.setProps({ visible: true });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.getAttribute('tabindex')).toBe('-1');
        expect(document.activeElement).toBe(panel);
    });

    it('focusOnShow=false (default) não rouba o foco do gatilho', async () => {
        const target = makeTarget();
        target.focus();

        const wrapper = mountOverlay({ visible: false, target });
        await wrapper.setProps({ visible: true });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(document.activeElement).not.toBe(panel);
    });

    it('returnFocusOnHide=false não devolve o foco ao gatilho', async () => {
        const target = makeTarget();
        const focusSpy = vi.spyOn(target, 'focus');
        const wrapper = mountOverlay({ visible: true, target, returnFocusOnHide: false });
        await nextTick();
        focusSpy.mockClear();

        await wrapper.setProps({ visible: false });
        await nextTick();

        expect(focusSpy).not.toHaveBeenCalled();
    });

    it('overlays abertos depois recebem z-index maior (empilhamento)', async () => {
        const first = mountOverlay({ visible: false, target: makeTarget() });
        await first.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (first.vm as unknown as { position: () => void }).position();
        await nextTick();

        const second = mountOverlay({ visible: false, target: makeTarget() });
        await second.setProps({ visible: true });
        await nextTick();

        const panels = document.querySelectorAll('.max-base-overlay');
        expect(panels.length).toBe(2);

        (second.vm as unknown as { position: () => void }).position();
        await nextTick();

        const z = Array.from(panels).map((p) => Number((p as HTMLElement).style.zIndex));
        expect(z[1]).toBeGreaterThan(z[0]);
    });

    it('reposicionar não infla o z-index (alocado uma vez por abertura)', async () => {
        const target = makeTarget();
        const wrapper = mountOverlay({ visible: false, target });
        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});

        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        const primeiro = panel.style.zIndex;

        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('resize'));
        await nextTick();

        expect(panel.style.zIndex).toBe(primeiro);
    });

    it('em overlays aninhados só o do topo reage ao ESC', async () => {
        const bottom = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();
        const top = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(top.emitted('update:visible')?.[0]).toEqual([false]);
        expect(bottom.emitted('update:visible')).toBeFalsy();
    });

    it('appendTo="self" desativa o teleport (painel fica no lugar do componente)', async () => {
        const wrapper = mountOverlay({ visible: true, appendTo: 'self' });
        await nextTick();

        // Teleport desativado: o painel fica na árvore do próprio componente, e por
        // isso é alcançável pelo wrapper (com teleport ativo, find() não o vê).
        expect(wrapper.find('.max-base-overlay').exists()).toBe(true);
    });

    it('appendTo aceita um elemento e teleporta para ele', async () => {
        const host = document.createElement('div');
        host.id = 'host-overlay';
        document.body.appendChild(host);

        mountOverlay({ visible: true, appendTo: host });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(host.contains(panel)).toBe(true);
    });

    it('reposiciona em scroll de container interno (listener em fase de captura)', async () => {
        const scroller = document.createElement('div');
        document.body.appendChild(scroller);

        const target = makeTarget({ top: 100, bottom: 140, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, offset: 2 });
        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 100, width: 200 });

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        expect(panel.style.top).toBe('142px');

        target.getBoundingClientRect = () => ({
            x: 100, y: 10, top: 10, left: 100, right: 300, bottom: 50,
            width: 200, height: 40, toJSON: () => ({})
        } as DOMRect);

        // scroll num container que NÃO é ancestral do painel: só chega via captura
        scroller.dispatchEvent(new Event('scroll', { bubbles: false }));
        await nextTick();

        expect(panel.style.top).toBe('52px');
    });

    it('maxHeight é aplicado ao painel', async () => {
        mountOverlay({ visible: true, maxHeight: '14rem' });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.maxHeight).toBe('14rem');
    });

    it('modal renderiza a máscara abaixo do painel e o clique nela fecha', async () => {
        const wrapper = mountOverlay({ visible: true, modal: true, dismissable: true });
        await nextTick();

        const mask = document.querySelector('.max-base-overlay-mask') as HTMLElement;
        expect(mask).not.toBeNull();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.getAttribute('aria-modal')).toBe('true');

        mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('modal com dismissable=false: clique na máscara NÃO fecha', async () => {
        const wrapper = mountOverlay({ visible: true, modal: true, dismissable: false });
        await nextTick();

        const mask = document.querySelector('.max-base-overlay-mask') as HTMLElement;
        mask.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('a máscara fica ABAIXO do painel no empilhamento', async () => {
        const target = makeTarget();
        const wrapper = mountOverlay({ visible: false, modal: true, target });
        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const mask = document.querySelector('.max-base-overlay-mask') as HTMLElement;
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;

        expect(Number(mask.style.zIndex)).toBeLessThan(Number(panel.style.zIndex));
    });

    it('desmontar um overlay aberto o remove da pilha (ESC segue funcionando depois)', async () => {
        const remaining = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();

        // o abandonado entra DEPOIS, virando topo; ao desmontar ainda aberto, seu
        // symbol precisa sair da pilha, senão ele bloqueia o ESC de quem ficou
        const abandoned = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();
        abandoned.unmount();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(remaining.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('sem target o foco volta a quem o tinha antes de abrir', async () => {
        const externo = document.createElement('button');
        document.body.appendChild(externo);
        externo.focus();
        const focusSpy = vi.spyOn(externo, 'focus');

        const wrapper = mountOverlay({ visible: false, target: null, focusOnShow: true });
        await wrapper.setProps({ visible: true });
        await nextTick();
        focusSpy.mockClear();

        await wrapper.setProps({ visible: false });
        await nextTick();

        expect(focusSpy).toHaveBeenCalled();
    });

    it('blockScroll com dois overlays: só destrava quando o último fecha', async () => {
        document.body.style.overflow = 'scroll';

        const a = mountOverlay({ visible: true, blockScroll: true });
        await nextTick();
        const b = mountOverlay({ visible: true, blockScroll: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');

        // fechar o primeiro NÃO pode liberar o scroll com o segundo ainda aberto
        await a.setProps({ visible: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');

        await b.setProps({ visible: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('scroll');
    });

    it('fechar e depois desmontar não solta a trava de outro overlay aberto', async () => {
        document.body.style.overflow = 'scroll';

        const a = mountOverlay({ visible: true, blockScroll: true });
        await nextTick();
        const b = mountOverlay({ visible: true, blockScroll: true });
        await nextTick();

        // fechar via v-model e EM SEGUIDA desmontar chama unlockScroll duas vezes;
        // sem a guarda holdsScrollLock isso decrementa o contador global a mais e
        // destrava o body com o overlay B ainda aberto
        await a.setProps({ visible: false });
        await nextTick();
        a.unmount();

        expect(document.body.style.overflow).toBe('hidden');

        await b.setProps({ visible: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('scroll');
    });

    it('reabrir o mesmo overlay não trava o body duas vezes', async () => {
        document.body.style.overflow = 'scroll';

        const wrapper = mountOverlay({ visible: false, blockScroll: true });

        for (let i = 0; i < 3; i++) {
            await wrapper.setProps({ visible: true });
            await nextTick();
            expect(document.body.style.overflow).toBe('hidden');

            await wrapper.setProps({ visible: false });
            await nextTick();
            // um lock duplicado por instância deixaria o contador alto e o body preso
            expect(document.body.style.overflow).toBe('scroll');
        }
    });

    it('fechar o overlay do MEIO mantém o ESC no topo', async () => {
        const fundo = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();
        const meio = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();
        const topo = mountOverlay({ visible: true, target: makeTarget() });
        await nextTick();

        // remoção por identidade: um pop() aqui tiraria o topo da pilha
        await meio.setProps({ visible: false });
        await nextTick();

        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(topo.emitted('update:visible')?.[0]).toEqual([false]);
        expect(fundo.emitted('update:visible')).toBeFalsy();
    });

    it('reabrir aloca um z-index novo, acima do anterior', async () => {
        const target = makeTarget();
        const wrapper = mountOverlay({ visible: false, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        const primeiro = Number((document.querySelector('.max-base-overlay') as HTMLElement).style.zIndex);

        await wrapper.setProps({ visible: false });
        await nextTick();

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        const segundo = Number((document.querySelector('.max-base-overlay') as HTMLElement).style.zIndex);

        expect(segundo).toBeGreaterThan(primeiro);
    });

    it('o z-index do primeiro overlay fica acima do tema (> 1000)', async () => {
        const target = makeTarget();
        const wrapper = mountOverlay({ visible: false, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({});
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(Number(panel.style.zIndex)).toBeGreaterThan(1000);
    });

    it('o estado de flip não vaza entre aberturas', async () => {
        // 1a abertura junto ao rodapé: abre para cima
        const target = makeTarget({ top: 660, bottom: 700, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 150, width: 200 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        expect((document.querySelector('.max-base-overlay') as HTMLElement).classList).toContain('max-base-overlay-up');

        await wrapper.setProps({ visible: false });
        await nextTick();

        // 2a abertura com espaço de sobra abaixo: a classe -up não pode persistir
        target.getBoundingClientRect = () => ({
            x: 100, y: 100, top: 100, left: 100, right: 300, bottom: 140,
            width: 200, height: 40, toJSON: () => ({})
        } as DOMRect);

        await wrapper.setProps({ visible: true });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.classList).not.toContain('max-base-overlay-up');
    });

    it('trapFocus: o PRIMEIRO Tab a partir do painel vai para o primeiro focável', async () => {
        mountOverlay(
            { visible: true, trapFocus: true, modal: true },
            '<button class="b1">um</button><button class="b2">dois</button>'
        );
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        const first = panel.querySelector('.b1') as HTMLElement;

        // ao abrir com trapFocus o foco está no próprio painel
        expect(document.activeElement).toBe(panel);

        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        panel.dispatchEvent(event);
        await nextTick();

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(first);
    });

    it('pointerdown sem click não engole o clique seguinte', async () => {
        const wrapper = mountOverlay({ visible: true, dismissable: true });
        await nextTick();

        const inner = document.querySelector('.conteudo') as HTMLElement;
        const outside = document.createElement('div');
        document.body.appendChild(outside);

        // gesto dentro do painel que é cancelado (virou scroll / pointercancel) e
        // portanto nunca vira click
        inner.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        document.dispatchEvent(new Event('pointercancel', { bubbles: true }));

        // clique fora sem novo pointerdown (teclado, clique sintético): se o alvo
        // sujo tivesse ficado, este clique seria engolido para limpar o estado
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('modal com visible=false não deixa máscara no DOM', async () => {
        // uma máscara órfã é invisível mas cobre a viewport inteira (fixed, inset 0)
        // e engoliria todos os cliques da aplicação com o overlay fechado
        const wrapper = mountOverlay({ visible: false, modal: true });
        await nextTick();

        expect(document.querySelector('.max-base-overlay-mask')).toBeNull();

        await wrapper.setProps({ visible: true });
        await nextTick();
        expect(document.querySelector('.max-base-overlay-mask')).not.toBeNull();

        await wrapper.setProps({ visible: false });
        await nextTick();
        expect(document.querySelector('.max-base-overlay-mask')).toBeNull();
    });

    it('o painel reaberto não carrega a posição da abertura anterior', async () => {
        const target = makeTarget({ top: 100, bottom: 140, left: 100, right: 300, width: 200 });
        const wrapper = mountOverlay({ visible: false, target, offset: 2 });

        await wrapper.setProps({ visible: true });
        await nextTick();
        mockPanelRect({ height: 100, width: 200 });
        (wrapper.vm as unknown as { position: () => void }).position();
        await nextTick();
        expect((document.querySelector('.max-base-overlay') as HTMLElement).style.top).toBe('142px');

        await wrapper.setProps({ visible: false });
        await nextTick();

        // gatilho mudou de lugar entre as aberturas
        target.getBoundingClientRect = () => ({
            x: 100, y: 400, top: 400, left: 100, right: 300, bottom: 440,
            width: 200, height: 40, toJSON: () => ({})
        } as DOMRect);

        await wrapper.setProps({ visible: true });
        await nextTick();

        // no primeiro frame, antes de reposicionar, o painel não pode exibir o top antigo
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.style.top).not.toBe('142px');
    });

    it('sem modal não há máscara nem aria-modal', async () => {
        mountOverlay({ visible: true, modal: false });
        await nextTick();

        expect(document.querySelector('.max-base-overlay-mask')).toBeNull();
        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.getAttribute('aria-modal')).toBeNull();
    });

    it('blockScroll trava o body e restaura o valor anterior ao fechar', async () => {
        document.body.style.overflow = 'scroll';

        const wrapper = mountOverlay({ visible: false, blockScroll: true });
        await wrapper.setProps({ visible: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');

        await wrapper.setProps({ visible: false });
        await nextTick();
        expect(document.body.style.overflow).toBe('scroll');
    });

    it('blockScroll restaura o body também ao desmontar aberto', async () => {
        document.body.style.overflow = 'auto';

        const wrapper = mountOverlay({ visible: true, blockScroll: true });
        await nextTick();
        expect(document.body.style.overflow).toBe('hidden');

        wrapper.unmount();
        expect(document.body.style.overflow).toBe('auto');
    });

    it('trapFocus faz o Tab circular dentro do painel', async () => {
        const wrapper = mountOverlay(
            { visible: true, trapFocus: true, modal: true },
            '<button class="b1">um</button><button class="b2">dois</button>'
        );
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        const first = panel.querySelector('.b1') as HTMLElement;
        const last = panel.querySelector('.b2') as HTMLElement;

        last.focus();
        panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
        await nextTick();
        expect(document.activeElement).toBe(first);

        first.focus();
        panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
        await nextTick();
        expect(document.activeElement).toBe(last);

        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('sem trapFocus o Tab não é interceptado', async () => {
        mountOverlay(
            { visible: true, trapFocus: false },
            '<button class="b1">um</button><button class="b2">dois</button>'
        );
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        const first = panel.querySelector('.b1') as HTMLElement;
        const last = panel.querySelector('.b2') as HTMLElement;
        last.focus();

        const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
        panel.dispatchEvent(event);
        await nextTick();

        // sem trap: o evento não é cancelado e o foco não é reciclado para o primeiro
        expect(event.defaultPrevented).toBe(false);
        expect(document.activeElement).not.toBe(first);
    });

    it('arraste iniciado dentro do painel e terminado fora não fecha', async () => {
        const wrapper = mountOverlay({ visible: true, dismissable: true });
        await nextTick();

        const inner = document.querySelector('.conteudo') as HTMLElement;
        const outside = document.createElement('div');
        document.body.appendChild(outside);

        // gesto nasce dentro (slider de cor) e o mouse é solto fora
        inner.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('sem target o painel é renderizado e não quebra (modo drawer)', async () => {
        const wrapper = mountOverlay({ visible: true, target: null });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel).not.toBeNull();
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('remove todos os listeners ao desmontar (sem vazamento)', async () => {
        const docAdd = vi.spyOn(document, 'addEventListener');
        const docRemove = vi.spyOn(document, 'removeEventListener');
        const winAdd = vi.spyOn(window, 'addEventListener');
        const winRemove = vi.spyOn(window, 'removeEventListener');

        const wrapper = mountOverlay({ visible: true });
        await nextTick();

        const added = [
            ...docAdd.mock.calls.map((c) => c[0]),
            ...winAdd.mock.calls.map((c) => c[0])
        ].filter((t) => ['click', 'keydown', 'scroll', 'resize'].includes(t as string));
        expect(added.length).toBeGreaterThan(0);

        wrapper.unmount();

        const removed = [
            ...docRemove.mock.calls.map((c) => c[0]),
            ...winRemove.mock.calls.map((c) => c[0])
        ].filter((t) => ['click', 'keydown', 'scroll', 'resize'].includes(t as string));

        expect(removed.sort()).toEqual(added.sort());
    });

    it('após fechar, o clique fora não dispara mais nada (listeners soltos)', async () => {
        const wrapper = mountOverlay({ visible: true });
        await nextTick();
        await wrapper.setProps({ visible: false });
        await nextTick();

        const outside = document.createElement('div');
        document.body.appendChild(outside);
        outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));

        // apenas o hide do setProps; nenhum update:visible extra do listener órfão
        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('não contém marcação de componente PrimeVue além das classes de tema', async () => {
        mountOverlay({ visible: true });
        await nextTick();

        const panel = document.querySelector('.max-base-overlay') as HTMLElement;
        expect(panel.className).not.toContain('p-overlay');
        expect(panel.className).not.toContain('p-select-overlay');
    });
});
