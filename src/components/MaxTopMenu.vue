<template>
    <div class="max-top-menu top-menu" v-bind="attrs" :screen="isMobile ? 'mobile' : 'desktop'">
        <!-- Estrutura Mobile: 3 Colunas Estritas (Hambúrguer 44px, Centro 1fr, Ações auto) estilo AgenteDeBolso -->
        <div v-if="isMobile" class="top-menu-elementos" :screen="'mobile'" v-bind="attrs">
            <div
                class="btn_side_menu"
                role="button"
                tabindex="0"
                aria-label="Abrir menu"
                @click.stop="toggleSideMenu"
                @keydown.enter.stop="toggleSideMenu"
            >
                <MaxIcon icon="uil:bars" size="1.3" light />
            </div>

            <div id="top_menu_mobile_center" class="top-menu-mobile-center">
                <transition name="max-save-fade">
                    <span
                        v-if="system.save_status !== 'idle'"
                        class="max-save-indicator is-mobile"
                        :class="`is-${system.save_status}`"
                        role="status"
                        :aria-label="saveStatusLabel"
                        v-tooltip.bottom="saveStatusLabel"
                    />
                </transition>
                <slot name="mobile-center">
                    <span v-if="system.top_menu_title" class="mobile-header-title">{{ system.top_menu_title }}</span>
                    <slot v-else name="status"></slot>
                </slot>
            </div>

            <div class="top-menu-mobile-actions">
                <slot name="mobile-actions">
                    <slot name="search">
                        <MaxTopMenuSearchBar v-if="!toolbar.show" screen="mobile" />
                    </slot>
                    <slot name="add"></slot>
                    <slot name="chat"></slot>
                    <slot name="notifications"></slot>
                    <slot name="voip"></slot>
                    <slot name="live"></slot>
                    <slot name="user">
                        <MaxUserSection
                            :name="user.data?.name ?? ''"
                            :company-name="user.data?.solar_company_name ?? undefined"
                            :user-id="user.data?.id ?? undefined"
                            :avatar-url="avatarUrl"
                            :dark-mode="user.data?.settings?.darkMode === true"
                            :is-impersonated="isImpersonated"
                            :version="system.version || undefined"
                            only-avatar
                            screen="mobile"
                            @profile="emit('profile')"
                            @settings="emit('settings')"
                            @support="emit('support')"
                            @toggle-dark-mode="emit('toggleDarkMode')"
                            @logout="emit('logout')"
                            @end-impersonate="emit('endImpersonate')"
                        />
                    </slot>
                </slot>
            </div>
        </div>

        <!-- Estrutura Desktop: Fluxo Completo -->
        <div v-else class="top-menu-elementos" v-bind="attrs">
            <div class="icons-save-div">
                <transition name="max-save-fade">
                    <span
                        v-if="system.save_status !== 'idle'"
                        class="max-save-indicator"
                        :class="`is-${system.save_status}`"
                        role="status"
                        :aria-label="saveStatusLabel"
                        v-tooltip.bottom="saveStatusLabel"
                    />
                </transition>
                <slot name="status"></slot>
            </div>

            <MaxTopToolbar v-if="toolbar.show" />
            <slot v-else name="search">
                <MaxTopMenuSearchBar />
            </slot>

            <slot name="add">
                <MaxPopoverMenu v-if="props.addItems?.length" icon="mdi:plus-circle" title="Adicionar Novo" light size="1.4" icon-hover-white :model="props.addItems" />
            </slot>

            <div class="tool-bar-plus">
                <MaxIconButton v-tooltip.bottom="'Atualizar dados'" aria-label="Atualizar dados" :i="reloading ? 'loading' : 'reload'" :loading="reloading" :disabled="reloading" size="1.7" light icon-hover-white @click.stop="reloadAll" />
            </div>


            <!-- Chat, notificações, VoIP e Live continuam na aplicação: dependem de
                 Reverb, LiveKit e das stores de domínio do engeapp. -->
            <slot name="chat"></slot>
            <slot name="bugs"></slot>
            <slot name="notifications"></slot>
            <slot name="voip"></slot>
            <slot name="live"></slot>

            <slot name="user">
                <!-- O MaxUserSection é prop-driven; o shell alimenta os dados a
                     partir da store e repassa os eventos para a aplicação. -->
                <MaxUserSection
                    class="top-menu-user-section"
                    :name="user.data?.name ?? ''"
                    :company-name="user.data?.solar_company_name ?? undefined"
                    :user-id="user.data?.id ?? undefined"
                    :avatar-url="avatarUrl"
                    :dark-mode="user.data?.settings?.darkMode === true"
                    :is-impersonated="isImpersonated"
                    :version="system.version || undefined"
                    @profile="emit('profile')"
                    @settings="emit('settings')"
                    @support="emit('support')"
                    @toggle-dark-mode="emit('toggleDarkMode')"
                    @logout="emit('logout')"
                    @end-impersonate="emit('endImpersonate')"
                />
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxPopoverMenu from './MaxPopoverMenu.vue';
    import MaxTopToolbar from './MaxTopToolbar.vue';
    import MaxTopMenuSearchBar from './MaxTopMenuSearchBar.vue';
    import MaxUserSection from './MaxUserSection.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useUserStore } from '../stores/useUser.Store';
    import { useTopToolbarStore } from '../stores/useTopToolbar.Store';

    const props = defineProps<{
        /**
         * Itens do menu "Adicionar Novo". No engeapp eram as rotas `new_project`
         * e `new_equipment`, embutidas no componente.
         */
        addItems?: Array<Record<string, any>>;
        /** Caminho base do avatar. Padrão: `/avatar/{id}`. */
        avatarPath?: string;
    }>();

    /** Eventos repassados do `MaxUserSection` para a aplicação. */
    const emit = defineEmits<{
        profile: [];
        settings: [];
        support: [];
        toggleDarkMode: [];
        logout: [];
        endImpersonate: [];
    }>();

    const attrs = useAttrs();
    const system = useSystemStore();
    const user = useUserStore();
    const toolbar = useTopToolbarStore();

    /** Determina se deve renderizar a versão mobile. */
    const isMobile = computed<boolean>(() => {
        const target = attrs.screen as string | undefined;
        if (target) return target === 'mobile';

        return system.type_device === 'mobile';
    });

    /** URL do avatar do usuário logado. */
    const avatarUrl = computed(() => (user.data?.id ? `${props.avatarPath ?? '/avatar/'}${user.data.id}` : undefined));

    /** `isImpersonated` é injetado pelo `@maxvue/max-pinia`. */
    const isImpersonated = computed<boolean>(() => Boolean((user as any).isImpersonated));

    const reloading = ref(false);

    const toggleSideMenu = (): void => {
        system.side_menu_open = !system.side_menu_open;
    };

    const reloadAll = async (): Promise<void> => {
        if (reloading.value) return;
        reloading.value = true;
        try {
            await Promise.resolve(system.reloadAll?.());
        } catch (err) {
            console.error('[MaxTopMenu] Erro ao recarregar dados do sistema:', err);
        } finally {
            reloading.value = false;
        }
    };

    /** Rótulo textual descritivo para tooltip e acessibilidade (role="status"). */
    const saveStatusLabel = computed<string>(() => {
        if (system.save_message) return system.save_message;
        if (system.save_status === 'success') return 'Salvo com sucesso';
        if (system.save_status === 'error') return 'Erro ao salvar alterações';
        return '';
    });


</script>

<style lang="scss" scoped>
    .top-menu {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10;
        width: 100%;
        height: 64px;
        grid-template-columns: auto 1fr;
        background-color: var(--layout-shell-bg, #003048);
        color: var(--layout-shell-text, #fff);
        display: grid !important;
        place-items: center end;

        &[screen='mobile'] {
            z-index: 20;
            place-items: center;
            grid-template-columns: 1fr !important;
            height: var(--top-menu-height, 60px);
            background-color: var(--layout-shell-bg, #003048);
            padding: 0 0.75rem;
            padding-left: max(0.75rem, env(safe-area-inset-left));
            padding-right: max(0.75rem, env(safe-area-inset-right));
            box-sizing: border-box;
        }

        .btn_side_menu {
            display: grid;
            place-items: center;
            width: 38px;
            min-width: 38px;
            min-height: 44px;
            border-radius: 999px;
            font-size: 1.3rem;
            color: rgb(255 255 255 / 80%);
            cursor: pointer;
            transition: background-color 0.18s ease;

            &:hover {
                background-color: rgb(255 255 255 / 10%);
            }

            :deep(.max-icon-div) {
                color: currentcolor !important;
            }
        }

        .top-menu-mobile-center {
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 0;
            width: 100%;
            overflow: hidden;
            gap: 6px;

            .mobile-header-title {
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--layout-shell-text, #fff);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                text-align: center;
            }
        }

        .top-menu-mobile-actions {
            display: grid;
            grid-auto-flow: column;
            grid-auto-columns: auto;
            align-items: center;
            justify-content: end;
            gap: 1.125rem;
            padding-left: 5px;

            :deep(.tool-bar-plus) {
                position: relative;
                width: 30px;
                height: 30px;
                display: grid;
                place-items: center;
            }

            .mobile-user-avatar {
                display: grid;
                place-items: center;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                overflow: hidden;
                cursor: pointer;
                transition: opacity 0.18s ease;

                :deep(.max-user-avatar) {
                    width: 34px;
                    height: 34px;
                }

                &:hover {
                    opacity: 0.85;
                }

                &:focus-visible {
                    /* Foco canônico: --blue-500 era legado; --max-focus-ring-color é a referência da marca */
                    outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                    outline-offset: 2px;
                }
            }
        }

        .top-menu-elementos {
            position: relative;
            display: grid;
            width: 100%;
            padding: 0 1rem 0 75px;
            column-gap: 6px;

            // 1fr = espaço vazio à esquerda; auto = a busca.
            grid-template-columns: auto 1fr;
            grid-auto-flow: column;

            // Colunas implícitas crescem para as seções Live/Usuário, mas nunca
            // ficam menores que 39px.
            grid-auto-columns: minmax(39px, auto);
            grid-column: 2;
            place-items: center;
            height: 64px !important;

            &[screen='mobile'] {
                width: 100%;
                grid-column: 1;
                padding: 0 !important;
                place-items: center start;
                grid-template-columns: 38px 1fr auto !important;
                gap: 0.5rem !important;
                height: var(--top-menu-height, 60px) !important;
            }

            .icons-save-div {
                display: flex;
                align-items: center;
                gap: 8px;
                height: 100%;
                padding-left: 20px;
            }

            :deep(.tool-bar-plus),
            .tool-bar-plus {
                position: relative;
                width: 30px;
                height: 30px;
                display: grid;
                place-items: center;
            }

            .top-menu-user-section {
                margin-left: 20px;
            }
        }

        .max-save-indicator {
            width: 10px;
            height: 10px;
            min-width: 10px;
            min-height: 10px;
            border-radius: 50%;
            display: inline-block;
            flex-shrink: 0;
            cursor: default;

            &.is-success {
                background-color: var(--max-success-500, #10b981);
                box-shadow: 0 0 6px rgb(16 185 129 / 45%);
            }

            &.is-error {
                background-color: var(--max-danger-500, #ef4444);
                box-shadow: 0 0 6px rgb(239 68 68 / 45%);
            }

            &.is-mobile {
                margin-right: 2px;
            }
        }

        .max-save-fade-enter-active,
        .max-save-fade-leave-active {
            transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .max-save-fade-enter-from,
        .max-save-fade-leave-to {
            opacity: 0;
            transform: scale(0.6);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
