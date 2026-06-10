import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MaxMsgLabels from '../../src/components/MaxMsgLabels.vue';

function mountMsgLabels(props: Record<string, any> = {}) {
    return mount(MaxMsgLabels, { props });
}

describe('MaxMsgLabels', () => {
    it('renderiza corretamente', () => {
        const wrapper = mountMsgLabels();
        expect(wrapper.exists()).toBe(true);
    });

    it('não renderiza quando noErrors=true', () => {
        const wrapper = mountMsgLabels({ noErrors: true });
        expect(wrapper.find('.labels').exists()).toBe(false);
    });

    it('exibe indicador obrigatório quando obrigatorio=true', () => {
        const wrapper = mountMsgLabels({ obrigatorio: true });
        expect(wrapper.find('.obrigatorio').exists()).toBe(true);
        expect(wrapper.find('.obrigatorio').text()).toBe('*');
    });

    it('exibe mensagem de erro quando msgError é fornecido', () => {
        const wrapper = mountMsgLabels({ msgError: 'Campo inválido' });
        expect(wrapper.find('.erro').exists()).toBe(true);
        expect(wrapper.text()).toContain('Campo inválido');
    });

    it('exibe mensagem informativa quando msg é fornecido e sem erro', () => {
        const wrapper = mountMsgLabels({ msg: 'Dica: use letras' });
        expect(wrapper.find('.div_mensagem').exists()).toBe(true);
        expect(wrapper.text()).toContain('Dica: use letras');
    });

    it('erro tem prioridade sobre msg', () => {
        const wrapper = mountMsgLabels({ msgError: 'Erro', msg: 'Dica' });
        expect(wrapper.find('.erro').exists()).toBe(true);
        expect(wrapper.find('.div_mensagem').exists()).toBe(false);
    });

    it('aplica typeSelect como classe CSS', () => {
        const wrapper = mountMsgLabels({ typeSelect: 'select' });
        expect(wrapper.find('.labels.select').exists()).toBe(true);
    });
});
