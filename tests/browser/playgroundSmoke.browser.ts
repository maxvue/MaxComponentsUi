import { describe, expect, it } from 'vitest';
import { createApp, h, nextTick } from 'vue';
import { createPinia } from 'pinia';
import { SCENARIO_LOADERS } from '../../playground/src/scenarios';

function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

describe('R19/E10-10 — smoke do playground no Chromium', () => {
    it('carrega cada cenário registrado e monta os estados reais dos loaders', async () => {
        const scenarioIds = Object.keys(SCENARIO_LOADERS);
        expect(scenarioIds).toHaveLength(36);

        for (const scenarioId of scenarioIds) {
            const module = await SCENARIO_LOADERS[scenarioId]();
            expect(module.default, scenarioId).toBeDefined();
        }

        const host = document.createElement('div');
        document.body.append(host);
        const loadersScenario = await SCENARIO_LOADERS['media-loaders']();
        const app = createApp({ render: () => h(loadersScenario.default) });
        app.use(createPinia());
        app.directive('tooltip', {});

        try {
            app.mount(host);
            await nextTick();
            await nextFrame();
            expect(host.querySelector('[data-scenario="media-loaders"]')).not.toBeNull();
            expect(host.querySelectorAll('.component-block')).toHaveLength(5);
            expect(host.querySelectorAll('.state-col')).toHaveLength(15);
            expect(host.querySelectorAll('.max-loader, .max-loader-ai, .max-loader-icon').length).toBeGreaterThanOrEqual(3);
        } finally {
            app.unmount();
            host.remove();
        }
    });
});
