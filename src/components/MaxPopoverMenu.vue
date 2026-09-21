<template>
    <div class="max-popover-menu" ref="btn_el" :style="{ width: size_icon, height: size_icon }">
        <slot
            v-if="$slots.trigger || $slots.button"
            :name="$slots.trigger ? 'trigger' : 'button'"
            v-bind="triggerSlotProps"
        />
        <button
            v-else
            type="button"
            class="botao"
            ref="triggerButtonRef"
            role="button"
            tabindex="0"
            aria-haspopup="menu"
            :aria-expanded="isOpen"
            :aria-controls="menuId"
            :aria-label="props.ariaLabel || props.label || 'Menu de opções'"
            :style="{ width: size_icon, height: size_icon }"
            @click.stop="toggle"
            @keydown.enter.prevent="toggle"
            @keydown.space.prevent="toggle"
            @keydown.down.prevent="openAndFocusFirst"
            @keydown.up.prevent="openAndFocusLast"
        >
            <MaxIcon
                v-if="props.icon || props.i"
                :icon="props.icon ?? props.i"
                :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1.1'"
                :dark="props.dark"
                :light="props.light"
                aria-hidden="true"
                class="max-popover-menu-icon"
            />
            <span v-if="props.label" class="max-popover-menu-label">{{ props.label }}</span>
        </button>

        <Teleport to="body" v-if="isOpen">
            <div
                ref="menuEl"
                :id="menuId"
                class="max-popover-menu-overlay"
                role="menu"
                :style="{ top: position.top + 'px', left: position.left + 'px', zIndex: overlayZIndex }"
                @keydown="onMenuKeydown"
            >
                <div
                    v-for="(item, idx) in resolvedItems"
                    :key="idx"
                    :ref="(el) => setItemRef(el, idx)"
                    role="menuitem"
                    class="max-popover-menu-item-wrapper"
                    :tabindex="focusedItemIndex === idx ? 0 : -1"
                    @click.stop="executeItem(item, $event)"
                    @mouseenter="focusedItemIndex = idx"
                >
                    <slot name="item" :data="item">
                        <div class="max-popover-menu-item">
                            <MaxIcon :icon="item.icon ?? item.i" v-if="item.icon || item.i" size="1.1" />
                            <div class="max-popover-menu-label">{{ item.label }}</div>
                        </div>
                    </slot>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, nextTick, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { goToRoute, useDefaultReset } from '@maxvue/max-use';
    import { useActiveOverlayPosition } from '../composables/useActiveOverlayPosition';
    import { getCssSize } from '../helpers/getCssSize';
    import { useOutsidePointer } from '../helpers/useOutsidePointer';

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
        /** Nome acessível para o botão do menu */
        ariaLabel?: string;
    }>(), {
        dark: 0.4,
        light: undefined,
        loading: false,
        message: 'Deseja continuar?'
    });

    const menuId = `max-popover-menu-${Math.random().toString(36).slice(2, 9)}`;
    const triggerButtonRef = ref<HTMLElement | null>(null);
    const focusedItemIndex = ref(0);
    const itemRefs = ref<(HTMLElement | null)[]>([]);

    const resolvedItems = computed<any[]>(() => {
        return props.items ?? props.model ?? [];
    });

    const setItemRef = (el: any, index: number) => {
        itemRefs.value[index] = el as HTMLElement | null;
    };

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

    const boundingTarget = computed(() => anchorEl.value ?? triggerButtonRef.value ?? btn_el.value);

    const { position, zIndex: overlayZIndex } = useActiveOverlayPosition<{ top: number; left: number }>({
        target: boundingTarget,
        overlay: menuEl,
        active: isOpen,
        compute: ({ targetRect, overlayRect, viewportWidth, viewportHeight }) => {
            const targetX = targetRect.left;
            const targetY = targetRect.top;
            const targetH = targetRect.height;
            const width_el = overlayRect.width || 150;
            const height_el = overlayRect.height || 100;

            let top = targetY + targetH + 4;
            let left = targetX;

            if (top + height_el > viewportHeight && targetY - height_el > 0) top = targetY - height_el - 4;


            if (left + width_el > viewportWidth) left = Math.max(10, viewportWidth - width_el - 10);


            left = Math.max(8, Math.min(left, viewportWidth - width_el - 8));

            return { top, left };
        }
    });

    const setAnchor = (event?: any) => {
        if (event?.currentTarget) anchorEl.value = event.currentTarget as HTMLElement;
        else if (triggerButtonRef.value) anchorEl.value = triggerButtonRef.value;
        else if (btn_el.value) anchorEl.value = btn_el.value;
    };

    const toggle = (event?: any) => {
        setAnchor(event);
        isOpen.value = !isOpen.value;
        if (isOpen.value) focusedItemIndex.value = 0;

    };

    const hide = () => {
        isOpen.value = false;
    };

    const show = (event?: any) => {
        setAnchor(event);
        isOpen.value = true;
        focusedItemIndex.value = 0;
    };

    const openAndFocusFirst = (event?: any) => {
        setAnchor(event);
        if (!isOpen.value) isOpen.value = true;
        nextTick(() => {
            focusedItemIndex.value = 0;
            itemRefs.value[0]?.focus();
        });
    };

    const openAndFocusLast = (event?: any) => {
        setAnchor(event);
        if (!isOpen.value) isOpen.value = true;
        nextTick(() => {
            const last = Math.max(0, resolvedItems.value.length - 1);
            focusedItemIndex.value = last;
            itemRefs.value[last]?.focus();
        });
    };

    const onTriggerKeydown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            toggle(event);
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            openAndFocusFirst(event);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openAndFocusLast(event);
        }
    };

    const triggerSlotProps = computed(() => ({
        'aria-expanded': isOpen.value,
        'aria-controls': menuId,
        'aria-haspopup': 'menu',
        role: 'button',
        tabindex: 0,
        type: 'button' as const,
        toggle,
        show,
        hide,
        isOpen: isOpen.value,
        menuId,
        onClick: (event: any) => toggle(event),
        onKeydown: onTriggerKeydown,
        openAndFocusFirst,
        openAndFocusLast
    }));

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

    const executeItem = (item: any, event: MouseEvent | KeyboardEvent) => {
        if (item.action) item.action({ event, data: item.data ?? {} });
        else onClick(event as any, item);

        hide();
        triggerButtonRef.value?.focus();
    };

    const onMenuKeydown = (event: KeyboardEvent) => {
        const total = resolvedItems.value.length;
        if (total === 0) return;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                focusedItemIndex.value = (focusedItemIndex.value + 1) % total;
                itemRefs.value[focusedItemIndex.value]?.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                focusedItemIndex.value = (focusedItemIndex.value - 1 + total) % total;
                itemRefs.value[focusedItemIndex.value]?.focus();
                break;
            case 'Home':
                event.preventDefault();
                focusedItemIndex.value = 0;
                itemRefs.value[0]?.focus();
                break;
            case 'End':
                event.preventDefault();
                focusedItemIndex.value = total - 1;
                itemRefs.value[total - 1]?.focus();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (resolvedItems.value[focusedItemIndex.value]) executeItem(resolvedItems.value[focusedItemIndex.value], event);

                break;
            case 'Escape':
                event.preventDefault();
                hide();
                triggerButtonRef.value?.focus();
                break;
        }
    };

    useOutsidePointer(isOpen, {
        elements: () => [menuEl.value, triggerButtonRef.value, btn_el.value, anchorEl.value],
        onClose: () => {
            hide();
            triggerButtonRef.value?.focus();
        },
        closeOnEscape: true,
        triggerEl: triggerButtonRef
    });

    watch(isOpen, (open) => {
        if (open) itemRefs.value = [];

    });

    defineExpose({
        toggle,
        show,
        hide,
        onClick,
        openAndFocusFirst,
        openAndFocusLast,
        isOpen,
        menuId,
        focusedItemIndex
    });
</script>

<style lang="scss" scoped>
.max-popover-menu {
    cursor: pointer;
    max-height: 40px;
    max-width: 40px;

    .botao {
        display: grid;
        grid-template-columns: 1fr;
        place-items: center;
        gap: 8px;
        cursor: pointer;
        outline: none;
        background: transparent;
        border: none;
        padding: 0;
        color: inherit;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
            outline-offset: 2px;
            border-radius: 4px;
        }

        .max-popover-menu-icon {
            display: flex;
        }

        .max-popover-menu-btn {
            display: flex;
        }
    }
}

.max-popover-menu-overlay {
    position: fixed;
    z-index: var(--z-dropdown, 1000);
    background: var(--background-0, #fff);
    border: 1px solid var(--surface-border);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
    min-width: 150px;
    max-width: calc(100vw - 16px);
    box-sizing: border-box;
    max-height: calc(100dvh - 32px);
    overflow-y: auto;
    padding: 4px 0;
    display: flex;
    flex-direction: column;

    .max-popover-menu-item-wrapper {
        outline: none;
        cursor: pointer;

        &:focus-visible {
            outline: var(--max-focus-outline, 2px solid var(--max-focus-ring-color, #00768e)); /* Foco canônico */
            outline-offset: -2px;
            background-color: var(--background-100, #f1f5f9);
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
    }
}
</style>
