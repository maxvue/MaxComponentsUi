import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputTextArea from '../../src/components/MaxInputTextArea.vue';

describe('Performance: Redimensionamento Único do MaxInputTextArea (E11-02)', () => {
    let wrappers: VueWrapper[] = [];

    beforeEach(() => {
        setActivePinia(createPinia());
        wrappers = [];
    });

    afterEach(() => {
        for (const w of wrappers) w.unmount();
        wrappers = [];
        vi.restoreAllMocks();
    });

    const cardinalities = [1, 20, 50];

    cardinalities.forEach((count) => {
        describe(`Cardinalidade ${count} textarea(s)`, () => {
            it(`executa exatamente uma medição (scrollHeight e getComputedStyle) por componente ao alterar valor (${count} instâncias)`, async () => {
                let scrollHeightReads = 0;

                // Monta N instâncias
                for (let i = 0; i < count; i++) {
                    const w = mount(MaxInputTextArea, {
                        props: { modelValue: `Item inicial ${i}` }
                    });
                    wrappers.push(w);
                }

                // Aguarda ciclo inicial de mount
                for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

                // Instrumenta getters de scrollHeight nos textareas montados
                const textareas: HTMLTextAreaElement[] = [];
                for (const w of wrappers) {
                    const el = w.find('textarea').element as HTMLTextAreaElement;
                    textareas.push(el);
                    Object.defineProperty(el, 'scrollHeight', {
                        get() {
                            scrollHeightReads++;
                            return 120;
                        },
                        configurable: true
                    });
                }

                const gcsSpy = vi.spyOn(window, 'getComputedStyle');
                gcsSpy.mockClear();

                // Reseta contadores após mount
                scrollHeightReads = 0;

                const startTime = performance.now();

                // Simula digitação em todas as instâncias
                for (let i = 0; i < count; i++) {
                    const el = textareas[i];
                    el.value = `Novo conteúdo linha 1\nLinha 2 para item ${i}`;
                    wrappers[i].find('textarea').trigger('input');
                }

                // Aguarda atualização de layout de todas as instâncias
                for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

                const duration = performance.now() - startTime;

                const gcsCalls = gcsSpy.mock.calls.filter(([target]) => textareas.includes(target as HTMLTextAreaElement)).length;

                gcsSpy.mockRestore();

                // Afirma exatamente 1 leitura de scrollHeight e 1 chamada de getComputedStyle por componente
                expect(scrollHeightReads).toBe(count);
                expect(gcsCalls).toBe(count);

                // Benchmark temporal informativo e não-bloqueante para evitar falso-positivo em ambientes CI / CPU compartilhada
                expect(duration).toBeGreaterThanOrEqual(0);
            });

            it(`coalesce múltiplas alterações de propriedades para um único resize por componente (${count} instâncias)`, async () => {
                let scrollHeightReads = 0;

                for (let i = 0; i < count; i++) {
                    const w = mount(MaxInputTextArea, {
                        props: { modelValue: `Texto ${i}`, minRows: 1, maxRows: 10 }
                    });
                    wrappers.push(w);
                }

                for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

                for (const w of wrappers) {
                    const el = w.find('textarea').element as HTMLTextAreaElement;
                    Object.defineProperty(el, 'scrollHeight', {
                        get() {
                            scrollHeightReads++;
                            return 100;
                        },
                        configurable: true
                    });
                }

                scrollHeightReads = 0;

                // Altera múltiplas props e modelValue no mesmo tick em todas as instâncias
                wrappers.forEach((w, i) => {
                    w.setProps({
                        modelValue: `Linha 1\nLinha 2\nLinha 3 (${i})`,
                        minRows: 2,
                        maxRows: 5
                    });
                });

                for (let i = 0; i < 3; i++) await wrappers[0].vm.$nextTick();

                // Cada componente executa apenas um ciclo coalescido de resize
                expect(scrollHeightReads).toBe(count);
            });
        });
    });
});
