<template>
    <div class="user-section" pointer @click.stop="toggle">
        <div class="user-text-div">
            <div class="solar-company-text">
                {{ props.subtitle ?? user.data?.solar_company_name }}
            </div>
            <div class="user-name-text">
                {{ user.data?.name }}
            </div>
        </div>
        <div class="button-avatar">
            <MaxUserAvatar v-if="user.data?.id" :image-url="hasAvatar ? avatarUrl : undefined" :name="user.data?.name?.charAt(0)" :show-tooltip="false" />
            <TieredMenu id="overlay_tmenu" ref="menu" :model="props.items ?? defaultItems" popup>
                <template #item="{ item }">
                    <div class="main-item-menu-div" @click="runItem(item)">
                        <MaxIcon :icon="item.icon" />
                        <div>
                            {{ item.label }}
                        </div>
                    </div>
                </template>
            </TieredMenu>
        </div>
        <div v-if="isImpersonated" class="impersonated-btn" @click.stop="emit('end-impersonate')">
            <div class="impersonated-btn-grid">
                <MaxIcon i="ci:user-close" icon-blue size="1.3" />
                <div class="impersonated-btn-label">
                    <div class="a">SAIR</div>
                    <div class="b">(RETORNAR)</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch } from 'vue';
    import TieredMenu from 'primevue/tieredmenu';
    import MaxIcon from './MaxIcon.vue';
    import MaxUserAvatar from './MaxUserAvatar.vue';
    import { useUserStore } from '../stores/useUser.Store';

    /** Item do menu do usuário. */
    export interface UserSectionItem {
        label?: string;
        icon?: string;
        separator?: boolean;
        exec?: () => void;
    }

    const props = defineProps<{
        /** Itens do menu. Quando omitido, usa perfil, modo escuro e sair. */
        items?: UserSectionItem[];
        /** Texto acima do nome. Padrão: a empresa do usuário. */
        subtitle?: string;
        /** Caminho base do avatar. Padrão: `/avatar/{id}`. */
        avatarPath?: string;
    }>();

    const emit = defineEmits<{
        /** Emitido ao acionar "Sair" — a aplicação executa sua própria limpeza. */
        logout: [];
        /** Emitido ao acionar "Meu perfil". */
        profile: [];
        /** Emitido ao alternar o modo escuro. */
        'toggle-dark-mode': [value: boolean];
        /** Emitido ao encerrar a impersonação. */
        'end-impersonate': [];
    }>();

    const user = useUserStore();

    /** `isImpersonated` é injetado pelo `@maxvue/max-pinia`. */
    const isImpersonated = computed<boolean>(() => Boolean((user as any).isImpersonated));

    /**
     * Pré-carrega o avatar: se a rota responder 404 (usuário sem foto), o
     * `MaxUserAvatar` cai no fallback com a inicial do nome.
     */
    const avatarUrl = computed(() => (user.data?.id ? `${props.avatarPath ?? '/avatar/'}${user.data.id}` : undefined));
    const hasAvatar = ref(false);

    watch(avatarUrl, (url) => {
        hasAvatar.value = false;

        if (!url || typeof Image === 'undefined') return;

        const img = new Image();
        img.onload = () => hasAvatar.value = true;
        img.src = url;
    }, { immediate: true });

    /**
     * Itens padrão. As ações que dependem do domínio da aplicação — navegação de
     * perfil e a limpeza do logout — saem como eventos.
     */
    const defaultItems = computed<UserSectionItem[]>(() => [
        { label: 'Meu perfil', icon: 'lucide:user', exec: () => emit('profile') },
        { separator: true },
        {
            label: user.data?.settings?.darkMode === true ? 'Desativar Modo escuro' : 'Ativar Modo escuro',
            icon: 'material-symbols-light:dark-mode-rounded',
            exec: () => emit('toggle-dark-mode', !(user.data?.settings?.darkMode === true))
        },
        { label: 'Sair', icon: 'ion:exit-outline', exec: () => emit('logout') }
    ]);

    const menu = ref();

    const toggle = (event: any): void => menu.value?.toggle(event);

    // O slot do TieredMenu tipa o item como MenuItem do PrimeVue, cujo `label`
    // pode ser função — daí o parâmetro mais largo aqui.
    const runItem = (item: Record<string, any>): void => item.exec?.();
</script>

<style lang="scss">
    .user-section {
        display: grid;
        gap: 0.5rem;
        grid-auto-flow: column;
        place-items: center;

        .user-text-div {
            display: grid;
            text-align: right;
            place-items: center end;

            .solar-company-text {
                font-size: 0.7rem;
                color: rgb(255 255 255 / 60%);
                line-height: 1;
            }

            .user-name-text {
                font-size: 0.85rem;
                color: var(--background-0);
                line-height: 1.2;
            }
        }

        .impersonated-btn {
            display: grid;
            cursor: pointer;
            place-items: center;

            .impersonated-btn-grid {
                display: grid;
                gap: 0.25rem;
                grid-auto-flow: column;
                place-items: center;
            }

            .impersonated-btn-label {
                font-size: 0.6rem;
                line-height: 1;

                .a {
                    font-weight: 600;
                }
            }
        }
    }

    .main-item-menu-div {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: 20px 1fr;
        place-items: center start;
    }
</style>
