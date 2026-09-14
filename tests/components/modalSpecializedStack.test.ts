import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxModal from '../../src/components/MaxModal.vue';
import { useModalStore } from '../../src/stores/useModal.Store';
import { nextTick, defineComponent, h, ref } from 'vue';

const stubs = {
    MaxButton: {
        template: '<button class="max-button" v-bind="$attrs"><slot /></button>',
        props: ['icon', 'i', 'label', 'size', 'action']
    },
    MaxIconButton: {
        template: '<button class="icon-button" v-bind="$attrs"><slot /></button>',
        props: ['icon', 'i', 'size']
    },
    MaxTitle1: {
        template: '<div class="title" v-bind="$attrs"><slot /></div>',
        props: ['h1', 'h2', 'title', 'subtitle', 'subTitle']
    },
    MaxGrid: {
        template: '<div class="grid" v-bind="$attrs"><slot /></div>',
        props: ['label']
    },
    Teleport: true
};

// Modais especializados de referência para testar o contrato de empilhamento
const MaxModalAction = defineComponent({
    name: 'MaxModalAction',
    props: {
        id: { type: String, default: undefined },
        title: { type: String, default: 'Ação Principal' },
        visible: { type: Boolean, default: false }
    },
    emits: ['update:visible', 'closed'],
    setup(props, { emit, slots }) {
        return () => h(MaxModal, {
            id: props.id,
            title: props.title,
            visible: props.visible,
            'onUpdate:visible': (val: boolean) => emit('update:visible', val),
            onClosed: () => emit('closed')
        }, slots);
    }
});

const MaxModalConfirm = defineComponent({
    name: 'MaxModalConfirm',
    props: {
        id: { type: String, default: undefined },
        title: { type: String, default: 'Confirmar Ação' },
        visible: { type: Boolean, default: false }
    },
    emits: ['update:visible', 'confirm', 'cancel'],
    setup(props, { emit, slots }) {
        return () => h(MaxModal, {
            id: props.id,
            title: props.title,
            visible: props.visible,
            'onUpdate:visible': (val: boolean) => emit('update:visible', val)
        }, {
            default: () => [
                slots.default ? slots.default() : null,
                h('button', { id: 'btn-confirm-yes', onClick: () => emit('confirm') }, 'Sim'),
                h('button', { id: 'btn-confirm-no', onClick: () => emit('cancel') }, 'Não')
            ]
        });
    }
});

describe('modalSpecializedStack (R07 — F09 / E04-04)', () => {
    let pinia: ReturnType<typeof createPinia>;

    beforeEach(() => {
        pinia = createPinia();
        setActivePinia(pinia);
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    describe('Foco cíclico (Tab / Shift+Tab)', () => {
        it('mantém o foco cíclico dentro do modal: Tab no último elemento volta para o primeiro', async () => {
            const wrapper = mount(MaxModal, {
                props: { id: 'modal-tab-cycle', visible: true, title: 'Modal Cíclico' },
                slots: {
                    default: `
                        <input id="input-1" type="text" />
                        <button id="btn-middle">Meio</button>
                        <button id="btn-last">Último</button>
                    `
                },
                global: { stubs },
                attachTo: document.body
            });

            await nextTick();
            await nextTick();

            const modalEl = wrapper.find<HTMLElement>('.max-modal').element;
            const input1 = document.getElementById('input-1') as HTMLElement;
            const btnLast = document.getElementById('btn-last') as HTMLElement;
            const closeBtn = wrapper.find<HTMLElement>('.close-btn').element;

            expect(input1).not.toBeNull();
            expect(btnLast).not.toBeNull();

            // Foca o último elemento do modal
            btnLast.focus();
            expect(document.activeElement).toBe(btnLast);

            // Pressiona Tab no último elemento do modal -> deve mover foco para o primeiro focável
            const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
            modalEl.dispatchEvent(tabEvent);

            // O primeiro elemento focável no modal é o botão fechar do header
            expect(document.activeElement).toBe(closeBtn);

            wrapper.unmount();
        });

        it('mantém o foco cíclico dentro do modal: Shift+Tab no primeiro elemento vai para o último', async () => {
            const wrapper = mount(MaxModal, {
                props: { id: 'modal-shift-tab-cycle', visible: true, title: 'Modal Cíclico Reverso' },
                slots: {
                    default: `
                        <input id="input-first" type="text" />
                        <button id="btn-end">Final</button>
                    `
                },
                global: { stubs },
                attachTo: document.body
            });

            await nextTick();
            await nextTick();

            const modalEl = wrapper.find<HTMLElement>('.max-modal').element;
            const closeBtn = wrapper.find<HTMLElement>('.close-btn').element;
            const btnEnd = document.getElementById('btn-end') as HTMLElement;

            // Foca o primeiro elemento focável (botão fechar no header)
            closeBtn.focus();
            expect(document.activeElement).toBe(closeBtn);

            // Pressiona Shift+Tab no primeiro elemento -> deve mover para o último focável
            const shiftTabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            modalEl.dispatchEvent(shiftTabEvent);

            expect(document.activeElement).toBe(btnEnd);

            wrapper.unmount();
        });
    });

    describe('Cadeia de retorno de foco (Trigger -> Modal A -> Modal B -> fechar B -> A -> fechar A -> Trigger)', () => {
        it('restaura o foco corretamente em cadeia entre múltiplos modais e o gatilho externo', async () => {
            // Cria o gatilho inicial externo no DOM
            const triggerBtn = document.createElement('button');
            triggerBtn.id = 'external-trigger-btn';
            triggerBtn.textContent = 'Abrir Ação';
            document.body.appendChild(triggerBtn);
            triggerBtn.focus();
            expect(document.activeElement).toBe(triggerBtn);

            // Componente que orquestra Modal A (Action) abrindo Modal B (Confirm)
            const Orchestrator = defineComponent({
                components: { MaxModalAction, MaxModalConfirm },
                setup() {
                    const isActionOpen = ref(false);
                    const isConfirmOpen = ref(false);
                    return { isActionOpen, isConfirmOpen };
                },
                template: `
                    <div>
                        <MaxModalAction id="modal-chain-a" v-model:visible="isActionOpen" title="Modal Action A">
                            <input id="action-input" type="text" />
                            <button id="btn-open-confirm" @click="isConfirmOpen = true">Abrir Confirmação B</button>
                        </MaxModalAction>

                        <MaxModalConfirm id="modal-chain-b" v-model:visible="isConfirmOpen" title="Modal Confirm B" />
                    </div>
                `
            });

            const wrapper = mount(Orchestrator, {
                global: {
                    components: { MaxModalAction, MaxModalConfirm },
                    stubs
                },
                attachTo: document.body
            });

            const store = useModalStore();

            // 1. Abre Modal A a partir do triggerBtn
            wrapper.vm.isActionOpen = true;
            await nextTick();
            await nextTick();

            expect(store.stack.length).toBe(1);

            // Foca o botão dentro de A que abrirá B
            const btnOpenConfirm = document.getElementById('btn-open-confirm') as HTMLElement;
            expect(btnOpenConfirm).not.toBeNull();
            btnOpenConfirm.focus();
            expect(document.activeElement).toBe(btnOpenConfirm);

            // 2. Abre Modal B a partir do botão em A
            wrapper.vm.isConfirmOpen = true;
            await nextTick();
            await nextTick();

            expect(store.stack.length).toBe(2);
            expect(store.isTop('modal-chain-b')).toBe(true);

            // Foco inicial dentro de Modal B
            const btnConfirmYes = document.getElementById('btn-confirm-yes') as HTMLElement;
            expect(btnConfirmYes).not.toBeNull();

            // 3. Fecha Modal B -> Foco deve retornar exatamente para btnOpenConfirm dentro de Modal A
            wrapper.vm.isConfirmOpen = false;
            await nextTick();
            await nextTick();
            await nextTick();

            expect(store.stack.length).toBe(1);
            expect(document.activeElement).toBe(btnOpenConfirm);

            // 4. Fecha Modal A -> Foco deve retornar para o gatilho externo triggerBtn
            wrapper.vm.isActionOpen = false;
            await nextTick();
            await nextTick();
            await nextTick();

            expect(store.stack.length).toBe(0);
            expect(document.activeElement).toBe(triggerBtn);

            wrapper.unmount();
            triggerBtn.remove();
        });
    });

    describe('Ownership centralizado do listener de Escape', () => {
        it('quando múltiplos modais estão empilhados, tecla Escape fecha apenas o modal do topo', async () => {
            const Orchestrator = defineComponent({
                components: { MaxModal },
                setup() {
                    const isAOpen = ref(true);
                    const isBOpen = ref(true);
                    return { isAOpen, isBOpen };
                },
                template: `
                    <div>
                        <MaxModal id="esc-modal-a" v-model:visible="isAOpen" title="Modal A">
                            <div id="content-a">Conteúdo A</div>
                        </MaxModal>
                        <MaxModal id="esc-modal-b" v-model:visible="isBOpen" title="Modal B">
                            <div id="content-b">Conteúdo B</div>
                        </MaxModal>
                    </div>
                `
            });

            const wrapper = mount(Orchestrator, {
                global: {
                    components: { MaxModal },
                    stubs
                },
                attachTo: document.body
            });

            const store = useModalStore();
            await nextTick();
            await nextTick();

            expect(store.stack.length).toBe(2);
            expect(store.isTop('esc-modal-b')).toBe(true);

            // Dispara Escape no document
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
            await nextTick();
            await nextTick();

            // Apenas Modal B (o topo) deve ter fechado; Modal A permanece aberto
            expect(wrapper.vm.isBOpen).toBe(false);
            expect(wrapper.vm.isAOpen).toBe(true);
            expect(store.stack.length).toBe(1);
            expect(store.isTop('esc-modal-a')).toBe(true);

            // Dispara Escape novamente -> agora Modal A fecha
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
            await nextTick();
            await nextTick();

            expect(wrapper.vm.isAOpen).toBe(false);
            expect(store.stack.length).toBe(0);

            wrapper.unmount();
        });
    });

    describe('Unmount e recuperação do topo da pilha', () => {
        it('ao desmontar o modal do topo sem close explícito, o modal inferior reassume o topo e o trap', async () => {
            const store = useModalStore();

            const wrapperA = mount(MaxModal, {
                props: { id: 'unmount-modal-a', visible: true, title: 'Modal Base' },
                global: { stubs },
                attachTo: document.body
            });
            await nextTick();

            const wrapperB = mount(MaxModal, {
                props: { id: 'unmount-modal-b', visible: true, title: 'Modal Topo' },
                global: { stubs },
                attachTo: document.body
            });
            await nextTick();

            expect(store.stack.length).toBe(2);
            expect(store.isTop('unmount-modal-b')).toBe(true);
            expect(store.isTop('unmount-modal-a')).toBe(false);

            const modalAEl = wrapperA.find('.max-modal');
            expect(modalAEl.attributes('aria-hidden')).toBe('true');
            expect(modalAEl.attributes('inert')).toBeDefined();

            // Desmonta o modal do topo (wrapperB)
            wrapperB.unmount();
            await nextTick();
            await nextTick();

            // Modal A automaticamente reassume o topo da pilha
            expect(store.stack.length).toBe(1);
            expect(store.isTop('unmount-modal-a')).toBe(true);

            expect(modalAEl.attributes('aria-hidden')).toBeUndefined();
            expect(modalAEl.attributes('inert')).toBeUndefined();
            expect(modalAEl.attributes('aria-modal')).toBe('true');

            wrapperA.unmount();
            expect(store.stack.length).toBe(0);
        });
    });

    describe('Nested Stack de 3 camadas', () => {
        it('suporta empilhamento de 3 modais especializados mantendo isolamento estrito', async () => {
            const store = useModalStore();

            const wrapper1 = mount(MaxModalAction, {
                props: { id: 'nest-1', visible: true, title: 'Nível 1' },
                global: { stubs },
                attachTo: document.body
            });
            await nextTick();

            const wrapper2 = mount(MaxModalAction, {
                props: { id: 'nest-2', visible: true, title: 'Nível 2' },
                global: { stubs },
                attachTo: document.body
            });
            await nextTick();

            const wrapper3 = mount(MaxModalConfirm, {
                props: { id: 'nest-3', visible: true, title: 'Nível 3' },
                global: { stubs },
                attachTo: document.body
            });
            await nextTick();

            expect(store.stack.length).toBe(3);

            const modal1 = wrapper1.find('.max-modal');
            const modal2 = wrapper2.find('.max-modal');
            const modal3 = wrapper3.find('.max-modal');

            // Apenas o nível 3 é ativo
            expect(modal3.attributes('aria-modal')).toBe('true');
            expect(modal3.attributes('inert')).toBeUndefined();

            // Níveis 1 e 2 são inertes
            expect(modal1.attributes('inert')).toBeDefined();
            expect(modal2.attributes('inert')).toBeDefined();

            // Fecha nível 3
            await wrapper3.setProps({ visible: false });
            await nextTick();

            expect(store.stack.length).toBe(2);
            expect(modal2.attributes('aria-modal')).toBe('true');
            expect(modal2.attributes('inert')).toBeUndefined();
            expect(modal1.attributes('inert')).toBeDefined();

            // Fecha nível 2
            await wrapper2.setProps({ visible: false });
            await nextTick();

            expect(store.stack.length).toBe(1);
            expect(modal1.attributes('aria-modal')).toBe('true');
            expect(modal1.attributes('inert')).toBeUndefined();

            // Fecha nível 1
            await wrapper1.setProps({ visible: false });
            await nextTick();

            expect(store.stack.length).toBe(0);

            wrapper1.unmount();
            wrapper2.unmount();
            wrapper3.unmount();
        });
    });
});
