// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import { useAsyncState } from '../../src/composables/useAsyncState';
import MaxIconButton from '../../src/components/MaxIconButton.vue';
import MaxPdfView from '../../src/components/MaxPdfView.vue';
import MaxInputIconPicker from '../../src/components/MaxInputIconPicker.vue';
import MaxInputSelect from '../../src/components/MaxInputSelect.vue';
import MaxInputAutoCompleteApi from '../../src/components/MaxInputAutoCompleteApi.vue';
import * as maxUse from '@maxvue/max-use';

vi.mock('@maxvue/max-use', async (importOriginal) => {
    const actual = await importOriginal<Record<string, any>>();
    return {
        ...actual,
        getCachedApiIDB: vi.fn(() => Promise.resolve([{ label: 'Test Item', value: '1' }])),
        useWindowSize: () => ({ width: { value: 1024 }, height: { value: 768 } })
    };
});

describe('E05-07: Estados Assíncronos Distinguíveis e Recuperação', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
        document.body.style.overflow = '';
    });

    describe('useAsyncState composable', () => {
        it('transiciona corretamente entre idle, loading, success e recupera de erro', async () => {
            const { state, status, isLoading, isSuccess, isError, execute, retry, reset } = useAsyncState(
                async (multiplier: number) => {
                    if (multiplier === 0) throw new Error('Valor inválido');
                    return 10 * multiplier;
                }
            );

            expect(status.value).toBe('idle');
            expect(state.value.attemptId).toBe(0);

            // Executa com erro
            const errorPromise = execute(0);
            expect(isLoading.value).toBe(true);
            expect(status.value).toBe('loading');
            expect(state.value.attemptId).toBe(1);

            await expect(errorPromise).rejects.toThrow('Valor inválido');
            expect(isError.value).toBe(true);
            expect(status.value).toBe('error');
            expect(state.value.error?.message).toBe('Valor inválido');

            // Retry com mesmos argumentos
            await expect(retry()).rejects.toThrow('Valor inválido');
            expect(state.value.attemptId).toBe(2);

            // Sucesso
            const result = await execute(5);
            expect(result).toBe(50);
            expect(isSuccess.value).toBe(true);
            expect(status.value).toBe('success');
            expect(state.value.data).toBe(50);

            // Reset
            reset();
            expect(status.value).toBe('idle');
            expect(state.value.data).toBeNull();
            expect(state.value.error).toBeNull();
        });
    });

    describe('MaxIconButton - Bloqueio de reentrada e aria-busy', () => {
        it('aplica aria-busy, disabled e bloqueia cliques nativos enquanto pendente', async () => {
            let resolveAction: () => void = () => {};
            const actionPromise = new Promise<void>((resolve) => { resolveAction = resolve; });
            const mockAction = vi.fn().mockImplementation(() => actionPromise);

            const wrapper = mount(MaxIconButton, {
                props: { icon: 'mdi:send', action: mockAction, ariaLabel: 'Enviar' }
            });

            const button = wrapper.find('button');
            expect(button.attributes('aria-busy')).toBe('false');

            // Primeiro clique inicia ação assíncrona
            await button.trigger('click');
            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(button.attributes('aria-busy')).toBe('true');
            expect(button.attributes('disabled')).toBeDefined();

            // Segundo clique durante a pendência é completamente ignorado
            await button.trigger('click');
            expect(mockAction).toHaveBeenCalledTimes(1);

            // Libera a ação
            resolveAction();
            await actionPromise;
            await wrapper.vm.$nextTick();

            expect(button.attributes('aria-busy')).toBe('false');
            expect(button.attributes('disabled')).toBeUndefined();
        });
    });

    describe('MaxPdfView - Feedback em pt-BR e recuperação de falha', () => {
        it('exibe tela de erro amigável ao falhar e permite retry', async () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const wrapper = mount(MaxPdfView, {
                props: { file: 'documento.pdf' },
                global: {
                    stubs: {
                        VuePdfEmbed: {
                            template: '<div class="pdf-embed" @click="$emit(\'loading-failed\', new Error(\'Network error\'))">PDF</div>',
                            emits: ['loading-failed', 'loaded']
                        }
                    }
                }
            });

            await wrapper.vm.$nextTick();

            // Simula falha de carregamento do PDF
            const vm = wrapper.vm as any;
            vm.onLoadingFailed(new Error('Corrompido'));
            await wrapper.vm.$nextTick();

            expect(vm.hasError).toBe(true);
            expect(vm.isLoading).toBe(false);

            const errorBox = wrapper.find('.pdf-error-state');
            expect(errorBox.exists()).toBe(true);
            expect(errorBox.text()).toContain('Não foi possível carregar o documento');

            // Clica em tentar novamente
            const retryBtn = wrapper.find('.pdf-retry-btn');
            expect(retryBtn.exists()).toBe(true);
            await retryBtn.trigger('click');

            // Volta para loading e reseta erro
            expect(vm.isLoading).toBe(true);
            expect(vm.hasError).toBe(false);
            wrapper.unmount();
            errSpy.mockRestore();
        });
    });

    describe('MaxInputIconPicker - Tratamento de falha no catálogo', () => {
        it('exibe mensagem de erro e botão de retry ao falhar na requisição', async () => {
            const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = vi.fn().mockRejectedValue(new Error('Falha de rede'));
            vi.stubGlobal('fetch', fetchMock);

            const wrapper = mount(MaxInputIconPicker, {
                props: { modelValue: '' }
            });

            const vm = wrapper.vm as any;
            // Abre o drawer e força busca
            vm.visible = true;
            vm.search = 'solar';
            await wrapper.vm.$nextTick();
            await new Promise((r) => setTimeout(r, 450));

            expect(vm.hasLoadError).toBe(true);
            expect(vm.isLoading).toBe(false);

            // Retry com sucesso
            fetchMock.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve([{ id: 1, name: 'mdi:solar', search: 'solar' }])
            } as Response);

            await vm.retryLoad();
            await new Promise((r) => setTimeout(r, 50));
            await wrapper.vm.$nextTick();

            expect(vm.hasLoadError).toBe(false);
            wrapper.unmount();
            errSpy.mockRestore();
        });
    });

    describe('MaxInputSelect - Indicador de carregamento e retry em caso de falha', () => {
        it('exibe estado de erro e permite retry no dropdown quando loadOptions falha', async () => {
            const loadOptions = vi.fn().mockRejectedValueOnce(new Error('Falha ao obter lista'))
                .mockResolvedValueOnce([{ value: '1', name: 'Opção 1' }]);

            const wrapper = mount(MaxInputSelect, {
                props: { modelValue: '', loadOptions }
            });

            // Clica para abrir e carregar
            await wrapper.find('.max-select').trigger('click');
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            const vm = wrapper.vm as any;
            expect(vm.loadError).toBe(true);

            // Dispara retry
            await vm.retryLoad();
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect(vm.loadError).toBe(false);
            expect(vm.optionsField.length).toBe(1);
            wrapper.unmount();
        });
    });

    describe('MaxInputAutoCompleteApi - Estados assíncronos no overlay', () => {
        it('exibe loading, erro com retry e estado vazio no overlay', async () => {
            let _resolveApi: any;
            let rejectApi: any;
            (maxUse.getCachedApiIDB as any).mockImplementation(() => new Promise((resolve, reject) => {
                _resolveApi = resolve;
                rejectApi = reject;
            }));

            const wrapper = mount(MaxInputAutoCompleteApi, {
                props: { route: '/api/search', data: { query: 'test' }, delay: 0 },
                global: {
                    stubs: {
                        InputBase: {
                            template: '<div class="input-base"><slot :inputAttrs="{}" /></div>'
                        }
                    }
                }
            });

            await wrapper.vm.$nextTick();
            const vm = wrapper.vm as any;

            // Digita no input para abrir overlay
            const input = wrapper.find('input');
            await input.setValue('test');
            await wrapper.vm.$nextTick();

            expect(vm.isLoading).toBe(true);
            expect(vm.isOpen).toBe(true);

            // Rejeita a API
            rejectApi(new Error('Erro no servidor'));
            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect(vm.isLoading).toBe(false);
            expect(vm.hasError).toBe(true);

            const overlay = document.querySelector('.max-autocomplete-overlay');
            expect(overlay).toBeTruthy();
            expect(overlay?.querySelector('.max-autocomplete-error')).toBeTruthy();

            // Executa retry com sucesso vazio
            (maxUse.getCachedApiIDB as any).mockImplementation(() => Promise.resolve([]));
            const retryBtn = overlay?.querySelector('.max-autocomplete-retry-btn') as HTMLButtonElement;
            expect(retryBtn).toBeTruthy();
            retryBtn.click();

            await new Promise((r) => setTimeout(r, 10));
            await wrapper.vm.$nextTick();

            expect(vm.hasError).toBe(false);
            expect(vm.isLoading).toBe(false);
            expect(overlay?.querySelector('.max-autocomplete-empty')).toBeTruthy();

            wrapper.unmount();
        });
    });
});
