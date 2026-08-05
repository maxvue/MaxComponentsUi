import { describe, it, expect, afterEach } from 'vitest';
import { ref, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useFocusTrap } from '../../src/helpers/useFocusTrap';
import MaxDrawer from '../../src/components/MaxDrawer.vue';

describe('useFocusTrap', () => {
    it('move o foco para o primeiro elemento focavel ao ativar', async () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('um');
        document.body.removeChild(container);
    });

    it('devolve o foco ao elemento anterior ao desativar', async () => {
        const anterior = document.createElement('button');
        document.body.appendChild(anterior);
        anterior.focus();

        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();
        trap.deactivate();
        await nextTick();

        expect(document.activeElement).toBe(anterior);
        document.body.removeChild(container);
        document.body.removeChild(anterior);
    });

    it('Tab no ultimo elemento volta para o primeiro', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const ultimo = container.querySelector<HTMLElement>('#dois');
        ultimo?.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
        Object.defineProperty(event, 'target', { value: ultimo });
        trap.onKeydown(event);

        expect(document.activeElement?.id).toBe('um');
        document.body.removeChild(container);
    });

    it('Shift+Tab no primeiro elemento vai para o ultimo', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        const primeiro = container.querySelector<HTMLElement>('#um');
        primeiro?.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
        Object.defineProperty(event, 'target', { value: primeiro });
        trap.onKeydown(event);

        expect(document.activeElement?.id).toBe('dois');
        document.body.removeChild(container);
    });

    it('ignora containers sem elementos focaveis', () => {
        const container = document.createElement('div');
        container.innerHTML = '<span>Sem foco</span>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        expect(() => trap.activate()).not.toThrow();

        document.body.removeChild(container);
    });

    it('Tab com foco fora da lista de focaveis vai para o primeiro focavel', () => {
        const container = document.createElement('div');
        container.setAttribute('role', 'complementary');
        container.tabIndex = -1;
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        container.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
        Object.defineProperty(event, 'target', { value: container });
        trap.onKeydown(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement?.id).toBe('um');
        document.body.removeChild(container);
    });

    it('Shift+Tab com foco fora da lista de focaveis vai para o ultimo focavel', () => {
        const container = document.createElement('div');
        container.setAttribute('role', 'complementary');
        container.tabIndex = -1;
        container.innerHTML = '<button id="um">Um</button><button id="dois">Dois</button>';
        document.body.appendChild(container);

        container.focus();

        const trap = useFocusTrap(ref(container));
        const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
        Object.defineProperty(event, 'target', { value: container });
        trap.onKeydown(event);

        expect(event.defaultPrevented).toBe(true);
        expect(document.activeElement?.id).toBe('dois');
        document.body.removeChild(container);
    });

    it('elemento oculto no container nao recebe foco ao ativar', async () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="oculto" style="display: none;">Oculto</button><button id="escondido" hidden>Escondido</button><button id="visivel">Visivel</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('visivel');
        document.body.removeChild(container);
    });

    it('deactivate nao lanca e nao foca elemento removido do DOM', async () => {
        const anterior = document.createElement('button');
        document.body.appendChild(anterior);
        anterior.focus();

        const container = document.createElement('div');
        container.innerHTML = '<button id="um">Um</button>';
        document.body.appendChild(container);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        document.body.removeChild(anterior);

        expect(() => trap.deactivate()).not.toThrow();
        expect(document.activeElement).not.toBe(anterior);

        document.body.removeChild(container);
    });

    it('container com um unico elemento focavel cicla nele mesmo em ambas as direcoes', () => {
        const container = document.createElement('div');
        container.innerHTML = '<button id="unico">Unico</button>';
        document.body.appendChild(container);

        const unico = container.querySelector<HTMLElement>('#unico');
        unico?.focus();

        const trap = useFocusTrap(ref(container));

        const eventoTab = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
        Object.defineProperty(eventoTab, 'target', { value: unico });
        trap.onKeydown(eventoTab);
        expect(document.activeElement?.id).toBe('unico');

        const eventoShiftTab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
        Object.defineProperty(eventoShiftTab, 'target', { value: unico });
        trap.onKeydown(eventoShiftTab);
        expect(document.activeElement?.id).toBe('unico');

        document.body.removeChild(container);
    });
});

/** Monta o drawer anexado ao body, necessario por causa do Teleport. */
const mountDrawer = (props: Record<string, unknown> = {}) => mount(MaxDrawer, {
    props: { visible: true, ...props },
    slots: { default: '<button class="interno">Interno</button>' },
    attachTo: document.body
});

describe('MaxDrawer', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('nao renderiza nada quando visible e false', () => {
        mountDrawer({ visible: false });
        expect(document.querySelector('.max-drawer')).toBeNull();
    });

    it('renderiza o painel e o slot quando visible e true', () => {
        mountDrawer();
        expect(document.querySelector('.max-drawer')).not.toBeNull();
        expect(document.querySelector('.interno')).not.toBeNull();
    });

    it('aplica a classe da posicao, com left por padrao', () => {
        mountDrawer();
        expect(document.querySelector('.max-drawer-left')).not.toBeNull();
    });

    it('aceita as demais posicoes', () => {
        mountDrawer({ position: 'right' });
        expect(document.querySelector('.max-drawer-right')).not.toBeNull();
    });

    it('aplica role complementary e aria-modal', () => {
        mountDrawer();
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.getAttribute('role')).toBe('complementary');
        expect(drawer?.getAttribute('aria-modal')).toBe('true');
    });

    it('renderiza o header quando a prop header e informada', () => {
        mountDrawer({ header: 'Titulo' });
        expect(document.querySelector('.max-drawer-header')?.textContent).toContain('Titulo');
    });

    it('emite update:visible false ao clicar no botao de fechar', async () => {
        const wrapper = mountDrawer();
        const botao = document.querySelector<HTMLElement>('.max-drawer-close');
        botao?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao renderiza o botao de fechar com showCloseIcon false', () => {
        mountDrawer({ showCloseIcon: false });
        expect(document.querySelector('.max-drawer-close')).toBeNull();
    });

    it('fecha ao clicar na mascara quando dismissable', async () => {
        const wrapper = mountDrawer();
        const mascara = document.querySelector<HTMLElement>('.max-drawer-mask');
        mascara?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao fecha ao clicar na mascara quando dismissable e false', async () => {
        const wrapper = mountDrawer({ dismissable: false });
        const mascara = document.querySelector<HTMLElement>('.max-drawer-mask');
        mascara?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('fecha com a tecla Escape', async () => {
        const wrapper = mountDrawer();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('Escape ainda fecha quando dismissable e false, pois closeOnEscape e independente', async () => {
        const wrapper = mountDrawer({ dismissable: false });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao fecha com Escape quando closeOnEscape e false', async () => {
        const wrapper = mountDrawer({ closeOnEscape: false });
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')).toBeFalsy();
    });

    it('clique na mascara continua governado apenas por dismissable, mesmo com closeOnEscape false', async () => {
        const wrapper = mountDrawer({ closeOnEscape: false });
        const mascara = document.querySelector<HTMLElement>('.max-drawer-mask');
        mascara?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    });

    it('nao muta o proprio visible (componente controlado)', async () => {
        const wrapper = mountDrawer();
        document.querySelector<HTMLElement>('.max-drawer-close')?.click();
        await wrapper.vm.$nextTick();
        expect(wrapper.props('visible')).toBe(true);
    });

    it('expoe open, close e toggle imperativos', async () => {
        const wrapper = mountDrawer({ visible: false });

        wrapper.vm.open();
        expect(wrapper.emitted('update:visible')?.[0]).toEqual([true]);

        wrapper.vm.close();
        expect(wrapper.emitted('update:visible')?.[1]).toEqual([false]);

        // toggle() le o `visible` atual das props (ainda false, pois o
        // componente e controlado e nao muta a prop sozinho), entao emite true.
        wrapper.vm.toggle();
        expect(wrapper.emitted('update:visible')?.[2]).toEqual([true]);
    });

    it('emite show ao abrir', async () => {
        const wrapper = mountDrawer({ visible: false });
        await wrapper.setProps({ visible: true });
        expect(wrapper.emitted('show')).toBeTruthy();
    });

    it('emite hide ao fechar', async () => {
        const wrapper = mountDrawer({ visible: true });
        await wrapper.setProps({ visible: false });
        expect(wrapper.emitted('hide')).toBeTruthy();
    });

    it('trava o scroll do body com blockScroll', async () => {
        document.body.style.overflow = '';
        const wrapper = mountDrawer({ visible: false, blockScroll: true });
        await wrapper.setProps({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');
        await wrapper.setProps({ visible: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('renderiza o slot footer quando informado', () => {
        mount(MaxDrawer, {
            props: { visible: true },
            slots: { default: '<div>x</div>', footer: '<span class="rodape">Rodape</span>' },
            attachTo: document.body
        });
        expect(document.querySelector('.rodape')).not.toBeNull();
    });

    it('aplica closeButtonProps ao botao de fechar', () => {
        mountDrawer({ closeButtonProps: { title: 'Fechar painel', 'data-testid': 'fechar-drawer' } });
        const botao = document.querySelector('.max-drawer-close');
        expect(botao?.getAttribute('title')).toBe('Fechar painel');
        expect(botao?.getAttribute('data-testid')).toBe('fechar-drawer');
    });

    it('usa o default do PrimeVue para closeButtonProps quando a prop nao e informada', () => {
        const wrapper = mountDrawer();
        expect(wrapper.props('closeButtonProps')).toEqual({ severity: 'secondary', text: true, rounded: true });
    });

    it('nao aplica severity/text/rounded do default como atributos DOM invalidos no botao nativo', () => {
        mountDrawer();
        const botao = document.querySelector('.max-drawer-close');
        expect(botao?.hasAttribute('severity')).toBe(false);
        expect(botao?.hasAttribute('text')).toBe(false);
        expect(botao?.hasAttribute('rounded')).toBe(false);
    });

    it('nao emite hide no mount quando visible comeca false', () => {
        const wrapper = mountDrawer({ visible: false });
        expect(wrapper.emitted('hide')).toBeFalsy();
    });

    it('emite hide legitimo ao abrir e depois fechar', async () => {
        const wrapper = mountDrawer({ visible: false });
        await wrapper.setProps({ visible: true });
        await wrapper.setProps({ visible: false });
        expect(wrapper.emitted('hide')).toHaveLength(1);
    });

    it('mantem o scroll travado para outro drawer ainda aberto ao fechar um deles', async () => {
        document.body.style.overflow = '';
        const wrapperA = mountDrawer({ visible: false, blockScroll: true });
        const wrapperB = mountDrawer({ visible: false, blockScroll: true });

        await wrapperA.setProps({ visible: true });
        await wrapperB.setProps({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');

        await wrapperA.setProps({ visible: false });
        expect(document.body.style.overflow).toBe('hidden');

        await wrapperB.setProps({ visible: false });
        expect(document.body.style.overflow).toBe('');
    });

    it('restaura o valor original de overflow, nao apenas uma string vazia', async () => {
        document.body.style.overflow = 'scroll';
        const wrapper = mountDrawer({ visible: false, blockScroll: true });

        await wrapper.setProps({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');

        await wrapper.setProps({ visible: false });
        expect(document.body.style.overflow).toBe('scroll');

        document.body.style.overflow = '';
    });

    it('alternar blockScroll para false com o drawer aberto e depois fechar nao deixa o scroll travado', async () => {
        document.body.style.overflow = '';
        const wrapper = mountDrawer({ visible: false, blockScroll: true });

        await wrapper.setProps({ visible: true });
        expect(document.body.style.overflow).toBe('hidden');

        await wrapper.setProps({ blockScroll: false });
        await wrapper.setProps({ visible: false });
        expect(document.body.style.overflow).toBe('');
    });
});
