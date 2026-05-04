import 'virtual:uno.css';

export { presetMaxUno } from './unoCssPreset';

import PrimeVue from 'primevue/config';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';
import { MaxComponentsUiResolver } from './helpers/resolver';

export { MaxComponentsUiResolver };

export * from './components/_primeVue';

export { default as MaxIcon } from './components/MaxIcon.vue';
export { default as Grid } from './components/Grid.vue';

// Button
export { default as MaxButton } from './components/MaxButton.vue';
export { default as Button } from './components/MaxButton.vue';
export { default as Botao } from './components/MaxButton.vue';

// Input Text
export { default as MaxInputText } from './components/MaxInputText.vue';
export { default as InputText } from './components/MaxInputText.vue';
export { default as InputField } from './components/MaxInputText.vue';

// Phone Field
export { default as MaxPhoneField } from './components/MaxPhoneField.vue';
export { default as PhoneField } from './components/MaxPhoneField.vue';
export { default as InputPhone } from './components/MaxPhoneField.vue';

// Inputs
export { default as MaxInputAutoComplete } from './components/MaxInputAutoComplete.vue';
export { default as MaxInputAutoCompleteApi } from './components/MaxInputAutoCompleteApi.vue';
export { default as MaxInputCep } from './components/MaxInputCep.vue';
export { default as MaxInputCheckbox } from './components/MaxInputCheckbox.vue';
export { default as MaxInputCoordinateDecimalLat } from './components/MaxInputCoordinateDecimalLat.vue';
export { default as MaxInputCoordinateDecimalLng } from './components/MaxInputCoordinateDecimalLng.vue';
export { default as MaxInputCpfCnpj } from './components/MaxInputCpfCnpj.vue';
export { default as MaxInputDatePicker } from './components/MaxInputDatePicker.vue';
export { default as MaxInputField } from './components/MaxInputField.vue';
export { default as MaxInputFile } from './components/MaxInputFile.vue';
export { default as MaxInputFileProject } from './components/MaxInputFileProject.vue';
export { default as MaxInputFileUpload } from './components/MaxInputFileUpload.vue';
export { default as MaxInputFileUploadBig } from './components/MaxInputFileUploadBig.vue';
export { default as MaxInputFileUploadButton } from './components/MaxInputFileUploadButton.vue';
export { default as MaxInputNumber } from './components/MaxInputNumber.vue';
export { default as MaxInputPhone } from './components/MaxInputPhone.vue';
export { default as MaxInputPhoneMail } from './components/MaxInputPhoneMail.vue';
export { default as MaxInputRadio } from './components/MaxInputRadio.vue';
export { default as MaxInputSearch } from './components/MaxInputSearch.vue';
export { default as MaxInputSelect } from './components/MaxInputSelect.vue';
export { default as MaxInputSwitch } from './components/MaxInputSwitch.vue';
export { default as MaxInputTextArea } from './components/MaxInputTextArea.vue';
export { default as MaxInputToggle } from './components/MaxInputToggle.vue';
export { default as MaxInputTypeAddress } from './components/MaxInputTypeAddress.vue';

// Utils / Others
export { default as MaxMsgLabels } from './components/MaxMsgLabels.vue';
export { default as MaxTableData } from './components/MaxTableData.vue';
export { default as MaxTextInputFloatLabel } from './components/MaxTextInputFloatLabel.vue';
export { default as MaxTransitionFadeLight } from './components/MaxTransitionFadeLight.vue';
export { default as MaxTransitionUp } from './components/MaxTransitionUp.vue';
export { default as MaxUserAvatar } from './components/MaxUserAvatar.vue';
export const install = (app: any, options: any = {}) => {
    app.use(PrimeVue, {
        locale: options.locale || ptBR,
        theme: {
            preset: MaxStyle,
            options: {
                darkModeSelector: '.dark',
                prefix: 'max',
                ...options.theme?.options
            },
            ...options.theme
        },
        ripple: true,
        ...options
    });
};

export default {
    install
};


export * from './types';
