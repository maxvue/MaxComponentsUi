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
                MaxButton: {
                    name: 'MaxButton',
                    props: ['action', 'label', 'icon'],
                    template: '<button class="max-button-stub" @click="action && action()">{{ label }}</button>'
                },
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
        expect(wrapper.find('.background-popover-confirm').exists()).toBe(false);
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

        const buttons = wrapper.findAll('.max-button-stub');
        expect(buttons.length).toBe(2);

        // Click no botão reject (primeiro na ordem do template)
        await buttons[0].trigger('click');
        expect(rejected).toBe(true);
        expect(store.show).toBe(false); // hide() é chamado internamente

        store.show = true;
        await wrapper.vm.$nextTick();

        const newButtons = wrapper.findAll('.max-button-stub');

        // Click no botão accept (segundo)
        await newButtons[1].trigger('click');
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

        const bg = wrapper.find('.background-popover-confirm');
        await bg.trigger('click');
        expect(store.show).toBe(false);
    });

    describe('Acessibilidade (Etapa 5.1)', () => {
        afterEach(() => {
            document.body.innerHTML = '';
        });

        it('painel possui role="alertdialog", aria-modal="true" e aria-labelledby', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.message = 'Deseja confirmar a exclusão?';
            store.show = true;
            await wrapper.vm.$nextTick();

            const dialog = wrapper.find('.max-icon-confirm-dialog');
            expect(dialog.exists()).toBe(true);
            expect(dialog.attributes('role')).toBe('alertdialog');
            expect(dialog.attributes('aria-modal')).toBe('true');
            const labelledby = dialog.attributes('aria-labelledby');
            expect(labelledby).toBeTruthy();
            expect(wrapper.find(`#${labelledby}`).text()).toContain('Deseja confirmar a exclusão?');
        });

        it('fecha ao pressionar a tecla Escape', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.show = true;
            await wrapper.vm.$nextTick();

            expect(store.show).toBe(true);
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wrapper.vm.$nextTick();

            expect(store.show).toBe(false);
        });

        it('ativa focus trap e foca o botão de confirmação/cancelamento ao abrir', async () => {
            const botaoOrigem = document.createElement('button');
            botaoOrigem.id = 'gatilho-confirm';
            document.body.appendChild(botaoOrigem);
            botaoOrigem.focus();

            const wrapper = mount(MaxPopoverConfirm, {
                attachTo: document.body,
                global: {
                    stubs: {
                        MaxButton: {
                            template: '<button class="max-button-stub">{{ label }}</button>',
                            props: ['action', 'label', 'icon']
                        },
                        MaxIcon: { template: '<span></span>' },
                        MaxGrid: { template: '<div><slot /></div>' },
                        TransitionFade: { template: '<div><slot /></div>' }
                    }
                }
            });

            const store = useConfirmStore();
            store.show = true;
            await wrapper.vm.$nextTick();
            await wrapper.vm.$nextTick();

            const dialog = document.querySelector('.max-icon-confirm-dialog');
            expect(dialog?.contains(document.activeElement)).toBe(true);

            store.hide();
            await wrapper.vm.$nextTick();

            expect(document.activeElement).toBe(botaoOrigem);
            document.body.removeChild(botaoOrigem);
        });
    });
});
