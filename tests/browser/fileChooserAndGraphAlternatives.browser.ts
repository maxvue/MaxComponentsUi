import { describe, it, expect, afterEach, vi } from 'vitest';
import { createApp, h, ref, type App, defineComponent } from 'vue';
import { createPinia } from 'pinia';
import MaxInputFileUpload from '../../src/components/MaxInputFileUpload.vue';
import MaxInputFileProject from '../../src/components/MaxInputFileProject.vue';
import MaxChart from '../../src/components/MaxChart.vue';
import MaxMaps from '../../src/components/MaxMaps.vue';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

const IconStub = defineComponent({
    name: 'Icon',
    props: ['icon', 'size'],
    render() {
        return h('span', { class: 'icon-stub' });
    }
});

function configureApp(app: App) {
    app.use(createPinia());
    app.component('Icon', IconStub);
    app.directive('tooltip', () => {});
}

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle() {
    await nextFrame();
    await nextFrame();
}

function pressKey(key: string, options: { shiftKey?: boolean } = {}) {
    const target = document.activeElement || document.body;
    const event = new KeyboardEvent('keydown', {
        key,
        code: key === ' ' ? 'Space' : key,
        bubbles: true,
        cancelable: true,
        shiftKey: options.shiftKey ?? false
    });
    target.dispatchEvent(event);
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
    document.body.innerHTML = '';
});

describe('File Chooser e Alternativas Acessíveis no Chromium Real (R12 / F19)', () => {
    describe('MaxInputFileUpload e MaxInputFileProject', () => {
        it('associa label :for nativo ao input file, recebe foco visível e aciona via Enter e Espaço', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-host-upload';
            document.body.appendChild(hostElement);

            const selectEmitted = ref<any[]>([]);
            const selectedFiles = ref<any[]>([]);

            const app = createApp({
                render() {
                    return h(MaxInputFileUpload, {
                        label: 'Escolher Documentos',
                        modelValue: selectedFiles.value,
                        auto: false,
                        onSelect: (e: any) => selectEmitted.value.push(e)
                    });
                }
            });
            configureApp(app);

            activeApp = app;
            app.mount(hostElement);
            await settle();

            const nativeInput = hostElement.querySelector('input[type="file"]') as HTMLInputElement;
            expect(nativeInput).not.toBeNull();
            const inputId = nativeInput.id;
            expect(inputId).toBeTruthy();

            const chooseLabel = hostElement.querySelector('.max-fileupload-choose') as HTMLElement;
            expect(chooseLabel).not.toBeNull();
            expect(chooseLabel.getAttribute('for')).toBe(inputId);
            expect(chooseLabel.getAttribute('tabindex')).toBe('0');

            // Foco visível via teclado
            chooseLabel.focus();
            expect(document.activeElement).toBe(chooseLabel);

            // Spy de click no input nativo
            const clickSpy = vi.spyOn(nativeInput, 'click');

            // Acionamento com Enter
            pressKey('Enter');
            expect(clickSpy).toHaveBeenCalledTimes(1);

            // Acionamento com Espaço
            pressKey(' ');
            expect(clickSpy).toHaveBeenCalledTimes(2);

            // Simula seleção de múltiplos arquivos e garante emissão única
            const fileA = new File(['conteudoA'], 'relatorio.pdf', { type: 'application/pdf' });
            const fileB = new File(['conteudoB'], 'foto.png', { type: 'image/png' });

            Object.defineProperty(nativeInput, 'files', {
                value: [fileA, fileB],
                writable: true,
                configurable: true
            });

            nativeInput.dispatchEvent(new Event('change', { bubbles: true }));
            await settle();

            expect(selectEmitted.value).toHaveLength(1);
            expect(selectEmitted.value[0].files).toHaveLength(2);

            clickSpy.mockRestore();
        });

        it('impede acionamento por teclado e clique quando MaxInputFileUpload está desabilitado', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-host-disabled';
            document.body.appendChild(hostElement);

            const app = createApp({
                render() {
                    return h(MaxInputFileUpload, {
                        label: 'Upload Desabilitado',
                        disabled: true,
                        auto: false
                    });
                }
            });
            configureApp(app);

            activeApp = app;
            app.mount(hostElement);
            await settle();

            const nativeInput = hostElement.querySelector('input[type="file"]') as HTMLInputElement;
            expect(nativeInput.disabled).toBe(true);

            const chooseLabel = hostElement.querySelector('.max-fileupload-choose') as HTMLElement;
            expect(chooseLabel.getAttribute('for')).toBeNull();
            expect(chooseLabel.getAttribute('tabindex')).toBe('-1');
            expect(chooseLabel.getAttribute('aria-disabled')).toBe('true');

            const clickSpy = vi.spyOn(nativeInput, 'click');

            chooseLabel.click();
            chooseLabel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            chooseLabel.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

            expect(clickSpy).not.toHaveBeenCalled();
            clickSpy.mockRestore();
        });

        it('associa label :for nativo e suporta acionamento por teclado em MaxInputFileProject', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-host-project';
            document.body.appendChild(hostElement);

            const selectedFiles = ref<any[]>([]);

            const app = createApp({
                render() {
                    return h(MaxInputFileProject, {
                        files: [],
                        auto: false,
                        onFilesSelected: (files: File[]) => {
                            selectedFiles.value = files;
                        }
                    });
                }
            });
            configureApp(app);

            activeApp = app;
            app.mount(hostElement);
            await settle();

            const nativeInput = hostElement.querySelector('input[type="file"]') as HTMLInputElement;
            expect(nativeInput).not.toBeNull();
            const inputId = nativeInput.id;
            expect(inputId).toBeTruthy();

            const chooseLabel = hostElement.querySelector('.open-files-btn-label') as HTMLElement;
            expect(chooseLabel).not.toBeNull();
            expect(chooseLabel.getAttribute('for')).toBe(inputId);
            expect(chooseLabel.getAttribute('tabindex')).toBe('0');

            // Foco e acionamento por teclado
            chooseLabel.focus();
            expect(document.activeElement).toBe(chooseLabel);

            const clickSpy = vi.spyOn(nativeInput, 'click');
            pressKey('Enter');
            expect(clickSpy).toHaveBeenCalledTimes(1);

            pressKey(' ');
            expect(clickSpy).toHaveBeenCalledTimes(2);

            clickSpy.mockRestore();
        });
    });

    describe('MaxChart e MaxMaps - Alternativas Perceptíveis ao Foco', () => {
        it('expõe região acessível em MaxChart perceptível ao foco com navegação e seleção por teclado', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-host-chart';
            hostElement.style.width = '500px';
            hostElement.style.height = '300px';
            document.body.appendChild(hostElement);

            const selectPayload = ref<any>(null);

            const app = createApp({
                render() {
                    return h(MaxChart, {
                        ariaLabel: 'Produção Fotovoltaica Mensal',
                        data: {
                            labels: ['Jan', 'Fev'],
                            datasets: [
                                { label: 'Geração Real', data: [120, 180] }
                            ]
                        },
                        onSelect: (payload: any) => {
                            selectPayload.value = payload;
                        }
                    });
                }
            });
            configureApp(app);

            activeApp = app;
            app.mount(hostElement);
            await settle();

            const region = hostElement.querySelector('.max-chart-accessible-table') as HTMLElement;
            expect(region).not.toBeNull();
            expect(region.getAttribute('role')).toBe('region');
            expect(region.getAttribute('tabindex')).toBe('0');
            expect(region.getAttribute('aria-label')).toContain('Produção Fotovoltaica Mensal');

            // Antes do foco: clip-path aplicado / dimensionalmente recolhido
            const rectBefore = region.getBoundingClientRect();

            // Ao receber foco por teclado, expande e torna-se perceptível
            region.focus();
            await settle();

            const rectAfter = region.getBoundingClientRect();
            expect(rectAfter.width).toBeGreaterThan(rectBefore.width);
            expect(rectAfter.height).toBeGreaterThan(rectBefore.height);

            // Célula acessível e seleção via teclado
            const cellBtn = hostElement.querySelector('.max-chart-cell-btn') as HTMLButtonElement;
            expect(cellBtn).not.toBeNull();
            cellBtn.focus();
            expect(document.activeElement).toBe(cellBtn);

            cellBtn.click();
            await settle();

            expect(selectPayload.value).not.toBeNull();
            expect(selectPayload.value.index).toBe(0);
            expect(selectPayload.value.datasetIndex).toBe(0);
        });

        it('expõe controles acessíveis em MaxMaps perceptíveis ao foco com sumário semântico navegável', async () => {
            hostElement = document.createElement('div');
            hostElement.id = 'browser-test-host-maps';
            hostElement.style.width = '600px';
            hostElement.style.height = '400px';
            document.body.appendChild(hostElement);

            const coords = ref({ latitude: -15.7801, longitude: -47.9292 });

            const app = createApp({
                render() {
                    return h(MaxMaps, {
                        modelValue: coords.value,
                        'onUpdate:modelValue': (val: any) => {
                            coords.value = val;
                        }
                    });
                }
            });
            configureApp(app);

            activeApp = app;
            app.mount(hostElement);
            await settle();

            const controlsRegion = hostElement.querySelector('.map-accessible-controls') as HTMLElement;
            expect(controlsRegion).not.toBeNull();
            expect(controlsRegion.getAttribute('role')).toBe('region');
            expect(controlsRegion.getAttribute('tabindex')).toBe('0');

            const summary = hostElement.querySelector('.map-accessible-summary') as HTMLElement;
            expect(summary).not.toBeNull();
            expect(summary.textContent).toContain('-15.78010');

            // Foco na região expande controles no Chromium real
            controlsRegion.focus();
            await settle();

            const rect = controlsRegion.getBoundingClientRect();
            expect(rect.width).toBeGreaterThan(100);
            expect(rect.height).toBeGreaterThan(30);

            // Altera latitude por input acessível
            const latInput = hostElement.querySelector('input[aria-label="Latitude do marcador"]') as HTMLInputElement;
            expect(latInput).not.toBeNull();
            latInput.value = '-16.5000';
            latInput.dispatchEvent(new Event('change', { bubbles: true }));
            await settle();

            expect(coords.value.latitude).toBe(-16.5);

            // Botão direcional de passo por teclado
            const northBtn = hostElement.querySelector('button[aria-label="Mover marcador para o Norte"]') as HTMLButtonElement;
            northBtn.click();
            await settle();

            expect(coords.value.latitude).toBeCloseTo(-16.4995, 4);
        });
    });
});
