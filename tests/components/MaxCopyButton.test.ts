import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxCopyButton from '../../src/components/MaxCopyButton.vue';

vi.mock('@maxvue/max-use', () => ({ useClipboardItems: () => ({ copy: vi.fn().mockResolvedValue(undefined), isSupported: { value: true } }) }));

describe('MaxCopyButton', () => {
    it('não copia texto vazio', async () => {
        const wrapper = mount(MaxCopyButton, { props: { text: '' }, global: { stubs: { MaxButton: { template: '<button :disabled="$attrs.disabled" @click="$emit(\'click\')"><slot /></button>' } } } });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('copied')).toBeUndefined();
    });
});
