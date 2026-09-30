<template>
    <div
        class="max-user-section"
        :class="{ 'only-avatar': isCompact }"
        :screen="props.screen"
    >
        <button
            type="button"
            class="user-section user-profile-trigger"
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
        </button>

        <button
            v-if="props.isImpersonated && !isCompact"
            type="button"
            class="impersonated-btn"
            :aria-label="impersonateAriaLabel"
            @click.stop="onEndImpersonate"
            @keydown.enter.stop.prevent="onEndImpersonate"
            @keydown.space.stop.prevent="onEndImpersonate"
        >
            <div class="impersonated-btn-grid">
                <MaxIcon i="ci:user-close" icon-blue size="1.3" />

                <div class="impersonated-btn-label">
                    <div class="a">{{ props.labelEndImpersonate }}</div>
                    <div class="b">{{ props.labelEndImpersonateSub }}</div>
                </div>
            </div>
        </button>

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
                        v-else-if="item.isFontSize"
                        class="main-item-menu-div font-size-item-div"
                        role="menuitem"
                        :tabindex="focusedUserMenuIdx === index ? 0 : -1"
                        :ref="(el) => setUserMenuItemRef(el, index)"
                        @mouseenter="focusedUserMenuIdx = index"
                        @click.stop
                    >
                        <div class="font-size-left">
                            <MaxIcon icon="material-symbols-light:format-size-rounded" />
                            <span>{{ props.labelFontSize }}</span>
                        </div>
                        <div class="font-size-stepper" @click.stop>
                            <button
                                type="button"
                                class="font-size-btn"
                                :disabled="currentFontSize <= props.minFontSize"
                                aria-label="Diminuir tamanho da fonte"
                                @click.stop.prevent="decrementFontSize"
                            >
                                <MaxIcon icon="lucide:minus" size="0.75" />
                            </button>
                            <button
                                type="button"
                                class="font-size-value-btn"
                                title="Clique para restaurar 16px"
                                aria-label="Restaurar tamanho da fonte para 16px"
                                @click.stop.prevent="resetFontSize"
                            >
                                {{ currentFontSize }}
                            </button>
                            <button
                                type="button"
                                class="font-size-btn"
                                :disabled="currentFontSize >= props.maxFontSize"
                                aria-label="Aumentar tamanho da fonte"
                                @click.stop.prevent="incrementFontSize"
                            >
                                <MaxIcon icon="lucide:plus" size="0.75" />
                            </button>
                        </div>
                    </div>
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
    import { computed, ref, nextTick, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxUserAvatar from './MaxUserAvatar.vue';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';
    import { useHtmlFontSize, DEFAULT_FONT_SIZE, clampFontSize } from '../helpers/useHtmlFontSize';

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
        /** Tamanho atual da fonte em pixels */
        fontSize?: number;
        /** Tamanho mínimo permitido para a fonte */
        minFontSize?: number;
        /** Tamanho máximo permitido para a fonte */
        maxFontSize?: number;
        /** Rótulo da opção de tamanho da fonte */
        labelFontSize?: string;
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
        minFontSize: 10,
        maxFontSize: 24,
        labelFontSize: 'Tamanho da fonte',
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
        changeFontSize: [size: number];
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

    const { position } = useActiveOverlayPosition<{ top: number; left: number }>({
        target: boundingTarget,
        overlay: menuEl,
        active: isOpen,
        compute: ({ targetRect, overlayRect, viewportWidth, viewportHeight }) => {
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetW = targetRect.width;
            const targetH = targetRect.height;
            const width_el = overlayRect.width || 220;
            const height_el = overlayRect.height || 200;

            let top = targetY + targetH + 4;
            let left = targetX + targetW - width_el;

            if (top + height_el > viewportHeight && targetY - height_el > 0) top = targetY - height_el - 4;


            if (left < 10) left = 10;
            if (viewportWidth && left + width_el > viewportWidth - 10) left = Math.max(10, viewportWidth - width_el - 10);


            left = Math.max(8, Math.min(left, viewportWidth - width_el - 8));

            return { top, left };
        }
    });

    const { fontSize: globalFontSize, setFontSize: setGlobalFontSize } = useHtmlFontSize();

    const localFontSize = ref(props.fontSize ?? globalFontSize.value ?? DEFAULT_FONT_SIZE);

    watch(() => props.fontSize, (val) => {
        if (val !== undefined) localFontSize.value = clampFontSize(val);
    });

    watch(globalFontSize, (val) => {
        if (props.fontSize === undefined) localFontSize.value = val;
    });

    const currentFontSize = computed(() => localFontSize.value);

    const updateFontSize = (newSize: number) => {
        const clamped = clampFontSize(Math.min(props.maxFontSize, Math.max(props.minFontSize, newSize)));
        localFontSize.value = clamped;
        setGlobalFontSize(clamped);
        emit('changeFontSize', clamped);
    };

    const decrementFontSize = () => {
        if (currentFontSize.value > props.minFontSize) updateFontSize(currentFontSize.value - 1);
    };

    const incrementFontSize = () => {
        if (currentFontSize.value < props.maxFontSize) updateFontSize(currentFontSize.value + 1);
    };

    const resetFontSize = () => {
        updateFontSize(DEFAULT_FONT_SIZE);
    };

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
                isFontSize: true
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
            if ((it.label || it.isFontSize) && !it.separator) indices.push(idx);
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

    const impersonateAriaLabel = computed(() => {
        const main = props.labelEndImpersonate || 'Encerrar personificação';
        const sub = props.labelEndImpersonateSub ? ` ${props.labelEndImpersonateSub}` : '';
        return `${main}${sub}`.trim();
    });

    const onEndImpersonate = (event?: Event) => {
        event?.stopPropagation?.();
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
            case 'ArrowLeft': {
                const item = menuItems.value[focusedUserMenuIdx.value];
                if (item?.isFontSize) {
                    event.preventDefault();
                    decrementFontSize();
                }
                break;
            }
            case 'ArrowRight': {
                const item = menuItems.value[focusedUserMenuIdx.value];
                if (item?.isFontSize) {
                    event.preventDefault();
                    incrementFontSize();
                }
                break;
            }
            case 'Enter':
            case ' ': {
                const item = menuItems.value[focusedUserMenuIdx.value];
                if (item?.isFontSize) {
                    event.preventDefault();
                    break;
                }
                event.preventDefault();
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

    useOutsidePointer(isOpen, {
        elements: () => [menuEl.value, root_el.value, anchorEl.value],
        onClose: () => {
            hide();
            root_el.value?.focus();
        },
        closeOnEscape: true,
        triggerEl: root_el
    });

    watch(isOpen, (open) => {
        if (open) menuItemRefs.value = [];

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
    .max-user-section {
        position: relative;
        display: inline-flex;
        align-items: center;

        .user-section {
            display: grid;
            place-items: center end;
            grid-auto-columns: auto 50px;
            gap: 1rem;
            position: relative;
            outline: none;
            cursor: pointer;
            background: transparent;
            border: none;
            padding: 0;
            margin: 0;
            font: inherit;
            color: inherit;
            text-align: inherit;

            &.user-profile-trigger {
                cursor: pointer;
            }

            &:focus-visible {
                outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                outline-offset: 2px;
                box-shadow: var(--max-focus-ring, 0 0 0 2px var(--background-0, #fff), 0 0 0 4px var(--max-primary-500, #00768e));
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
                        outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
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
            border: none;
            cursor: pointer;
            color: inherit;
            font-family: inherit;
            margin: 0;

            &:hover,
            &:focus-visible {
                opacity: 1;
            }

            &:focus-visible {
                outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                outline-offset: 2px;
                box-shadow: var(--max-focus-ring, 0 0 0 2px var(--background-0, #fff), 0 0 0 4px var(--max-primary-500, #00768e));
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
        min-width: 220px;
        max-width: calc(100vw - 16px);
        box-sizing: border-box;
        max-height: calc(100dvh - 32px);
        overflow-y: auto;
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
                outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
                outline-offset: -2px;
                background-color: var(--background-100, #f1f5f9);
                color: var(--background-775);
            }

            &:hover {
                background-color: var(--background-100, #f1f5f9);
                color: var(--background-775);
                cursor: pointer;
            }

            &.font-size-item-div {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                cursor: default;

                &:hover {
                    cursor: default;
                }

                .font-size-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-width: 0;
                    flex: 1;

                    span {
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                }

                .font-size-stepper {
                    display: inline-flex;
                    align-items: center;
                    background-color: var(--background-100, #f1f5f9);
                    border: 1px solid var(--surface-border, var(--background-300, #cbd5e1));
                    border-radius: 6px;
                    padding: 1px;
                    gap: 1px;

                    .font-size-btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 22px;
                        height: 22px;
                        padding: 0;
                        margin: 0;
                        background: transparent;
                        border: none;
                        border-radius: 4px;
                        color: var(--background-700, #334155);
                        cursor: pointer;
                        transition: background-color 0.15s ease, color 0.15s ease;

                        &:hover:not(:disabled) {
                            background-color: var(--background-0, #fff);
                            color: var(--max-primary-500, #00768e);
                        }

                        &:focus-visible {
                            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                            outline-offset: 1px;
                        }

                        &:disabled {
                            opacity: 0.35;
                            cursor: not-allowed;
                        }
                    }

                    .font-size-value-btn {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-width: 28px;
                        height: 22px;
                        padding: 0 4px;
                        margin: 0;
                        font-size: 0.75rem;
                        font-weight: 600;
                        font-family: inherit;
                        color: var(--background-800, #1e293b);
                        background: transparent;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        user-select: none;
                        transition: background-color 0.15s ease, color 0.15s ease;

                        &:hover {
                            background-color: var(--background-0, #fff);
                            color: var(--max-primary-500, #00768e);
                        }

                        &:focus-visible {
                            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e));
                            outline-offset: 1px;
                        }
                    }
                }
            }
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
