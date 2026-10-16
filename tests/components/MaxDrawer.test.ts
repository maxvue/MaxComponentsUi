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

    it('aplica role dialog e aria-modal quando modal', () => {
        mountDrawer();
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.getAttribute('role')).toBe('dialog');
        expect(drawer?.getAttribute('aria-modal')).toBe('true');
    });

    it('aplica role complementary quando modal é false', () => {
        mountDrawer({ modal: false });
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.getAttribute('role')).toBe('complementary');
        expect(drawer?.getAttribute('aria-modal')).toBeNull();
    });

    it('vincula aria-labelledby ao título do header', () => {
        mountDrawer({ header: 'Minha Gaveta' });
        const drawer = document.querySelector('.max-drawer');
        const labelledBy = drawer?.getAttribute('aria-labelledby');
        expect(labelledBy).toBeTruthy();
        expect(document.getElementById(labelledBy!)?.textContent).toContain('Minha Gaveta');
    });

    it('aplica aria-label quando não houver header e a prop ariaLabel for passada', () => {
        mountDrawer({ ariaLabel: 'Gaveta descritiva' });
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.getAttribute('aria-label')).toBe('Gaveta descritiva');
    });

    it('transfere o foco para o contêiner com tabindex -1 quando não há elementos focáveis internos', async () => {
        mount(MaxDrawer, {
            props: { visible: true, showCloseIcon: false },
            slots: { default: '<div>Apenas texto estático</div>' },
            attachTo: document.body
        });
        await nextTick();
        await nextTick();
        const drawer = document.querySelector<HTMLElement>('.max-drawer');
        expect(document.activeElement).toBe(drawer);
    });

    it('aplica a classe max-drawer-no-padding quando noPadding é true', () => {
        mountDrawer({ noPadding: true });
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.classList.contains('max-drawer-no-padding')).toBe(true);
    });

    it('repassa classes de attrs para o elemento .max-drawer', () => {
        mount(MaxDrawer, {
            props: { visible: true },
            attrs: { class: 'custom-drawer-class' },
            attachTo: document.body
        });
        const drawer = document.querySelector('.max-drawer');
        expect(drawer?.classList.contains('custom-drawer-class')).toBe(true);
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

    it('nao duplica a classe de closeButtonProps.class no botao de fechar', () => {
        mountDrawer({ closeButtonProps: { class: 'minha-classe' } });
        const botao = document.querySelector('.max-drawer-close');
        const classes = botao?.className.split(' ').filter((c) => c === 'minha-classe');
        expect(classes?.length).toBe(1);
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

    it('restaura o foco ao elemento anterior ao desmontar o drawer enquanto visivel', async () => {
        const botaoOrigem = document.createElement('button');
        botaoOrigem.id = 'trigger-abrir';
        document.body.appendChild(botaoOrigem);
        botaoOrigem.focus();
        expect(document.activeElement).toBe(botaoOrigem);

        const wrapper = mount(MaxDrawer, {
            props: { visible: true, showCloseIcon: false },
            slots: { default: '<button id="btn-interno">Acao Interna</button>' },
            attachTo: document.body
        });

        await nextTick();
        expect(document.activeElement?.id).toBe('btn-interno');

        wrapper.unmount();
        await nextTick();

        expect(document.activeElement).toBe(botaoOrigem);

        document.body.removeChild(botaoOrigem);
    });

    it('desmontar drawer fechado e seguro e idempotente', async () => {
        const wrapper = mount(MaxDrawer, {
            props: { visible: false },
            attachTo: document.body
        });

        expect(() => wrapper.unmount()).not.toThrow();
    });

    it('desmontar drawer aberto com elemento anterior desconectado nao lanca erro', async () => {
        const botaoRemovido = document.createElement('button');
        document.body.appendChild(botaoRemovido);
        botaoRemovido.focus();

        const wrapper = mount(MaxDrawer, {
            props: { visible: true },
            slots: { default: '<button id="btn-seguro">Seguro</button>' },
            attachTo: document.body
        });
        await nextTick();

        document.body.removeChild(botaoRemovido);

        expect(() => wrapper.unmount()).not.toThrow();
    });

    describe('acessibilidade e nome acessível', () => {
        it('usa aria-labelledby quando header textual padrão é fornecido', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, header: 'Título da Gaveta' },
                attachTo: document.body
            });

            const panel = document.querySelector('.max-drawer');
            expect(panel?.getAttribute('role')).toBe('dialog');
            expect(panel?.getAttribute('aria-modal')).toBe('true');
            const labelledby = panel?.getAttribute('aria-labelledby');
            expect(labelledby).toBeTruthy();
            const headerEl = document.getElementById(labelledby!);
            expect(headerEl?.textContent).toBe('Título da Gaveta');
            expect(panel?.getAttribute('aria-label')).toBeNull();
            wrapper.unmount();
        });

        it('usa aria-label quando especificado diretamente', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, ariaLabel: 'Gaveta de Filtros' },
                attachTo: document.body
            });

            const panel = document.querySelector('.max-drawer');
            expect(panel?.getAttribute('aria-label')).toBe('Gaveta de Filtros');
            expect(panel?.getAttribute('aria-labelledby')).toBeNull();
            wrapper.unmount();
        });

        it('não emite aria-labelledby apontando para ID inexistente quando header slot customizado é usado', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, header: 'Antigo' },
                slots: {
                    header: '<h3 class="custom-header">Cabeçalho Customizado</h3>'
                },
                attachTo: document.body
            });

            const panel = document.querySelector('.max-drawer');
            // Como o slot customizado substituiu o span com id, aria-labelledby não pode apontar para id ausente
            expect(panel?.getAttribute('aria-labelledby')).toBeNull();
            expect(panel?.getAttribute('aria-label')).toBe('Antigo');
            wrapper.unmount();
        });

        it('respeita ariaLabelledby explícito quando informado', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, ariaLabelledby: 'external-title-id' },
                attachTo: document.body
            });

            const panel = document.querySelector('.max-drawer');
            expect(panel?.getAttribute('aria-labelledby')).toBe('external-title-id');
            expect(panel?.getAttribute('aria-label')).toBeNull();
            wrapper.unmount();
        });

        it('fornece fallback não vazio "Gaveta" para diálogo modal sem header ou ariaLabel', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true },
                attachTo: document.body
            });

            const panel = document.querySelector('.max-drawer');
            expect(panel?.getAttribute('aria-label')).toBe('Gaveta');
            wrapper.unmount();
        });
    });

    describe('Proteção contra fechamento por arraste na máscara (R1-R8)', () => {
        function simulateDrag(fromEl: Element, toEl: Element, clickEl: Element = toEl) {
            fromEl.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            toEl.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            clickEl.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
                detail: 1
            }));
        }

        function simulateDirectClick(el: Element) {
            el.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            el.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            el.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
                detail: 1
            }));
        }

        it('R1: arraste iniciado dentro do painel e terminado na máscara não fecha o drawer', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true },
                slots: { default: '<input id="drawer-input" value="Texto de teste">' },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;
            const inputEl = document.getElementById('drawer-input')!;
            expect(maskEl).toBeTruthy();
            expect(inputEl).toBeTruthy();

            simulateDrag(inputEl, maskEl, maskEl);
            await nextTick();

            expect(wrapper.emitted('update:visible')).toBeUndefined();
            wrapper.unmount();
        });

        it('R3: clique direto iniciado e terminado na máscara fecha quando dismissable é true', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                slots: { default: '<div>Conteúdo</div>' },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;
            simulateDirectClick(maskEl);
            await nextTick();

            expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
            wrapper.unmount();
        });

        it('R3: próximo clique direto na máscara fecha o drawer após um arraste ignorado', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                slots: { default: '<button id="btn-interno">Ação</button>' },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;
            const btnEl = document.getElementById('btn-interno')!;

            // 1. Arraste ignorado
            simulateDrag(btnEl, maskEl, maskEl);
            await nextTick();
            expect(wrapper.emitted('update:visible')).toBeUndefined();

            // 2. Clique direto na máscara
            simulateDirectClick(maskEl);
            await nextTick();
            expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);

            wrapper.unmount();
        });

        it('R4: arraste inverso iniciado na máscara e terminado no conteúdo não fecha o drawer', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                slots: { default: '<div id="conteudo-drawer">Painel</div>' },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;
            const contentEl = document.getElementById('conteudo-drawer')!;

            simulateDrag(maskEl, contentEl, maskEl);
            await nextTick();

            expect(wrapper.emitted('update:visible')).toBeUndefined();
            wrapper.unmount();
        });

        it('R6: suporta slot container customizado sem painel padrão', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                slots: {
                    container: '<div id="custom-container"><input id="custom-input" value="Custom"></div>'
                },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;
            const customInput = document.getElementById('custom-input')!;

            // Arraste de dentro do custom container para a máscara
            simulateDrag(customInput, maskEl, maskEl);
            await nextTick();
            expect(wrapper.emitted('update:visible')).toBeUndefined();

            // Clique direto fecha
            simulateDirectClick(maskEl);
            await nextTick();
            expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);

            wrapper.unmount();
        });

        it('R6: pointercancel invalida o fechamento por clique', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;

            maskEl.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));

            maskEl.dispatchEvent(new PointerEvent('pointercancel', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true
            }));

            maskEl.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            maskEl.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
                detail: 1
            }));
            await nextTick();

            expect(wrapper.emitted('update:visible')).toBeUndefined();
            wrapper.unmount();
        });

        it('R6: evento de blur na janela reseta a guarda de gesto', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;

            maskEl.dispatchEvent(new PointerEvent('pointerdown', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));

            window.dispatchEvent(new Event('blur'));

            maskEl.dispatchEvent(new PointerEvent('pointerup', {
                bubbles: true,
                cancelable: true,
                pointerId: 1,
                isPrimary: true,
                button: 0
            }));
            maskEl.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                button: 0,
                detail: 1
            }));
            await nextTick();

            expect(wrapper.emitted('update:visible')).toBeUndefined();
            wrapper.unmount();
        });

        it('R8: preserva clique programático neutro com detail === 0', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;

            maskEl.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                detail: 0
            }));
            await nextTick();

            expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
            wrapper.unmount();
        });

        it('R8: rejeita clique físico isolado com detail > 0 sem sequência de ponteiro', async () => {
            const wrapper = mount(MaxDrawer, {
                props: { visible: true, dismissable: true },
                attachTo: document.body
            });
            await nextTick();

            const maskEl = document.querySelector('.max-drawer-mask')!;

            maskEl.dispatchEvent(new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                detail: 1
            }));
            await nextTick();

            expect(wrapper.emitted('update:visible')).toBeUndefined();
            wrapper.unmount();
        });
    });

    describe('Dimensões do painel (width, maxWidth, minWidth)', () => {
        it('não injeta width, max-width nem min-width inline quando as props não forem informadas', async () => {
            const wrapper = mountDrawer();
            await nextTick();
            const drawerEl = document.querySelector('.max-drawer');
            expect(drawerEl).not.toBeNull();
            const style = drawerEl?.getAttribute('style') ?? '';
            expect(style).not.toMatch(/\bwidth:/);
            expect(style).not.toMatch(/\bmax-width:/);
            expect(style).not.toMatch(/\bmin-width:/);
            wrapper.unmount();
        });

        it('aplica width inline quando informada como número, zero ou string CSS', async () => {
            const wrapperNumber = mountDrawer({ width: 350 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('width: 350px');
            wrapperNumber.unmount();

            const wrapperZero = mountDrawer({ width: 0 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('width: 0px');
            wrapperZero.unmount();

            const testCases = ['25rem', '75%', '60vw', 'calc(100vw - 32px)', 'var(--drawer-custom-width)'];
            for (const val of testCases) {
                const w = mountDrawer({ width: val });
                await nextTick();
                expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain(`width: ${val}`);
                w.unmount();
            }
        });

        it('aplica maxWidth inline com teto de 100vw quando informada como número, zero ou string CSS', async () => {
            const wrapperNumber = mountDrawer({ maxWidth: 480 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('max-width: min(480px, 100vw)');
            wrapperNumber.unmount();

            const wrapperZero = mountDrawer({ maxWidth: 0 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('max-width: min(0px, 100vw)');
            wrapperZero.unmount();

            const testCases = ['30rem', '90%', '80vw', 'calc(100vw - 40px)', 'var(--drawer-max)'];
            for (const val of testCases) {
                const w = mountDrawer({ maxWidth: val });
                await nextTick();
                expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain(`max-width: min(${val}, 100vw)`);
                w.unmount();
            }
        });

        it('aplica minWidth inline quando informada como número, zero ou string CSS', async () => {
            const wrapperNumber = mountDrawer({ minWidth: 280 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('min-width: 280px');
            wrapperNumber.unmount();

            const wrapperZero = mountDrawer({ minWidth: 0 });
            await nextTick();
            expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain('min-width: 0px');
            wrapperZero.unmount();

            const testCases = ['18rem', '40%', '30vw', 'calc(50vw - 10px)', 'var(--drawer-min)'];
            for (const val of testCases) {
                const w = mountDrawer({ minWidth: val });
                await nextTick();
                expect(document.querySelector('.max-drawer')?.getAttribute('style')).toContain(`min-width: ${val}`);
                w.unmount();
            }
        });

        it('combina width, maxWidth e minWidth simultaneamente no painel', async () => {
            const wrapper = mountDrawer({
                width: 400,
                maxWidth: 600,
                minWidth: 250
            });
            await nextTick();
            const style = document.querySelector('.max-drawer')?.getAttribute('style') ?? '';
            expect(style).toContain('width: 400px');
            expect(style).toContain('max-width: min(600px, 100vw)');
            expect(style).toContain('min-width: 250px');
            wrapper.unmount();
        });

        it('aplica dimensões apenas ao painel .max-drawer e nunca à máscara .max-drawer-mask', async () => {
            const wrapper = mountDrawer({
                width: '30rem',
                maxWidth: '40rem',
                minWidth: '20rem'
            });
            await nextTick();
            const maskEl = document.querySelector('.max-drawer-mask');
            const drawerEl = document.querySelector('.max-drawer');
            expect(maskEl).not.toBeNull();
            expect(drawerEl).not.toBeNull();

            const maskStyle = maskEl?.getAttribute('style') ?? '';
            expect(maskStyle).not.toMatch(/\bwidth:/);
            expect(maskStyle).not.toMatch(/\bmax-width:/);
            expect(maskStyle).not.toMatch(/\bmin-width:/);

            const drawerStyle = drawerEl?.getAttribute('style') ?? '';
            expect(drawerStyle).toContain('width: 30rem');
            expect(drawerStyle).toContain('max-width: min(40rem, 100vw)');
            expect(drawerStyle).toContain('min-width: 20rem');
            wrapper.unmount();
        });

        it('não aplica estilos de dimensão quando o slot container substitui o painel padrão', async () => {
            const wrapper = mount(MaxDrawer, {
                props: {
                    visible: true,
                    width: 500,
                    maxWidth: 700,
                    minWidth: 300
                },
                slots: {
                    container: '<aside class="meu-container-customizado">Custom</aside>'
                },
                attachTo: document.body
            });
            await nextTick();

            expect(document.querySelector('.max-drawer')).toBeNull();
            expect(document.querySelector('.meu-container-customizado')).not.toBeNull();

            const maskStyle = document.querySelector('.max-drawer-mask')?.getAttribute('style') ?? '';
            expect(maskStyle).not.toMatch(/\bwidth:/);
            expect(maskStyle).not.toMatch(/\bmax-width:/);
            expect(maskStyle).not.toMatch(/\bmin-width:/);
            wrapper.unmount();
        });

        it('atualiza e remove reativamente width, maxWidth e minWidth via setProps', async () => {
            const wrapper = mountDrawer({
                width: 300,
                maxWidth: 500,
                minWidth: 200
            });
            await nextTick();
            let style = document.querySelector('.max-drawer')?.getAttribute('style') ?? '';
            expect(style).toContain('width: 300px');
            expect(style).toContain('max-width: min(500px, 100vw)');
            expect(style).toContain('min-width: 200px');

            await wrapper.setProps({
                width: '35rem',
                maxWidth: '50rem',
                minWidth: '22rem'
            });
            await nextTick();
            style = document.querySelector('.max-drawer')?.getAttribute('style') ?? '';
            expect(style).toContain('width: 35rem');
            expect(style).toContain('max-width: min(50rem, 100vw)');
            expect(style).toContain('min-width: 22rem');

            await wrapper.setProps({
                width: undefined,
                maxWidth: undefined,
                minWidth: undefined
            });
            await nextTick();
            style = document.querySelector('.max-drawer')?.getAttribute('style') ?? '';
            expect(style).not.toMatch(/\bwidth:/);
            expect(style).not.toMatch(/\bmax-width:/);
            expect(style).not.toMatch(/\bmin-width:/);
            wrapper.unmount();
        });

        it('mantém as classes de posição nas cinco posições junto aos estilos inline', async () => {
            const positions = ['left', 'right', 'top', 'bottom', 'full'] as const;
            for (const pos of positions) {
                const wrapper = mountDrawer({ position: pos, width: 320 });
                await nextTick();
                const el = document.querySelector('.max-drawer');
                expect(el?.classList.contains(`max-drawer-${pos}`)).toBe(true);
                expect(el?.getAttribute('style')).toContain('width: 320px');
                wrapper.unmount();
            }
        });

        it('preserva classes extras via attrs e classe max-drawer-no-padding com props de dimensão', async () => {
            const wrapper = mount(MaxDrawer, {
                props: {
                    visible: true,
                    noPadding: true,
                    width: 400
                },
                attrs: {
                    class: 'drawer-custom-class'
                },
                attachTo: document.body
            });
            await nextTick();

            const el = document.querySelector('.max-drawer');
            expect(el?.classList.contains('max-drawer-no-padding')).toBe(true);
            expect(el?.classList.contains('drawer-custom-class')).toBe(true);
            expect(el?.getAttribute('style')).toContain('width: 400px');
            wrapper.unmount();
        });
    });
});
