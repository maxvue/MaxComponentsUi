<template>
    <div class="max-side-menu side-menu" v-bind="attrs">
        <div class="grid-logo-and-menu">
            <div v-if="!isMobile" v-tooltip="system.version" class="space-logo" @click="onLogoClick">
                <MaxLogo v-if="logoSrc" :src="logoSrc" :to="effectiveRouteLogo" :no-padding="true" class="side-menu-logo" />
            </div>
            <div class="menu">
                <div v-if="items" class="grupo items">
                    <MaxMenuVerticalItem :items="items" />
                </div>
                <div v-if="settings" class="grupo settings">
                    <MaxMenuVerticalItem :items="settings" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import { useRouter, useRoute } from 'vue-router';
    import { getRoute } from '@maxvue/max-use';
    import MaxLogo from './MaxLogo.vue';
    import MaxMenuVerticalItem from './MaxMenuVerticalItem.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import { useListMenusStore } from '../stores/useListMenus.Store';
    import { getMaxAppConfig } from '../helpers/maxAppConfig';
    import type { SideMenuItem } from '../types/app';

    const props = defineProps<{
        /**
         * Logo exibida no topo do menu.
         *
         * Aceita uma URL (`/get_file?file=logo.svg`, `https://…`, `data:…`) ou o
         * nome de uma rota, resolvido pelo `getRoute` do MaxUse. Quando omitida
         * — ou quando a rota não resolve — consulta `getMaxAppConfig().logo`.
         */
        logo?: string;
        /** Rota de destino ao clicar na logo. Padrão: '/'. */
        routeLogo?: string;
        /** Dispositivo atual ('desktop' | 'mobile'). Quando omitido, consulta useSystemStore(). */
        screen?: string;
    }>();

    const emit = defineEmits<{
        logoClick: [];
    }>();

    const attrs = useAttrs();
    const router = useRouter();
    const route = useRoute();
    const menus = useListMenusStore();
    const system = useSystemStore();

    /** Determina se o menu lateral está em modo mobile. */
    const isMobile = computed<boolean>(() => {
        const target = props.screen ?? (attrs.screen as string | undefined);
        if (target) return target === 'mobile';

        return system.type_device === 'mobile';
    });

    /** Rota efetiva de destino ao clicar na logo. */
    const effectiveRouteLogo = computed<string>(() => props.routeLogo ?? getMaxAppConfig().routeLogo ?? '/');

    /** Indica que o valor já é um caminho utilizável, e não um nome de rota. */
    const isUrl = (value: string): boolean => /^(https?:\/\/|\/|data:|blob:)/.test(value);

    /** Resolve a logo para a URL final da imagem, com fallback para a configuração global. */
    const logoSrc = computed<string | undefined>(() => {
        const raw = props.logo ?? getMaxAppConfig().logo;
        const logo = raw?.trim();

        if (!logo) return undefined;
        if (isUrl(logo)) return logo;

        return getRoute(logo) ?? undefined;
    });

    /**
     * Separa os itens em dois grupos.
     *
     * `hide` tem cast booleano no modelo, então precisa de checagem falsy e não
     * `=== null`: com a comparação estrita, salvar `hide = false` pela tela de
     * administração escondia o menu.
     */
    const visible = computed<SideMenuItem[]>(() => ((menus.list as any)?.side ?? []).filter((item: SideMenuItem) => !item.details?.hide));

    /** Itens da seção inferior (configurações). */
    const settings = computed<SideMenuItem[] | null>(() => {
        const list = visible.value.filter((item) => item.details?.settings);

        return list.length ? list : null;
    });

    /** Itens da seção principal. */
    const items = computed<SideMenuItem[] | null>(() => {
        const list = visible.value.filter((item) => !item.details?.settings);

        return list.length ? list : null;
    });

    const clearSearch = (): void => {
        useSearchBarStore().input_value = '';
    };

    const onLogoClick = (): void => {
        clearSearch();
        emit('logoClick');

        const target = effectiveRouteLogo.value;
        if (!target) return;

        if (target.startsWith('/')) {
            if (route?.path !== target) router.push(target);
        } else if (route?.name !== target) router.push({ name: target });

    };
</script>

<style scoped lang="scss">
    .side-menu {
        position: relative;
        overflow: hidden;
        width: 55px;
        height: 100vh;
        height: 100dvh;
        box-sizing: border-box;
        z-index: 25;
        background-color: var(--layout-shell-bg, #003048);

        &[screen='mobile'] {
            position: absolute;
            left: -100%;
        }

        .grid-logo-and-menu {
            display: grid;
            width: 100%;
            height: 100%;
            min-height: 0;
            padding-bottom: 5px;
            grid-template-rows: auto 1fr;

            .space-logo {
                position: relative;
                top: 10px;
                left: 6px;
                width: 45px;
                height: 45px;
                margin: 5px auto 25px;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                box-sizing: border-box;
                flex-shrink: 0;

                :deep(.side-menu-logo) {
                    display: flex;
                    background-color: var(--layout-shell-bg, #003048);
                }
            }

            .menu {
                display: grid;
                width: 100%;
                height: 100%;
                min-height: 0;
                overflow: hidden auto;
                scrollbar-width: none;
                padding: 25px 0 2rem;
                grid-template-rows: 1fr auto;


                &::-webkit-scrollbar {
                    display: none;
                    width: 0;
                    height: 0;
                }

                .grupo {
                    display: grid;
                    gap: 4px;
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    grid-template-columns: 1fr;
                    grid-template-rows: repeat(auto-fill, minmax(2.7rem, 1fr));
                    place-items: center;
                }
            }
        }
    }
</style>
