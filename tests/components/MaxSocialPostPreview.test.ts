import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxSocialPostPreview from '../../src/components/MaxSocialPostPreview.vue';

describe('MaxSocialPostPreview', () => {
    it('mostra estado vazio sem imagens', () => {
        const wrapper = mount(MaxSocialPostPreview, { props: { author: 'Equipe', media: [] } });
        expect(wrapper.text()).toContain('Sem imagem para pré-visualizar');
    });
});
