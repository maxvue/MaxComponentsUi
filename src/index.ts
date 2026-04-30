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

export * from './components/_primeVue';

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
