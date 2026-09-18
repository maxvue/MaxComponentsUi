import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Pinia } from 'pinia';
import { setActivePinia, createPinia, defineStore } from 'pinia';
import { reactive, ref, nextTick } from 'vue';

const route = reactive<Record<string, any>>({ name: 'board', meta: {}, query: {}, params: {} });

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRoute: () => route,
    useRouter: () => ({ push: vi.fn(), hasRoute: () => false, currentRoute: { value: route } }),
    RouterView: { template: '<div class="router-view-stub" />' }
}));

const menusRef = ref<any>(null);

vi.mock('@maxvue/max-use', async (importOriginal) => ({
    ...(await importOriginal<Record<string, any>>()),
    useRefCachedApi: () => menusRef,
    getRoute: () => '/'
}));

import MaxApp from '../../src/components/MaxApp.vue';
import MaxTopMenu from '../../src/components/MaxTopMenu.vue';
import { useSystemStore } from '../../src/stores/useSystem.Store';
import { useUserStore } from '../../src/stores/useUser.Store';
import { resetMaxAppConfig } from '../../src/helpers/maxAppConfig';

describe('MaxPiniaSaveIndicator', () => {
    let pinia: Pinia;

    beforeEach(() => {
        vi.useFakeTimers();
        pinia = createPinia();
        setActivePinia(pinia);
        resetMaxAppConfig();
        Object.assign(route, { name: 'board', meta: {}, query: {}, params: {} });
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    describe('useSystemStore Save State Engine', () => {
        it('inicia no estado idle sem mensagem', () => {
            const system = useSystemStore();
            expect(system.save_status).toBe('idle');
            expect(system.save_message).toBe('');
        });

        it('transiciona para success e apaga automaticamente após 3 segundos', () => {
            const system = useSystemStore();

            system.notifySaveSuccess();
            expect(system.save_status).toBe('success');
            expect(system.save_message).toBe('Salvo com sucesso');

            vi.advanceTimersByTime(2999);
            expect(system.save_status).toBe('success');

            vi.advanceTimersByTime(1);
            expect(system.save_status).toBe('idle');
            expect(system.save_message).toBe('');
        });

        it('transiciona para error e apaga automaticamente após 20 segundos', () => {
            const system = useSystemStore();

            system.notifySaveError();
            expect(system.save_status).toBe('error');
            expect(system.save_message).toBe('Erro ao salvar alterações');

            vi.advanceTimersByTime(3000);
            // Continua em erro mesmo após os 3s de um sucesso
            expect(system.save_status).toBe('error');

            vi.advanceTimersByTime(16999);
            expect(system.save_status).toBe('error');

            vi.advanceTimersByTime(1);
            expect(system.save_status).toBe('idle');
        });

        it('erro tem prioridade e não é mascarado por um salvamento de sucesso subsequente', () => {
            const system = useSystemStore();

            system.notifySaveError();
            expect(system.save_status).toBe('error');

            // Outra store salva com sucesso durante o erro
            system.notifySaveSuccess();
            expect(system.save_status).toBe('error');
            expect(system.save_message).toBe('Erro ao salvar alterações');

            // Permanece vermelho até completar os 20s
            vi.advanceTimersByTime(20000);
            expect(system.save_status).toBe('idle');
        });

        it('renova o timer de 20 segundos se ocorrer um novo erro enquanto em estado de erro', () => {
            const system = useSystemStore();

            system.notifySaveError();
            vi.advanceTimersByTime(15000);
            expect(system.save_status).toBe('error');

            // Novo erro aos 15s renova os 20s
            system.notifySaveError({ message: 'Falha de conexão com a API' });
            expect(system.save_status).toBe('error');
            expect(system.save_message).toBe('Falha de conexão com a API');

            vi.advanceTimersByTime(15000);
            expect(system.save_status).toBe('error');

            vi.advanceTimersByTime(5000);
            expect(system.save_status).toBe('idle');
        });

        it('erro interrompe imediatamente um estado de sucesso ativo', () => {
            const system = useSystemStore();

            system.notifySaveSuccess();
            expect(system.save_status).toBe('success');

            vi.advanceTimersByTime(1000);
            system.notifySaveError();
            expect(system.save_status).toBe('error');

            // Aguarda mais 3s (quando o sucesso teria expirado)
            vi.advanceTimersByTime(3000);
            expect(system.save_status).toBe('error');

            // Expira somente aos 20s
            vi.advanceTimersByTime(17000);
            expect(system.save_status).toBe('idle');
        });

        it('clearSaveStatus reseta o estado imediatamente', () => {
            const system = useSystemStore();
            system.notifySaveError();
            expect(system.save_status).toBe('error');

            system.clearSaveStatus();
            expect(system.save_status).toBe('idle');
            expect(system.save_message).toBe('');
        });
    });

    describe('MaxTopMenu Component Indicator', () => {
        it('renderiza o indicador verde de 10px ao lado da logo no desktop quando save_status é success', async () => {
            const system = useSystemStore();
            const wrapper = mount(MaxTopMenu, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        MaxIconButton: true,
                        MaxPopoverMenu: true,
                        MaxTopToolbar: true,
                        MaxTopMenuSearchBar: true,
                        MaxUserSection: true
                    }
                }
            });

            expect(wrapper.find('.max-save-indicator').exists()).toBe(false);

            system.notifySaveSuccess();
            await nextTick();

            const indicator = wrapper.find('.icons-save-div .max-save-indicator');
            expect(indicator.exists()).toBe(true);
            expect(indicator.classes()).toContain('is-success');
            expect(indicator.attributes('role')).toBe('status');
            expect(indicator.attributes('aria-label')).toBe('Salvo com sucesso');
        });

        it('renderiza o indicador vermelho de 10px no desktop quando save_status é error', async () => {
            const system = useSystemStore();
            const wrapper = mount(MaxTopMenu, {
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        MaxIconButton: true,
                        MaxPopoverMenu: true,
                        MaxTopToolbar: true,
                        MaxTopMenuSearchBar: true,
                        MaxUserSection: true
                    }
                }
            });

            system.notifySaveError({ message: 'Falha no banco de dados' });
            await nextTick();

            const indicator = wrapper.find('.icons-save-div .max-save-indicator');
            expect(indicator.exists()).toBe(true);
            expect(indicator.classes()).toContain('is-error');
            expect(indicator.attributes('aria-label')).toBe('Falha no banco de dados');
        });

        it('renderiza o indicador no mobile ao lado do menu/hambúrguer', async () => {
            const system = useSystemStore();

            const wrapper = mount(MaxTopMenu, {
                attrs: {
                    screen: 'mobile'
                },
                global: {
                    plugins: [pinia],
                    stubs: {
                        MaxIcon: true,
                        MaxIconButton: true,
                        MaxPopoverMenu: true,
                        MaxTopToolbar: true,
                        MaxTopMenuSearchBar: true,
                        MaxUserSection: true
                    }
                }
            });

            system.notifySaveSuccess();
            await nextTick();

            const indicator = wrapper.find('#top_menu_mobile_center .max-save-indicator.is-mobile');
            expect(indicator.exists()).toBe(true);
            expect(indicator.classes()).toContain('is-success');
        });
    });

    describe('MaxApp & MaxPinia Integration', () => {
        it('detecta alteração em store MaxPinia e reflete no indicador do cabeçalho', async () => {
            const user = useUserStore();
            user.data = { id: 1, name: 'Engenheiro' };
            (user as any).status = { server: { get: { is_success: true } } };

            const useTestProjectStore = defineStore('testProjectStore', () => {
                const status = reactive({
                    server: {
                        get: { is_success: true, is_error: false },
                        save: { is_success: false, is_error: false, error: null }
                    }
                });

                return { status };
            });

            const testStore = useTestProjectStore();

            const wrapper = mount(MaxApp, {
                props: { screen: 'desktop' },
                global: {
                    plugins: [pinia],
                    stubs: {
                        teleport: true,
                        MaxLogo: { template: '<div class="max-logo-stub" />' },
                        RouterView: { template: '<div class="router-view-stub" />' }
                    }
                }
            });

            await nextTick();

            expect(wrapper.find('.max-save-indicator').exists()).toBe(false);

            // Simula store salvando dados com sucesso
            testStore.status.server.save.is_success = true;
            await nextTick();

            const indicator = wrapper.find('.icons-save-div .max-save-indicator');
            expect(indicator.exists()).toBe(true);
            expect(indicator.classes()).toContain('is-success');

            // Após 3s o indicador apaga
            vi.advanceTimersByTime(3000);
            await nextTick();
            expect(wrapper.find('.max-save-indicator').exists()).toBe(false);

            // Simula store salvando com erro
            testStore.status.server.save.is_success = false;
            testStore.status.server.save.is_error = true;
            await nextTick();

            const errorIndicator = wrapper.find('.icons-save-div .max-save-indicator');
            expect(errorIndicator.exists()).toBe(true);
            expect(errorIndicator.classes()).toContain('is-error');

            // 3s depois continua ativo
            vi.advanceTimersByTime(3000);
            await nextTick();
            expect(wrapper.find('.icons-save-div .max-save-indicator').exists()).toBe(true);

            // 20s depois apaga
            vi.advanceTimersByTime(17000);
            await nextTick();
            expect(wrapper.find('.max-save-indicator').exists()).toBe(false);
        });

        it('reage ao evento customizado document status-updated disparado pelo MaxPinia', async () => {
            const user = useUserStore();
            user.data = { id: 1, name: 'Engenheiro' };
            (user as any).status = { server: { get: { is_success: true } } };

            const wrapper = mount(MaxApp, {
                props: { screen: 'desktop' },
                global: {
                    plugins: [pinia],
                    stubs: {
                        teleport: true,
                        MaxLogo: { template: '<div class="max-logo-stub" />' },
                        RouterView: { template: '<div class="router-view-stub" />' }
                    }
                }
            });

            await nextTick();

            // Dispara CustomEvent idêntico ao emitido pelo MaxPinia
            document.dispatchEvent(new CustomEvent('status-updated', {
                detail: {
                    server: {
                        save: { is_success: true, is_error: false }
                    }
                }
            }));

            await nextTick();

            const indicator = wrapper.find('.icons-save-div .max-save-indicator');
            expect(indicator.exists()).toBe(true);
            expect(indicator.classes()).toContain('is-success');
        });
    });
});
