import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia } from 'pinia';

import MaxLoadScreen from '../../src/components/MaxLoadScreen.vue';
import MaxLoadScreenTarget from '../../src/components/MaxLoadScreenTarget.vue';
import { useLoadingStore } from '../../src/stores/useLoading.Store';

/**
 * O `tests/setup.ts` instala um Pinia global em `config.global.plugins`, que
 * seria usado por todo componente montado — e não é o mesmo instanciado por
 * `setActivePinia` aqui. Passar a instância local em cada `mount` garante que
 * o componente enxergue a store que o teste manipula.
 */
let pinia: Pinia;

const mountWithPinia = (component: any, options: Record<string, any> = {}) => mount(component, {
    ...options,
    global: { ...(options.global ?? {}), plugins: [pinia] }
});

describe('MaxLoadScreen', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('não renderiza alvos quando não há carregamento', () => {
        const wrapper = mountWithPinia(MaxLoadScreen);

        expect(wrapper.find('.load-screen-target-item').exists()).toBe(false);
    });

    it('renderiza um alvo para cada target ativo', async () => {
        const loading = useLoadingStore();
        loading.start({ key: 'a', target: 'body' });

        const wrapper = mountWithPinia(MaxLoadScreen);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('.load-screen-target-item').exists()).toBe(true);
        expect(wrapper.findComponent(MaxLoadScreenTarget).exists()).toBe(true);
    });

    it('renderiza um item por target distinto', async () => {
        const loading = useLoadingStore();
        loading.start({ key: 'a', target: 'body' });
        loading.start({ key: 'b', target: '#painel' });

        const wrapper = mountWithPinia(MaxLoadScreen);
        await wrapper.vm.$nextTick();

        expect(wrapper.findAll('.load-screen-target-item')).toHaveLength(2);
    });

    it('passa o target adiante para o componente filho', async () => {
        const loading = useLoadingStore();
        loading.start({ key: 'a', target: 'body' });

        const wrapper = mountWithPinia(MaxLoadScreen);
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent(MaxLoadScreenTarget).props('target')).toMatchObject({ target: 'body' });
    });

    it('deixa de renderizar depois que a fila é limpa pelo debounce', async () => {
        vi.useFakeTimers();

        const loading = useLoadingStore();
        loading.start({ key: 'a', target: 'body' });

        const wrapper = mountWithPinia(MaxLoadScreen);
        await wrapper.vm.$nextTick();
        expect(wrapper.find('.load-screen-target-item').exists()).toBe(true);

        // O watchDebounced da store limpa os itens 500 ms após todos concluírem.
        loading.end('a');
        await vi.advanceTimersByTimeAsync(600);
        await wrapper.vm.$nextTick();

        expect(loading.targets['body'].items).toEqual({});
        vi.useRealTimers();
    });
});

describe('MaxLoadScreenTarget', () => {
    let wrappers: Array<{ unmount: () => void }> = [];

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        document.body.innerHTML = '';
        wrappers = [];
    });

    // O conteúdo teleportado vive fora do wrapper e sobreviveria ao caso
    // seguinte, inflando as contagens no documento.
    afterEach(() => {
        wrappers.forEach((wrapper) => wrapper.unmount());
        document.body.innerHTML = '';
    });

    /** Monta o alvo teleportando para um contêiner real do documento. */
    const mountTarget = (items: Record<string, any>) => {
        const host = document.createElement('div');
        host.id = 'alvo';
        document.body.appendChild(host);

        const wrapper = mountWithPinia(MaxLoadScreenTarget, {
            props: { target: { target: '#alvo', items } },
            attachTo: host
        });

        wrappers.push(wrapper);

        return wrapper;
    };

    it('não renderiza sem itens', () => {
        const wrapper = mountTarget({});

        expect(wrapper.find('.load-screen').exists()).toBe(false);
    });

    it('exibe a mensagem do item', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Carregando projeto', status: 'loading' } });
        await wrapper.vm.$nextTick();

        expect(document.body.textContent).toContain('Carregando projeto');
    });

    it('renderiza um bloco por item', async () => {
        const wrapper = mountTarget({
            a: { key: 'a', message: 'Um', status: 'loading' },
            b: { key: 'b', message: 'Dois', status: 'done' }
        });
        await wrapper.vm.$nextTick();

        expect(document.querySelectorAll('.load-screen-message-item')).toHaveLength(2);
    });

    it('mostra o ícone de concluído no status done', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Pronto', status: 'done' } });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxDoneIcon' }).exists()).toBe(true);
    });

    it('mostra o ícone de erro no status error', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Falhou', status: 'error' } });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxErrorIcon' }).exists()).toBe(true);
    });

    it('mostra o ícone de espera no status waiting', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Na fila', status: 'waiting' } });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxWaitIcon' }).exists()).toBe(true);
    });

    it('mostra o loader no status loading', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Carregando', status: 'loading' } });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxLoaderIcon' }).exists()).toBe(true);
    });

    it('renderiza o ícone customizado do item', async () => {
        const wrapper = mountTarget({ a: { key: 'a', message: 'Com ícone', status: 'loading', icon: 'mdi:file' } });
        await wrapper.vm.$nextTick();

        expect(wrapper.findComponent({ name: 'MaxIcon' }).exists()).toBe(true);
    });
});
