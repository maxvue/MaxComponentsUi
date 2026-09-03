<template>
    <div class="container-app-mobile" v-bind="attrs">
        <MaxTopMenu
            v-bind="attrs"
            screen="mobile"
            :add-items="props.addItems"
            :avatar-path="props.avatarPath"
            @profile="emit('profile')"
            @settings="emit('settings')"
            @support="emit('support')"
            @toggle-dark-mode="emit('toggleDarkMode')"
            @logout="emit('logout')"
            @end-impersonate="emit('endImpersonate')"
        >
            <!-- Repassa os slots do topo para quem usa o layout mobile -->
            <template v-for="(_, name) in topMenuSlots" #[name]="slotProps" :key="name">
                <slot :name="name" v-bind="slotProps ?? {}"></slot>
            </template>
        </MaxTopMenu>

        <main class="mobile-page-content">
            <slot></slot>
        </main>

        <slot name="bottom-menu">
            <MaxBottomMenu
                v-bind="attrs"
                :tabs="props.bottomTabs"
                :add-items="props.addItems"
                :show-labels="props.bottomShowLabels"
                @fab-click="emit('fabClick')"
            />
        </slot>

        <slot name="side-menu">
            <MaxSideMenuMobile
                v-bind="attrs"
                :groups="props.sideMenuGroups"
                :items="props.sideMenuItems"
                :avatar-path="props.avatarPath"
                @profile="emit('profile')"
                @settings="emit('settings')"
                @support="emit('support')"
                @toggle-dark-mode="emit('toggleDarkMode')"
                @logout="emit('logout')"
            >
                <template v-if="$slots.switcher" #switcher="slotProps">
                    <slot name="switcher" v-bind="slotProps ?? {}"></slot>
                </template>
            </MaxSideMenuMobile>
        </slot>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs, useSlots } from 'vue';
    import MaxTopMenu from './MaxTopMenu.vue';
    import MaxBottomMenu from './MaxBottomMenu.vue';
    import MaxSideMenuMobile from './MaxSideMenuMobile.vue';
    import type { BottomTab } from './MaxBottomMenu.vue';
    import type { MenuGroup } from './MaxSideMenuMobile.vue';

    /** Slots repassados ao `MaxTopMenu`. */
    const TOP_MENU_SLOTS = ['status', 'search', 'add', 'chat', 'bugs', 'notifications', 'voip', 'live', 'user', 'mobile-center', 'mobile-actions'] as const;

    const props = defineProps<{
        /** Itens do menu "Adicionar Novo" do topo e do FAB inferior. */
        addItems?: Array<Record<string, any>>;
        /** Abas do menu inferior (mobile). Omitido, usa o padrão do `MaxBottomMenu`. */
        bottomTabs?: BottomTab[];
        /** Exibe rótulos textuais no menu inferior. Padrão false (estilo AgenteDeBolso). */
        bottomShowLabels?: boolean;
        /** Grupos de menu para a gaveta lateral. */
        sideMenuGroups?: MenuGroup[];
        /** Itens de menu simples para a gaveta lateral. */
        sideMenuItems?: any[];
        /** Caminho base do avatar do usuário. */
        avatarPath?: string;
        /** Logo do cabeçalho / menu. */
        logo?: string;
    }>();

    const emit = defineEmits<{
        profile: [];
        settings: [];
        support: [];
        toggleDarkMode: [];
        logout: [];
        endImpersonate: [];
        fabClick: [];
    }>();

    const attrs = useAttrs();
    const slots = useSlots();

    /** Apenas os slots de topo efetivamente informados. */
    const topMenuSlots = computed(() => {
        const provided: Record<string, true> = {};

        TOP_MENU_SLOTS.forEach((name) => {
            if (slots[name]) provided[name] = true;
        });

        return provided;
    });
</script>

<style lang="scss">
    .container-app-mobile {
        display: grid;
        grid-template-rows:
            var(--top-menu-height, 60px)
            1fr
            calc(var(--bottom-menu-height, 58px) + var(--safe-area-bottom, env(safe-area-inset-bottom, 0px)));
        width: 100%;
        height: 100vh;
        height: 100dvh;
        overflow: hidden;
        background-color: var(--blue-850, #0f172a);
        box-sizing: border-box;

        .mobile-page-content {
            grid-row: 2;
            overflow: hidden auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-y: contain;
            padding-left: env(safe-area-inset-left, 0);
            padding-right: env(safe-area-inset-right, 0);
            background-color: var(--background-25, #f8fafc);
            height: 100%;
            box-sizing: border-box;

            &::-webkit-scrollbar {
                width: 0;
                height: 0;
            }
        }
    }
</style>
