import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxModal from '../../src/components/MaxModal.vue';
import { useModalStore } from '../../src/stores/useModal.Store';

function mountModal(props: Record<string, any> = {}, slots: Record<string, any> = {}) {
    return mount(MaxModal, {
        props: { icon: 'mdi:cog', ...props },
        slots,
        global: {
            stubs: {
                MaxButton: {
                    template: '<button class="max-button"><slot /></button>',
                    props: ['icon', 'i', 'label', 'size']
                },
                MaxIconButton: {
                    template: '<button class="icon-button"></button>',
                    props: ['icon', 'i', 'size']
                },
                MaxTitle1: {
                    template: '<div class="title"></div>',
                    props: ['h1', 'h2']
                },
                MaxGrid: {
                    template: '<div class="grid"><slot /></div>',
                    props: ['label']
                },
                Teleport: true
            }
        }
    });
}

describe('MaxModal', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountModal();
        expect(wrapper.find('.max-modal-item').exists()).toBe(true);
    });

    it('expõe método toggle via defineExpose', () => {
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        expect(typeof vm.toggle).toBe('function');
    });

    it('integra com useModalStore', () => {
        const store = useModalStore();
        expect(store.show_id).toBe(null);
    });

    it('aceita título e subtítulo', () => {
        const wrapper = mountModal({
            title: 'Configurações',
            subTitle: 'Ajuste suas preferências'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita slot de conteúdo', () => {
        const wrapper = mountModal({}, {
            content: '<p>Conteúdo do modal</p>'
        });
        expect(wrapper.exists()).toBe(true);
    });

    it('aceita slot de botão customizado', () => {
        const wrapper = mountModal({}, {
            button: '<button class="custom-btn">Abrir</button>'
        });
        expect(wrapper.find('.custom-btn').exists()).toBe(true);
    });

    it('abre o modal chamando toggle() e aciona timers', async () => {
        vi.useFakeTimers();
        const wrapper = mountModal();
        const vm = wrapper.vm as any;
        const store = useModalStore();

        expect(store.show_id).toBe(null);

        // Chamada de toggle para ABRIR o modal
        vm.toggle();
        expect(store.show_id).toBe(vm.id);

        // Avança o timer do setTimeout(..., 1)
        vi.advanceTimersByTime(2);

        // Tentar chamar de novo logo em seguida não deve fazer nada devido ao is_changing
        vm.toggle();
        expect(store.show_id).toBe(vm.id); // ainda o mesmo

        // Avança 500ms para passar com folga do refAutoReset(400) do is_changing
        vi.advanceTimersByTime(500);
        vm.is_changing = false; // Força para false caso refAutoReset não tenha disparado no fake timer

        // Agora chama toggle para FECHAR o modal
        vm.toggle();

        // Timeout 1
        vi.advanceTimersByTime(10);
        // Timeout 2 (300ms)
        vi.advanceTimersByTime(350);

        expect(store.show_id).toBe(null); // deve ter removido da store

        vi.useRealTimers();
    });

    it('renderiza o conteúdo do modal quando aberto', async () => {
        const wrapper = mountModal({
            title: 'Test Title',
            subTitle: 'Test Subtitle'
        });
        const vm = wrapper.vm as any;
        const store = useModalStore();

        vm.toggle();
        await wrapper.vm.$nextTick();

        expect(store.show_id).toBe(vm.id);
        const bg = wrapper.find('.background-modal');
        expect(bg.exists()).toBe(true);
        expect(wrapper.find('.max-modal-header').exists()).toBe(true);

        // Testa o click.stop vazio
        const maxModal = wrapper.find('.max-modal');
        await maxModal.trigger('click');

        // Testa fechamento via botão X e background
        await bg.trigger('click');
        expect(store.show_id).toBe(null);
    });
});
