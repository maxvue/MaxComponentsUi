import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxAttachmentList from '../../src/components/MaxAttachmentList.vue';

describe('MaxAttachmentList', () => {
    it('mostra estado vazio', () => {
        const wrapper = mount(MaxAttachmentList, { props: { files: [] } });
        expect(wrapper.text()).toContain('Nenhum anexo');
    });
});
