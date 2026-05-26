<template>
    <div class="max-popover-menu" ref="btn_el" pointer v-tooltip="null" flex>
        <div v-tooltip="null" @click.stop="toggle" flex class="botao">
            <slot name="button" >
                <MaxButton v-bind="props" :size="props.size || props.sizeIcon ? String(props.size ?? props.sizeIcon) : ''" />
            </slot>
        </div>

        <Menu ref="menu" id="overlay_menu" :model="props.items ?? props.model" :popup="true">
            <template #item="{ item }">
                <div class="max-popover-menu-item" @click.stop="(event) => item.action?.({ event, data: item.data ?? {} }) ?? onClick(item)" >
                    <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                    <div class="max-popover-menu-label">{{ item.label }}</div>
                </div>
            </template>
        </Menu>
    </div>
</template>

<script setup lang="ts">
    import { ref, useAttrs } from 'vue';
    import Menu from 'primevue/menu';
    import type { MenuItem } from 'primevue/menuitem';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute } from '@maxvue/max-use';

    const props = withDefaults(defineProps<{
        /** Texto do botão */
        label?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** Array de items para o menu */
        items?: MenuItem[];
        /** Array de items para o menu ( Alias) */
        model?: MenuItem[] | undefined;
        /** se o ícone deve rotacionar */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;

        sizeIcon?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Mensagem de confirmação */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?'
    });


    const menu = ref();

    const toggle = (event: any) => {
        menu.value.toggle(event);
    };

    const onClick = (item: any) => {
        if (item.route) {
            goToRoute(item.route, { ...(item.params ?? {}), ...(item.data ?? {}), ...(item.query ?? {}) });
            return;
        }

        if (item.action) {
            item.action(item);
            return;
        }
    };
</script>

<style lang="scss">

.max-popover-menu {
    max-height: 40px;
    max-width: 40px;

    .botao {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center;
        gap: 8px;
        height: 2rem;
        cursor: pointer;
        padding: 0 8px;
    }
}

.max-popover-menu-item {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center start;
    gap: 8px;
    height: 2rem;
    cursor: pointer;
    padding: 0 8px;
}
</style>
