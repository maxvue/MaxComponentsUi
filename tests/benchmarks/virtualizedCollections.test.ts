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

describe('Benchmark: Coleções Virtualizadas (100, 1.000, 5.000 itens)', () => {
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
            const startTime = performance.now();

            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    options: items
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const duration = performance.now() - startTime;
            const renderedOptions = document.body.querySelectorAll('.max-select-option');

            // Quando virtualizado (count >= 500), DOM não escala com N
            if (count >= 500) {
                expect(renderedOptions.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-select-spacer');
                expect(spacer).toBeTruthy();
            } else expect(renderedOptions.length).toBe(count);


            expect(duration).toBeLessThan(2000);
            wrapper.unmount();
        });


        it('achata grupos em O(N) com 5.000 itens (50 grupos x 100 itens)', async () => {
            const groupOptions = generateGroupItems(50, 100);
            const startTime = performance.now();

            const wrapper = mount(MaxInputSelect, {
                props: {
                    modelValue: null,
                    groupOptions
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const duration = performance.now() - startTime;
            const renderedOptions = document.body.querySelectorAll('.max-select-option');
            const spacer = document.body.querySelector('.max-select-spacer');

            expect(spacer).toBeTruthy();
            expect(renderedOptions.length).toBeLessThan(60);
            expect(duration).toBeLessThan(2000);

            wrapper.unmount();
        });
    });

    describe('MaxTagSelect - Limite de nós DOM com coleção grande', () => {
        for (const count of counts) it(`renderiza com ${count} itens limitando nós DOM`, async () => {
            const items = generateItems(count);
            const startTime = performance.now();

            const wrapper = mount(MaxTagSelect, {
                props: {
                    modelValue: null,
                    options: items
                }
            });

            await wrapper.find('.max-select').trigger('click');
            await wrapper.vm.$nextTick();

            const duration = performance.now() - startTime;
            const renderedOptions = document.body.querySelectorAll('.max-select-option');

            if (count >= 500) {
                expect(renderedOptions.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-select-spacer');
                expect(spacer).toBeTruthy();
            } else expect(renderedOptions.length).toBe(count);


            expect(duration).toBeLessThan(2000);
            wrapper.unmount();
        });

    });

    describe('MaxInputAutoComplete - Limite de nós DOM com coleção grande', () => {
        for (const count of counts) it(`busca e renderiza sugestões com ${count} itens mantendo DOM proporcional à viewport`, async () => {
            const items = generateItems(count);
            const startTime = performance.now();

            const wrapper = mount(MaxInputAutoComplete, {
                props: {
                    modelValue: '',
                    options: items
                }
            });

            const input = wrapper.find('input');
            await input.setValue('Option');
            await wrapper.vm.$nextTick();

            const duration = performance.now() - startTime;
            const renderedItems = document.body.querySelectorAll('.max-autocomplete-item');

            if (count >= 500) {
                expect(renderedItems.length).toBeLessThan(60);
                const spacer = document.body.querySelector('.max-autocomplete-spacer');
                expect(spacer).toBeTruthy();
            } else expect(renderedItems.length).toBe(count);


            expect(duration).toBeLessThan(2000);
            wrapper.unmount();
        });

    });

    describe('MaxInputPhone - Limite de nós DOM com 237 países', () => {
        it('renderiza opções virtualizadas mantendo DOM proporcional à viewport', async () => {
            const startTime = performance.now();

            const wrapper = mount(MaxInputPhone, {
                props: {
                    modelValue: ''
                },
                attachTo: document.body
            });

            await wrapper.find('.max-phone-select').trigger('click');
            await wrapper.vm.$nextTick();

            const duration = performance.now() - startTime;
            const renderedOptions = document.body.querySelectorAll('.max-phone-select-option');
            const spacer = document.body.querySelector('.max-phone-select-spacer');

            expect(spacer).toBeTruthy();
            expect(renderedOptions.length).toBeLessThan(40);
            expect(duration).toBeLessThan(1000);

            wrapper.unmount();
        });
    });
});
