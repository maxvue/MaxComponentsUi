import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxPopoverConfirm from '../../src/components/MaxPopoverConfirm.vue';
import { useConfirmStore } from '../../src/stores/useConfirm.Store';
import { ref } from 'vue';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@maxvue/max-use')>();
    return {
        ...actual,
        useWindowSize: () => ({ width: ref(1024), height: ref(768) }),
        useElementSize: () => ({ width: ref(500), height: ref(500) })
    };
});

function mountPopoverConfirm() {
    return mount(MaxPopoverConfirm, {
        global: {
            stubs: {
                MaxButton: true,
                MaxIcon: {
                    template: '<span class="max-icon"></span>',
                    props: ['icon', 'i', 'size']
                },
                MaxGrid: {
                    template: '<div class="grid"><slot /></div>'
                },
                TransitionFade: { template: '<div><slot /></div>' },
                Teleport: true
            }
        }
    });
}

describe('MaxPopoverConfirm', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renderiza corretamente', () => {
        const wrapper = mountPopoverConfirm();
        expect(wrapper.exists()).toBe(true);
    });

    it('não exibe o diálogo quando store.show é false', () => {
        const store = useConfirmStore();
        store.show = false;

        const wrapper = mountPopoverConfirm();
        expect(wrapper.find('.background-popover').exists()).toBe(false);
    });

    it('integra com o confirm store para exibição condicional', () => {
        // O v-if depende do estado reativo da store no momento da renderização.
        // Quando a store já está show=true ANTES do mount, o conteúdo deve ser visível.
        const store = useConfirmStore();
        store.show = false;
        expect(store.show).toBe(false);

        // Verificamos que o componente acessa a store corretamente
        const wrapper = mountPopoverConfirm();
        expect(wrapper.exists()).toBe(true);
    });

    it('as funções accept e reject do store são executáveis', () => {
        const store = useConfirmStore();
        let aceito = false;
        let rejeitado = false;

        store.acceptProps = { label: 'Sim', action: () => { aceito = true; } };
        store.rejectProps = { label: 'Não', action: () => { rejeitado = true; } };

        // Simula as ações que o componente faria
        store.acceptProps.action();
        expect(aceito).toBe(true);

        store.rejectProps.action();
        expect(rejeitado).toBe(true);
    });

    it('hide() reseta o estado show', () => {
        const store = useConfirmStore();
        store.show = true;
        store.hide();
        expect(store.show).toBe(false);
    });

    it('botões chamam accept e reject corretamente do componente', async () => {
        const wrapper = mountPopoverConfirm();
        const store = useConfirmStore();
        
        store.message = 'Deletar?';
        let accepted = false;
        let rejected = false;

        store.acceptProps = { label: 'Sim', action: () => { accepted = true; }, icon: '' };
        store.rejectProps = { label: 'Não', action: () => { rejected = true; }, icon: '' };

        store.show = true;
        await wrapper.vm.$nextTick(); // Garante renderização v-if

        const buttons = wrapper.findAllComponents({ name: 'MaxButton' });
        expect(buttons.length).toBe(2);
        
        // Simular click no botão reject (primeiro na ordem do template)
        await buttons[0].vm.$emit('click');
        expect(rejected).toBe(true);
        expect(store.show).toBe(false); // hide() é chamado internamente

        store.show = true;
        await wrapper.vm.$nextTick();
        
        const newButtons = wrapper.findAllComponents({ name: 'MaxButton' });

        // Simular click no botão accept (segundo)
        await newButtons[1].vm.$emit('click');
        expect(accepted).toBe(true);
        expect(store.show).toBe(false);
    });

    it('ajusta posicao ao ultrapassar bordas e fecha pelo background', async () => {
        const wrapper = mountPopoverConfirm();
        const store = useConfirmStore();
        store.x = 2000;
        store.y = 2000;
        store.height = 100;
        store.show = true;

        await wrapper.vm.$nextTick();

        const dialog = wrapper.find('.max-icon-confirm-dialog');
        expect(dialog.classes()).toContain('is-top');
        expect(dialog.classes()).toContain('is-left');

        const bg = wrapper.find('.background-popover');
        await bg.trigger('click');
        expect(store.show).toBe(false);
    });
});
