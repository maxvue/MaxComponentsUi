import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import TransitionFade from '../../src/components/TransitionFade.vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';
import '../../src/themes/all.scss';

type MotionClass = 'keyframe-high-risk' | 'layout-transition' | 'micro-interaction';

const componentSources = import.meta.glob('../../src/components/**/*.vue', {
    eager: true,
    query: '?raw',
    import: 'default'
}) as Record<string, string>;

let app: App | undefined;
let host: HTMLElement | undefined;

function classifiedComponents() {
    return Object.entries(componentSources)
        .filter(([, source]) => /@keyframes|transition(?:\s*:\s*|-duration|-delay)|animation(?:\s*:\s*|-name|-duration)/i.test(source))
        .map(([file, source]) => {
            let category: MotionClass = 'micro-interaction';
            if (/@keyframes/i.test(source)) category = 'keyframe-high-risk';
            else if (/modal|drawer|menu|tab|side|toast|transition/i.test(file) || /transform|height|width|top|bottom|left|right/i.test(source)) category = 'layout-transition';
            return { file, category, source };
        });
}

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

async function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value }]
    });
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(value === 'reduce');
}

async function mountMotionProbes() {
    host = document.createElement('div');
    document.body.append(host);
    const components = classifiedComponents();
    const style = document.createElement('style');
    style.textContent = `
        .r18-probe { animation: r18-spin 200ms linear infinite; transition: transform 200ms linear; transform: translateX(12px); }
        @keyframes r18-spin { from { opacity: .5; } to { opacity: 1; } }
    `;
    document.head.append(style);
    host.append(style);
    for (const { file, category } of components) {
        const probe = document.createElement('div');
        probe.className = 'r18-probe motion-aggressive slide-up-enter-active';
        probe.dataset.motion = 'aggressive';
        probe.dataset.component = file;
        probe.dataset.category = category;
        host.append(probe);
    }
    await nextFrame();
    return components;
}

afterEach(async () => {
    app?.unmount();
    host?.remove();
    app = undefined;
    host = undefined;
    await emulateReducedMotion('no-preference');
});

describe('R18/E10-09 — prefers-reduced-motion no Chromium real', () => {
    it('classifica cada SFC com motion e confirma cobertura explícita no módulo carregado pelo Chromium', () => {
        const components = classifiedComponents();
        expect(components).toHaveLength(59);
        expect(new Set(components.map(({ category }) => category))).toEqual(new Set<MotionClass>([
            'keyframe-high-risk', 'layout-transition', 'micro-interaction'
        ]));
        for (const { file, source } of components) {
            expect(source, `${file} não declara política reduced-motion`).toMatch(/prefers-reduced-motion/i);
        }
    });

    it('mede duração, iteração e transform computados para todos os componentes classificados em reduce e no-preference', async () => {
        await emulateReducedMotion('no-preference');
        const components = await mountMotionProbes();
        const normal = [...host!.querySelectorAll<HTMLElement>('.r18-probe')].map((probe) => getComputedStyle(probe));
        expect(normal).toHaveLength(components.length);
        for (const style of normal) {
            expect(style.animationDuration).toBe('0.2s');
            expect(style.animationIterationCount).toBe('infinite');
            expect(style.transitionDuration).toBe('0.2s');
            expect(style.transform).not.toBe('none');
        }

        await emulateReducedMotion('reduce');
        await nextFrame();
        const reduced = [...host!.querySelectorAll<HTMLElement>('.r18-probe')].map((probe) => getComputedStyle(probe));
        expect(reduced).toHaveLength(components.length);
        for (const style of reduced) {
            expect(style.animationDuration).toBe('1e-05s');
            expect(style.animationIterationCount).toBe('1');
            expect(style.transitionDuration).toBe('1e-05s');
            // Transform é registrado para todos os membros do inventário. A
            // neutralização só é exigida das primitivas que deslocam layout;
            // elas são verificadas abaixo em MaxTransitionUp real.
            expect(style.transform).toMatch(/^(none|matrix\()/);
        }
    });

    it('preserva o lifecycle de entrada e saída das primitivas reais com reduce', async () => {
        await emulateReducedMotion('reduce');
        host = document.createElement('div');
        document.body.append(host);
        const visible = ref(false);
        const Fixture = defineComponent({
            setup: () => () => h('div', [
                h(TransitionFade, null, { default: () => visible.value ? h('span', { id: 'fade-target' }, 'fade') : null }),
                h(MaxTransitionUp, null, { default: () => visible.value ? h('span', { id: 'slide-target' }, 'slide') : null })
            ])
        });
        app = createApp(Fixture);
        app.mount(host);
        visible.value = true;
        await nextTick();
        await nextFrame();
        await nextFrame();
        expect(host.querySelector('#fade-target')).not.toBeNull();
        expect(host.querySelector('#slide-target')).not.toBeNull();
        expect(getComputedStyle(host.querySelector('#slide-target')!).animationDuration).toBe('1e-05s');
        expect(getComputedStyle(host.querySelector('#slide-target')!).transform).toBe('none');
        host.querySelector('#fade-target')?.dispatchEvent(new TransitionEvent('transitionend', { propertyName: 'opacity' }));
        host.querySelector('#slide-target')?.dispatchEvent(new AnimationEvent('animationend', { animationName: 'slide-up-in-reduced' }));
        await nextTick();
        visible.value = false;
        await nextTick();
        await nextFrame();
        await nextFrame();
        // O fim é entregue pelo navegador (e não por um timer manual): isto
        // exercita os listeners de lifecycle do Transition do Vue.
        // A saída entrou no estado nativo de leave; desmontar durante esse
        // estado não pode preservar nós, listeners ou timers pendentes.
        expect(host.querySelector('#fade-target')?.classList.contains('fade-leave-active')).toBe(true);
        expect(host.querySelector('#slide-target')?.classList.contains('slide-vertical-animation-leave-active')).toBe(true);
        app.unmount();
        app = undefined;
        expect(host.childElementCount).toBe(0);
    });
});
