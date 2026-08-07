<template>
    <div class="user-section" @click.stop="toggle" pointer>
        <div class="user-text-div">
            <div v-if="props.companyName" class="solar-company-text">
                {{ props.companyName }}
            </div>
            <div class="user-name-text">
                {{ props.name }}
            </div>
        </div>
        <div class="button-avatar">

            <MaxUserAvatar :image-url="props.avatarUrl" :name="props.name" :show-tooltip="false" v-if="props.userId" />
            <TieredMenu ref="menu" id="overlay_tmenu" :model="menuItems" popup>
                <template #item="{ item }">
                    <div v-if="item.label" class="main-item-menu-div" @click="item.exec && item.exec()">
                        <MaxIcon v-if="item.icon" :icon="item.icon" />
                        <div>
                            {{ item.label }}
                        </div>
                    </div>
                </template>
            </TieredMenu>
        </div>
        <div v-if="props.isImpersonated" class="impersonated-btn" @click.stop="onEndImpersonate">
            <div class="impersonated-btn-grid">
                <MaxIcon i="ci:user-close" icon-blue size="1.3" />

                <div class="impersonated-btn-label">
                    <div class="a">{{ props.labelEndImpersonate }}</div>
                    <div class="b">{{ props.labelEndImpersonateSub }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

/**
 * Seção de usuário para o cabeçalho.
 * Exibe nome, empresa (opcional) e avatar, com um menu dropdown.
 * Totalmente prop-driven: emite eventos para que o app consumidor decida
 * navegação, chamadas de API e estado (ex: dark mode).
 */
<script setup lang="ts">
    import { computed, ref } from 'vue';
    import TieredMenu from 'primevue/tieredmenu';
    import MaxIcon from './MaxIcon.vue';
    import MaxUserAvatar from './MaxUserAvatar.vue';

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
    }>(), {
        labelProfile: 'Meu perfil',
        labelSettings: 'Configurações',
        labelDarkModeOn: 'Ativar Modo escuro',
        labelDarkModeOff: 'Desativar Modo escuro',
        labelSupport: 'Suporte',
        labelLogout: 'Sair',
        labelEndImpersonate: 'SAIR',
        labelEndImpersonateSub: '(RETORNAR)'
    });

    const emit = defineEmits<{
        profile: [];
        settings: [];
        toggleDarkMode: [];
        support: [];
        logout: [];
        endImpersonate: [];
    }>();

    const menu = ref();

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

    const toggle = (event: any) => {
        menu.value.toggle(event);
    };

    const onEndImpersonate = () => {
        emit('endImpersonate');
    };
</script>

<style>
    .user-section {
        display: grid;
        place-items: center end;
        grid-auto-columns: auto 50px;
        gap: 1rem;
        position: relative;

        .user-text-div {
            grid-column: 1;
            width: auto;
            display: grid;
            place-items: center end;
            grid-template-rows: 1fr 1fr;
            color: var(--background-0);

            .solar-company-text {
                font-size: 0.9rem;
            }

            .user-name-text {
                font-size: 0.8rem;
                font-weight: 200;
            }
        }

        .button-avatar {
            position: relative;
            width: 100%;
            height: 100%;
            display: grid;
            place-items: center;
            grid-column: 2;

            .p-avatar {
                position: relative;
                margin: 0 !important;
                width: 40px;
                height: 40px;
            }
        }
    }

    .main-item-menu-div {
        display: grid;
        place-items: center start;
        gap: 10px;
        width: 100%;
        height: 100%;
        padding: 8px;
        font-size: 0.9rem;
        color: var(--text-c);
        background-color: var(--background-0);
        border-radius: 0.5rem;
        grid-template-columns: auto 1fr;

        &:hover {
            background-color: var(--background-1);
            color: var(--text-c);
            cursor: pointer;
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
            color: var(--background-650);
            background-color: var(--background-0);

            .icon-div {
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
</style>
