import { describe, it, expect } from 'vitest';
import { ref, nextTick } from 'vue';
import { useFocusTrap } from '../../src/helpers/useFocusTrap';

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
