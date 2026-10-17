import { afterEach, describe, expect, it } from 'vitest';
import { createApp, h, type App } from 'vue';
import { userEvent } from 'vitest/browser';
import MaxDescriptionList from '../../src/components/MaxDescriptionList.vue';
import MaxSaveIndicator from '../../src/components/MaxSaveIndicator.vue';

let app: App | undefined;
let host: HTMLElement | undefined;

afterEach(() => { app?.unmount(); host?.remove(); app = undefined; host = undefined; });

describe('componentes operacionais no navegador', () => {
    it('apresenta detalhe semântico e estado não dependente de cor', async () => {
        host = document.createElement('div');
        document.body.append(host);
        app = createApp({ render: () => h('main', [h(MaxDescriptionList, { items: [{ id: 'a', label: 'Ativo', value: true }] }), h(MaxSaveIndicator, { state: 'offline' })]) });
        app.mount(host);
        await userEvent.tab();
        expect(host.querySelector('dt')?.textContent).toBe('Ativo');
        expect(host.textContent).toContain('Sem conexão');
    });
});
