// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { mount } from '@vue/test-utils';
import MaxDescriptionList from '../../src/components/MaxDescriptionList.vue';

describe('hidratação de componentes operacionais', () => {
    it('mantém conteúdo determinístico entre SSR e cliente', async () => {
        const props = { items: [{ id: 'same-id', label: 'Status', value: 'Pronto' }] };
        const html = await renderToString(createSSRApp({ render: () => h(MaxDescriptionList, props) }));
        const wrapper = mount(MaxDescriptionList, { props });
        expect(html).toContain('Status');
        expect(html).toContain('Pronto');
        expect(wrapper.text()).toContain('Pronto');
    });
});
