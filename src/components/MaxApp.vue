<template>
    <div v-if="route.name" class="max-app">
        <!-- Páginas de site e telas sem layout: apenas o conteúdo da rota. -->
        <div v-if="isSite || isBlank">
            <slot name="blank">
                <RouterView />
            </slot>
        </div>

        <!-- Usuário carregado, mas sem sessão: tela de login. -->
        <div v-else-if="isLoaded && !isLogged">
            <slot name="login">
                <RouterView />
            </slot>
        </div>

        <!-- Usuário autenticado: aplicação completa. -->
        <div v-else-if="isLoaded && isLogged">
            <slot name="authenticated">
                <MaxPageLayout
                    :screen="system.type_device"
                    :add-items="props.addItems"
                    :bottom-tabs="props.bottomTabs"
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
                    <RouterView />

                    <template v-for="(_, name) in forwardedSlots" #[name]="slotProps" :key="name">
                        <slot :name="name" v-bind="slotProps ?? {}"></slot>
                    </template>
                </MaxPageLayout>
            </slot>
        </div>

        <MaxLoadScreen />
    </div>

    <MaxPopoverConfirm />
    <MaxToast />

    <!-- Componentes que vivem fora do layout (VoIP, ouvintes de eventos). -->
    <slot v-if="isLoaded && isLogged" name="extras"></slot>
</template>

<script setup lang="ts">
    import { computed, watch, useSlots } from 'vue';
    import { RouterView, useRoute } from 'vue-router';
    import MaxPageLayout from './MaxPageLayout.vue';
    import MaxLoadScreen from './MaxLoadScreen.vue';
    import MaxPopoverConfirm from './MaxPopoverConfirm.vue';
    import MaxToast from './MaxToast.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useUserStore } from '../stores/useUser.Store';
    import { useLoginStore } from '../stores/useLogin.Store';
    import { configureMaxApp } from '../helpers/maxAppConfig';
    import type { BottomTab } from './MaxBottomMenu.vue';
    import type { MenuGroup } from './MaxSideMenuMobile.vue';

    /** Slots repassados ao `MaxPageLayout`. */
    const LAYOUT_SLOTS = ['status', 'search', 'add', 'chat', 'bugs', 'notifications', 'voip', 'live', 'user', 'mobile-center'] as const;

    const props = withDefaults(defineProps<{
        /** Rota de submissão do login. */
        routeLogin?: string;
        /** Rota que lista os provedores sociais. */
        routeProviders?: string;
        /** Rota que devolve os dados do usuário. */
        routeUser?: string;
        /** Habilita o login por nome de usuário. */
        allowUserName?: boolean;
        /** Habilita o login por e-mail. */
        allowEmail?: boolean;
        /** Habilita o login por telefone. */
        allowPhone?: boolean;
        /**
         * Rotas que devem renderizar sem layout. No engeapp eram nomes fixos no
         * `App.vue` ('Page', 'contatos', 'Contract', 'Wire', ...).
         */
        blankPages?: string[];
        /** Itens do menu "Adicionar Novo" do topo e do FAB mobile. */
        addItems?: Array<Record<string, any>>;
        /** Abas do menu inferior (mobile). */
        bottomTabs?: BottomTab[];
        /** Grupos de navegação para o menu lateral móvel (gaveta). */
        sideMenuGroups?: MenuGroup[];
        /** Itens de navegação para o menu lateral móvel. */
        sideMenuItems?: any[];
        /** Caminho base do avatar do usuário. */
        avatarPath?: string;
        /**
         * Logo do menu lateral. Aceita uma URL (`/get_file?file=logo.svg`,
         * `https://…`) ou o nome de uma rota, resolvido pelo `getRoute`.
         * Sem ela, o espaço fica vazio.
         */
        logo?: string;
    }>(), {
        allowUserName: true,
        allowEmail: true,
        allowPhone: true,
        blankPages: () => []
    });

    /**
     * Eventos do menu do usuário, vindos do `MaxUserSection` e repassados pelo
     * `MaxPageLayout`. A aplicação decide o que fazer: a limpeza do logout e a
     * navegação de perfil dependem do domínio dela.
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

    // A configuração precisa ser aplicada antes das stores resolverem suas rotas.
    configureMaxApp({
        ...(props.routeLogin ? { routeLogin: props.routeLogin } : {}),
        ...(props.routeProviders ? { routeProviders: props.routeProviders } : {}),
        ...(props.routeUser ? { routeUser: props.routeUser } : {})
    });

    const route = useRoute();
    const system = useSystemStore();
    const user = useUserStore();
    const login = useLoginStore();

    const slots = useSlots();

    /** Apenas os slots de layout efetivamente informados. */
    const forwardedSlots = computed(() => {
        const provided: Record<string, true> = {};

        LAYOUT_SLOTS.forEach((name) => {
            if (slots[name]) provided[name] = true;
        });

        return provided;
    });

    /**
     * Indica que a store de usuário terminou de carregar do servidor.
     *
     * `status` é injetado pelo `@maxvue/max-pinia`; sem o plugin, nada é
     * renderizado além dos singletons — o mesmo comportamento do engeapp.
     */
    const isLoaded = computed<boolean>(() => Boolean((user as any).status?.server?.get?.is_success));

    /** Indica sessão ativa. */
    const isLogged = computed<boolean>(() => Boolean(user.data?.id));

    /** Rota marcada como site (`meta.layout === 'site'`). */
    const isSite = computed<boolean>(() => route?.meta?.layout === 'site');

    /** Rota sem layout, por `meta.layout` ou por estar em `blankPages`. */
    const isBlank = computed<boolean>(() => route?.meta?.layout === 'blank' || props.blankPages.includes(system.page));

    // Propaga as permissões de login para a store do formulário.
    watch(() => [props.allowEmail, props.allowPhone, props.allowUserName], ([email, phone, userName]) => {
        login.allow_email = email as boolean;
        login.allow_phone = phone as boolean;
        login.allow_user_name = userName as boolean;
    }, { immediate: true });
</script>

<style lang="scss">
    .max-app {
        min-height: 100vh;

        .fade-enter-active,
        .fade-leave-active {
            transition: opacity 0.2s ease;
        }

        .fade-enter-from,
        .fade-leave-to {
            opacity: 0;
        }
    }
</style>
