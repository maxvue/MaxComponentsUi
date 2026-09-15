/**
 * Suíte Determinística — Coleções Virtualizadas (R23/F28A)
 *
 * Conserva SOMENTE asserções de cardinalidade (número de nós DOM na viewport).
 *
 * ⚠️  As medições temporais (`performance.now`, `expect(duration).toBeLessThan`)
 * foram movidas para o benchmark temporal separado:
 *   tests/benchmarks/MaxBaseVirtualScroller.benchmark.ts
 *
 * Motivação: medições de tempo têm variação natural e não são determinísticas,
 * portanto não pertencem à suíte de CI. Ver R23/F28A.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import MaxInputAutoComplete from '../../src/components/MaxInputAutoComplete.vue';
import MaxInputPhone from '../../src/components/MaxInputPhone.vue';

function generateItems(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        value: `val_${i}`,
        name: `Option ${i}`,
        label: `Option ${i}`,
        sub_label: `Sub label ${i}`
    }));
}

function generateGroupItems(groupCount: number, itemsPerGroup: number) {
    return Array.from({ length: groupCount }, (_, gIdx) => ({
        label: `Group ${gIdx}`,
        items: Array.from({ length: itemsPerGroup }, (_, iIdx) => ({
            value: `g_${gIdx}_val_${iIdx}`,
            name: `G${gIdx} Item ${iIdx}`,
            label: `G${gIdx} Item ${iIdx}`
        }))
    }));
}

describe('Cardinalidade: Coleções Virtualizadas (100, 1.000, 5.000 itens)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    const counts = [100, 1000, 5000];

    describe('MaxInputSelect - Limite de nós DOM com coleção grande', () => {
        for (const count of counts) it(`renderiza com ${count} itens limitando nós DOM na viewport`, async () => {
            const items = generateItems(count);

            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    options: items
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const renderedOptions = document.body.querySelectorAll('.max-select-option');

            // Cardinalidade: quando virtualizado (count >= 500), DOM não escala com N
            if (count >= 500) {
                expect(renderedOptions.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-select-spacer');
                expect(spacer).toBeTruthy();
            }
            else expect(renderedOptions.length).toBe(count);


            wrapper.unmount();
        });


        it('achata grupos em O(N) com 5.000 itens (50 grupos x 100 itens)', async () => {
            const groupOptions = generateGroupItems(50, 100);

            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    groupOptions
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const renderedOptions = document.body.querySelectorAll('.max-select-option');
            const spacer = document.body.querySelector('.max-select-spacer');

            // Cardinalidade: DOM virtualizado, não proporcional à coleção
            expect(spacer).toBeTruthy();
            expect(renderedOptions.length).toBeLessThan(60);

            wrapper.unmount();
        });
    });

    describe('MaxTagSelect - Limite de nós DOM com coleção grande', () => {
        for (const count of counts) it(`renderiza com ${count} itens limitando nós DOM`, async () => {
            const items = generateItems(count);

            const wrapper = mount(MaxTagSelect, {
                props: {
                    modelValue: null,
                    options: items
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const renderedOptions = document.body.querySelectorAll('.max-select-option');

            // Cardinalidade: DOM proporcional à viewport, não à coleção
            if (count >= 500) {
                expect(renderedOptions.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-select-spacer');
                expect(spacer).toBeTruthy();
            }
            else expect(renderedOptions.length).toBe(count);


            wrapper.unmount();
        });

    });

    describe('MaxInputAutoComplete - Limite de nós DOM com coleção grande', () => {
        for (const count of counts) it(`busca e renderiza sugestões com ${count} itens mantendo DOM proporcional à viewport`, async () => {
            const items = generateItems(count);

            const wrapper = mount(MaxInputAutoComplete, {
                props: {
                    modelValue: '',
                    options: items
                }
            });

            const input = wrapper.find('input');
            await input.setValue('Option');
            await wrapper.vm.$nextTick();

            const renderedItems = document.body.querySelectorAll('.max-autocomplete-item');

            // Cardinalidade: DOM proporcional à viewport, não à coleção
            if (count >= 500) {
                expect(renderedItems.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-autocomplete-spacer');
                expect(spacer).toBeTruthy();
            }
            else expect(renderedItems.length).toBe(count);


            wrapper.unmount();
        });

    });

    describe('MaxInputPhone - Limite de nós DOM com 237 países', () => {
        it('renderiza opções virtualizadas mantendo DOM proporcional à viewport', async () => {
            const wrapper = mount(MaxInputPhone, {
                props: {
                    modelValue: ''
                },
                attachTo: document.body
            });

            await wrapper.find('.max-phone-select').trigger('click');
            await wrapper.vm.$nextTick();

            const renderedOptions = document.body.querySelectorAll('.max-phone-select-option');
            const spacer = document.body.querySelector('.max-phone-select-spacer');

            // Cardinalidade: DOM virtualizado com menos de 40 opções visíveis
            expect(spacer).toBeTruthy();
            expect(renderedOptions.length).toBeLessThan(40);

            wrapper.unmount();
        });
    });
});
