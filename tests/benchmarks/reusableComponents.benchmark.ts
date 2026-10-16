import { describe, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxAlert from '../../src/components/MaxAlert.vue';
import MaxProgressBar from '../../src/components/MaxProgressBar.vue';
import MaxSegmentedControl from '../../src/components/MaxSegmentedControl.vue';
import MaxCalendar from '../../src/components/MaxCalendar.vue';

describe('Benchmark: Reusable Components', () => {
    it('monta, atualiza e desmonta 50 instâncias de MaxAlert', async () => {
        setActivePinia(createPinia());
        const wrappers = [];
        for (let i = 0; i < 50; i++) {
            const w = mount(MaxAlert, {
                props: {
                    severity: 'info',
                    title: `Alerta ${i}`,
                    message: 'Mensagem de teste de benchmark'
                }
            });
            wrappers.push(w);
        }
        await wrappers[0].vm.$nextTick();

        for (const w of wrappers) w.unmount();
    });

    it('monta e atualiza 50 instâncias de MaxProgressBar', async () => {
        setActivePinia(createPinia());
        const wrappers = [];
        for (let i = 0; i < 50; i++) {
            const w = mount(MaxProgressBar, {
                props: {
                    value: i * 2,
                    max: 100,
                    ariaLabel: `Progresso ${i}`
                }
            });
            wrappers.push(w);
        }
        await wrappers[0].vm.$nextTick();

        for (let i = 0; i < 50; i++) await wrappers[i].setProps({ value: (i * 2) + 5 });


        for (const w of wrappers) w.unmount();
    });

    it('monta e alterna opções em 20 instâncias de MaxSegmentedControl', async () => {
        setActivePinia(createPinia());
        const wrappers = [];
        const options = [
            { value: 'a', label: 'Opção A' },
            { value: 'b', label: 'Opção B' },
            { value: 'c', label: 'Opção C' }
        ];

        for (let i = 0; i < 20; i++) {
            const w = mount(MaxSegmentedControl, {
                props: {
                    modelValue: 'a',
                    options,
                    ariaLabel: `Controle ${i}`
                }
            });
            wrappers.push(w);
        }
        await wrappers[0].vm.$nextTick();

        for (const w of wrappers) w.unmount();
    });

    it('monta e altera período em 5 instâncias de MaxCalendar', async () => {
        setActivePinia(createPinia());
        const wrappers = [];
        for (let i = 0; i < 5; i++) {
            const w = mount(MaxCalendar, {
                props: {
                    period: { year: 2026, month: 10 }
                }
            });
            wrappers.push(w);
        }
        await wrappers[0].vm.$nextTick();

        for (let i = 0; i < 5; i++) await wrappers[i].setProps({ period: { year: 2026, month: 11 } });


        for (const w of wrappers) w.unmount();
    });
});
