<template>
    <MaxDrawer
        v-model:visible="system.side_menu_open"
        position="left"
        :show-close-icon="false"
        class="max-side-menu-mobile-drawer"
    >
        <div class="mobile-side-menu">
            <!-- Cabeçalho com dados e avatar do usuário -->
            <div class="mobile-profile-header" @click="goToProfile">
                <div class="mobile-avatar">
                    <MaxUserAvatar
                        v-if="user.data?.id"
                        :name="user.data?.name ?? ''"
                        :image-url="avatarUrl"
                        :show-tooltip="false"
                    />
                    <MaxIcon v-else icon="fa6-solid:user" size="1.5" />
                </div>
                <div class="mobile-profile-details">
                    <div class="mobile-profile-name">{{ userName }}</div>
                    <div v-if="userSubtext" class="mobile-profile-subtext">{{ userSubtext }}</div>
                </div>
                <button type="button" class="mobile-profile-chevron" aria-label="Ver perfil">
                    <MaxIcon icon="material-symbols:chevron-right-rounded" size="1.4" />
                </button>
            </div>

            <!-- Slot de switcher / seleção de perfis (estilo AgenteDeBolso) -->
            <div v-if="$slots.switcher" class="switcher">
                <slot name="switcher"></slot>
            </div>

            <!-- Grupos e itens de navegação -->
            <div class="mobile-menu-content">
                <div v-for="(group, gIdx) in menuGroups" :key="group.title ?? gIdx" class="mobile-menu-group">
                    <div v-if="group.title" class="mobile-group-title">{{ group.title }}</div>
                    <div
                        v-for="item in group.items"
                        :key="item.route ?? item.id ?? item.label"
                        class="mobile-menu-item"
                        :class="{ active: isItemActive(item) }"
                        role="link"
                        tabindex="0"
                        :aria-label="getItemLabel(item)"
                        :aria-current="isItemActive(item) ? 'page' : undefined"
                        @click.stop="openItem(item)"
                        @keydown.enter.stop="openItem(item)"
                    >
                        <MaxIcon :icon="getItemIcon(item)" size="1.2" />
                        <span class="mobile-item-label">{{ getItemLabel(item) }}</span>
                    </div>
                </div>
            </div>

            <!-- Rodapé com ações de sessão e suporte -->
            <div class="mobile-menu-footer">
                <div class="mobile-footer-actions">
                    <button type="button" class="mobile-footer-btn" @click="emitToggleDarkMode">
                        <MaxIcon :icon="isDark ? 'solar:sun-2-bold-duotone' : 'solar:moon-bold-duotone'" size="1.2" />
                        <span>{{ isDark ? 'Tema Claro' : 'Tema Escuro' }}</span>
                    </button>
                    <button type="button" class="mobile-footer-btn logout" @click="emitLogout">
                        <MaxIcon icon="solar:logout-2-bold-duotone" size="1.2" />
                        <span>Sair</span>
                    </button>
                </div>
                <div v-if="system.version" class="mobile-app-version">
                    v{{ system.version }}
                </div>
            </div>
        </div>
    </MaxDrawer>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import MaxDrawer from './MaxDrawer.vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxUserAvatar from './MaxUserAvatar.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useUserStore } from '../stores/useUser.Store';
    import { useListMenusStore } from '../stores/useListMenus.Store';
    import type { SideMenuItem } from '../types/app';

    export interface MenuGroup {
        title?: string;
        items: any[];
    }

    const props = defineProps<{
        /** Itens ou grupos customizados de navegação. */
        groups?: MenuGroup[];
        /** Lista de itens não agrupados (opcional). */
        items?: any[];
        /** Caminho base do avatar do usuário. Padrão: `/avatar/`. */
        avatarPath?: string;
    }>();

    const emit = defineEmits<{
        profile: [];
        settings: [];
        support: [];
        toggleDarkMode: [];
        logout: [];
    }>();

    const system = useSystemStore();
    const user = useUserStore();
    const menus = useListMenusStore();
    const router = useRouter();
    const route = useRoute();

    const userName = computed<string>(() => user.data?.name ?? 'Minha Conta');
    const userSubtext = computed<string>(() => user.data?.email || user.data?.solar_company_name || '');
    const avatarUrl = computed<string | undefined>(() => (user.data?.id ? `${props.avatarPath ?? '/avatar/'}${user.data.id}` : undefined));
    const isDark = computed<boolean>(() => user.data?.settings?.darkMode === true);

    /** Processa e organiza os grupos de menu exibidos. */
    const menuGroups = computed<MenuGroup[]>(() => {
        if (props.groups?.length) return props.groups;

        if (props.items?.length) return [{ title: 'Navegação', items: props.items }];


        const sideItems: SideMenuItem[] = ((menus.list as any)?.side ?? []).filter((item: SideMenuItem) => !item.details?.hide);

        const mainItems = sideItems.filter((item) => !item.details?.settings);
        const settingsItems = sideItems.filter((item) => item.details?.settings);

        const result: MenuGroup[] = [];
        if (mainItems.length) result.push({ title: 'Menu Principal', items: mainItems });
        if (settingsItems.length) result.push({ title: 'Configurações', items: settingsItems });

        return result;
    });

    function getItemLabel(item: any): string {
        return item.label || item.title || item.details?.title || item.details?.tooltip || item.name || '';
    }

    function getItemIcon(item: any): string {
        return item.icon || item.icone || item.details?.icon || 'mdi:circle-medium';
    }

    function getItemRoute(item: any): string | null {
        return item.route || item.rota || item.details?.route || item.details?.page_component || null;
    }

    function isItemActive(item: any): boolean {
        const routeName = getItemRoute(item);
        if (!routeName) return false;

        const currentName = String(route?.name ?? '');

        return currentName === routeName || (item.matches?.includes(currentName) ?? false);
    }

    function openItem(item: any): void {
        system.side_menu_open = false;

        if (typeof item.action === 'function') {
            item.action();
            return;
        }

        const targetRoute = getItemRoute(item);
        if (targetRoute && route?.name !== targetRoute) router.push({ name: targetRoute });

    }

    function goToProfile(): void {
        system.side_menu_open = false;
        emit('profile');
    }

    function emitToggleDarkMode(): void {
        emit('toggleDarkMode');
    }

    function emitLogout(): void {
        system.side_menu_open = false;
        emit('logout');
    }
</script>

<style lang="scss">
    .max-side-menu-mobile-drawer {
        .max-drawer {
            width: min(88%, 340px) !important;
            padding: 0;
            background-color: var(--background-0, #fff);
            display: flex;
            flex-direction: column;
        }

        .max-drawer-content {
            padding: 0 !important;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
        }
    }

    .mobile-side-menu {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        overflow: hidden;

        .mobile-profile-header {
            display: grid;
            grid-template-columns: 44px 1fr 32px;
            align-items: center;
            gap: 0.75rem;
            padding: 1.25rem 1rem;
            background-color: var(--blue-850, #0f172a);
            color: #fff;
            cursor: pointer;
            flex-shrink: 0;

            .mobile-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background-color: var(--blue-700, #1e293b);
                display: grid;
                place-items: center;
                overflow: hidden;
            }

            .mobile-profile-details {
                display: flex;
                flex-direction: column;
                min-width: 0;
                gap: 0.15rem;

                .mobile-profile-name {
                    font-size: 0.95rem;
                    font-weight: 600;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .mobile-profile-subtext {
                    font-size: 0.75rem;
                    color: var(--background-400, #94a3b8);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            }

            .mobile-profile-chevron {
                background: none;
                border: none;
                color: var(--background-300, #cbd5e1);
                display: grid;
                place-items: center;
                cursor: pointer;
                padding: 0;
            }
        }

        .switcher {
            padding: 0.3rem 1rem 0;
        }

        .mobile-menu-content {
            flex: 1 1 auto;
            overflow-y: auto;
            padding: 0.75rem 0.5rem;
            -webkit-overflow-scrolling: touch;

            &::-webkit-scrollbar {
                width: 0;
            }
        }

        .mobile-menu-group {
            margin-bottom: 1.25rem;

            .mobile-group-title {
                font-size: 0.68rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: var(--background-500, #64748b);
                padding: 0.25rem 0.75rem 0.5rem;
            }
        }

        .mobile-menu-item {
            display: grid;
            grid-template-columns: 24px 1fr;
            align-items: center;
            gap: 0.75rem;
            min-height: 44px;
            padding: 0 0.75rem;
            border-radius: 10px;
            color: var(--background-750, #334155);
            cursor: pointer;
            transition: background-color 0.16s ease, color 0.16s ease;

            .mobile-item-label {
                font-size: 0.9rem;
                font-weight: 500;
            }

            &:hover {
                background-color: var(--background-100, #f1f5f9);
            }

            &.active {
                background-color: var(--blue-100, #e0f2fe);
                color: var(--blue-800, #0369a1);

                .mobile-item-label {
                    font-weight: 600;
                }
            }

            &:focus-visible {
                outline: 2px solid var(--blue-500, #0ea5e9);
                outline-offset: -2px;
            }
        }

        .mobile-menu-footer {
            flex-shrink: 0;
            padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
            border-top: 1px solid var(--background-200, #e2e8f0);
            background-color: var(--background-50, #f8fafc);
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .mobile-footer-actions {
                display: flex;
                gap: 0.5rem;
            }

            .mobile-footer-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                height: 38px;
                border: 1px solid var(--background-300, #cbd5e1);
                border-radius: 8px;
                background-color: var(--background-0, #fff);
                color: var(--background-700, #475569);
                font-size: 0.82rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color 0.15s ease;

                &:hover {
                    background-color: var(--background-100, #f1f5f9);
                }

                &.logout {
                    color: var(--red-600, #dc2626);
                    border-color: var(--red-200, #fecaca);

                    &:hover {
                        background-color: var(--red-50, #fef2f2);
                    }
                }
            }

            .mobile-app-version {
                text-align: center;
                font-size: 0.7rem;
                color: var(--background-400, #94a3b8);
            }
        }
    }
</style>
