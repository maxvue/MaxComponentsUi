<template>
    <div class="max-popover-menu" ref="btn_el" pointer v-tooltip="null" :style="{width: size_icon, height: size_icon} ">
        <div v-tooltip="null" @click.stop="toggle" class="botao" :style="{width: size_icon, height: size_icon} ">
            <slot name="button" >
                <MaxButton v-bind="props" :size="props.size || props.sizeIcon ? String(props.size ?? props.sizeIcon) : ''" flex/>
            </slot>
        </div>

        <Menu ref="menu" id="overlay_menu" :model="props.items ?? props.model" :popup="true">
            <template #item="{ item }">
                <slot name="item" :data="item">
                    <div class="max-popover-menu-item" @click.stop="(event) => item.action ? item.action({ event, data: item.data ?? {} }) : onClick(event, item)" >
                        <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                        <div class="max-popover-menu-label">{{ item.label }}</div>
                    </div>
                </slot>
            </template>
        </Menu>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, useAttrs } from 'vue';
    import Menu from 'primevue/menu';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute, useDefaultReset } from '@maxvue/max-use';
    import { getCssSize } from '../helpers/getCssSize.js';

    const props = withDefaults(defineProps<{
        /** Texto do botão */
        label?: string;
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** Array de items para o menu */
        items?: any[];
        /** Array de items para o menu ( Alias) */
        model?: any[] | undefined;
        /** se o ícone deve rotacionar */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        iconSize?: string | number;
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

    const size_icon = computed(() => getCssSize(Number(props.size ?? props.sizeIcon ?? props.iconSize ?? 1.1) + 'rem') );

    const menu = ref();

    const toggle = (event?: any) => {
        menu.value.toggle(event);
    };

    const executing = useDefaultReset<boolean>(false, 200);

    const onClick = (event: any, item: any) => {
        if (! executing.value) {
            executing.value = true;

            const data = item.data ?? item.props ?? item.params ?? item.query ?? {};

            if (item.route) {
                goToRoute(item.route, data);
                return;
            }

            if (item.action) {
                item.action({ event: event, data: data });
                return;
            }
        }
    };
</script>

<style lang="scss">

.max-popover-menu {
    max-height: 40px;
    max-width: 40px;

    .botao {
        display: grid;
        grid-template-columns: 1fr;
        place-items: center;
        gap: 8px;
        cursor: pointer;
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
