import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxPhoneField from '../../src/components/MaxPhoneField.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import { vMaska } from 'maska/vue';

const g = {
    directives: { maska: vMaska },
    stubs: { InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] }, InputText: { template: '<input />' } }
};

describe('audit', () => {
    it('phonefield ddi prefix collision: 1 vs 55', async () => {
        // digits '5511999999999' -> i=3 tries 551, i=2 tries 55
        const w = mount(MaxPhoneField, { props: { modelValue: '5511999999999' }, global: { stubs: { Select: true } } });
        await w.vm.$nextTick();
        console.log('country', (w.vm as any).country.ddi, 'phone', (w.vm as any).phone);
        // Now a Portugal number 351...
        const w2 = mount(MaxPhoneField, { props: { modelValue: '351912345678' }, global: { stubs: { Select: true } } });
        await w2.vm.$nextTick();
        console.log('PT country', (w2.vm as any).country.ddi, 'phone', (w2.vm as any).phone);
    });

    it('lng error when blank not required', () => {
        const w = mount(MaxInputCoordinateDecimalLng, { props: { modelValue: '', required: false }, global: g });
        console.log('LNG blank error:', (w.vm as any).error, 'caution:', (w.vm as any).caution);
        const wl = mount(MaxInputCoordinateDecimalLat, { props: { modelValue: '', required: false }, global: g });
        console.log('LAT blank error:', (wl.vm as any).error);
    });

    it('lat mask token for negatives', () => {
        const w = mount(MaxInputCoordinateDecimalLat, { props: { modelValue: '' }, global: g });
        console.log('mask pos', (w.vm as any).maskValue.mask);
    });

    it('cvv len 4 amex', async () => {
        const w = mount(MaxInputCreditCardCvv, { props: { modelValue: '', len: 4 }, global: { stubs: { InputBase: { template: '<div><slot /></div>', props: ['error', 'done'] } } } });
        console.log('cvv mask', (w.vm as any).maskValue.mask);
    });
});
