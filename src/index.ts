import 'virtual:uno.css';
// import '@unocss/reset/normalize.css';

import type { App } from 'vue';
import PrimeVue, { PrimeVueConfiguration } from 'primevue/config';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';

import MaxButton from './components/MaxButton.vue';
import Button from './components/MaxButton.vue';
import MaxIcon from './components/MaxIcon.vue';
import MaxInputText from './components/MaxInputText.vue';
import InputText from './components/MaxInputText.vue';

export { MaxButton, Button, MaxIcon, MaxInputText, InputText };

export const install = (app: App, options: PrimeVueConfiguration = {}) => {
    app.use(PrimeVue, {
        ...options,
        locale: options.locale || ptBR,
        theme: {
            preset: options.theme?.preset ?? MaxStyle,
            options: {
                darkModeSelector: '.dark',
                ...((options.theme?.options ?? {}) as any),
                prefix: 'max',
            },
        },
        ripple: true,
    });
};

export * from './types';

export default {
    install,
};
