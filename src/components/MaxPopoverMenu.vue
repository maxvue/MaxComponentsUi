<template>
    <div class="max-popover-menu" ref="btn_el" pointer v-tooltip="null" :style="{ width: size_icon, height: size_icon }">
        <div v-tooltip="null" @click.stop="toggle" class="botao" :style="{ width: size_icon, height: size_icon }">
            <slot name="button">
                <MaxButton v-bind="props" :size="props.size ?? props.sizeIcon" flex />
            </slot>
        </div>

        <Teleport to="body">
            <div v-if="isOpen" class="max-popover-menu-backdrop" @click="hide">
                <div
                    ref="menuEl"
                    id="overlay_menu"
                    class="max-popover-menu-overlay"
                    role="menu"
                    :style="{ top: position.top + 'px', left: position.left + 'px' }"
                    @click.stop
                >
                    <div
                        v-for="(item, idx) in (props.items ?? props.model ?? [])"
                        :key="idx"
                        role="menuitem"
                        class="max-popover-menu-item-wrapper"
                    >
                        <slot name="item" :data="item">
                            <div
                                class="max-popover-menu-item"
                                @click.stop="(event) => item.action ? (item.action({ event, data: item.data ?? {} }), hide()) : (onClick(event, item), hide())"
                            >
                                <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                                <div class="max-popover-menu-label">{{ item.label }}</div>
                            </div>
                        </slot>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, onBeforeUnmount } from 'vue';
    import MaxButton from './MaxButton.vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute, useDefaultReset, useElementBounding, useElementSize, useWindowSize } from '@maxvue/max-use';
    import { getCssSize } from '../helpers/getCssSize';

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

    // `size` também carrega os tamanhos textuais de botão ('small'/'lg'/…), que
    // não são multiplicadores: Number('small') é NaN e gerava 'NaNrem'. Como o
    // valor alimenta width e height do gatilho, a declaração inválida era
    // descartada e a área clicável colapsava para o tamanho do conteúdo.
    const size_icon = computed(() => {
        const raw = props.size ?? props.sizeIcon ?? props.iconSize;
        const factor = Number(raw);
        return getCssSize((isNaN(factor) ? 1.1 : factor) + 'rem');
    });

    const btn_el = ref<HTMLElement | null>(null);
    const menuEl = ref<HTMLElement | null>(null);
    const anchorEl = ref<HTMLElement | null>(null);
    const isOpen = ref(false);

    const { x, y, width: width_btn, height: height_btn } = useElementBounding(anchorEl as any);
    const { width: width_el, height: height_el } = useElementSize(menuEl as any);
    const { width: window_width, height: window_height } = useWindowSize();

    const position = computed(() => {
        const targetX = x.value;
        const targetY = y.value;
        const targetW = width_btn.value;
        const targetH = height_btn.value;

        let top = targetY + targetH + 4;
        let left = targetX;

        if (top + (height_el.value || 100) > window_height.value && targetY - (height_el.value || 100) > 0) top = targetY - (height_el.value || 100) - 4;


        if (left + (width_el.value || 150) > window_width.value) left = Math.max(10, window_width.value - (width_el.value || 150) - 10);


        return { top, left };
    });

    const toggle = (event?: any) => {
        if (event?.currentTarget) anchorEl.value = event.currentTarget as HTMLElement;
        else if (btn_el.value) anchorEl.value = btn_el.value;

        isOpen.value = !isOpen.value;
    };

    const hide = () => {
        isOpen.value = false;
    };

    const show = (event?: any) => {
        if (event?.currentTarget) anchorEl.value = event.currentTarget as HTMLElement;
        else if (btn_el.value) anchorEl.value = btn_el.value;

        isOpen.value = true;
    };

    const executing = useDefaultReset<boolean>(false, 200);

    const onClick = (event: any, item: any) => {
        if (!executing.value) {
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

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isOpen.value) hide();

    };

    if (typeof window !== 'undefined') window.addEventListener('keydown', onKeydown);


    onBeforeUnmount(() => {
        if (typeof window !== 'undefined') window.removeEventListener('keydown', onKeydown);

    });

    defineExpose({
        toggle,
        show,
        hide,
        onClick
    });
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

.max-popover-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1100;
    background: transparent;
}

.max-popover-menu-overlay {
    position: fixed;
    z-index: 1101;
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border, #e2e8f0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    min-width: 150px;
    padding: 4px 0;
    display: flex;
    flex-direction: column;
}

.max-popover-menu-item {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center start;
    gap: 8px;
    height: 2rem;
    cursor: pointer;
    padding: 0 8px;

    &:hover {
        background: var(--background-100, #f1f5f9);
    }
}
</style>
