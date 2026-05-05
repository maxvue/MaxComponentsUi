import 'virtual:uno.css';

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import MaxComponentsUi from '../../src/index';


import App from './App.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: App }
    ]
});

createApp(App).use(router).use(MaxComponentsUi).mount('#app');
