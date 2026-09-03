<template>
    <!-- Layout dedicado para Mobile (inspirado no AgenteDeBolso) -->
    <MaxPageMobileLayout
        v-if="isMobile"
        v-bind="attrs"
        :add-items="props.addItems"
        :bottom-tabs="props.bottomTabs"
        :bottom-show-labels="props.bottomShowLabels"
        :side-menu-groups="props.sideMenuGroups"
        :side-menu-items="props.sideMenuItems"
        :avatar-path="props.avatarPath"
        :logo="props.logo"
        @profile="emit('profile')"
        @settings="emit('settings')"
        @support="emit('support')"
        @toggle-dark-mode="emit('toggleDarkMode')"
        @logout="emit('logout')"
        @end-impersonate="emit('endImpersonate')"
        @fab-click="emit('fabClick')"
    >
        <slot></slot>
        <template v-for="(_, name) in forwardedSlots" #[name]="slotProps" :key="name">
            <slot :name="name" v-bind="slotProps ?? {}"></slot>
        </template>
    </MaxPageMobileLayout>

    <!-- Layout padrão para Desktop -->
    <MaxContainerApp v-else v-bind="attrs">
        <MaxTopMenu
            v-bind="attrs"
            :add-items="props.addItems"
            :avatar-path="props.avatarPath"
            @profile="emit('profile')"
            @settings="emit('settings')"
            @support="emit('support')"
            @toggle-dark-mode="emit('toggleDarkMode')"
            @logout="emit('logout')"
            @end-impersonate="emit('endImpersonate')"
        >
            <!-- Repassa os slots do topo para quem usa o layout: notificações,
                 chat, VoIP e Live continuam vindo da aplicação. -->
            <template v-for="(_, name) in topMenuSlots" #[name]="slotProps" :key="name">
                <slot :name="name" v-bind="slotProps ?? {}"></slot>
            </template>
        </MaxTopMenu>

        <MaxSideMenu v-bind="attrs" :logo="props.logo" />

        <MaxPageContent v-bind="attrs">
            <slot></slot>
        </MaxPageContent>
    </MaxContainerApp>
</template>

<script setup lang="ts">
    import { computed, useAttrs, useSlots } from 'vue';
    import MaxContainerApp from './MaxContainerApp.vue';
    import MaxTopMenu from './MaxTopMenu.vue';
    import MaxSideMenu from './MaxSideMenu.vue';
    import MaxPageContent from './MaxPageContent.vue';
    import MaxPageMobileLayout from './MaxPageMobileLayout.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import type { BottomTab } from './MaxBottomMenu.vue';
    import type { MenuGroup } from './MaxSideMenuMobile.vue';

    /** Slots repassados ao `MaxTopMenu`. */
    const TOP_MENU_SLOTS = ['status', 'search', 'add', 'chat', 'bugs', 'notifications', 'voip', 'live', 'user', 'mobile-center', 'mobile-actions', 'switcher'] as const;

    const props = defineProps<{
        /** Dispositivo atual ('desktop' | 'mobile'). Quando omitido, consulta useSystemStore(). */
        screen?: string;
        /** Itens do menu "Adicionar Novo" do topo. */
        addItems?: Array<Record<string, any>>;
        /** Abas do menu inferior (mobile). Omitido, usa o padrão do `MaxBottomMenu`. */
        bottomTabs?: BottomTab[];
        /** Exibe rótulos textuais no menu inferior (mobile). Padrão false (estilo AgenteDeBolso). */
        bottomShowLabels?: boolean;
        /** Grupos de menu da gaveta lateral no mobile. */
        sideMenuGroups?: MenuGroup[];
        /** Itens de menu simples para a gaveta lateral no mobile. */
        sideMenuItems?: any[];
        /** Caminho base do avatar. */
        avatarPath?: string;
        /** Logo do menu lateral: URL ou nome de rota. Sem ela, nada é exibido. */
        logo?: string;
    }>();

    /**
     * Eventos do `MaxUserSection`, repassados do `MaxTopMenu` para quem usa o
     * layout. Sem este repasse eles morriam aqui, e o `@logout` da aplicação
     * nunca era disparado.
     */
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
    const system = useSystemStore();

    /** Determina se deve renderizar o layout mobile dedicado. */
    const isMobile = computed<boolean>(() => {
        const target = props.screen ?? (attrs.screen as string | undefined);
        if (target) return target === 'mobile';

        return system.type_device === 'mobile';
    });

    /** Todos os slots informados no componente. */
    const forwardedSlots = computed(() => {
        const provided: Record<string, true> = {};

        TOP_MENU_SLOTS.forEach((name) => {
            if (slots[name]) provided[name] = true;
        });

        return provided;
    });

    /** Apenas os slots de topo efetivamente informados. */
    const topMenuSlots = computed(() => forwardedSlots.value);
</script>
