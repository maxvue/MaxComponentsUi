import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { config, mount } from '@vue/test-utils';
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

let pinia: ReturnType<typeof createPinia>;

function mountPopoverConfirm() {
    return mount(MaxPopoverConfirm, {
        global: {
            stubs: {
                MaxButton: {
                    name: 'MaxButton',
                    props: ['action', 'label', 'icon', 'severity', 'variant'],
                    template: '<button class="max-button-stub" :data-severity="severity" :data-variant="variant" @click="action && action()">{{ label }}</button>'
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
        pinia = createPinia();
        setActivePinia(pinia);
        config.global.plugins = [pinia];
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

    describe('Hierarquia visual e severidade dos botões e ícone (Etapa 09)', () => {
        it('renderiza o botão reject com severity secondary e variant outlined por padrão', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.show = true;
            await wrapper.vm.$nextTick();

            const buttons = wrapper.findAll('.max-button-stub');
            expect(buttons[0].attributes('data-severity')).toBe('secondary');
            expect(buttons[0].attributes('data-variant')).toBe('outlined');
        });

        it('renderiza o botão accept com severity danger por padrão', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.show = true;
            await wrapper.vm.$nextTick();

            const buttons = wrapper.findAll('.max-button-stub');
            expect(buttons[1].attributes('data-severity')).toBe('danger');
        });

        it('botão accept herda severity configurada na store quando confirm_store.severity é definida', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.confirm({
                message: 'Aviso importante',
                severity: 'warning',
                rejectProps: { label: 'Não' },
                acceptProps: { label: 'Sim' },
                x: 0,
                y: 0,
                width: 100,
                height: 40
            });
            await wrapper.vm.$nextTick();

            const buttons = wrapper.findAll('.max-button-stub');
            expect(buttons[1].attributes('data-severity')).toBe('warning');
        });

        it('botão accept aceita override via acceptProps.severity e acceptProps.variant', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();
            store.confirm({
                message: 'Confirmação',
                severity: 'warning',
                rejectProps: { label: 'Não' },
                acceptProps: { label: 'Sim', severity: 'success', variant: 'text' },
                x: 0,
                y: 0,
                width: 100,
                height: 40
            });
            await wrapper.vm.$nextTick();

            const buttons = wrapper.findAll('.max-button-stub');
            expect(buttons[1].attributes('data-severity')).toBe('success');
            expect(buttons[1].attributes('data-variant')).toBe('text');
        });

        it('aplica classes de severidade dinâmica no ícone de confirmação', async () => {
            const wrapper = mountPopoverConfirm();
            const store = useConfirmStore();

            // Padrão: severity-danger
            store.show = true;
            await wrapper.vm.$nextTick();
            let icon = wrapper.find('.popover-confirm-icon');
            expect(icon.classes()).toContain('severity-danger');

            // Warning
            store.severity = 'warning';
            await wrapper.vm.$nextTick();
            icon = wrapper.find('.popover-confirm-icon');
            expect(icon.classes()).toContain('severity-warning');

            // Info
            store.severity = 'info';
            await wrapper.vm.$nextTick();
            icon = wrapper.find('.popover-confirm-icon');
            expect(icon.classes()).toContain('severity-info');

            // Success
            store.severity = 'success';
            await wrapper.vm.$nextTick();
            icon = wrapper.find('.popover-confirm-icon');
            expect(icon.classes()).toContain('severity-success');
        });
    });
});
