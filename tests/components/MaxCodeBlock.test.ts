import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxCodeBlock from '../../src/components/MaxCodeBlock.vue';

describe('MaxCodeBlock', () => {
    it('renderiza conteúdo como texto e limita linhas inicialmente', () => {
        const wrapper = mount(MaxCodeBlock, { props: { code: '<script>\nsegunda\nterceira', maxLines: 2 } });
        expect(wrapper.find('code').text()).toBe('<script>\nsegunda');
        expect(wrapper.find('script').exists()).toBe(false);
    });
});
