import 'virtual:uno.css';
// import '@unocss/reset/normalize.css';

import PrimeVue, { PrimeVueConfiguration } from 'primevue/config';
import type { App } from 'vue';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';

export { default as MaxButton } from './components/MaxButton.vue';
export { default as Button } from './components/MaxButton.vue';
export { default as MaxIcon } from './components/MaxIcon.vue';
export { default as MaxInputText } from './components/MaxInputText.vue';
export { default as InputText } from './components/MaxInputText.vue';

export default function install(app: App, options: PrimeVueConfiguration = {}) {
    app.use(PrimeVue, {
        ...options,
        locale: options.locale,
        theme: {
            preset: options.theme?.preset ?? MaxStyle,
            locale: options.locale || ptBR,
            options: {
                darkModeSelector: '.dark',
                ...((options.theme?.options ?? {}) as any),
                prefix: 'max',
            },
        },
        ripple: true,
    });
}

export * from './types';
