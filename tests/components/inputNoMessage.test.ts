import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import InputBase from '../../src/components/InputBase.vue';
import MaxChips from '../../src/components/MaxChips.vue';
import MaxColorPicker from '../../src/components/MaxColorPicker.vue';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';
import MaxInputCep from '../../src/components/MaxInputCep.vue';
import MaxInputCoordinateDecimalLat from '../../src/components/MaxInputCoordinateDecimalLat.vue';
import MaxInputCoordinateDecimalLng from '../../src/components/MaxInputCoordinateDecimalLng.vue';
import MaxInputCpfCnpj from '../../src/components/MaxInputCpfCnpj.vue';
import MaxInputCreditCard from '../../src/components/MaxInputCreditCard.vue';
import MaxInputCreditCardCvv from '../../src/components/MaxInputCreditCardCvv.vue';
import MaxInputCreditCardDate from '../../src/components/MaxInputCreditCardDate.vue';
import MaxInputDatePicker from '../../src/components/MaxInputDatePicker.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputNumber from '../../src/components/MaxInputNumber.vue';
import MaxInputOTP from '../../src/components/MaxInputOTP.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';
import MaxInputPhoneMail from '../../src/components/MaxInputPhoneMail.vue';
import MaxInputSearch from '../../src/components/MaxInputSearch.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputSwitch from '../../src/components/MaxInputSwitch.vue';
import MaxInputText from '../../src/components/MaxInputText.vue';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';
import MaxInputTextList from '../../src/components/MaxInputTextList.vue';
import MaxInputTypeAddress from '../../src/components/MaxInputTypeAddress.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';

const cases = [
    ['MaxChips', MaxChips, { modelValue: [] }],
    ['MaxColorPicker', MaxColorPicker, { modelValue: '' }],
    ['MaxInputAutoComplete', MaxInputAutoComplete, { modelValue: '', options: [] }],
    ['MaxInputAutoCompleteApi', MaxInputAutoCompleteApi, { modelValue: '', route: '/busca' }],
    ['MaxInputCep', MaxInputCep, { modelValue: '' }],
    ['MaxInputCoordinateDecimalLat', MaxInputCoordinateDecimalLat, { modelValue: '' }],
    ['MaxInputCoordinateDecimalLng', MaxInputCoordinateDecimalLng, { modelValue: '' }],
    ['MaxInputCpfCnpj', MaxInputCpfCnpj, { modelValue: '' }],
    ['MaxInputCreditCard', MaxInputCreditCard, { modelValue: '' }],
    ['MaxInputCreditCardCvv', MaxInputCreditCardCvv, { modelValue: '' }],
    ['MaxInputCreditCardDate', MaxInputCreditCardDate, { modelValue: '' }],
    ['MaxInputDatePicker', MaxInputDatePicker, { modelValue: null }],
    ['MaxInputIconPicker', MaxInputIconPicker, { modelValue: '' }],
    ['MaxInputNumber', MaxInputNumber, { modelValue: null }],
    ['MaxInputOTP', MaxInputOTP, { modelValue: '' }],
    ['MaxInputPhone', MaxInputPhone, { modelValue: '' }],
    ['MaxInputPhoneMail', MaxInputPhoneMail, { modelValue: '' }],
    ['MaxInputSearch', MaxInputSearch, { modelValue: '' }],
    ['MaxInputSelect', MaxInputSelect, { modelValue: null, options: [] }],
    ['MaxInputSwitch', MaxInputSwitch, { modelValue: false }],
    ['MaxInputText', MaxInputText, { modelValue: '' }],
    ['MaxInputTextArea', MaxInputTextArea, { modelValue: '' }],
    ['MaxInputTextList', MaxInputTextList, { modelValue: [] }],
    ['MaxInputTypeAddress', MaxInputTypeAddress, { modelValue: '' }],
    ['MaxTagSelect', MaxTagSelect, { modelValue: [], options: [] }]
] as const;

describe('Contrato no-message dos componentes de input', () => {
    it.each(cases)('%s encaminha no-message ao InputBase', (_name, component, props) => {
        expect((component as any).props).toHaveProperty('noMessage');

        const wrapper = mount(component as any, {
            props: props as any,
            attrs: {
                message: 'Mensagem que não deve ocupar espaço',
                'no-message': ''
            }
        });
        const inputBase = wrapper.findComponent(InputBase);

        expect(inputBase.exists()).toBe(true);
        expect(inputBase.props('noMessage')).toBe(true);
        expect(wrapper.find('.input-message').exists()).toBe(false);
        expect(wrapper.find('.max-input-main-div').classes()).toContain('no-message');
    });
});
