<template>
    <div class="max-popover-menu" ref="btn_el" pointer v-tooltip="null">
        <div v-tooltip="null" >
            <slot name="button" v-bind="attrs">
                <MaxButton v-bind="props" @click.stop="toggle" :size="props.size || props.sizeIcon ? String(props.size ?? props.sizeIcon) : ''" />
            </slot>
        </div>
        <div style="position: fixed;" v-tooltip="null" class="popover-item">
            <Menu ref="menu" id="overlay_menu" :model="props.items" :popup="true">
                <template #item="{ item, props }">
                    <div class="max-popover-menu-item" v-bind="props.action">
                        <span :class="item.icon" />
                        <span>{{ item.label }}</span>
                        <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
                        <span v-if="item.shortcut" class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{ item.shortcut }}</span>
                    </div>
                </template>
            </Menu>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, useAttrs } from 'vue';
    import Menu from 'primevue/menu';
    import type { MenuItem } from 'primevue/menuitem';
    import MaxButton from './MaxButton.vue';

    const attrs = useAttrs();

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
</script>

<style lang="scss">

.max-popover-menu-item {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center start;
    gap: 5px;
}
</style>
