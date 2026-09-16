import { describe, it, expect, afterEach } from 'vitest';
import { cdp } from 'vitest/browser';
import { createApp, h, ref, nextTick, type App } from 'vue';
import { createPinia } from 'pinia';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';
import MaxTransitionFadeLight from '../../src/components/MaxTransitionFadeLight.vue';
import MaxAiIcon from '../../src/components/MaxAiIcon.vue';
import MaxLoaderIcon from '../../src/components/MaxLoaderIcon.vue';
import MaxCreditCard from '../../src/components/MaxCreditCard.vue';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';
import MaxTabItem from '../../src/components/MaxTabItem.vue';
import '../../src/themes/all.scss';

let activeApp: App | null = null;
let hostElement: HTMLElement | null = null;

function nextFrame(): Promise<void> {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(ticks = 3): Promise<void> {
    for (let i = 0; i < ticks; i++) {
        await nextTick();
        await nextFrame();
    }
}

async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function setReducedMotion(mode: 'reduce' | 'no-preference'): Promise<void> {
    const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: mode }]
    });
}

function parseDurationMs(durationStr: string): number {
    if (!durationStr || durationStr === 'none' || durationStr === 'auto') return 0;
    const firstVal = durationStr.split(',')[0].trim();
    if (firstVal.endsWith('ms')) return parseFloat(firstVal);
    if (firstVal.endsWith('s')) return parseFloat(firstVal) * 1000;
    return parseFloat(firstVal) || 0;
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
    try {
        const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
        await session.send('Emulation.setEmulatedMedia', { features: [] });
    } catch {
        // ignora se sessão cdp não estiver disponível
    }
    document.body.innerHTML = '';
});

describe('R18 / E10-09 — Emulação Real Chromium (Blink): prefers-reduced-motion (reduce vs no-preference)', () => {
    it('Tokens CSS de movimento resolvem para durações normais em no-preference e 0.01ms em reduce', async () => {
        await setReducedMotion('no-preference');
        expect(matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(true);

        const probe = document.createElement('div');
        probe.id = 'motion-token-probe';
        document.body.appendChild(probe);

        const normalFast = getComputedStyle(probe).getPropertyValue('--max-motion-duration-fast').trim();
        const normalSlow = getComputedStyle(probe).getPropertyValue('--max-motion-duration-slow').trim();

        expect(normalFast).toBe('0.15s');
        expect(normalSlow).toBe('0.35s');

        // Alterna para reduce via CDP
        await setReducedMotion('reduce');
        expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
        await settle();

        const reducedFast = getComputedStyle(probe).getPropertyValue('--max-motion-duration-fast').trim();
        const reducedSlow = getComputedStyle(probe).getPropertyValue('--max-motion-duration-slow').trim();

        expect(reducedFast).toBe('0.01ms');
        expect(reducedSlow).toBe('0.01ms');

        probe.remove();
    });

    it('Regra universal (*, ::before, ::after): impõe duração 0.01ms e iteração unitária sob reduce', async () => {
        await setReducedMotion('reduce');

        const testEl = document.createElement('div');
        testEl.className = 'sample-animated-node';
        testEl.style.animation = 'sample-anim 2s infinite ease';
        testEl.style.transition = 'all 0.5s ease';
        document.body.appendChild(testEl);
        await settle();

        const style = getComputedStyle(testEl);
        const animDuration = parseDurationMs(style.animationDuration);
        const transDuration = parseDurationMs(style.transitionDuration);

        expect(animDuration).toBeLessThanOrEqual(0.02); // 0.01ms computado
        expect(transDuration).toBeLessThanOrEqual(0.02);
        expect(style.animationIterationCount).toBe('1');
        expect(style.scrollBehavior).toBe('auto');

        testEl.remove();
    });

    it('Classes agressivas inventariadas (.slide-up-enter-active, .is-shaking, etc.): suprimem transform sob reduce', async () => {
        await setReducedMotion('reduce');

        const classesToTest = [
            'slide-up-enter-active',
            'slide-enter-active',
            'scale-enter-active',
            'flip-enter-active',
            'is-shaking',
            'is-pulsing',
            'motion-aggressive',
            'max-motion-aggressive'
        ];

        for (const cls of classesToTest) {
            const el = document.createElement('div');
            el.className = cls;
            el.style.transform = 'translateY(100px) scale(1.5)';
            document.body.appendChild(el);
            await settle();

            const computed = getComputedStyle(el);
            expect(computed.transform, `Classe .${cls} deve ter transform: none sob reduce`).toBe('none');
            el.remove();
        }
    });

    it('MaxTransitionFadeLight: preserva ciclo de vida completo sem travamento sob no-preference e reduce', async () => {
        for (const mode of ['no-preference', 'reduce'] as const) {
            await setReducedMotion(mode);

            hostElement = document.createElement('div');
            document.body.appendChild(hostElement);

            const isVisible = ref(false);
            const app = createApp({
                render() {
                    return h(MaxTransitionFadeLight, null, {
                        default: () => isVisible.value ? h('div', { id: 'fade-target' }, 'Conteúdo Fade') : null
                    });
                }
            });

            activeApp = app;
            app.mount(hostElement);
            await settle();

            // Montagem inicial: oculto
            expect(hostElement.querySelector('#fade-target')).toBeNull();

            // Transição de Entrada
            isVisible.value = true;
            if (mode === 'no-preference') await delay(600);
            else await settle(5);

            const targetAfterEnter = hostElement.querySelector('#fade-target') as HTMLElement;
            expect(targetAfterEnter).not.toBeNull();
            expect(targetAfterEnter.textContent).toBe('Conteúdo Fade');

            if (mode === 'reduce') {
                const style = getComputedStyle(targetAfterEnter);
                expect(parseDurationMs(style.transitionDuration)).toBeLessThanOrEqual(0.02);
            }

            // Transição de Saída
            isVisible.value = false;
            if (mode === 'no-preference') await delay(600);
            else await settle(5);

            expect(hostElement.querySelector('#fade-target')).toBeNull();

            app.unmount();
            activeApp = null;
            hostElement.remove();
            hostElement = null;
        }
    });

    it('MaxTransitionUp: elimina transform vertical (translateY) sob reduce no Chromium real', async () => {
        await setReducedMotion('reduce');

        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const isVisible = ref(false);
        const app = createApp({
            render() {
                return h(MaxTransitionUp, null, {
                    default: () => isVisible.value ? h('div', { id: 'up-target' }, 'Conteúdo Vertical') : null
                });
            }
        });

        activeApp = app;
        app.mount(hostElement);
        await settle();

        isVisible.value = true;
        await settle(5);

        const target = hostElement.querySelector('#up-target') as HTMLElement;
        expect(target).not.toBeNull();

        const style = getComputedStyle(target);
        expect(style.transform).toBe('none');

        // Saída
        isVisible.value = false;
        await settle(5);
        expect(hostElement.querySelector('#up-target')).toBeNull();

        app.unmount();
        activeApp = null;
        hostElement.remove();
        hostElement = null;
    });

    it('Componentes contínuos e de alto risco: MaxAiIcon e MaxCreditCard desativam rotação 3D e pulso', async () => {
        await setReducedMotion('reduce');

        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxAiIcon, { animate: true }),
                    h(MaxCreditCard, { number: '4111 2222 3333 4444', side: 'front' })
                ]);
            }
        });
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle(6);

        // MaxAiIcon: sem animação contínua
        const aiSvg = hostElement.querySelector('.max-ai-icon .img-p-top svg') as HTMLElement;
        if (aiSvg) {
            const aiStyle = getComputedStyle(aiSvg);
            expect(aiStyle.animationName === 'none' || parseDurationMs(aiStyle.animationDuration) <= 0.02).toBe(true);
        }

        // MaxCreditCard: perspective e transition desativadas
        const cardRoot = hostElement.querySelector('.credit-card-perspective') as HTMLElement;
        if (cardRoot) {
            const cardStyle = getComputedStyle(cardRoot);
            expect(cardStyle.perspective).toBe('none');
        }
        const flipCard = hostElement.querySelector('.flip-card') as HTMLElement;
        if (flipCard) {
            const flipStyle = getComputedStyle(flipCard);
            expect(flipStyle.transitionProperty === 'none' || parseDurationMs(flipStyle.transitionDuration) <= 0.02).toBe(true);
        }

        app.unmount();
        activeApp = null;
        hostElement.remove();
        hostElement = null;
    });

    it('MaxLoaderIcon: desacelera rotação de 1s para 4s em reduce para evitar vertigem', async () => {
        await setReducedMotion('no-preference');

        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h(MaxLoaderIcon);
            }
        });
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const loaderDiv = hostElement.querySelector('.max-loader-icon-div') as HTMLElement;
        expect(loaderDiv).not.toBeNull();
        const normalDuration = parseDurationMs(getComputedStyle(loaderDiv).animationDuration);
        expect(normalDuration).toBe(1000); // 1s

        await setReducedMotion('reduce');
        await settle();

        const reducedDuration = parseDurationMs(getComputedStyle(loaderDiv).animationDuration);
        expect(reducedDuration).toBe(4000); // 4s

        app.unmount();
        activeApp = null;
        hostElement.remove();
        hostElement = null;
    });

    it('Controles e formulários (MaxInputOTP, MaxTabItem): removem transição de layout sob reduce', async () => {
        await setReducedMotion('reduce');

        hostElement = document.createElement('div');
        document.body.appendChild(hostElement);

        const app = createApp({
            render() {
                return h('div', [
                    h(MaxInputOTP, { length: 4 }),
                    h(MaxTabItem, { title: 'Aba Teste' })
                ]);
            }
        });
        app.provide('tabs_info', {
            register_tab: () => {},
            unregister_tab: () => {},
            active_tab: ref(0)
        });
        app.use(createPinia());
        activeApp = app;
        app.mount(hostElement);
        await settle();

        const otpCell = hostElement.querySelector('.max-input-otp-cell') as HTMLElement;
        if (otpCell) {
            const otpStyle = getComputedStyle(otpCell);
            expect(otpStyle.transitionProperty === 'none' || parseDurationMs(otpStyle.transitionDuration) <= 0.02).toBe(true);
        }

        const tabTitle = hostElement.querySelector('.max-tab-item-title') as HTMLElement;
        if (tabTitle) {
            const tabStyle = getComputedStyle(tabTitle);
            expect(tabStyle.transitionProperty === 'none' || parseDurationMs(tabStyle.transitionDuration) <= 0.02).toBe(true);
        }

        app.unmount();
        activeApp = null;
        hostElement.remove();
        hostElement = null;
    });
});
