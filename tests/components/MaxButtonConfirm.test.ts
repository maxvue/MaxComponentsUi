import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxButtonConfirm from '../../src/components/MaxButtonConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';

let pinia: ReturnType<typeof createPinia>;

function mountButtonConfirm(props: Record<string, any> = {}) {
    return mount(MaxButtonConfirm, {
        props,
        global: {
            plugins: [pinia],
            stubs: {
                MaxButton: {
                    name: 'MaxButton',
                    template: '<button class="max-button-stub" @click="action && action()"></button>',
                    props: ['label', 'icon', 'i', 'blank', 'route', 'data', 'params', 'rotate', 'flip', 'size', 'scale', 'severity', 'variant', 'loading', 'width', 'height', 'dark', 'light', 'action']
                }
            }
        }
    });
}

describe('MaxButtonConfirm', () => {
    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
    });

    it('renderiza corretamente', () => {
        const wrapper = mountButtonConfirm();
        expect(wrapper.exists()).toBe(true);
        expect(wrapper.find('.max-button-stub').exists()).toBe(true);
    });

    it('ao clicar, chama confirm_store.confirm com message/messageIcon/rejectProps/acceptProps corretos', async () => {
        const store = useConfirmStore();
        expect(store.show).toBe(false);

        const acceptProps = { label: 'Confirmar', icon: 'mdi:check', action: () => {} };
        const rejectProps = { label: 'Cancelar', icon: 'mdi:close', action: () => {} };

        const wrapper = mountButtonConfirm({
            message: 'Excluir item?',
            messageIcon: 'mdi:alert',
            acceptProps,
            rejectProps
        });

        await wrapper.find('.max-button-stub').trigger('click');

        expect(store.show).toBe(true);
        expect(store.message).toBe('Excluir item?');
        expect(store.messageIcon).toBe('mdi:alert');
        expect(store.acceptProps).toEqual(acceptProps);
        expect(store.rejectProps).toEqual(rejectProps);
    });

    it('usa mensagem padrão "Deseja continuar?" quando nenhuma mensagem é informada', async () => {
        const store = useConfirmStore();
        const wrapper = mountButtonConfirm();

        await wrapper.find('.max-button-stub').trigger('click');

        expect(store.message).toBe('Deseja continuar?');
        expect(store.messageIcon).toBe(null);
        expect(store.rejectProps.label).toBe('Não');
        expect(store.acceptProps.label).toBe('Sim');
    });

    it('propaga posição (x/y/width/height) do elemento do botão para a store ao confirmar', async () => {
        const store = useConfirmStore();
        const wrapper = mountButtonConfirm();

        await wrapper.find('.max-button-stub').trigger('click');

        // useElementBounding em ambiente de teste (happy-dom) resolve para 0
        expect(store.x).toBe(0);
        expect(store.y).toBe(0);
        expect(store.width).toBe(0);
        expect(store.height).toBe(0);
    });

    it('encaminha props visuais (label, icon, severity, variant, etc.) para o MaxButton subjacente', () => {
        const wrapper = mountButtonConfirm({
            label: 'Excluir',
            icon: 'mdi:delete',
            severity: 'danger',
            variant: 'outlined',
            size: '2',
            loading: true,
            width: '100px',
            height: '40px'
        });

        const maxButton = wrapper.findComponent({ name: 'MaxButton' });
        expect(maxButton.exists()).toBe(true);
        expect(maxButton.props('label')).toBe('Excluir');
        expect(maxButton.props('icon')).toBe('mdi:delete');
        expect(maxButton.props('severity')).toBe('danger');
        expect(maxButton.props('variant')).toBe('outlined');
        expect(maxButton.props('size')).toBe('2');
        expect(maxButton.props('loading')).toBe(true);
        expect(maxButton.props('width')).toBe('100px');
        expect(maxButton.props('height')).toBe('40px');
    });

    it('não vaza message/messageIcon/rejectProps/acceptProps como atributos crus para o MaxButton (Etapa 7a)', () => {
        const wrapper = mountButtonConfirm({
            message: 'Mensagem customizada',
            messageIcon: 'mdi:info',
            rejectProps: { label: 'Não quero' },
            acceptProps: { label: 'Quero' }
        });

        const maxButton = wrapper.findComponent({ name: 'MaxButton' });
        expect(maxButton.exists()).toBe(true);

        // Nenhuma dessas props de confirmação deve chegar ao MaxButton (nem como prop, nem como attr)
        expect(maxButton.props('message')).toBeUndefined();
        expect(maxButton.props('messageIcon')).toBeUndefined();
        expect(maxButton.props('rejectProps')).toBeUndefined();
        expect(maxButton.props('acceptProps')).toBeUndefined();
        expect(maxButton.attributes('message')).toBeUndefined();
        expect(maxButton.attributes('messageicon')).toBeUndefined();
        expect(maxButton.attributes('rejectprops')).toBeUndefined();
        expect(maxButton.attributes('acceptprops')).toBeUndefined();
    });
});
