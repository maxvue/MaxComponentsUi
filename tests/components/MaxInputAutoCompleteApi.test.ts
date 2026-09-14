import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        getCachedApiIDB: vi.fn(() => Promise.resolve([{ label: 'Test', value: '1', model: 'Model Test', sub_label: 'Sub Test' }]))
    };
});

function mountAutoCompleteApi(props: Record<string, any> = {}, attrs: Record<string, any> = {}) {
    return mount(MaxInputAutoCompleteApi, {
        props: { route: '/api/test', modelValue: '', ...props },
        attrs,
        global: {
            stubs: {
                InputBase: {
                    template: '<div class="input-base"><slot /></div>',
                    props: ['done', 'caution']
                }
            }
        }
    });
}

describe('MaxInputAutoCompleteApi.vue', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('deve renderizar o componente', () => {
        const wrapper = mountAutoCompleteApi();
        expect(wrapper.exists()).toBe(true);
    });

    it('não busca dados da API no mount se valor inicial estiver abaixo do minLength (F13)', async () => {
        vi.useFakeTimers();
        const wrapper = mountAutoCompleteApi({ data: { category: 1 }, modelValue: '', minLength: 1, delay: 300 });
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(500);
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('busca dados da API no mount quando valor inicial atender minLength após delay (F13)', async () => {
        vi.useFakeTimers();
        const wrapper = mountAutoCompleteApi({ data: { category: 1 }, modelValue: 'painel', minLength: 1, delay: 300 });
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).toHaveBeenCalledTimes(1);
        const [url, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
        expect(url).toBe('/api/test');
        expect(payload).toEqual({ category: 1, input_value: 'painel' });

        vi.useRealTimers();
    });

    it('busca dados no mount com minLength=0 e delay=0', async () => {
        const wrapper = mountAutoCompleteApi({ data: { category: 1 }, minLength: 0, delay: 0 });
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).toHaveBeenCalled();
        const [url, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
        expect(url).toBe('/api/test');
        expect(payload).toEqual({ category: 1, input_value: '' });

        // resolve promise
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect((wrapper.vm as any).list.length).toBe(1);
    });

    it('não busca dados da API se data for em branco e não mudar', async () => {
        const wrapper = mountAutoCompleteApi({ data: null, minLength: 0, delay: 0 });
        await wrapper.vm.$nextTick();
        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();
    });

    it('não envia objeto complexo no input_value quando modelValue for objeto', async () => {
        const wrapper = mountAutoCompleteApi({
            data: { category: 1 },
            modelValue: { id: '123', name: 'Painel Solar', specs: { voc: 40, isc: 10 } },
            minLength: 0,
            delay: 0
        });
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).toHaveBeenCalled();
        const [, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
        expect(payload).toEqual({ category: 1, input_value: '' });
    });

    it('atualiza o valor quando modificado via props (não sobrescreve list)', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).temp_value = '1';
        expect((wrapper.vm as any).temp_value).toBe('1');
    });

    it('calcula temp_value_string corretamente', () => {
        const wrapper = mountAutoCompleteApi({ modelValue: 'string_value' });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('string_value');

        vm.temp_value = { value: 'obj_value' };
        expect(vm.temp_value_string).toBe('obj_value');

        vm.temp_value = { label: 'obj_label' };
        expect(vm.temp_value_string).toBe('obj_label');

        vm.temp_value = { id: 'obj_id' };
        expect(vm.temp_value_string).toBe('obj_id');

        vm.temp_value = {};
        expect(vm.temp_value_string).toBe('');
    });

    it('retorna string vazia se temp_value não for string/object com prop', () => {
        const wrapper = mountAutoCompleteApi({ modelValue: null });
        const vm = wrapper.vm as any;
        expect(vm.temp_value_string).toBe('');
    });

    it('calcula isDone corretamente no blur', async () => {
        const wrapper = mountAutoCompleteApi({ required: true, modelValue: '' });
        await wrapper.find('input').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(false);
    });

    it('calcula isDone = true quando required e tem valor no blur', async () => {
        const wrapper = mountAutoCompleteApi({ required: true, modelValue: 'algum valor' });
        await wrapper.find('input').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('respeita prop done explícita', async () => {
        const wrapper = mountAutoCompleteApi({ done: true });
        await wrapper.find('input').trigger('blur');
        expect((wrapper.vm as any).isDone).toBe(true);
    });

    it('testIsDone usa caution invertida caso isRequired não exista', () => {
        const wrapper = mountAutoCompleteApi({ caution: true });
        const done = (wrapper.vm as any).testIsDone();
        expect(done).toBe(false);
    });

    it('executa search e filtra corretamente', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).list = [
            { label: 'Maçã', value: 'apple', sub_label: 'Fruit' },
            { name: 'Banana', value: 'banana', sub_label: 'Fruit' }
        ];

        (wrapper.vm as any).temp_value = 'açã';
        await wrapper.vm.$nextTick();

        const filtered = (wrapper.vm as any).filtered_values;
        expect(filtered.length).toBe(1);
        expect(filtered[0].value).toBe('apple');
    });

    it('emite update:modelValue apenas se for object', async () => {
        const wrapper = mountAutoCompleteApi();

        (wrapper.vm as any).temp_value = 'some_str';
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')).toBeFalsy();

        const obj = { value: 'val' };
        (wrapper.vm as any).temp_value = obj;
        await wrapper.vm.$nextTick();
        expect(wrapper.emitted('update:modelValue')?.[0][0]).toEqual(obj);
    });

    it('renderiza o slot de option corretamente', async () => {
        const wrapper = mountAutoCompleteApi({ data: { fetch: 1 }, delay: 0 });
        await wrapper.vm.$nextTick();

        const input = wrapper.find('input');
        await input.setValue('Test');
        await wrapper.vm.$nextTick();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await wrapper.vm.$nextTick();

        const labelEl = document.body.querySelector('.autocomplete-item-select-label');
        const subLabelEl = document.body.querySelector('.autocomplete-item-select-sub-label');

        expect(labelEl?.textContent?.trim()).toBe('Model Test');
        expect(subLabelEl?.textContent?.trim()).toBe('Sub Test');
    });

    it('rejeita respostas obsoletas e mantém apenas a da rota/dados mais recente (E05-04)', async () => {
        let resolveA: any;
        const promiseA = new Promise((resolve) => { resolveA = resolve; });

        (maxUse.getCachedApiIDB as any).mockImplementation((route: string) => {
            if (route === '/api/route-a') return promiseA;
            if (route === '/api/route-b') return Promise.resolve([{ label: 'Item B', value: 'b' }]);
            return Promise.resolve([]);
        });

        const wrapper = mountAutoCompleteApi({ route: '/api/route-a', data: { v: 1 }, minLength: 0, delay: 0 });
        await wrapper.vm.$nextTick();

        // Altera para rota B antes de A resolver
        await wrapper.setProps({ route: '/api/route-b', data: { v: 2 } });
        await wrapper.vm.$nextTick();
        await new Promise((r) => setTimeout(r, 10));

        // Rota B deve ter sido aplicada
        expect((wrapper.vm as any).list).toEqual([{ label: 'Item B', value: 'b' }]);

        // Agora a rota A antiga finalmente resolve
        resolveA([{ label: 'Item A', value: 'a' }]);
        await new Promise((r) => setTimeout(r, 10));
        await wrapper.vm.$nextTick();

        // O resultado deve continuar sendo B, A foi descartada
        expect((wrapper.vm as any).list).toEqual([{ label: 'Item B', value: 'b' }]);
        wrapper.unmount();
    });

    it('cancela controller e aborta requisição ativa no desmonte do componente (E05-04)', async () => {
        let capturedSignal: AbortSignal | undefined;
        (maxUse.getCachedApiIDB as any).mockImplementation((_route: string, _params: any, _cache: any, _ttl: any, _cb: any, opts: any) => {
            capturedSignal = opts?.signal;
            return new Promise(() => {}); // never resolves
        });

        const wrapper = mountAutoCompleteApi({ data: { fetch: 1 }, minLength: 0, delay: 0 });
        await wrapper.vm.$nextTick();

        expect(capturedSignal).toBeDefined();
        expect(capturedSignal?.aborted).toBe(false);

        wrapper.unmount();
        expect(capturedSignal?.aborted).toBe(true);
    });

    it('não dispara busca na alteração de route ou data quando abaixo do minLength', async () => {
        vi.useFakeTimers();
        const wrapper = mountAutoCompleteApi({ route: '/api/test-1', data: { v: 1 }, modelValue: '', minLength: 2 });
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(500);
        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

        await wrapper.setProps({ route: '/api/test-2', data: { v: 2 } });
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(500);
        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    it('agenda busca debounced na alteração de route ou data quando acima do minLength', async () => {
        vi.useFakeTimers();
        const wrapper = mountAutoCompleteApi({ route: '/api/test-1', data: { v: 1 }, modelValue: 'solar', minLength: 2, delay: 200 });
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(200);
        expect(maxUse.getCachedApiIDB).toHaveBeenCalledTimes(1);

        vi.clearAllMocks();
        await wrapper.setProps({ route: '/api/test-2' });
        await wrapper.vm.$nextTick();
        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

        vi.advanceTimersByTime(200);
        await wrapper.vm.$nextTick();
        expect(maxUse.getCachedApiIDB).toHaveBeenCalledTimes(1);
        const [url, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
        expect(url).toBe('/api/test-2');
        expect(payload).toEqual({ v: 1, input_value: 'solar' });

        vi.useRealTimers();
    });

    it('agrupa rajadas de digitação em uma única busca remota após o delay', async () => {
        vi.useFakeTimers();
        const wrapper = mountAutoCompleteApi({ data: { fetch: 1 }, minLength: 2, delay: 300 });
        await wrapper.vm.$nextTick();

        const input = wrapper.find('input');
        await input.setValue('a');
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(100);

        await input.setValue('ab');
        await wrapper.vm.$nextTick();
        vi.advanceTimersByTime(100);

        await input.setValue('abc');
        await wrapper.vm.$nextTick();
        expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        await wrapper.vm.$nextTick();

        expect(maxUse.getCachedApiIDB).toHaveBeenCalledTimes(1);
        const [, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
        expect(payload.input_value).toBe('abc');

        vi.useRealTimers();
    });

    it('uma digitação produz exatamente uma emissão de complete e busca única (E05-05)', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).list = [
            { label: 'Item 1', value: 'item-1' },
            { label: 'Item 2', value: 'item-2' }
        ];
        await wrapper.vm.$nextTick();

        // Simula evento de input
        const input = wrapper.find('input');
        await input.setValue('Item 1');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('complete');
        // Deve emitir exatamente uma vez para a digitação
        expect(emitted).toBeDefined();
        expect(emitted?.length).toBe(1);
        expect((wrapper.vm as any).filtered_values.length).toBe(1);
        expect((wrapper.vm as any).filtered_values[0].value).toBe('item-1');
        wrapper.unmount();
    });

    it('sequência de digitações emite exatamente uma vez por alteração sem multiplicação reativa (E05-05)', async () => {
        const wrapper = mountAutoCompleteApi();
        (wrapper.vm as any).list = [
            { label: 'Alpha', value: 'a' },
            { label: 'Alphabet', value: 'ab' },
            { label: 'Alphabetical', value: 'abc' }
        ];
        await wrapper.vm.$nextTick();

        const input = wrapper.find('input');
        await input.setValue('a');
        await wrapper.vm.$nextTick();

        await input.setValue('ab');
        await wrapper.vm.$nextTick();

        await input.setValue('abc');
        await wrapper.vm.$nextTick();

        const emitted = wrapper.emitted('complete');
        expect(emitted?.length).toBe(3);
        expect((wrapper.vm as any).filtered_values.length).toBe(1);
        wrapper.unmount();
    });

    describe('Contrato WAI-ARIA Combobox (E06-02)', () => {
        it('expõe atributos semânticos combobox no input e sincroniza com o listbox', async () => {
            const wrapper = mountAutoCompleteApi({
                modelValue: 'item-1'
            });
            (wrapper.vm as any).list = [
                { label: 'Item 1', value: 'item-1' },
                { label: 'Item 2', value: 'item-2' }
            ];
            await wrapper.vm.$nextTick();

            const input = wrapper.find('input');
            expect(input.attributes('role')).toBe('combobox');
            expect(input.attributes('aria-autocomplete')).toBe('list');
            expect(input.attributes('aria-expanded')).toBe('false');
            expect(input.attributes('aria-controls')).toBeUndefined();
            expect(input.attributes('aria-activedescendant')).toBeUndefined();

            // Digita para abrir overlay
            await input.setValue('Item');
            await wrapper.vm.$nextTick();

            expect(input.attributes('aria-expanded')).toBe('true');
            const listboxId = input.attributes('aria-controls');
            expect(listboxId).toBeTruthy();

            const listbox = document.getElementById(listboxId!);
            expect(listbox).not.toBeNull();
            expect(listbox?.getAttribute('role')).toBe('listbox');

            // Navegação por seta atualiza aria-activedescendant
            await input.trigger('keydown.down');
            await wrapper.vm.$nextTick();

            const activeDescId = input.attributes('aria-activedescendant');
            expect(activeDescId).toBe(`${listboxId}-opt-0`);

            // Opções possuem role=option e aria-selected reflete a seleção inicial (item-1)
            let optionEls = listbox?.querySelectorAll('[role="option"]');
            expect(optionEls?.length).toBe(2);
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('true');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('false');

            // Navega para a opção 1: activeDescendant atualiza para opt-1, mas aria-selected continua false
            await input.trigger('keydown.down');
            await wrapper.vm.$nextTick();

            expect(input.attributes('aria-activedescendant')).toBe(`${listboxId}-opt-1`);
            optionEls = listbox?.querySelectorAll('[role="option"]');
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('true');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('false');

            wrapper.unmount();
        });

        it('ArrowDown sem Enter destaca com aria-activedescendant sem alterar seleção e Enter posterior seleciona (F14)', async () => {
            const wrapper = mountAutoCompleteApi({
                modelValue: null,
                minLength: 0
            });
            (wrapper.vm as any).list = [
                { label: 'Item A', value: 'a' },
                { label: 'Item B', value: 'b' }
            ];
            (wrapper.vm as any).filtered_values = [
                { label: 'Item A', value: 'a' },
                { label: 'Item B', value: 'b' }
            ];
            (wrapper.vm as any).isOpen = true;
            await wrapper.vm.$nextTick();

            const input = wrapper.find('input');
            const listboxId = input.attributes('aria-controls')!;
            const listbox = document.getElementById(listboxId);
            expect(listbox).not.toBeNull();

            // Inicialmente sem seleção
            let optionEls = listbox?.querySelectorAll('[role="option"]');
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('false');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('false');

            // ArrowDown move activeDescendant para opt-0 sem selecionar
            await input.trigger('keydown.down');
            await wrapper.vm.$nextTick();

            expect(input.attributes('aria-activedescendant')).toBe(`${listboxId}-opt-0`);
            optionEls = listbox?.querySelectorAll('[role="option"]');
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('false');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('false');
            expect(optionEls?.[0].classList.contains('max-autocomplete-item-active')).toBe(true);

            // ArrowDown move activeDescendant para opt-1 sem selecionar
            await input.trigger('keydown.down');
            await wrapper.vm.$nextTick();

            expect(input.attributes('aria-activedescendant')).toBe(`${listboxId}-opt-1`);
            optionEls = listbox?.querySelectorAll('[role="option"]');
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('false');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('false');
            expect(optionEls?.[1].classList.contains('max-autocomplete-item-active')).toBe(true);

            // Enter seleciona o item ativo (opt-1)
            await input.trigger('keydown.enter');
            await wrapper.vm.$nextTick();

            expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual({ label: 'Item B', value: 'b' });

            // Reabre o overlay para verificar aria-selected
            (wrapper.vm as any).filtered_values = [
                { label: 'Item A', value: 'a' },
                { label: 'Item B', value: 'b' }
            ];
            (wrapper.vm as any).isOpen = true;
            await wrapper.vm.$nextTick();

            optionEls = document.getElementById(listboxId)?.querySelectorAll('[role="option"]');
            expect(optionEls?.[1].getAttribute('aria-selected')).toBe('true');
            expect(optionEls?.[0].getAttribute('aria-selected')).toBe('false');

            wrapper.unmount();
        });

        it('active descendant permanece sempre montado no DOM durante navegação em lista virtualizada (F14)', async () => {
            const items = Array.from({ length: 100 }, (_, i) => ({
                id: i,
                label: `Sugestão ${i}`,
                value: `sug-${i}`
            }));
            const wrapper = mountAutoCompleteApi({
                modelValue: null,
                virtualScroll: true,
                numToleratedItems: 3,
                minLength: 0
            });
            (wrapper.vm as any).list = items;
            (wrapper.vm as any).filtered_values = items;
            (wrapper.vm as any).isOpen = true;
            await wrapper.vm.$nextTick();

            const input = wrapper.find('input');
            const listboxId = input.attributes('aria-controls')!;

            // Navega 15 vezes para baixo
            for (let i = 0; i < 15; i++) {
                await input.trigger('keydown.down');
                await wrapper.vm.$nextTick();
                const activeId = input.attributes('aria-activedescendant');
                expect(activeId).toBe(`${listboxId}-opt-${i}`);
                // O nó apontado por aria-activedescendant DEVE estar montado no DOM
                const activeEl = document.getElementById(activeId!);
                expect(activeEl).not.toBeNull();
                expect(activeEl?.getAttribute('role')).toBe('option');
                expect(activeEl?.getAttribute('aria-selected')).toBe('false');
            }

            wrapper.unmount();
        });
    });

    describe('Contrato Remoto com minLength, delay e debounce (F13 / E05-07)', () => {
        it('abaixo de minLength produz zero requisições remotas', async () => {
            vi.useFakeTimers();
            const wrapper = mountAutoCompleteApi({
                minLength: 3,
                delay: 200,
                data: { search: true }
            });
            await wrapper.vm.$nextTick();
            // Abaixo do minLength (0 < 3): zero requisições desde o mount (R10)
            expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

            const input = wrapper.find('input');
            await input.setValue('ab'); // 2 caracteres < minLength 3
            await wrapper.vm.$nextTick();

            // Avança o tempo além do delay
            vi.advanceTimersByTime(500);
            await wrapper.vm.$nextTick();

            // Nenhuma requisição deve ter sido disparada
            expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();
            wrapper.unmount();
            vi.useRealTimers();
        });

        it('rajada de digitações dispara apenas uma requisição após o delay (debounce)', async () => {
            vi.useFakeTimers();
            const wrapper = mountAutoCompleteApi({
                minLength: 2,
                delay: 300,
                data: { search: true }
            });
            await wrapper.vm.$nextTick();
            vi.clearAllMocks();

            const input = wrapper.find('input');

            // Simula rajada rápida de digitações
            await input.setValue('ab');
            await wrapper.vm.$nextTick();
            vi.advanceTimersByTime(100);

            await input.setValue('abc');
            await wrapper.vm.$nextTick();
            vi.advanceTimersByTime(100);

            await input.setValue('abcd');
            await wrapper.vm.$nextTick();
            vi.advanceTimersByTime(100);

            await input.setValue('abcde');
            await wrapper.vm.$nextTick();

            // Ainda dentro do delay após a última digitação: zero chamadas
            expect(maxUse.getCachedApiIDB).not.toHaveBeenCalled();

            // Avança o tempo após o delay da última digitação
            vi.advanceTimersByTime(300);
            await wrapper.vm.$nextTick();

            // Exatamente UMA requisição com o valor final 'abcde'
            expect(maxUse.getCachedApiIDB).toHaveBeenCalledTimes(1);
            const [, payload] = (maxUse.getCachedApiIDB as any).mock.calls[0];
            expect(payload.input_value).toBe('abcde');

            wrapper.unmount();
            vi.useRealTimers();
        });

        it('descarta respostas remotas obsoletas de gerações anteriores com abort da requisição anterior', async () => {
            vi.useFakeTimers();
            let resolveReq1: any;
            const promise1 = new Promise((resolve) => { resolveReq1 = resolve; });
            let capturedSignal1: AbortSignal | undefined;
            let capturedSignal2: AbortSignal | undefined;

            let callCount = 0;
            (maxUse.getCachedApiIDB as any).mockImplementation((_route: string, _params: any, _cache: any, _ttl: any, _cb: any, opts: any) => {
                callCount++;
                if (callCount === 1) {
                    capturedSignal1 = opts?.signal;
                    return promise1;
                }
                capturedSignal2 = opts?.signal;
                return Promise.resolve([{ label: 'Resultado 2', value: 'r2' }]);
            });

            const wrapper = mountAutoCompleteApi({
                minLength: 2,
                delay: 200,
                data: { search: true }
            });
            await wrapper.vm.$nextTick();
            vi.clearAllMocks();
            callCount = 0;

            const input = wrapper.find('input');

            // Primeira busca remota
            await input.setValue('primeiro');
            await wrapper.vm.$nextTick();
            vi.advanceTimersByTime(200);
            await wrapper.vm.$nextTick();
            expect(callCount).toBe(1);
            expect(capturedSignal1?.aborted).toBe(false);

            // Segunda busca remota antes da primeira resolver
            await input.setValue('segundo');
            await wrapper.vm.$nextTick();
            vi.advanceTimersByTime(200);
            await wrapper.vm.$nextTick();
            expect(callCount).toBe(2);
            // O primeiro signal foi abortado
            expect(capturedSignal1?.aborted).toBe(true);
            expect(capturedSignal2?.aborted).toBe(false);

            // Resposta 2 resolve
            await Promise.resolve();
            await wrapper.vm.$nextTick();
            expect((wrapper.vm as any).list).toEqual([{ label: 'Resultado 2', value: 'r2' }]);

            // Resposta 1 resolve tardiamente
            resolveReq1([{ label: 'Resultado 1 Obsoleto', value: 'r1' }]);
            await promise1;
            await wrapper.vm.$nextTick();

            // Continua com Resultado 2, resposta obsoleta ignorada
            expect((wrapper.vm as any).list).toEqual([{ label: 'Resultado 2', value: 'r2' }]);

            wrapper.unmount();
            vi.useRealTimers();
        });
    });
});
