import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxIconConfirm from '../../src/components/MaxIconConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

let pinia: ReturnType<typeof createPinia>;

function mountIconConfirm(props: Record<string, any> = {}) {
    return mount(MaxIconConfirm, {
        props: { icon: 'mdi:delete', ...props },
        global: {
            plugins: [pinia],
            stubs: {
                MaxIconButton: {
                    name: 'MaxIconButton',
                    template: '<button class="icon-button"></button>',
                    props: ['icon', 'i', 'dark', 'light']
                }
            }
        }
    });
}

describe('MaxIconConfirm', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('renderiza corretamente', () => {
        const wrapper = mountIconConfirm();
        expect(wrapper.exists()).toBe(true);
    });

    it('integra com useConfirmStore e propaga dados ao clicar', async () => {
        const store = useConfirmStore();
        expect(store.show).toBe(false);

        const wrapper = mountIconConfirm({ message: 'Excluir?' });

        const vm = wrapper.vm as any;
        vm.onClickToggle();

        expect(store.x).toBe(0);
        expect(store.y).toBe(0);
        expect(store.width).toBe(0);
        expect(store.height).toBe(0);
        expect(store.show).toBe(true);
        expect(store.message).toBe('Excluir?');
    });

    it('mensagem padrão é "Deseja continuar?"', () => {
        const wrapper = mountIconConfirm();
        expect((wrapper.vm as any).message).toBe('Deseja continuar?');
    });

    it('aceita acceptProps e rejectProps customizados', () => {
        let chamado = false;
        const wrapper = mountIconConfirm({
            acceptProps: { label: 'Confirmar', action: () => { chamado = true; } },
            rejectProps: { label: 'Cancelar', action: () => {} }
        });

        const vm = wrapper.vm as any;
        expect(vm.acceptProps.label).toBe('Confirmar');
        expect(vm.rejectProps.label).toBe('Cancelar');

        vm.acceptProps.action();
        expect(chamado).toBe(true);
    });

    it('não vaza message/messageIcon/rejectProps/acceptProps como atributos crus para o MaxIconButton', () => {
        const wrapper = mountIconConfirm({
            message: 'Mensagem customizada',
            messageIcon: 'mdi:info',
            rejectProps: { label: 'Não quero' },
            acceptProps: { label: 'Quero' }
        });

        const maxIconButton = wrapper.findComponent({ name: 'MaxIconButton' });
        expect(maxIconButton.exists()).toBe(true);

        // Nenhuma dessas props de confirmação deve chegar ao MaxIconButton (nem como prop, nem como attr)
        expect(maxIconButton.props('message')).toBeUndefined();
        expect(maxIconButton.props('messageIcon')).toBeUndefined();
        expect(maxIconButton.props('rejectProps')).toBeUndefined();
        expect(maxIconButton.props('acceptProps')).toBeUndefined();
        expect(maxIconButton.attributes('message')).toBeUndefined();
        expect(maxIconButton.attributes('messageicon')).toBeUndefined();
        expect(maxIconButton.attributes('rejectprops')).toBeUndefined();
        expect(maxIconButton.attributes('acceptprops')).toBeUndefined();
    });
});
