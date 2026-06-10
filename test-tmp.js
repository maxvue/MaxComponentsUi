import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPopoverConfirm from './src/components/MaxPopoverConfirm.vue';
import { useConfirmStore } from './src/stores/useConfirm.Store';
import { ref } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useWindowSize: () => ({ width: ref(1024), height: ref(768) }),
        useElementSize: () => ({ width: ref(500), height: ref(500) })
    };
});

// simulate
const store = useConfirmStore();
store.x = 2000;
store.y = 2000;
store.height = 100;
store.show = true;

const wrapper = mount(MaxPopoverConfirm, {
    global: {
        stubs: {
            MaxButton: true,
            MaxIcon: { template: '<span class="max-icon"></span>' },
            MaxGrid: { template: '<div class="grid"><slot /></div>' },
            TransitionFade: { template: '<div><slot /></div>' }
        }
    }
});
console.log(wrapper.html());
