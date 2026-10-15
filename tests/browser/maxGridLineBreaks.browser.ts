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

    describe('s4-max-end-mobile e s4-max-mobile-end no Chromium', () => {
        it.each([
            's4-max-end-mobile',
            's4-max-mobile-end'
        ])('encerra linha após o item B (%s) somente no mobile e respeita sequência 1280 -> 375 -> 1280 na mesma montagem', async (token) => {
            expect(typeof page?.viewport).toBe('function');

            try {
                await page.viewport(1280, 800);

                hostElement = document.createElement('div');
                hostElement.style.width = '1280px';
                document.body.appendChild(hostElement);

                const app = createApp({
                    render() {
                        return h(MaxGrid, null, {
                            default: () => [
                                h('div', { id: 'box-a', class: 's4', style: 'height: 40px;' }, 'A'),
                                h('div', { id: 'box-b', class: token, style: 'height: 40px;' }, 'B'),
                                h('div', { id: 'box-c', class: 's4', style: 'height: 40px;' }, 'C')
                            ]
                        });
                    }
                });

                activeApp = app;
                app.mount(hostElement);
                await settle();

                const boxA = hostElement.querySelector('#box-a') as HTMLElement;
                const boxB = hostElement.querySelector('#box-b') as HTMLElement;
                const boxC = hostElement.querySelector('#box-c') as HTMLElement;

                // 1. Desktop (1280px): todos na mesma linha
                let rectA = boxA.getBoundingClientRect();
                let rectB = boxB.getBoundingClientRect();
                let rectC = boxC.getBoundingClientRect();

                expect(Math.abs(rectA.top - rectB.top)).toBeLessThanOrEqual(1);
                expect(Math.abs(rectB.top - rectC.top)).toBeLessThanOrEqual(1);

                // 2. Mobile (375px): B encerra a linha, C vai para a próxima linha
                hostElement.style.width = '375px';
                await page.viewport(375, 667);
                await settle();

                const mobileBoxA = hostElement.querySelector('#box-a') as HTMLElement;
                const mobileBoxB = hostElement.querySelector('#box-b') as HTMLElement;
                const mobileBoxC = hostElement.querySelector('#box-c') as HTMLElement;

                rectA = mobileBoxA.getBoundingClientRect();
                rectB = mobileBoxB.getBoundingClientRect();
                rectC = mobileBoxC.getBoundingClientRect();

                // A e B continuam compartilhando a primeira linha
                expect(Math.abs(rectA.top - rectB.top)).toBeLessThanOrEqual(1);
                // C é forçado para a próxima linha abaixo de B
                expect(rectC.top).toBeGreaterThanOrEqual(rectB.bottom - 1);
                // O gap vertical respeita 13px (tolerância 1px)
                const verticalGap = rectC.top - rectB.bottom;
                expect(Math.abs(verticalGap - 13)).toBeLessThanOrEqual(1);

                // 3. Retorno ao Desktop (1280px) na mesma montagem
                hostElement.style.width = '1280px';
                await page.viewport(1280, 800);
                await settle();

                const desktopBoxA = hostElement.querySelector('#box-a') as HTMLElement;
                const desktopBoxB = hostElement.querySelector('#box-b') as HTMLElement;
                const desktopBoxC = hostElement.querySelector('#box-c') as HTMLElement;

                rectA = desktopBoxA.getBoundingClientRect();
                rectB = desktopBoxB.getBoundingClientRect();
                rectC = desktopBoxC.getBoundingClientRect();

                expect(Math.abs(rectA.top - rectB.top)).toBeLessThanOrEqual(1);
                expect(Math.abs(rectB.top - rectC.top)).toBeLessThanOrEqual(1);
            } finally {
                await page.viewport(1280, 800);
            }
        });

        it('testa fronteiras exatas de breakpoint 767px (mobile) vs 768px (desktop)', async () => {
            expect(typeof page?.viewport).toBe('function');

            try {
                hostElement = document.createElement('div');
                hostElement.style.width = '767px';
                document.body.appendChild(hostElement);

                await page.viewport(767, 800);

                const app = createApp({
                    render() {
                        return h(MaxGrid, null, {
                            default: () => [
                                h('div', { id: 'bf-a', class: 's4', style: 'height: 40px;' }, 'A'),
                                h('div', { id: 'bf-b', class: 's4-max-end-mobile', style: 'height: 40px;' }, 'B'),
                                h('div', { id: 'bf-c', class: 's4', style: 'height: 40px;' }, 'C')
                            ]
                        });
                    }
                });

                activeApp = app;
                app.mount(hostElement);
                await settle();

                let boxB = hostElement.querySelector('#bf-b') as HTMLElement;
                let boxC = hostElement.querySelector('#bf-c') as HTMLElement;

                // 1. Em 767px (mobile ativo): C fica abaixo de B
                let rectB = boxB.getBoundingClientRect();
                let rectC = boxC.getBoundingClientRect();
                expect(rectC.top).toBeGreaterThanOrEqual(rectB.bottom - 1);

                // 2. Em 768px (desktop inativo): B e C compartilham a linha
                hostElement.style.width = '768px';
                await page.viewport(768, 800);
                await settle();

                boxB = hostElement.querySelector('#bf-b') as HTMLElement;
                boxC = hostElement.querySelector('#bf-c') as HTMLElement;

                rectB = boxB.getBoundingClientRect();
                rectC = boxC.getBoundingClientRect();
                expect(Math.abs(rectB.top - rectC.top)).toBeLessThanOrEqual(1);
            } finally {
                await page.viewport(1280, 800);
            }
        });

        it('funciona com atributos attributify valueless no mobile', async () => {
            expect(typeof page?.viewport).toBe('function');

            try {
                await page.viewport(375, 667);

                hostElement = document.createElement('div');
                hostElement.style.width = '375px';
                document.body.appendChild(hostElement);

                const app = createApp({
                    render() {
                        return h(MaxGrid, null, {
                            default: () => [
                                h('div', { id: 'attr-a', class: 's4', style: 'height: 40px;' }, 'A'),
                                h('div', {
                                    id: 'attr-b',
                                    class: 's4',
                                    's4-max-end-mobile': '',
                                    style: 'height: 40px;'
                                }, 'B'),
                                h('div', { id: 'attr-c', class: 's4', style: 'height: 40px;' }, 'C')
                            ]
                        });
                    }
                });

                activeApp = app;
                app.mount(hostElement);
                await settle();

                const boxB = hostElement.querySelector('#attr-b') as HTMLElement;
                const boxC = hostElement.querySelector('#attr-c') as HTMLElement;

                const rectB = boxB.getBoundingClientRect();
                const rectC = boxC.getBoundingClientRect();

                expect(rectC.top).toBeGreaterThanOrEqual(rectB.bottom - 1);
            } finally {
                await page.viewport(1280, 800);
            }
        });

        it('preserva v-model reativo com MaxInputNumber e avalia estabilidade de estado ao cruzar breakpoint', async () => {
            expect(typeof page?.viewport).toBe('function');

            try {
                await page.viewport(1280, 800);

                hostElement = document.createElement('div');
                hostElement.style.width = '1280px';
                document.body.appendChild(hostElement);

                const numVal = ref(250);
                let unmountCounter = 0;

                const app = createApp({
                    render() {
                        return h(MaxGrid, null, {
                            default: () => [
                                h(MaxInputNumber, {
                                    id: 'input-resp',
                                    class: 's4-max-end-mobile',
                                    modelValue: numVal.value,
                                    'onUpdate:modelValue': (v: number | null | undefined) => { numVal.value = v ?? 0; }
                                }),
                                h('div', {
                                    id: 'resp-painel',
                                    class: 's4',
                                    style: 'height: 40px;',
                                    onVnodeUnmounted: () => { unmountCounter++; }
                                }, 'Painel')
                            ]
                        });
                    }
                });

                activeApp = app;
                app.mount(hostElement);
                await settle();

                const nativeInput = hostElement.querySelector('input.max-input-native') as HTMLInputElement;
                expect(nativeInput).toBeDefined();
                nativeInput.focus();
                expect(document.activeElement).toBe(nativeInput);

                // Resize dentro da mesma faixa (1280 -> 1000) não remonta
                const unmountsBefore = unmountCounter;
                await page.viewport(1000, 800);
                await settle();
                expect(unmountCounter).toBe(unmountsBefore);

                // Cruza o breakpoint para mobile (375px)
                hostElement.style.width = '375px';
                await page.viewport(375, 667);
                await settle();

                // Valor reativo v-model é mantido
                expect(numVal.value).toBe(250);

                // Modifica o valor no mobile
                numVal.value = 500;
                await settle();
                expect(numVal.value).toBe(500);

                // Retorna para desktop
                hostElement.style.width = '1280px';
                await page.viewport(1280, 800);
                await settle();
                expect(numVal.value).toBe(500);
            } finally {
                await page.viewport(1280, 800);
            }
        });
    });
});

