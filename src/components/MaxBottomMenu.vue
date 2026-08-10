<template>
    <nav class="bottom-menu">
        <div class="bottom-menu-bar" :style="{ gridTemplateColumns: `repeat(${props.tabs.length}, 1fr)` }">
            <div v-for="tab in props.tabs" :key="tab.name" class="bottom-menu-tab" :class="{ active: isActive(tab) }" @click="goTo(tab.name)">
                <MaxIcon :icon="tab.icon" size="1.25" />
                <span class="bottom-menu-label">{{ tab.label }}</span>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
    import { useRoute, useRouter } from 'vue-router';
    import MaxIcon from './MaxIcon.vue';

    /** Aba exibida no menu inferior. */
    export interface BottomTab {
        /** Nome da rota de destino. */
        name: string;
        /** Rótulo exibido abaixo do ícone. */
        label: string;
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
    }>(), {
        tabs: () => [
            { name: 'integrador_dashboard', label: 'Início', icon: 'mdi:view-dashboard-outline' },
            { name: 'integrador_clients', label: 'Clientes', icon: 'mdi:account-group-outline', matches: ['integrador_client_show'] },
            { name: 'board', label: 'Projetos', icon: 'mdi:solar-panel' },
            { name: 'settings', label: 'Perfil', icon: 'mdi:account-circle-outline' }
        ]
    });

    const router = useRouter();
    const currentRoute = useRoute();

    /**
     * Indica a aba ativa, considerando também as rotas em `matches`.
     */
    function isActive(tab: BottomTab): boolean {
        const current = String(currentRoute.name ?? '');

        return current === tab.name || (tab.matches?.includes(current) ?? false);
    }

    function goTo(name: string): void {
        if (currentRoute.name === name) return;

        router.push({ name });
    }
</script>

<style scoped lang="scss">
    .bottom-menu {
        position: fixed;
        bottom: 0;
        left: 0;
        z-index: 900;
        width: 100vw;
        padding: 0 0.75rem calc(0.5rem + env(safe-area-inset-bottom));
        background-color: var(--background-50);

        .bottom-menu-bar {
            display: grid;
            height: 58px;
            border-radius: 15px;
            background-color: var(--blue-850);
            color: var(--background-0);
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
            cursor: pointer;
            opacity: 0.65;
            transition: opacity 0.15s ease;

            &.active {
                opacity: 1;
                color: var(--background-650);
            }
        }

        .bottom-menu-label {
            font-size: 0.7rem;
            line-height: 1;
        }
    }
</style>
