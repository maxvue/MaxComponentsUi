import { describe, bench } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';

describe('Benchmark: MaxInputTextArea', () => {
    bench('monta e renderiza 50 textareas e digita', async () => {
        setActivePinia(createPinia());
        const wrappers = [];
        for (let i = 0; i < 50; i++) {
            const w = mount(MaxInputTextArea, { props: { modelValue: `Item inicial ${i}` } });
            wrappers.push(w);
        }
        for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

        for (let i = 0; i < 50; i++) {
            const el = wrappers[i].find('textarea').element as HTMLTextAreaElement;
            el.value = `Novo conteúdo linha 1\nLinha 2 para item ${i}`;
            wrappers[i].find('textarea').trigger('input');
        }
        for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

        for (const w of wrappers) w.unmount();
    });
});
