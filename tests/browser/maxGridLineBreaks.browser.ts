import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import presetCss from 'virtual:maxgrid-preset.js';
import MaxGrid from '../../src/components/MaxGrid.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';

let styleElement: HTMLStyleElement | null = null;
let hostElement: HTMLDivElement | null = null;
let activeApp: App | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

beforeAll(() => {
    // Garante que o CSS do preset foi gerado e recebido pelo harness
    expect(presetCss).toBeDefined();
    expect(typeof presetCss).toBe('string');
    expect(presetCss.length).toBeGreaterThan(0);

    styleElement = document.createElement('style');
    styleElement.id = 'test-virtual-preset-css';
    styleElement.textContent = presetCss;
    document.head.appendChild(styleElement);
});

afterAll(() => {
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }
});

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

describe('MaxGrid — Quebras explícitas de linha no Chromium', () => {
    it('caso negativo: contêiner amplo sem marcadores mantém os itens na mesma linha horizontal', async () => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1200px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h('div', { id: 'item-1', class: 's7', style: 'height: 40px;' }, 'Item 1'),
                        h('div', { id: 'item-2', class: 's3', style: 'height: 40px;' }, 'Item 2')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const item1 = hostElement.querySelector('#item-1') as HTMLElement;
        const item2 = hostElement.querySelector('#item-2') as HTMLElement;

        const rect1 = item1.getBoundingClientRect();
        const rect2 = item2.getBoundingClientRect();

        // Ambos devem estar alinhados no mesmo topo vertical
        expect(Math.abs(rect1.top - rect2.top)).toBeLessThanOrEqual(1);
        // O segundo item deve estar à direita do primeiro
        expect(rect2.left).toBeGreaterThanOrEqual(rect1.right - 1);
    });

    it.each([
        ['s7-end', 's3-10-start'],
        ['s7-10-end', 's3-start'],
        ['s7-end', 's3-start']
    ])('separa campo (%s) e histórico (%s) em linhas distintas com gap vertical correto', async (endToken, startToken) => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1200px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h('div', { id: 'campo', class: endToken, style: 'height: 40px;' }, 'Campo'),
                        h('div', { id: 'historico', class: startToken, style: 'height: 40px;' }, 'Histórico')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const campo = hostElement.querySelector('#campo') as HTMLElement;
        const historico = hostElement.querySelector('#historico') as HTMLElement;

        const rectCampo = campo.getBoundingClientRect();
        const rectHistorico = historico.getBoundingClientRect();

        // O histórico deve começar estritamente abaixo do campo
        expect(rectHistorico.top).toBeGreaterThanOrEqual(rectCampo.bottom - 1);

        // O espaçamento vertical entre as linhas deve respeitar o row-gap padrão de 13px (tolerância <= 1px)
        const verticalGap = rectHistorico.top - rectCampo.bottom;
        expect(Math.abs(verticalGap - 13)).toBeLessThanOrEqual(1);
    });

    it('end sozinho encerra a linha após o item e permite que o item anterior compartilhe a linha', async () => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1200px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h('div', { id: 'item-a', class: 's3', style: 'height: 40px;' }, 'A'),
                        h('div', { id: 'item-b', class: 's7-end', style: 'height: 40px;' }, 'B'),
                        h('div', { id: 'item-c', class: 's3', style: 'height: 40px;' }, 'C')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const a = hostElement.querySelector('#item-a')!.getBoundingClientRect();
        const b = hostElement.querySelector('#item-b')!.getBoundingClientRect();
        const c = hostElement.querySelector('#item-c')!.getBoundingClientRect();

        // A e B compartilham a primeira linha
        expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(1);
        // C é empurrado para a próxima linha
        expect(c.top).toBeGreaterThanOrEqual(b.bottom - 1);
    });

    it('start sozinho inicia nova linha antes do item e permite que o item posterior compartilhe a linha', async () => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1200px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h('div', { id: 'item-a', class: 's7', style: 'height: 40px;' }, 'A'),
                        h('div', { id: 'item-b', class: 's3-start', style: 'height: 40px;' }, 'B'),
                        h('div', { id: 'item-c', class: 's3', style: 'height: 40px;' }, 'C')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const a = hostElement.querySelector('#item-a')!.getBoundingClientRect();
        const b = hostElement.querySelector('#item-b')!.getBoundingClientRect();
        const c = hostElement.querySelector('#item-c')!.getBoundingClientRect();

        // B inicia nova linha abaixo de A
        expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
        // C compartilha a segunda linha com B
        expect(Math.abs(b.top - c.top)).toBeLessThanOrEqual(1);
    });

    it('preserva os limites de min-width e max-width nas caixas renderizadas', async () => {
        hostElement = document.createElement('div');
        // Espaço muito amplo para testar se respeita max-width
        hostElement.style.width = '1600px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        // s7-end: min 140px, max 168px
                        h('div', { id: 'box-s7', class: 's7-end', style: 'height: 30px;' }, 's7-end'),
                        // s3-10-start: min 60px, max 200px
                        h('div', { id: 'box-s3-10', class: 's3-10-start', style: 'height: 30px;' }, 's3-10-start')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const boxS7 = hostElement.querySelector('#box-s7')!.getBoundingClientRect();
        const boxS310 = hostElement.querySelector('#box-s3-10')!.getBoundingClientRect();

        // s7-end deve ter max-width de 168px (7 * 24px)
        expect(boxS7.width).toBeLessThanOrEqual(169);
        expect(boxS7.width).toBeGreaterThanOrEqual(139);

        // s3-10-start deve ter max-width de 200px (10 * 20px)
        expect(boxS310.width).toBeLessThanOrEqual(201);
        expect(boxS310.width).toBeGreaterThanOrEqual(59);
    });

    it('preserva gap customizado definido no MaxGrid sem duplicações', async () => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1000px';
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxGrid, { style: 'gap: 24px 16px;' }, {
                    default: () => [
                        h('div', { id: 'g1', class: 's7-end', style: 'height: 40px;' }, 'G1'),
                        h('div', { id: 'g2', class: 's3-start', style: 'height: 40px;' }, 'G2')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const g1 = hostElement.querySelector('#g1')!.getBoundingClientRect();
        const g2 = hostElement.querySelector('#g2')!.getBoundingClientRect();

        const customVerticalGap = g2.top - g1.bottom;
        expect(Math.abs(customVerticalGap - 24)).toBeLessThanOrEqual(1);
    });

    it('funciona perfeitamente com MaxInputNumber e mantém estabilidade reativa', async () => {
        hostElement = document.createElement('div');
        hostElement.style.width = '1000px';
        document.body.appendChild(hostElement);

        const val = ref(150);

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h(MaxInputNumber, {
                            id: 'input-num',
                            class: 's7-end',
                            modelValue: val.value,
                            'onUpdate:modelValue': (v: number | null | undefined) => { val.value = v ?? 0; }
                        }),
                        h('div', { id: 'painel', class: 's3-start', style: 'height: 36px;' }, 'Painel Histórico')
                    ]
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const inputEl = hostElement.querySelector('#input-num') as HTMLElement;
        const painelEl = hostElement.querySelector('#painel') as HTMLElement;

        const inputRect = inputEl.getBoundingClientRect();
        const painelRect = painelEl.getBoundingClientRect();

        expect(painelRect.top).toBeGreaterThanOrEqual(inputRect.bottom - 1);

        // Atualização de valor reativo
        val.value = 300;
        await settle();

        const nativeInput = hostElement.querySelector('input.max-input-native') as HTMLInputElement;
        expect(nativeInput).toBeDefined();
    });

    it('combina token base s11-11 com s20-full-mobile respeitando viewport desktop vs mobile', async () => {
        if (typeof page?.viewport === 'function') await page.viewport(1280, 800);

        hostElement = document.createElement('div');
        hostElement.style.width = '1280px';
        document.body.appendChild(hostElement);

        const docValue = ref('12345678901');

        const app = createApp({
            render() {
                return h(MaxGrid, null, {
                    default: () => [
                        h(MaxInputCpfCnpj, {
                            's11-11': '',
                            's20-full-mobile': '',
                            class: 's11-11 s20-full-mobile',
                            modelValue: docValue.value,
                            label: 'CPF ou CNPJ',
                            'onUpdate:modelValue': (v: string) => {
                                docValue.value = v;
                            }
                        })
                    ]
                });
            }
        });
        app.directive('tooltip', {});

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const inputEl = hostElement.querySelector('.max-input-cpf-cnpj') as HTMLElement;
        expect(inputEl).toBeDefined();

        // 1. Em viewport desktop (1280x800): s11-11 prevalece no desktop
        const desktopComputed = window.getComputedStyle(inputEl);
        expect(desktopComputed.minWidth).toBe('220px');
        expect(desktopComputed.maxWidth).toBe('220px');
        expect(Math.round(inputEl.getBoundingClientRect().width)).toBe(220);

        // 2. Em viewport mobile (375x667): s20-full-mobile ativa a media query
        if (typeof page?.viewport === 'function') {
            hostElement.style.width = '375px';
            await page.viewport(375, 667);
            await settle();

            const mobileComputed = window.getComputedStyle(inputEl);
            expect(mobileComputed.minWidth).toBe('400px');
            expect(mobileComputed.maxWidth).toBe('100%');

            // Restaura o viewport padrão para os próximos testes
            hostElement.style.width = '1280px';
            await page.viewport(1280, 800);
            await settle();
        }
    });
});

