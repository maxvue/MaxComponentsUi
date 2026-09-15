import 'virtual:uno.css';
import './styles.scss';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import MaxComponentsUi from '../../src/index';
import { configureMaxApp } from '../../src/index';


import App from './App.vue';

// O playground não é uma aplicação Laravel, mas alguns componentes usam o
// adaptador opcional de rotas do MaxUse. Uma configuração vazia torna explícito
// que os exemplos usam apenas URLs locais, sem depender de um global externo.
Object.assign(window, {
    Ziggy: {
        url: window.location.origin,
        port: null,
        defaults: {},
        routes: {
            'playground.menus': { uri: 'playground/menus', methods: ['GET', 'HEAD'] }
        }
    }
});

// Cenários de navegação exibem o shell sem backend. Desabilitar suas rotas
// remotas evita que os stores tentem resolver nomes Ziggy que só existem em
// uma aplicação Laravel consumidora.
configureMaxApp({ routeMenus: 'playground.menus' });

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: App }
    ]
});

// Alguns cenários exercitam stores da biblioteca; o playground precisa fornecer
// a mesma instância Pinia que uma aplicação consumidora fornece no bootstrap.
createApp(App).use(createPinia()).use(router).use(MaxComponentsUi).mount('#app');
