import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxMaps from '../../src/components/MaxMaps.vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
        ...actual,
        toNumber: (val: any) => Number(val)
    };
});

vi.mock('vue3-google-map', () => ({
    GoogleMap: { name: 'GoogleMap', props: ['apiKey', 'mapId', 'mapTypeId'], template: '<div><slot /></div>' },
    AdvancedMarker: { name: 'AdvancedMarker', template: '<div></div>' }
}));


describe('MaxMaps.vue', () => {
    it('deve montar se coordenadas forem passadas', async () => {
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: { latitude: -23.5, longitude: -46.6 }
            }
        });

        expect(wrapper.exists()).toBe(true);
        expect(wrapper.vm.coordinates.latitude).toBe(-23.5);
    });

    it('não deve renderizar mapa se coordenadas forem nulas', async () => {
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: null
            }
        });

        expect(wrapper.find('.mapa').exists()).toBe(false);
    });

    it.each([
        { latitude: 0, longitude: -46.6 },
        { latitude: -23.5, longitude: 0 },
        { latitude: 0, longitude: 0 }
    ])('aceita coordenadas zero e preserva a alternativa acessível: %o', async (modelValue) => {
        const wrapper = mount(MaxMaps, { props: { modelValue, apiKey: 'chave-de-teste' } });

        expect(wrapper.find('.mapa').exists()).toBe(true);
        expect(wrapper.find('.map-accessible-controls').exists()).toBe(true);
        expect(wrapper.find('.map-accessible-summary').text()).toContain(`Latitude ${modelValue.latitude.toFixed(5)}`);
    });

    it('deve atualizar modelValue quando as coordenadas mudam', async () => {
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: { latitude: -23.5, longitude: -46.6 }
            }
        });

        wrapper.vm.coordinates.latitude = -24.0;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual({ latitude: -24.0, longitude: -46.6 });
    });

    it('sincroniza modelValue para coordinates', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        await wrapper.setProps({ modelValue: { latitude: 10, longitude: 20 } });
        expect(wrapper.vm.coordinates.latitude).toBe(10);
        expect(wrapper.vm.coordinates.longitude).toBe(20);
    });

    it('testa onDrag', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        const event = {
            latLng: {
                lat: () => 10.12345678,
                lng: () => 20.12345678
            }
        };
        wrapper.vm.onDrag(event);
        expect(wrapper.vm.coordinates.latitude).toBe(10.1234568);
        expect(wrapper.vm.coordinates.longitude).toBe(20.1234568);
    });

    it('ativa isMounted após nextTick no onMounted e não deixa timers pendentes', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        expect(wrapper.vm.isMounted).toBe(false);
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.isMounted).toBe(true);

        wrapper.unmount();
        vi.runAllTimers();
        vi.useRealTimers();
    });

    it('watch modelValue covers all branches', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        // cover is_valid = false
        await wrapper.setProps({ modelValue: null });
        await wrapper.setProps({ modelValue: { latitude: null, longitude: null } as any });
        // cover is_different = false
        await wrapper.setProps({ modelValue: { latitude: -23.5, longitude: -46.6 } });
        // cover is_valid && is_different
        await wrapper.setProps({ modelValue: { latitude: 10, longitude: 20 } });
    });

    it('não contem a chave hardcoded AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY no código', () => {
        const source = require('fs').readFileSync(
            require('path').resolve(__dirname, '../../src/components/MaxMaps.vue'),
            'utf-8'
        );
        expect(source).not.toContain('AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY');
        expect(source).not.toContain('ENGEAPP_MAP');
    });

    it('exibe o container .no-map quando a apiKey do Google Maps não estiver configurada', async () => {
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: { latitude: -23.5, longitude: -46.6 }
            }
        });

        expect(wrapper.find('.no-map').exists()).toBe(true);
        expect(wrapper.findComponent({ name: 'GoogleMap' }).exists()).toBe(false);
    });

    it('renderiza o GoogleMap quando a apiKey for passada via prop ou maxAppConfig', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: { latitude: -23.5, longitude: -46.6 },
                apiKey: 'MINHA_CHAVE_PROPS',
                mapId: 'MEU_MAP_ID'
            }
        });
        vi.runAllTimers();
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        const googleMap = wrapper.findComponent({ name: 'GoogleMap' });
        expect(googleMap.exists()).toBe(true);
        expect(googleMap.props('apiKey')).toBe('MINHA_CHAVE_PROPS');
        expect(googleMap.props('mapId')).toBe('MEU_MAP_ID');
        vi.useRealTimers();
    });

    it('renderiza controles acessíveis de coordenadas e permite ajuste por inputs e botões de passo', async () => {
        const wrapper = mount(MaxMaps, {
            props: {
                modelValue: { latitude: -15.7801, longitude: -47.9292 }
            }
        });

        const controls = wrapper.find('.map-accessible-controls');
        expect(controls.exists()).toBe(true);
        expect(controls.attributes('role')).toBe('region');
        expect(controls.attributes('tabindex')).toBe('0');
        expect(controls.attributes('aria-label')).toBe('Controles acessíveis de coordenadas do mapa');

        const summary = wrapper.find('.map-accessible-summary');
        expect(summary.exists()).toBe(true);
        expect(summary.attributes('aria-live')).toBe('polite');
        expect(summary.text()).toContain('Latitude -15.78010, Longitude -47.92920');

        // Inputs de latitude e longitude
        const latInput = wrapper.find('input[aria-label="Latitude do marcador"]');
        const lngInput = wrapper.find('input[aria-label="Longitude do marcador"]');
        expect(latInput.exists()).toBe(true);
        expect(lngInput.exists()).toBe(true);

        // Alterando latitude via input
        (latInput.element as HTMLInputElement).value = '-16.0000';
        await latInput.trigger('change');
        expect(wrapper.vm.coordinates.latitude).toBe(-16);
        expect(wrapper.emitted('update:modelValue')).toBeTruthy();

        // Botões de passo direcional
        const northBtn = wrapper.find('button[aria-label="Mover marcador para o Norte"]');
        const eastBtn = wrapper.find('button[aria-label="Mover marcador para o Leste"]');
        expect(northBtn.exists()).toBe(true);
        expect(eastBtn.exists()).toBe(true);

        const currentLat = wrapper.vm.coordinates.latitude;
        await northBtn.trigger('click');
        expect(wrapper.vm.coordinates.latitude).toBeCloseTo(currentLat + 0.0005, 5);

        const currentLng = wrapper.vm.coordinates.longitude;
        await eastBtn.trigger('click');
        expect(wrapper.vm.coordinates.longitude).toBeCloseTo(currentLng + 0.0005, 5);
    });
});
