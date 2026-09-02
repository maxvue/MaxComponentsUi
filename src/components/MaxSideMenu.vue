<template>
    <div class="side-menu" v-bind="attrs">
        <div class="grid-logo-and-menu">
            <div v-if="system.type_device === 'desktop'" v-tooltip="system.version" class="space-logo" @click="clearSearch">
                <MaxLogo v-if="logoSrc" :src="logoSrc" fill flex no-padding />
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
    import { getRoute } from '@maxvue/max-use';
    import MaxLogo from './MaxLogo.vue';
    import MaxMenuVerticalItem from './MaxMenuVerticalItem.vue';
    import { useSystemStore } from '../stores/useSystem.Store';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';
    import { useListMenusStore } from '../stores/useListMenus.Store';
    import type { SideMenuItem } from '../types/app';

    const props = defineProps<{
        /**
         * Logo exibida no topo do menu.
         *
         * Aceita uma URL (`/get_file?file=logo.svg`, `https://…`, `data:…`) ou o
         * nome de uma rota, resolvido pelo `getRoute` do MaxUse. Quando omitida
         * — ou quando a rota não resolve — nenhuma logo é renderizada.
         */
        logo?: string;
    }>();

    const attrs = useAttrs();
    const menus = useListMenusStore();
    const system = useSystemStore();

    /** Indica que o valor já é um caminho utilizável, e não um nome de rota. */
    const isUrl = (value: string): boolean => /^(https?:\/\/|\/|data:|blob:)/.test(value);

    /** Resolve a prop `logo` para a URL final da imagem. */
    const logoSrc = computed<string | undefined>(() => {
        const logo = props.logo?.trim();

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
</script>

<style scoped lang="scss">
    .side-menu {
        position: relative;
        overflow: hidden;
        width: 55px;
        height: 100vh;
        height: 100dvh;
        box-sizing: border-box;
        z-index: 3;

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
                top: 5px;
                left: 5px;
                width: 55px;
                height: 55px;
                margin-bottom: 40px;
                padding: 7px;
                flex-shrink: 0;
            }

            .menu {
                display: grid;
                width: 100%;
                height: 100%;
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
                scrollbar-width: none;
                padding-bottom: 2rem;
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
