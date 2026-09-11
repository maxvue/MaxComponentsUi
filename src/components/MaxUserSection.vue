<template>
    <div
        class="max-user-section user-section user-profile-trigger"
        :class="{ 'only-avatar': isCompact }"
        :screen="props.screen"
        ref="root_el"
        role="button"
        tabindex="0"
        aria-haspopup="menu"
        :aria-expanded="isOpen"
        :aria-controls="userMenuId"
        aria-label="Perfil do usuário"
        @click.stop="toggle"
        @keydown.enter.prevent="toggle"
        @keydown.space.prevent="toggle"
        @keydown.down.prevent="openAndFocusFirst"
        @keydown.up.prevent="openAndFocusLast"
    >
        <div v-if="!isCompact" class="user-text-div">
            <div v-if="props.companyName" class="solar-company-text">
                {{ props.companyName }}
            </div>
            <div class="user-name-text">
                {{ props.name }}
            </div>
        </div>
        <div class="button-avatar" :class="{ 'mobile-user-avatar': isCompact }">
            <MaxUserAvatar
                v-if="props.userId || props.avatarUrl"
                :image-url="props.avatarUrl"
                :name="props.name"
                :show-tooltip="false"
            />
            <MaxIcon v-else icon="clarity:avatar-solid" size="1.2" light />
        </div>
        <div v-if="props.isImpersonated && !isCompact" class="impersonated-btn" @click.stop="onEndImpersonate">
            <div class="impersonated-btn-grid">
                <MaxIcon i="ci:user-close" icon-blue size="1.3" />

                <div class="impersonated-btn-label">
                    <div class="a">{{ props.labelEndImpersonate }}</div>
                    <div class="b">{{ props.labelEndImpersonateSub }}</div>
                </div>
            </div>
        </div>

        <Teleport to="body" v-if="isOpen">
            <div
                ref="menuEl"
                :id="userMenuId"
                class="max-user-section-overlay"
                role="menu"
                :style="{ top: position.top + 'px', left: position.left + 'px' }"
                @keydown="onUserMenuKeydown"
            >
                <template v-for="(item, index) in menuItems" :key="index">
                    <hr v-if="item.separator" class="max-user-section-separator" role="separator" />
                    <div
                        v-else-if="item.label"
                        class="main-item-menu-div"
                        role="menuitem"
                        :tabindex="focusedUserMenuIdx === index ? 0 : -1"
                        :ref="(el) => setUserMenuItemRef(el, index)"
                        @click="handleItemClick(item)"
                        @mouseenter="focusedUserMenuIdx = index"
                    >
                        <MaxIcon v-if="item.icon" :icon="item.icon" />
                        <div>
                            {{ item.label }}
                        </div>
                    </div>
                </template>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, nextTick, watch, onBeforeUnmount } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxUserAvatar from './MaxUserAvatar.vue';
    import { useElementSize, useWindowSize } from '@maxvue/max-use';
    import { useActiveElementBounding } from '../composables/useActiveElementBounding';

    const props = withDefaults(defineProps<{
        /** Nome do usuário */
        name?: string;
        /** Nome da empresa (opcional) */
        companyName?: string;
        /** Identificador do usuário (usado para exibir o avatar) */
        userId?: string | number;
        /** URL da imagem do avatar */
        avatarUrl?: string;
        /** Estado atual do modo escuro */
        darkMode?: boolean;
        /** Indica se a sessão está impersonada */
        isImpersonated?: boolean;
        /** Versão exibida como última linha do menu */
        version?: string;
        /** Sobrescreve o menu padrão */
        items?: any[];
        /** Labels (defaults pt-BR) */
        labelProfile?: string;
        labelSettings?: string;
        labelDarkModeOn?: string;
        labelDarkModeOff?: string;
        labelSupport?: string;
        labelLogout?: string;
        labelEndImpersonate?: string;
        labelEndImpersonateSub?: string;
        /** Exibe apenas o avatar (modo compacto/mobile) */
        onlyAvatar?: boolean;
        /** Tipo de tela: 'desktop' | 'mobile' */
        screen?: 'desktop' | 'mobile';
    }>(), {
        labelProfile: 'Meu perfil',
        labelSettings: 'Configurações',
        labelDarkModeOn: 'Ativar Modo escuro',
        labelDarkModeOff: 'Desativar Modo escuro',
        labelSupport: 'Suporte',
        labelLogout: 'Sair',
        labelEndImpersonate: 'SAIR',
        labelEndImpersonateSub: '(RETORNAR)',
        onlyAvatar: false,
        screen: 'desktop'
    });

    const isCompact = computed(() => props.onlyAvatar || props.screen === 'mobile');

    const emit = defineEmits<{
        profile: [];
        settings: [];
        toggleDarkMode: [];
        support: [];
        logout: [];
        endImpersonate: [];
    }>();

    const userMenuId = `max-user-menu-${Math.random().toString(36).slice(2, 9)}`;
    const focusedUserMenuIdx = ref(0);
    const menuItemRefs = ref<(HTMLElement | null)[]>([]);

    const setUserMenuItemRef = (el: any, index: number) => {
        menuItemRefs.value[index] = el as HTMLElement | null;
    };

    const root_el = ref<HTMLElement | null>(null);
    const menuEl = ref<HTMLElement | null>(null);
    const anchorEl = ref<HTMLElement | null>(null);
    const isOpen = ref(false);

    const boundingTarget = computed(() => anchorEl.value ?? root_el.value);
    const { x, y, width: width_btn, height: height_btn } = useActiveElementBounding(boundingTarget, isOpen);
    const { width: width_el, height: height_el } = useElementSize(menuEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetW = width_btn.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 4;
        let left = targetX + targetW - (width_el.value || 180);

        if (top + (height_el.value || 200) > window_height.value && targetY - (height_el.value || 200) > 0) top = targetY - (height_el.value || 200) - 4;

        if (left < 10) left = 10;
        if (window_width.value && left + (width_el.value || 180) > window_width.value - 10) left = Math.max(10, window_width.value - (width_el.value || 180) - 10);

        return { top, left };
    });

    const defaultItems = computed(() => {
        const list: any[] = [
            {
                label: props.labelProfile,
                icon: 'lucide:user',
                exec: () => emit('profile')
            },
            {
                separator: true
            },
            {
                label: props.labelSettings,
                icon: 'tabler:user-cog',
                exec: () => emit('settings')
            },
            {
                label: props.darkMode === true ? props.labelDarkModeOff : props.labelDarkModeOn,
                icon: 'material-symbols-light:dark-mode-rounded',
                exec: () => emit('toggleDarkMode')
            },
            {
                label: props.labelSupport,
                icon: 'formkit:help',
                exec: () => emit('support')
            },
            {
                label: props.labelLogout,
                icon: 'ion:exit-outline',
                exec: () => emit('logout')
            }
        ];

        if (props.version) list.push({ label: `Versão: ${props.version}` });

        return list;
    });

    const menuItems = computed(() => props.items ?? defaultItems.value);

    const getNavigableIndices = (): number[] => {
        const indices: number[] = [];
        menuItems.value.forEach((it, idx) => {
            if (it.label && !it.separator) indices.push(idx);
        });
        return indices;
    };

    const setAnchor = (event?: any) => {
        if (event?.currentTarget) anchorEl.value = event.currentTarget as HTMLElement;
        else if (root_el.value) anchorEl.value = root_el.value;
    };

    const toggle = (event?: any) => {
        setAnchor(event);
        isOpen.value = !isOpen.value;
        if (isOpen.value) {
            const nav = getNavigableIndices();
            focusedUserMenuIdx.value = nav[0] ?? 0;
        }
    };

    const hide = () => {
        isOpen.value = false;
    };

    const show = (event?: any) => {
        setAnchor(event);
        isOpen.value = true;
        const nav = getNavigableIndices();
        focusedUserMenuIdx.value = nav[0] ?? 0;
    };

    const openAndFocusFirst = (event?: any) => {
        setAnchor(event);
        if (!isOpen.value) isOpen.value = true;
        nextTick(() => {
            const nav = getNavigableIndices();
            focusedUserMenuIdx.value = nav[0] ?? 0;
            menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
        });
    };

    const openAndFocusLast = (event?: any) => {
        setAnchor(event);
        if (!isOpen.value) isOpen.value = true;
        nextTick(() => {
            const nav = getNavigableIndices();
            focusedUserMenuIdx.value = nav[nav.length - 1] ?? 0;
            menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
        });
    };

    const handleItemClick = (item: any) => {
        if (item.exec) item.exec();
        hide();
        root_el.value?.focus();
    };

    const onEndImpersonate = () => {
        emit('endImpersonate');
    };

    const onUserMenuKeydown = (event: KeyboardEvent) => {
        const navIndices = getNavigableIndices();
        if (navIndices.length === 0) return;

        const currentNavPos = navIndices.indexOf(focusedUserMenuIdx.value);

        switch (event.key) {
            case 'ArrowDown': {
                event.preventDefault();
                const nextNavPos = (currentNavPos + 1) % navIndices.length;
                focusedUserMenuIdx.value = navIndices[nextNavPos];
                menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
                break;
            }
            case 'ArrowUp': {
                event.preventDefault();
                const prevNavPos = (currentNavPos - 1 + navIndices.length) % navIndices.length;
                focusedUserMenuIdx.value = navIndices[prevNavPos];
                menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
                break;
            }
            case 'Home': {
                event.preventDefault();
                focusedUserMenuIdx.value = navIndices[0];
                menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
                break;
            }
            case 'End': {
                event.preventDefault();
                focusedUserMenuIdx.value = navIndices[navIndices.length - 1];
                menuItemRefs.value[focusedUserMenuIdx.value]?.focus();
                break;
            }
            case 'Enter':
            case ' ': {
                event.preventDefault();
                const item = menuItems.value[focusedUserMenuIdx.value];
                if (item) handleItemClick(item);

                break;
            }
            case 'Escape': {
                event.preventDefault();
                hide();
                root_el.value?.focus();
                break;
            }
        }
    };

    const onDocPointerDown = (e: PointerEvent) => {
        if (!isOpen.value) return;
        const target = e.target as Node | null;
        if (!target) return;
        if (menuEl.value?.contains(target)) return;
        if (root_el.value?.contains(target)) return;
        if (anchorEl.value?.contains(target)) return;
        hide();
    };

    const onDocClick = (e: MouseEvent) => {
        if (!isOpen.value) return;
        const target = e.target as Node | null;
        if (!target) return;
        if (menuEl.value?.contains(target)) return;
        if (root_el.value?.contains(target)) return;
        if (anchorEl.value?.contains(target)) return;
        hide();
    };

    const onGlobalKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) {
            hide();
            root_el.value?.focus();
        }
    };

    watch(isOpen, (open) => {
        if (typeof window === 'undefined') return;
        if (open) {
            menuItemRefs.value = [];
            window.addEventListener('keydown', onGlobalKeydown);
            document.addEventListener('pointerdown', onDocPointerDown, true);
            document.addEventListener('click', onDocClick, true);
        } else {
            window.removeEventListener('keydown', onGlobalKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }
    });

    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('keydown', onGlobalKeydown);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
            document.removeEventListener('click', onDocClick, true);
        }
    });

    defineExpose({
        toggle,
        show,
        hide,
        openAndFocusFirst,
        openAndFocusLast,
        isOpen,
        userMenuId,
        focusedUserMenuIdx
    });
</script>

<style lang="scss" scoped>
    .user-section {
        display: grid;
        place-items: center end;
        grid-auto-columns: auto 50px;
        gap: 1rem;
        position: relative;
        outline: none;
        cursor: pointer;

        &.user-profile-trigger {
            cursor: pointer;
        }

        &:focus-visible {
            outline: 2px solid var(--max-primary-500, #00768E);
            outline-offset: 2px;
            border-radius: 4px;
        }

        &.only-avatar,
        &[screen='mobile'] {
            display: flex;
            place-items: center;
            justify-content: center;
            width: auto;
            height: auto;
            gap: 0;

            .button-avatar {
                grid-column: 1;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                overflow: hidden;
                cursor: pointer;
                transition: opacity 0.18s ease;

                :deep(.p-avatar),
                :deep(.max-user-avatar) {
                    width: 34px;
                    height: 34px;
                }

                &:hover {
                    opacity: 0.85;
                }

                &:focus-visible {
                    outline: 2px solid var(--max-primary-500, #00768E);
                    outline-offset: 2px;
                }
            }
        }

        .user-text-div {
            grid-column: 1;
            width: auto;
            display: grid;
            place-items: center end;
            grid-template-rows: 1fr 1fr;
            color: var(--layout-shell-text, #fff);

            .solar-company-text {
                font-size: 0.9rem;
            }

            .user-name-text {
                font-size: 0.8rem;
                font-weight: 200;
                color: var(--layout-shell-text-muted, rgb(255 255 255 / 70%));
            }
        }

        .button-avatar {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            grid-column: 2;

            :deep(.p-avatar) {
                position: relative;
                margin: 0 !important;
                width: 40px;
                height: 40px;
            }
        }

        .impersonated-btn {
            position: absolute;
            top: -5px;
            right: -5px;
            width: calc(100% + 10px);
            height: calc(100% + 10px);
            padding: 0.5rem;
            font-size: 0.8rem;
            border-radius: 0.5rem;
            opacity: 0;
            transition: opacity 0.2s ease;
            display: grid;
            place-items: center;
            background-color: var(--background-0);

            &:hover {
                opacity: 1;
            }

            .impersonated-btn-grid {
                display: grid;
                place-items: center;
                grid-template-columns: auto 1fr;
                gap: 10px;
                width: 100%;
                height: 100%;
                padding: 0 8px;
                font-size: 0.9rem;
                color: var(--background-700);
                background-color: var(--background-0);

                :deep(.icon-div) {
                    transform: translateY(1px);
                }

                .impersonated-btn-label {
                    display: grid;
                    place-items: center;
                    grid-template-rows: 1fr auto;

                    .a {
                        font-size: 0.9rem;
                    }

                    .b {
                        font-size: 0.7rem;
                    }
                }
            }
        }
    }

    .max-user-section-overlay {
        position: fixed;
        z-index: var(--z-dropdown, 1000);
        background: var(--background-0, #fff);
        border: 1px solid var(--surface-border);
        border-radius: 0.5rem;
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
        min-width: 180px;
        padding: 4px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        .max-user-section-separator {
            border: none;
            border-top: 1px solid var(--surface-border);
            margin: 4px 0;
        }

        .main-item-menu-div {
            display: grid;
            place-items: center start;
            gap: 10px;
            width: 100%;
            height: 100%;
            padding: 8px;
            font-size: 0.9rem;
            color: var(--background-700);
            background-color: var(--background-0);
            border-radius: 0.5rem;
            grid-template-columns: auto 1fr;
            outline: none;

            :deep(.max-icon-div) {
                color: currentcolor !important;
            }

            &:focus-visible {
                outline: 2px solid var(--max-primary-500, #00768E);
                outline-offset: -2px;
                background-color: var(--background-100, #f1f5f9);
                color: var(--background-775);
            }

            &:hover {
                background-color: var(--background-100, #f1f5f9);
                color: var(--background-775);
                cursor: pointer;
            }
        }
    }
</style>
