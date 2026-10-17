import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxSaveIndicator from '../../src/components/MaxSaveIndicator.vue';

describe('MaxSaveIndicator', () => {
    it('não apresenta sucesso quando há erro e emite retry', async () => {
        const wrapper = mount(MaxSaveIndicator, { props: { state: 'error', retryable: true }, global: { stubs: { MaxButton: { inheritAttrs: false, emits: ['click'], template: '<button @click="$emit(\'click\', $event)"><slot /></button>' } } } });
        await wrapper.find('button').trigger('click');
        expect(wrapper.text()).toContain('Falha ao salvar');
        expect(wrapper.emitted('retry')).toHaveLength(1);
    });
});
