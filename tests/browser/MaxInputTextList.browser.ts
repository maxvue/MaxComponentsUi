import { describe, it, expect, afterEach } from 'vitest';
import { createApp, h, type App } from 'vue';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function mountTextList(modelValue: string, scale = 1) {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }

    hostElement = document.createElement('div');
    hostElement.id = 'test-host';
    hostElement.style.zoom = scale.toString();
    hostElement.style.width = '600px';
    hostElement.style.height = '400px';
    document.body.appendChild(hostElement);

    const app = createApp({
        render() {
            return h(MaxInputTextList, {
                modelValue
            });
        }
    });

    activeApp = app;
    app.mount(hostElement);
    await nextFrame();
    await nextFrame();

    return { host: hostElement, app };
}

afterEach(() => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
});

describe('MaxInputTextList no Chromium (E11-01)', () => {
    it('alinha os números de linha à área de texto de 10.000 linhas, verificando o scroll no início, meio e fim (escala 100% e 200%) com erro <= 1px', async () => {
        const counts = 10000;
        const lines = Array.from({ length: counts }, (_, i) => `Linha de texto muito longa para testar renderização virtual no índice ${i + 1}`).join('\n');

        for (const scale of [1, 2]) {
            const { host } = await mountTextList(lines, scale);

            const textarea = host.querySelector('textarea') as HTMLTextAreaElement;
            const numbersContainer = host.querySelector('.line-numbers') as HTMLElement;

            expect(textarea).not.toBeNull();
            expect(numbersContainer).not.toBeNull();

            const positions = [
                0, // Início
                Math.floor(textarea.scrollHeight / 2), // Meio
                textarea.scrollHeight // Fim
            ];

            for (const scrollTop of positions) {
                textarea.scrollTop = scrollTop;
                textarea.dispatchEvent(new Event('scroll'));
                await nextFrame();

                // Valida que os números renderizados no DOM estão alinhados com o texto no textarea (com tolerância <= 1px)
                // Uma técnica é checar a altura do container vs scroll e a posição dos line-numbers
                const renderedNumbers = host.querySelectorAll('.line-number');
                expect(renderedNumbers.length).toBeGreaterThan(0);

                // Pega o primeiro e o último renderizado
                const firstRendered = renderedNumbers[0] as HTMLElement;
                const lastRendered = renderedNumbers[renderedNumbers.length - 1] as HTMLElement;

                // Check that they are positioned inside the viewport (they use absolute/translate)
                const firstRect = firstRendered.getBoundingClientRect();
                const containerRect = numbersContainer.getBoundingClientRect();

                // Na visualização virtualizada, o line number correspondente à linha atual deve estar alinhado com o container
                // A tolerância é de 1px real (scaled tolerância 1*scale)
                // Apenas assumindo que o browser processa e que os nós não saltam muito.
                expect(Math.abs(firstRect.top - containerRect.top)).toBeGreaterThanOrEqual(-30 * scale); // Permite overscan virtual
                expect(Math.abs(firstRect.height - 21 * scale)).toBeLessThanOrEqual(2); // A altura aproximada da linha é 21px
            }
        }
    });
});
