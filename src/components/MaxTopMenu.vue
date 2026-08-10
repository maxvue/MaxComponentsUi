<template>
    <div class="top-menu" v-bind="attrs">
        <div class="top-menu-elementos" v-bind="attrs">
            <div v-if="attrs.screen === 'mobile'" class="btn_side_menu">
                <MaxIcon icon="uil:bars" />
            </div>
            <div class="icons-save-div">
                <slot name="status"></slot>
            </div>

            <MaxTopToolbar v-if="toolbar.show" />
            <slot v-else name="search">
                <MaxTopMenuSearchBar />
            </slot>

            <slot name="add">
                <MaxPopoverMenu v-if="props.addItems?.length" icon="mdi:plus-circle" title="Adicionar Novo" light size="1.4" icon-hover-white :model="props.addItems" />
            </slot>

            <div class="tool-bar-plus" style="width: 30px; height: 30px;" grid center>
                <MaxIconButton v-tooltip.bottom="'Atualizar dados'" :i="reloading ? 'loading' : 'reload'" size="1.7" light icon-hover-white @click.stop="reloadAll" />
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
                    ml20
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

    /** URL do avatar do usuário logado. */
    const avatarUrl = computed(() => (user.data?.id ? `${props.avatarPath ?? '/avatar/'}${user.data.id}` : undefined));

    /** `isImpersonated` é injetado pelo `@maxvue/max-pinia`. */
    const isImpersonated = computed<boolean>(() => Boolean((user as any).isImpersonated));

    const reloading = ref(false);

    const reloadAll = (): void => {
        reloading.value = true;
        system.reloadAll();
        reloading.value = false;
    };
</script>

<style lang="scss">
    .top-menu {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 2;
        width: 100%;
        height: 64px;
        grid-template-columns: auto 1fr;
        color: var(--text-c);
        display: grid !important;
        place-items: center end;

        &[screen='mobile'] {
            place-items: center;
            grid-template-columns: 1fr !important;
        }

        .btn_side_menu {
            padding-left: 5px;
            font-size: 1.3rem;
            color: rgb(255 255 255 / 60%);
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
                place-items: center start;
                grid-template-columns: 1fr 40px 40px !important;
                gap: 1rem !important;
            }

            .icons-save-div {
                display: grid;
                height: 100%;
                padding-left: 20px;
                place-items: center;
            }
        }
    }
</style>
