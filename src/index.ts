import 'virtual:uno.css';
// import '@unocss/reset/normalize.css';

import PrimeVue, { PrimeVueConfiguration } from 'primevue/config';
import type { Plugin } from 'vue';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';

export { default as MaxButton } from './components/MaxButton.vue';
export { default as Button } from './components/MaxButton.vue';
export { default as MaxIcon } from './components/MaxIcon.vue';
export { default as MaxInputText } from './components/MaxInputText.vue';
export { default as InputText } from './components/MaxInputText.vue';

interface MaxUiConfiguration extends PrimeVueConfiguration {
    unocss: boolean;
}

const MaxComponentsUi: Plugin = {
    install(app, options: MaxUiConfiguration = { unocss: true, locale: ptBR }) {
        app.use(PrimeVue, {
            ...options,
            unocss: options.unocss,
            locale: options.locale,
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
    },
};

export default MaxComponentsUi;

export * from './types';
