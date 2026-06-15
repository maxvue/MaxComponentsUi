import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxMaps from '../../src/components/MaxMaps.vue';

vi.mock('@maxvue/max-use', () => ({
    toNumber: (val: any) => Number(val)
}));

vi.mock('vue3-google-map', () => ({
    GoogleMap: { template: '<div><slot /></div>' },
    AdvancedMarker: { template: '<div></div>' }
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

    it('testa setTimeout no onMounted', async () => {
        vi.useFakeTimers();
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        expect(wrapper.vm.isMounted).toBe(false);
        vi.runAllTimers();
        expect(wrapper.vm.isMounted).toBe(true);
        vi.useRealTimers();
    });

    it('watch modelValue covers all branches', async () => {
        const wrapper = mount(MaxMaps, {
            props: { modelValue: { latitude: -23.5, longitude: -46.6 } }
        });
        // cover is_valid = false
        await wrapper.setProps({ modelValue: null });
        await wrapper.setProps({ modelValue: { latitude: null, longitude: null } });
        // cover is_different = false
        await wrapper.setProps({ modelValue: { latitude: -23.5, longitude: -46.6 } });
        // cover is_valid && is_different
        await wrapper.setProps({ modelValue: { latitude: 10, longitude: 20 } });
    });
});
