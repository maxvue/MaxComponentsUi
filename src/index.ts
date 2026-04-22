import 'virtual:uno.css';
// import '@unocss/reset/normalize.css';

import PrimeVue from 'primevue/config';
import type { Plugin } from 'vue';

import { MaxStyle } from './styles/style';
import ptBR from './locales/pt-br';

export { default as MaxButton } from './components/MaxButton.vue';
export { default as Button } from './components/MaxButton.vue';
export { default as MaxIcon } from './components/MaxIcon.vue';
export { default as MaxInputText } from './components/MaxInputText.vue';
export { default as InputText } from './components/MaxInputText.vue';

const MaxComponentsUi: Plugin<any[], any[]> = {
    install(app) {
        app.use(PrimeVue, {
            locale: ptBR,
            theme: {
                preset: MaxStyle,
                options: {
                    darkModeSelector: '.dark',
                    prefix: 'max',
                },
            },
            ripple: true,
        });
    },
};

export default MaxComponentsUi;

export * from './types';
