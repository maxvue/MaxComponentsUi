import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxMaps from '../../src/components/MaxMaps.vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return { ...actual, toNumber: (val: any) => Number(val) };
});

vi.mock('vue3-google-map', () => ({
    GoogleMap: { name: 'GoogleMap', props: ['apiKey', 'mapId', 'mapTypeId'], template: '<div><slot /></div>' },
    AdvancedMarker: { name: 'AdvancedMarker', template: '<div></div>' }
}));

describe('REV-R12 — Testes Adversariais MaxMaps', () => {
    /**
     * CASO ADVERSARIAL MAPS-1:
     * O componente inteiro é condicionado por v-if="coordinates.latitude !== 0 && coordinates.longitude !== 0".
     * Quando lat=0 OU lng=0, o div principal NÃO renderiza, e consequentemente
     * os controles acessíveis (.map-accessible-controls) também NÃO aparecem.
     * Isso viola o requisito R12 de alternativa sempre perceptível ao foco.
     */
    it('[ADVERSARIAL MAPS-1] aceita 0,0 e mantém controles acessíveis operáveis', async () => {
        // Coordenadas nulas/zero — caso típico de "mapa em branco"
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: 0, longitude: 0 } }
        });

        // O componente inteiro não renderiza quando lat=0 e lng=0
        const controls = wrapper.find('.map-accessible-controls');

        const componentRendered = wrapper.find('.map-main-div').exists();
        expect(componentRendered).toBe(true);
        expect(controls.exists()).toBe(true);
        expect(wrapper.find('.map-accessible-summary').text()).toContain('Latitude 0.00000, Longitude 0.00000');
    });

    /**
     * CASO ADVERSARIAL MAPS-2:
     * Verifica que os controles acessíveis estão disponíveis quando
     * as coordenadas são válidas (não-zero).
     */
    it('[ADVERSARIAL MAPS-2] controles acessíveis são exibidos com coordenadas válidas', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -15.7801, longitude: -47.9292 } }
        });

        const controls = wrapper.find('.map-accessible-controls');
        expect(controls.exists()).toBe(true);
        expect(controls.attributes('role')).toBe('region');
        expect(controls.attributes('tabindex')).toBe('0');
    });

    /**
     * CASO ADVERSARIAL MAPS-3:
     * Verifica que o sumário de coordenadas usa 5 casas decimais (conforme IMP-R12).
     * O formato no template é: .toFixed(5) = 5 casas decimais
     * O teste original em MaxMaps.test.ts verifica '-15.78010, -47.92920' (5 casas) - CORRETO
     */
    it('[ADVERSARIAL MAPS-3] sumário exibe coordenadas com exatamente 5 casas decimais', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -15.78, longitude: -47.9 } }
        });

        const summary = wrapper.find('.map-accessible-summary');
        expect(summary.exists()).toBe(true);
        // .toFixed(5) => "-15.78000" e "-47.90000"
        expect(summary.text()).toContain('-15.78000');
        expect(summary.text()).toContain('-47.90000');
    });
});
