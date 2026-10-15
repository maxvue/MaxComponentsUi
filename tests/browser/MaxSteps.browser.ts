import { describe, it, expect, afterEach } from 'vitest';
import { page } from 'vitest/browser';
import { createApp, h, ref, type App } from 'vue';
import MaxSteps from '../../src/components/MaxSteps.vue';
import MaxStepItem from '../../src/components/MaxStepItem.vue';

let activeApp: App | null = null;
let hostElement: HTMLDivElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(): Promise<void> {
    await nextFrame();
    await nextFrame();
}

function createStepsApp(renderFn: () => any): App {
    const app = createApp({ render: renderFn });
    app.directive('tooltip', {});
    return app;
}

async function waitForCondition(predicate: () => boolean, timeoutMs = 2000, intervalMs = 30): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        if (predicate()) return true;
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return predicate();
}

afterEach(async () => {
    if (activeApp) {
        activeApp.unmount();
        activeApp = null;
    }
    if (hostElement) {
        hostElement.remove();
        hostElement = null;
    }
    await page.viewport(1280, 800);
});

describe('MaxSteps — Browser Layout e Geometria Mobile', () => {
    it('R1: raiz, wrapper e header respeitam pai e viewport de 320px com host de 288px úteis sem overflow horizontal na página', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.id = 'test-host-288';
        hostElement.style.width = '320px';
        hostElement.style.padding = '0 16px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r1-containment',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            mobileShowLabel: false
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Passo 1' }, () => h('div', 'Conteúdo 1')),
                h(MaxStepItem, { value: '2', title: 'Passo 2' }, () => h('div', 'Conteúdo 2')),
                h(MaxStepItem, { value: '3', title: 'Passo 3' }, () => h('div', 'Conteúdo 3')),
                h(MaxStepItem, { value: '4', title: 'Passo 4' }, () => h('div', 'Conteúdo 4'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const docWidth = document.documentElement.clientWidth;
        const docScrollWidth = document.documentElement.scrollWidth;
        expect(docScrollWidth).toBeLessThanOrEqual(docWidth + 1);

        const hostRect = hostElement.getBoundingClientRect();
        expect(hostRect.width).toBeLessThanOrEqual(320 + 1);

        const rootEl = hostElement.querySelector('.max-steps') as HTMLElement;
        expect(rootEl).toBeTruthy();
        const rootRect = rootEl.getBoundingClientRect();
        expect(rootRect.width).toBeLessThanOrEqual(288 + 1);
        expect(rootRect.right).toBeLessThanOrEqual(hostRect.right - 16 + 1);

        const wrapperEl = hostElement.querySelector('.max-steps-header-wrapper') as HTMLElement;
        expect(wrapperEl).toBeTruthy();
        const wrapperRect = wrapperEl.getBoundingClientRect();
        expect(wrapperRect.width).toBeLessThanOrEqual(288 + 1);

        const headerEl = hostElement.querySelector('.max-steps-header') as HTMLElement;
        expect(headerEl).toBeTruthy();
        expect(headerEl.scrollWidth).toBeLessThanOrEqual(headerEl.clientWidth + 1);
    });

    it('R1: permanece contido em contêiner flex e contêiner grid sem expandir o pai', async () => {
        await page.viewport(320, 600);

        // Host Flex
        hostElement = document.createElement('div');
        hostElement.id = 'test-host-flex';
        hostElement.style.display = 'flex';
        hostElement.style.flexDirection = 'column';
        hostElement.style.width = '320px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r1-flex',
            cached: false,
            isMobile: true
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Passo 1' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Passo 2' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Passo 3' }, () => h('div', 'C3')),
                h(MaxStepItem, { value: '4', title: 'Passo 4' }, () => h('div', 'C4'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
        expect(hostElement.scrollWidth).toBeLessThanOrEqual(hostElement.clientWidth + 1);

        app.unmount();
        activeApp = null;
        hostElement.remove();

        // Host Grid
        hostElement = document.createElement('div');
        hostElement.id = 'test-host-grid';
        hostElement.style.display = 'grid';
        hostElement.style.gridTemplateColumns = '1fr';
        hostElement.style.width = '320px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const appGrid = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r1-grid',
            cached: false,
            isMobile: true
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Passo 1' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Passo 2' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Passo 3' }, () => h('div', 'C3')),
                h(MaxStepItem, { value: '4', title: 'Passo 4' }, () => h('div', 'C4'))
            ]
        }));

        activeApp = appGrid;
        appGrid.mount(hostElement);
        await settle();

        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
        expect(hostElement.scrollWidth).toBeLessThanOrEqual(hostElement.clientWidth + 1);
    });

    it('R2: 4 etapas ficam visíveis simultaneamente sem rolagem interna e sem sobreposição em 320px com host de 288px úteis', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        hostElement.style.padding = '0 16px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r2-4',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            mobileShowLabel: false
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Primeiro Passo' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Segundo Passo' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Terceiro Passo' }, () => h('div', 'C3')),
                h(MaxStepItem, { value: '4', title: 'Quarto Passo' }, () => h('div', 'C4'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const headerEl = hostElement.querySelector('.max-steps-header') as HTMLElement;
        expect(headerEl).toBeTruthy();
        expect(headerEl.scrollWidth).toBeLessThanOrEqual(headerEl.clientWidth + 1);

        const circles = Array.from(hostElement.querySelectorAll('.step-circle')) as HTMLElement[];
        expect(circles.length).toBe(4);

        const prevBtn = hostElement.querySelector('.prev-btn') as HTMLElement;
        const nextBtn = hostElement.querySelector('.next-btn') as HTMLElement;
        expect(prevBtn).toBeTruthy();
        expect(nextBtn).toBeTruthy();

        const prevRect = prevBtn.getBoundingClientRect();
        const nextRect = nextBtn.getBoundingClientRect();
        const firstCircleRect = circles[0].getBoundingClientRect();
        const lastCircleRect = circles[3].getBoundingClientRect();

        expect(prevRect.right).toBeLessThanOrEqual(firstCircleRect.left + 1);
        expect(lastCircleRect.right).toBeLessThanOrEqual(nextRect.left + 1);

        for (let i = 0; i < circles.length - 1; i++) {
            const current = circles[i].getBoundingClientRect();
            const next = circles[i + 1].getBoundingClientRect();
            expect(current.right).toBeLessThanOrEqual(next.left + 1);
        }
    });

    it('R2: 6 etapas ficam visíveis simultaneamente sem rolagem interna e sem sobreposição em 320px com host de 288px úteis', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        hostElement.style.padding = '0 16px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r2-6',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            mobileShowLabel: false
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'P1' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'P2' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'P3' }, () => h('div', 'C3')),
                h(MaxStepItem, { value: '4', title: 'P4' }, () => h('div', 'C4')),
                h(MaxStepItem, { value: '5', title: 'P5' }, () => h('div', 'C5')),
                h(MaxStepItem, { value: '6', title: 'P6' }, () => h('div', 'C6'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const headerEl = hostElement.querySelector('.max-steps-header') as HTMLElement;
        expect(headerEl).toBeTruthy();
        expect(headerEl.scrollWidth).toBeLessThanOrEqual(headerEl.clientWidth + 1);

        const circles = Array.from(hostElement.querySelectorAll('.step-circle')) as HTMLElement[];
        expect(circles.length).toBe(6);

        const prevBtn = hostElement.querySelector('.prev-btn') as HTMLElement;
        const nextBtn = hostElement.querySelector('.next-btn') as HTMLElement;
        const prevRect = prevBtn.getBoundingClientRect();
        const nextRect = nextBtn.getBoundingClientRect();
        const firstCircleRect = circles[0].getBoundingClientRect();
        const lastCircleRect = circles[5].getBoundingClientRect();

        expect(prevRect.right).toBeLessThanOrEqual(firstCircleRect.left + 1);
        expect(lastCircleRect.right).toBeLessThanOrEqual(nextRect.left + 1);

        for (let i = 0; i < circles.length - 1; i++) {
            const current = circles[i].getBoundingClientRect();
            const next = circles[i + 1].getBoundingClientRect();
            expect(current.right).toBeLessThanOrEqual(next.left + 1);
        }
    });

    it('R2: 6 etapas com mobileShowLabel true e labels longos mantêm cabeçalho compacto sem sobreposição', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        hostElement.style.padding = '0 16px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r2-labels',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            mobileShowLabel: true
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Dados Pessoais Longos' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Endereço Residencial Completo' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Documentos e Anexos' }, () => h('div', 'C3')),
                h(MaxStepItem, { value: '4', title: 'Revisão Cadastral Geral' }, () => h('div', 'C4')),
                h(MaxStepItem, { value: '5', title: 'Termos e Condições' }, () => h('div', 'C5')),
                h(MaxStepItem, { value: '6', title: 'Confirmação Final' }, () => h('div', 'C6'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const headerEl = hostElement.querySelector('.max-steps-header') as HTMLElement;
        expect(headerEl).toBeTruthy();
        expect(headerEl.scrollWidth).toBeLessThanOrEqual(headerEl.clientWidth + 1);

        const labelWrappers = Array.from(hostElement.querySelectorAll('.step-label-wrapper')) as HTMLElement[];
        expect(labelWrappers.length).toBe(6);

        const items = Array.from(hostElement.querySelectorAll('.max-step-header-item')) as HTMLElement[];
        for (let i = 0; i < items.length; i++) {
            const itemRect = items[i].getBoundingClientRect();
            const labelRect = labelWrappers[i].getBoundingClientRect();
            expect(labelRect.width).toBeLessThanOrEqual(itemRect.width + 1);
        }
    });

    it('R3: excesso com 12 etapas ativa rolagem interna controlada no cabeçalho sem vazar a página', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        hostElement.style.padding = '0 16px';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const activeStep = ref('1');

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r3-overflow',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            modelValue: activeStep.value,
            'onUpdate:modelValue': (v: any) => {
                activeStep.value = String(v);
            }
        }, {
            default: () => Array.from({ length: 12 }, (_, i) => {
                const val = String(i + 1);
                return h(MaxStepItem, { value: val, title: `Passo ${val}` }, () => h('div', `Conteúdo ${val}`));
            })
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const headerEl = hostElement.querySelector('.max-steps-header') as HTMLElement;
        expect(headerEl).toBeTruthy();

        // O cabeçalho possui rolagem interna para acomodar 12 etapas
        expect(headerEl.scrollWidth).toBeGreaterThan(headerEl.clientWidth);

        // A página inteira NÃO tem rolagem horizontal
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
        expect(window.scrollX).toBeLessThanOrEqual(1);

        // Navega até a última etapa clicando diretamente no item
        const item12 = hostElement.querySelector('#max-step-header-12') as HTMLElement;
        expect(item12).toBeTruthy();
        item12.click();
        await settle();

        const scrollSettled = await waitForCondition(() => {
            const headerRect = headerEl.getBoundingClientRect();
            const itemRect = item12.getBoundingClientRect();
            return itemRect.left >= headerRect.left - 5 && itemRect.right <= headerRect.right + 5;
        }, 3000);

        expect(scrollSettled).toBe(true);
        expect(headerEl.scrollLeft).toBeGreaterThan(0);
        expect(window.scrollX).toBeLessThanOrEqual(1);
        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);
    });

    it('R4: layout desktop em 1280px é amplo e se recupera após resize dinâmico', async () => {
        await page.viewport(1280, 800);

        hostElement = document.createElement('div');
        hostElement.style.maxWidth = '1200px';
        hostElement.style.width = '100%';
        hostElement.style.boxSizing = 'border-box';
        document.body.appendChild(hostElement);

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-r4-desktop',
            cached: false,
            isMobile: false,
            showTopButtons: true
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Passo Inicial' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Passo Intermediário' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Passo Final' }, () => h('div', 'C3'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const headerItems = Array.from(hostElement.querySelectorAll('.max-step-header-item')) as HTMLElement[];
        expect(headerItems.length).toBe(3);
        for (const item of headerItems) expect(item.getBoundingClientRect().width).toBeGreaterThanOrEqual(120 - 1);

        // Resize para mobile 375px
        await page.viewport(375, 667);
        await settle();

        expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth + 1);

        // Retorna para desktop 1280px
        await page.viewport(1280, 800);
        await settle();

        for (const item of headerItems) expect(item.getBoundingClientRect().width).toBeGreaterThanOrEqual(120 - 1);
    });

    it('R4: suporta 0 e 1 etapa sem erros ou divisão por zero', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        document.body.appendChild(hostElement);

        // 0 etapas
        const appZero = createStepsApp(() => h(MaxSteps, { id: 'steps-zero', cached: false, isMobile: true }));
        activeApp = appZero;
        expect(() => appZero.mount(hostElement!)).not.toThrow();
        await settle();

        appZero.unmount();
        activeApp = null;

        // 1 etapa
        const appOne = createStepsApp(() => h(MaxSteps, { id: 'steps-one', cached: false, isMobile: true }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Etapa Única' }, () => h('div', 'Único'))
            ]
        }));
        activeApp = appOne;
        expect(() => appOne.mount(hostElement!)).not.toThrow();
        await settle();

        const circles = hostElement.querySelectorAll('.step-circle');
        expect(circles.length).toBe(1);

        const connectors = hostElement.querySelectorAll('.step-connector');
        expect(connectors.length).toBe(0);
    });

    it('R4: botões de navegação avançam e voltam os passos', async () => {
        await page.viewport(320, 600);

        hostElement = document.createElement('div');
        hostElement.style.width = '320px';
        document.body.appendChild(hostElement);

        const activeStep = ref('1');

        const app = createStepsApp(() => h(MaxSteps, {
            id: 'steps-nav-test',
            cached: false,
            isMobile: true,
            showTopButtons: true,
            modelValue: activeStep.value,
            'onUpdate:modelValue': (v: any) => {
                activeStep.value = String(v);
            }
        }, {
            default: () => [
                h(MaxStepItem, { value: '1', title: 'Passo 1' }, () => h('div', 'C1')),
                h(MaxStepItem, { value: '2', title: 'Passo 2' }, () => h('div', 'C2')),
                h(MaxStepItem, { value: '3', title: 'Passo 3' }, () => h('div', 'C3'))
            ]
        }));

        activeApp = app;
        app.mount(hostElement);
        await settle();

        const nextBtn = hostElement.querySelector('.next-btn') as HTMLButtonElement;
        const prevBtn = hostElement.querySelector('.prev-btn') as HTMLButtonElement;

        expect(nextBtn).toBeTruthy();
        expect(prevBtn).toBeTruthy();
        expect(activeStep.value).toBe('1');

        nextBtn.click();
        await settle();
        expect(activeStep.value).toBe('2');

        prevBtn.click();
        await settle();
        expect(activeStep.value).toBe('1');
    });
});
