import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { defineComponent, h, nextTick, ref } from 'vue';
import MaxModal from '../../src/components/MaxModal.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxTagSelect from '../../src/components/MaxTagSelect.vue';
import { provideModalContext } from '../../src/helpers/modalContext';
import { useOverlayZIndex } from '../../src/composables/useOverlayZIndex';

describe('Z-Index de Selects em Modais', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('MaxInputSelect fora de modal utiliza z-index padrão de dropdown', async () => {
        const wrapper = mount(MaxInputSelect, {
            props: {
                modelValue: null,
                options: [
                    { value: 1, label: 'Opção 1' },
                    { value: 2, label: 'Opção 2' }
                ]
            },
            attachTo: document.body
        });

        const trigger = wrapper.find('.max-select');
        await trigger.trigger('click');
        await nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();
        expect(overlay.style.zIndex).toContain('var(--max-z-index-dropdown, var(--max-layer-dropdown, 1000))');

        wrapper.unmount();
    });

    it('MaxInputSelect dentro de MaxModal recebe z-index superior ao do modal (calc(1310 + 10))', async () => {
        const TestContainer = defineComponent({
            components: { MaxModal, MaxInputSelect },
            setup() {
                const selected = ref(null);
                const options = [
                    { value: 'a', label: 'Item A' },
                    { value: 'b', label: 'Item B' }
                ];
                return { selected, options };
            },
            template: `
                <MaxModal visible noButton noHeader id="modal-test">
                    <template #default>
                        <MaxInputSelect v-model="selected" :options="options" />
                    </template>
                </MaxModal>
            `
        });

        const wrapper = mount(TestContainer, {
            attachTo: document.body
        });

        await nextTick();

        const modalEl = document.body.querySelector('.max-modal') as HTMLElement;
        expect(modalEl).not.toBeNull();
        expect(modalEl.style.zIndex).toContain('1310');

        const selectWrapper = wrapper.findComponent(MaxInputSelect);
        expect(selectWrapper.exists()).toBe(true);
        await selectWrapper.find('.max-select').trigger('click');
        await nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();
        expect(overlay.style.zIndex).toContain('calc(var(--max-layer-modal, 1310) + 10)');

        wrapper.unmount();
    });

    it('MaxTagSelect dentro de MaxModal recebe z-index superior ao do modal', async () => {
        const TestContainer = defineComponent({
            components: { MaxModal, MaxTagSelect },
            setup() {
                const selected = ref([]);
                const options = [
                    { value: 1, label: 'Tag 1' },
                    { value: 2, label: 'Tag 2' }
                ];
                return { selected, options };
            },
            template: `
                <MaxModal visible noButton noHeader id="modal-tag-test">
                    <template #default>
                        <MaxTagSelect v-model="selected" :options="options" />
                    </template>
                </MaxModal>
            `
        });

        const wrapper = mount(TestContainer, {
            attachTo: document.body
        });

        await nextTick();

        const tagWrapper = wrapper.findComponent(MaxTagSelect);
        expect(tagWrapper.exists()).toBe(true);
        await tagWrapper.find('.max-select').trigger('click');
        await nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();
        expect(overlay.style.zIndex).toContain('calc(var(--max-layer-modal, 1310) + 10)');

        wrapper.unmount();
    });

    it('MaxInputSelect em modal aninhado acompanha o z-index de profundidade do modal', async () => {
        const ChildSelect = defineComponent({
            components: { MaxInputSelect },
            template: '<MaxInputSelect :modelValue="null" :options="[{ value: 1, label: \'X\' }]" />'
        });

        const NestedContainer = defineComponent({
            setup() {
                provideModalContext({
                    zIndex: 'calc(var(--max-layer-modal, 1310) + 20)',
                    modalDepth: 1
                });
                return {};
            },
            render() {
                return h(ChildSelect);
            }
        });

        const wrapper = mount(NestedContainer, { attachTo: document.body });
        await nextTick();

        const trigger = wrapper.find('.max-select');
        await trigger.trigger('click');
        await nextTick();

        const overlay = document.body.querySelector('.max-select-overlay') as HTMLElement;
        expect(overlay).not.toBeNull();
        expect(overlay.style.zIndex).toContain('calc(calc(var(--max-layer-modal, 1310) + 20) + 10)');

        wrapper.unmount();
    });

    it('useOverlayZIndex resolve z-index de container DOM quando injection não está presente', () => {
        const dummyModal = document.createElement('div');
        dummyModal.className = 'max-modal';
        dummyModal.style.zIndex = '1350';

        const triggerEl = document.createElement('div');
        dummyModal.appendChild(triggerEl);
        document.body.appendChild(dummyModal);

        const zIndex = useOverlayZIndex({ target: triggerEl, layer: 'dropdown' });
        expect(zIndex.value).toBe(1360);

        document.body.removeChild(dummyModal);
    });
});
