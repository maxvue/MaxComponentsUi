import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ref, nextTick } from 'vue';
import { useFocusTrap, getActiveFocusTrapsCount, clearFocusTrapStack } from '../../src/helpers/useFocusTrap';

describe('useFocusTrap (Unitário & Comportamental)', () => {
    let containersToClean: HTMLElement[] = [];

    const createContainer = (html: string, id?: string): HTMLElement => {
        const el = document.createElement('div');
        if (id) el.id = id;
        el.innerHTML = html;
        document.body.appendChild(el);
        containersToClean.push(el);
        return el;
    };

    beforeEach(() => {
        clearFocusTrapStack();
        containersToClean = [];
        document.body.innerHTML = '';
    });

    afterEach(() => {
        clearFocusTrapStack();
        containersToClean.forEach((el) => {
            if (el.isConnected) el.remove();
        });
        containersToClean = [];
        document.body.innerHTML = '';
    });

    it('move o foco para o primeiro elemento focável ao ativar', async () => {
        const container = createContainer('<button id="b1">1</button><input id="i1" />');
        const trap = useFocusTrap(ref(container));

        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('b1');
        expect(getActiveFocusTrapsCount()).toBe(1);

        trap.deactivate();
        expect(getActiveFocusTrapsCount()).toBe(0);
    });

    it('foca o container com tabindex="-1" se não houver elementos focáveis', async () => {
        const container = createContainer('<p>Apenas texto</p>', 'empty-container');
        const trap = useFocusTrap(ref(container));

        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('empty-container');
        expect(container.getAttribute('tabindex')).toBe('-1');

        trap.deactivate();
        expect(getActiveFocusTrapsCount()).toBe(0);
    });

    it('ignora elementos ocultos por hidden, display:none, visibility:hidden, aria-hidden="true" e inert', async () => {
        const container = createContainer(`
            <button id="btn-hidden" hidden>Oculto</button>
            <div style="display: none;"><button id="btn-none">Display none</button></div>
            <div style="visibility: hidden;"><button id="btn-visibility">Visibility hidden</button></div>
            <div aria-hidden="true"><button id="btn-aria-hidden">Aria hidden</button></div>
            <div inert><button id="btn-inert">Inert</button></div>
            <button id="btn-visible">Visível</button>
        `);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        expect(document.activeElement?.id).toBe('btn-visible');
        trap.deactivate();
    });

    it('Tab e Shift+Tab confinam o foco ciclicamente dentro do container', async () => {
        const container = createContainer(`
            <button id="primeiro">Primeiro</button>
            <button id="meio">Meio</button>
            <button id="ultimo">Último</button>
        `);

        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        const primeiro = container.querySelector<HTMLElement>('#primeiro')!;
        const ultimo = container.querySelector<HTMLElement>('#ultimo')!;

        // Foco no último -> Tab deve ir para o primeiro
        ultimo.focus();
        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
        document.dispatchEvent(tabEvent);
        expect(document.activeElement?.id).toBe('primeiro');

        // Foco no primeiro -> Shift+Tab deve ir para o último
        primeiro.focus();
        const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true, bubbles: true });
        document.dispatchEvent(shiftTabEvent);
        expect(document.activeElement?.id).toBe('ultimo');

        trap.deactivate();
    });

    it('Tab com foco fora do container resgata o foco para dentro do trap', async () => {
        const outsideBtn = document.createElement('button');
        outsideBtn.id = 'outside';
        document.body.appendChild(outsideBtn);
        containersToClean.push(outsideBtn);

        const container = createContainer('<button id="inside">Inside</button>');
        const trap = useFocusTrap(ref(container));
        trap.activate();
        await nextTick();

        outsideBtn.focus();
        expect(document.activeElement?.id).toBe('outside');

        const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
        document.dispatchEvent(tabEvent);

        expect(document.activeElement?.id).toBe('inside');
        trap.deactivate();
    });

    it('Escape dispara apenas no topo da pilha (topmost trap), sem afetar camadas inferiores', async () => {
        const onEscapeA = vi.fn();
        const onEscapeB = vi.fn();

        const containerA = createContainer('<button id="a1">A1</button>');
        const containerB = createContainer('<button id="b1">B1</button>');

        const trapA = useFocusTrap(ref(containerA), { onEscape: onEscapeA });
        const trapB = useFocusTrap(ref(containerB), { onEscape: onEscapeB });

        trapA.activate();
        await nextTick();
        expect(getActiveFocusTrapsCount()).toBe(1);

        trapB.activate();
        await nextTick();
        expect(getActiveFocusTrapsCount()).toBe(2);

        // Dispara Escape no documento: deve acionar APENAS o topo (trapB)
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
        document.dispatchEvent(escapeEvent);

        expect(onEscapeB).toHaveBeenCalledTimes(1);
        expect(onEscapeA).not.toHaveBeenCalled();

        // Desativa trapB (fechando B) -> agora trapA é o topo
        trapB.deactivate();
        expect(getActiveFocusTrapsCount()).toBe(1);

        // Dispara outro Escape -> agora sim trapA deve responder
        const escapeEvent2 = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true, bubbles: true });
        document.dispatchEvent(escapeEvent2);

        expect(onEscapeA).toHaveBeenCalledTimes(1);
        trapA.deactivate();
        expect(getActiveFocusTrapsCount()).toBe(0);
    });

    it('centraliza pointer externo no topo e preserva clique iniciado dentro do overlay', async () => {
        const onOutsideA = vi.fn();
        const onOutsideB = vi.fn();
        const triggerA = document.createElement('button');
        document.body.appendChild(triggerA);
        containersToClean.push(triggerA);

        const containerA = createContainer('<button>A</button>');
        const containerB = createContainer('<button>B</button>');
        const trapA = useFocusTrap(ref(containerA), {
            outsideElements: () => [triggerA],
            onOutsidePointer: onOutsideA
        });
        const trapB = useFocusTrap(ref(containerB), { onOutsidePointer: onOutsideB });

        trapA.activate();
        trapB.activate();
        await nextTick();

        // O clique no trigger pertencente a A ainda é externo ao topo B.
        triggerA.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        triggerA.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onOutsideB).toHaveBeenCalledTimes(1);
        expect(onOutsideA).not.toHaveBeenCalled();

        // Um gesto iniciado dentro de B não fecha nenhuma camada ao terminar fora.
        containerB.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onOutsideB).toHaveBeenCalledTimes(1);

        trapB.deactivate();
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(onOutsideA).toHaveBeenCalledTimes(1);

        trapA.deactivate();
    });

    it('cadeia encadeada de foco A -> B -> A -> gatilho inicial restaura cada nível com precisão', async () => {
        const trigger = document.createElement('button');
        trigger.id = 'initial-trigger';
        document.body.appendChild(trigger);
        containersToClean.push(trigger);
        trigger.focus();
        expect(document.activeElement?.id).toBe('initial-trigger');

        const containerA = createContainer(`
            <button id="a-btn1">A Btn 1</button>
            <button id="open-b-btn">Abrir B</button>
        `);
        const containerB = createContainer(`
            <button id="b-btn1">B Btn 1</button>
        `);

        const trapA = useFocusTrap(ref(containerA));
        const trapB = useFocusTrap(ref(containerB));

        // 1. Abre A
        trapA.activate();
        await nextTick();
        expect(document.activeElement?.id).toBe('a-btn1');

        // 2. Usuário navega até o botão que abre B em A
        const openBBtn = containerA.querySelector<HTMLElement>('#open-b-btn')!;
        openBBtn.focus();
        expect(document.activeElement?.id).toBe('open-b-btn');

        // 3. Abre B a partir de A
        trapB.activate();
        await nextTick();
        expect(document.activeElement?.id).toBe('b-btn1');
        expect(getActiveFocusTrapsCount()).toBe(2);

        // 4. Fecha B -> foco deve retornar para openBBtn em A
        trapB.deactivate();
        await nextTick();
        expect(document.activeElement?.id).toBe('open-b-btn');
        expect(getActiveFocusTrapsCount()).toBe(1);

        // 5. Fecha A -> foco deve retornar para o gatilho inicial
        trapA.deactivate();
        await nextTick();
        expect(document.activeElement?.id).toBe('initial-trigger');
        expect(getActiveFocusTrapsCount()).toBe(0);
    });

    it('unmount de camada inferior enquanto camada superior está aberta preserva o foco do topo e redireciona retorno para o gatilho', async () => {
        const trigger = document.createElement('button');
        trigger.id = 'page-trigger';
        document.body.appendChild(trigger);
        containersToClean.push(trigger);
        trigger.focus();

        const containerA = createContainer('<button id="a-btn">A</button>');
        const containerB = createContainer('<button id="b-btn">B</button>');

        const trapA = useFocusTrap(ref(containerA));
        const trapB = useFocusTrap(ref(containerB));

        // Abre A e depois B
        trapA.activate();
        await nextTick();

        const aBtn = containerA.querySelector<HTMLElement>('#a-btn')!;
        aBtn.focus();

        trapB.activate();
        await nextTick();
        expect(document.activeElement?.id).toBe('b-btn');
        expect(getActiveFocusTrapsCount()).toBe(2);

        // A é desmontado (deactivate chamado) enquanto B ainda é o topo
        containerA.remove();
        trapA.deactivate();
        await nextTick();

        // O foco NÃO deve ser roubado de B!
        expect(document.activeElement?.id).toBe('b-btn');
        expect(getActiveFocusTrapsCount()).toBe(1);

        // Quando B fecha, o retorno foi herdado e deve ir direto para o page-trigger
        trapB.deactivate();
        await nextTick();
        expect(document.activeElement?.id).toBe('page-trigger');
        expect(getActiveFocusTrapsCount()).toBe(0);
    });

    it('fallback seguro quando o elemento anterior foi desconectado do DOM', async () => {
        const temporaryTrigger = document.createElement('button');
        temporaryTrigger.id = 'temp-trigger';
        document.body.appendChild(temporaryTrigger);
        temporaryTrigger.focus();

        const container = createContainer('<button id="btn-trap">Trap</button>');
        const trap = useFocusTrap(ref(container));

        trap.activate();
        await nextTick();
        expect(document.activeElement?.id).toBe('btn-trap');

        // Remove o trigger do DOM enquanto o trap está ativo
        temporaryTrigger.remove();

        // Desativar o trap não deve lançar erro
        expect(() => {
            trap.deactivate();
        }).not.toThrow();

        expect(getActiveFocusTrapsCount()).toBe(0);
    });
});
