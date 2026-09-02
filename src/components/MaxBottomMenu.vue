<template>
    <nav class="bottom-menu" :class="{ 'is-curved': props.curved && hasFab }">
        <!-- Fundo em SVG com recorte côncavo suave no centro quando há FAB -->
        <svg
            v-if="props.curved && hasFab"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 120"
            class="img-background"
            preserveAspectRatio="none"
            aria-hidden="true"
        >
            <path d="M300 60c-13,0 -22,-11 -28,-25 -6,-14 -13,-25 -24,-25l-248 0 0 110 600 0 0 -110 -248 0c-11,0 -18,11 -24,25 -6,14 -15,25 -28,25z" />
        </svg>

        <div class="bottom-menu-bar" :style="gridStyle">
            <template v-if="hasFab">
                <!-- Abas à esquerda do FAB -->
                <div
                    v-for="tab in leftTabs"
                    :key="tab.name"
                    class="bottom-menu-tab"
                    :class="{ active: isActive(tab) }"
                    role="link"
                    tabindex="0"
                    :aria-label="tab.label || tab.name"
                    :aria-current="isActive(tab) ? 'page' : undefined"
                    @click="goTo(tab.name)"
                    @keydown.enter="goTo(tab.name)"
                >
                    <MaxIcon :icon="tab.icon" size="1.3" />
                    <span v-if="tab.label" class="bottom-menu-label">{{ tab.label }}</span>
                </div>

                <!-- FAB Central com menu de adição ou clique -->
                <div class="bottom-menu-fab-wrapper">
                    <slot name="fab">
                        <MaxPopoverMenu v-if="props.addItems?.length" :items="props.addItems" class="menu-plus-bottom">
                            <template #button>
                                <button
                                    type="button"
                                    class="fab"
                                    aria-label="Adicionar novo"
                                    @keydown.enter.prevent="(event) => (event.currentTarget as HTMLElement).click()"
                                >
                                    <MaxIcon icon="ic:round-plus" size="1.5" />
                                </button>
                            </template>
                        </MaxPopoverMenu>
                        <button
                            v-else
                            type="button"
                            class="fab"
                            aria-label="Adicionar novo"
                            @click="emit('fabClick')"
                        >
                            <MaxIcon icon="ic:round-plus" size="1.5" />
                        </button>
                    </slot>
                </div>

                <!-- Abas à direita do FAB -->
                <div
                    v-for="tab in rightTabs"
                    :key="tab.name"
                    class="bottom-menu-tab"
                    :class="{ active: isActive(tab) }"
                    role="link"
                    tabindex="0"
                    :aria-label="tab.label || tab.name"
                    :aria-current="isActive(tab) ? 'page' : undefined"
                    @click="goTo(tab.name)"
                    @keydown.enter="goTo(tab.name)"
                >
                    <MaxIcon :icon="tab.icon" size="1.3" />
                    <span v-if="tab.label" class="bottom-menu-label">{{ tab.label }}</span>
                </div>
            </template>

            <template v-else>
                <div
                    v-for="tab in props.tabs"
                    :key="tab.name"
                    class="bottom-menu-tab"
                    :class="{ active: isActive(tab) }"
                    role="link"
                    tabindex="0"
                    :aria-label="tab.label || tab.name"
                    :aria-current="isActive(tab) ? 'page' : undefined"
                    @click="goTo(tab.name)"
                    @keydown.enter="goTo(tab.name)"
                >
                    <MaxIcon :icon="tab.icon" size="1.3" />
                    <span v-if="tab.label" class="bottom-menu-label">{{ tab.label }}</span>
                </div>
            </template>
        </div>
    </nav>
</template>

<script setup lang="ts">
    import { computed, useSlots } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import MaxIcon from './MaxIcon.vue';
    import MaxPopoverMenu from './MaxPopoverMenu.vue';

    /** Aba exibida no menu inferior. */
    export interface BottomTab {
        /** Nome da rota de destino. */
        name: string;
        /** Rótulo exibido abaixo do ícone. */
        label?: string;
        /** Ícone da aba. */
        icon: string;
        /**
         * Rotas adicionais que também marcam esta aba como ativa — útil para
         * telas de detalhe que pertencem à mesma seção.
         */
        matches?: string[];
    }

    const props = withDefaults(defineProps<{
        /** Abas exibidas. O padrão reproduz o menu do engeapp. */
        tabs?: BottomTab[];
        /** Itens do menu "Adicionar Novo" para o FAB central. */
        addItems?: Array<Record<string, any>>;
        /** Força ou esconde a exibição do botão FAB central. */
        showFab?: boolean;
        /** Habilita o recorte côncavo suave em SVG para o FAB central. */
        curved?: boolean;
    }>(), {
        tabs: () => [
            { name: 'integrador_dashboard', label: 'Início', icon: 'mdi:view-dashboard-outline' },
            { name: 'integrador_clients', label: 'Clientes', icon: 'mdi:account-group-outline', matches: ['integrador_client_show'] },
            { name: 'board', label: 'Projetos', icon: 'mdi:solar-panel' },
            { name: 'settings', label: 'Perfil', icon: 'mdi:account-circle-outline' }
        ],
        addItems: () => [],
        showFab: undefined,
        curved: true
    });

    const emit = defineEmits<{
        fabClick: [];
    }>();

    const slots = useSlots();
    const router = useRouter();
    const currentRoute = useRoute();

    /** Determina se o FAB central deve ser renderizado. */
    const hasFab = computed<boolean>(() => {
        if (typeof props.showFab === 'boolean') return props.showFab;

        return (props.addItems && props.addItems.length > 0) || Boolean(slots.fab);
    });

    const midIndex = computed<number>(() => Math.ceil((props.tabs?.length ?? 0) / 2));
    const leftTabs = computed<BottomTab[]>(() => props.tabs.slice(0, midIndex.value));
    const rightTabs = computed<BottomTab[]>(() => props.tabs.slice(midIndex.value));

    const gridStyle = computed(() => {
        if (hasFab.value) {
            const leftCount = leftTabs.value.length;
            const rightCount = rightTabs.value.length;

            return {
                gridTemplateColumns: `repeat(${leftCount}, 1fr) 64px repeat(${rightCount}, 1fr)`
            };
        }

        return {
            gridTemplateColumns: `repeat(${props.tabs.length}, 1fr)`
        };
    });

    /**
     * Indica a aba ativa, considerando também as rotas em `matches`.
     */
    function isActive(tab: BottomTab): boolean {
        const current = String(currentRoute?.name ?? '');

        return current === tab.name || (tab.matches?.includes(current) ?? false);
    }

    function goTo(name: string): void {
        if (currentRoute?.name === name) return;

        router.push({ name });
    }
</script>

<style scoped lang="scss">
    .bottom-menu {
        position: fixed;
        bottom: 0;
        left: 0;
        z-index: 900;
        width: 100%;
        height: calc(var(--bottom-menu-height, 58px) + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)));
        box-sizing: border-box;
        padding: 0 0.75rem calc(0.5rem + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)));
        background-color: var(--background-50, #f8fafc);
        display: flex;
        align-items: center;

        &.is-curved {
            background-color: transparent;
            padding: 0 0 calc(var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)));

            .bottom-menu-bar {
                background-color: transparent;
                border-radius: 0;
            }
        }

        .img-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            fill: var(--background-25, #fff);
            filter: drop-shadow(0 -2px 10px rgb(0 32 58 / 8%));
        }

        .bottom-menu-bar {
            position: relative;
            z-index: 1;
            display: grid;
            width: 100%;
            height: var(--bottom-menu-height, 58px);
            border-radius: 15px;
            background-color: var(--blue-850, #0f172a);
            color: var(--background-0, #fff);
            place-items: center;
        }

        .bottom-menu-tab {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.125rem;
            width: 100%;
            height: 100%;
            min-height: 44px;
            cursor: pointer;
            color: var(--background-600, #94a3b8);
            opacity: 0.75;
            transition: color 0.18s ease, opacity 0.18s ease;

            &:focus-visible {
                outline: 2px solid var(--blue-500, #3b82f6);
                outline-offset: -2px;
                border-radius: 10px;
            }

            &.active {
                opacity: 1;
                color: var(--blue-700, #38bdf8);
            }

            &:not(.active):hover {
                opacity: 0.95;
                color: var(--background-800, #cbd5e1);
            }
        }

        .bottom-menu-label {
            font-size: 0.7rem;
            line-height: 1;
            white-space: nowrap;
        }

        .bottom-menu-fab-wrapper {
            position: relative;
            display: grid;
            place-items: center;
            width: 64px;
            height: 100%;
        }

        .fab {
            position: absolute;
            top: -24px;
            width: 52px;
            height: 52px;
            display: grid;
            place-items: center;
            border: 0;
            padding: 0;
            appearance: none;
            border-radius: 999px;
            background: var(--blue-700, #0284c7);
            color: #fff;
            cursor: pointer;
            box-shadow: 0 6px 16px rgb(0 32 58 / 28%);
            transition: transform 0.18s ease, box-shadow 0.18s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 22px rgb(0 32 58 / 34%);
            }

            &:active {
                transform: translateY(0);
            }

            &:focus-visible {
                outline: 2px solid var(--blue-500, #38bdf8);
                outline-offset: 3px;
            }
        }
    }
</style>
