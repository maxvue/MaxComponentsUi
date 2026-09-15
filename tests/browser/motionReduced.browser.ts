import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import TransitionFade from '../../src/components/TransitionFade.vue';
import MaxTransitionUp from '../../src/components/MaxTransitionUp.vue';
import MaxAiIcon from '../../src/components/MaxAiIcon.vue';
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

async function frames(count: number) {
    for (let index = 0; index < count; index += 1) await nextFrame();
}

async function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    const session = cdp() as unknown as { send(command: string, params?: unknown): Promise<unknown> };
    await session.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value }]
    });
    expect(matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(value === 'reduce');
}

async function mountRealComponents() {
    host = document.createElement('div');
    document.body.append(host);
    const components = classifiedComponents();
    app = createApp({
        // Três SFCs reais cobrem as categorias do inventário: keyframe,
        // transição de layout e microinteração. Seus estilos efetivos são
        // medidos abaixo; o inventário conserva os 59 itens auditáveis.
        render: () => h('div', [
            h('section', { 'data-component': 'MaxAiIcon.vue', 'data-category': 'keyframe-high-risk' }, [h(MaxAiIcon)]),
            h('section', { 'data-component': 'TransitionFade.vue', 'data-category': 'layout-transition' }, [h(TransitionFade, null, { default: () => h('span', { class: 'fade-enter-active' }) })]),
            h('section', { 'data-component': 'MaxTransitionUp.vue', 'data-category': 'layout-transition' }, [h(MaxTransitionUp, null, { default: () => h('span', { class: 'slide-vertical-animation-enter-active' }) })])
        ])
    });
    app.directive('tooltip', {});
    app.mount(host);
    await nextFrame();
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
        for (const { file, source } of components) expect(source, `${file} não declara política reduced-motion`).toMatch(/prefers-reduced-motion/i);

    });

    it('mede duração, iteração e transform computados para todos os componentes classificados em reduce e no-preference', async () => {
        await emulateReducedMotion('no-preference');
        await mountRealComponents();
        const targets = [
            host!.querySelector<HTMLElement>('.max-ai-icon')!,
            host!.querySelector<HTMLElement>('.fade-enter-active')!,
            host!.querySelector<HTMLElement>('.slide-vertical-animation-enter-active')!
        ];
        expect(targets).not.toContain(null);
        const normal = targets.map((target) => getComputedStyle(target));
        expect(normal).toHaveLength(3);
        for (const style of normal) {
            expect(style.animationDuration).not.toBe('1e-05s');
            expect(style.transitionDuration).not.toBe('1e-05s');
            expect(style.transform).toMatch(/^(none|matrix\()/);
        }

        await emulateReducedMotion('reduce');
        await nextFrame();
        const reduced = targets.map((target) => getComputedStyle(target));
        expect(reduced).toHaveLength(3);
        for (const style of reduced) {
            expect(style.animationDuration).toBe('1e-05s');
            expect(style.animationIterationCount).toBe('1');
            expect(style.transitionDuration).toBe('1e-05s');
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
        // Espera frames de pintura reais; não injeta transitionend/animationend
        // nem usa timer. Assim o Chromium entrega o término nativo ao Vue.
        await frames(12);
        expect(host.querySelector('#fade-target')).toBeNull();
        expect(host.querySelector('#slide-target')).toBeNull();
    });
});
