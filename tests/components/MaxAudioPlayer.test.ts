import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAudioPlayer from '../../src/components/MaxAudioPlayer.vue';

describe('MaxAudioPlayer', () => {
    it('recusa protocolo executável e não habilita velocidade', () => {
        const wrapper = mount(MaxAudioPlayer, { props: { src: 'javascript:alert(1)' }, global: { stubs: { MaxButton: { template: '<button :disabled="$attrs.disabled"><slot /></button>' } } } });
        expect(wrapper.find('audio').attributes('src')).toBeUndefined();
        expect(wrapper.text()).toContain('Fonte de áudio inválida');
    });
});
