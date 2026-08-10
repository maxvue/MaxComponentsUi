import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PrimeColumn from 'primevue/column';
import MaxTableColumn from '../../src/components/MaxTableColumn.vue';

vi.mock('@maxvue/max-use', () => ({
    useElementSize: () => ({ width: { value: 100 } })
}));

describe('MaxTableColumn.vue', () => {
    it('deve montar corretamente', () => {
        const wrapper = mount(MaxTableColumn, {
            global: {
                stubs: {
                    Column: true
                }
            }
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('não renderiza nenhum conteúdo (template vazio, componente sem lógica própria)', () => {
        const wrapper = mount(MaxTableColumn, {
            global: {
                stubs: {
                    Column: true
                }
            }
        });
        expect(wrapper.html()).toBe('');
        expect(wrapper.findAll('*').length).toBe(0);
    });

    it('o import de primevue/column resolve sem lançar erro', () => {
        expect(PrimeColumn).toBeDefined();
        expect(typeof PrimeColumn).not.toBe('undefined');
    });
});
