<template>
    <component
        :is="isInteractiveButton ? 'button' : 'div'"
        :type="isInteractiveButton ? 'button' : undefined"
        class="max-user-avatar"
        :class="{
            removable: remove && !noClick,
            'no-click': noClick,
            'has-fallback-icon': !resolvedImageUrl || has_image_error
        }"
        :style="avatarStyle"
        :aria-label="isInteractiveButton ? accessibleLabel : undefined"
        @click="onAvatarClick"
        @keydown.enter.prevent="onKeydownAction"
        @keydown.space.prevent="onKeydownAction"
        v-tooltip.top="showTooltip ? (remove && !noClick ? (labelRemove ?? name) : name) : null"
    >
        <img
            v-if="resolvedImageUrl && !has_image_error"
            class="max-user-avatar__image"
            :src="resolvedImageUrl"
            :alt="name ?? ''"
            @error="has_image_error = true"
        />
        <span
            v-else-if="userInitials"
            class="max-user-avatar__initials"
        >
            {{ userInitials }}
        </span>
        <div v-else class="max-user-avatar__icon-wrapper">
            <MaxIcon
                icon="clarity:avatar-solid"
                class="max-user-avatar__icon"
                size="72%"
                color="#fff"
            />
        </div>
    </component>
</template>

<script setup lang="ts">
    import { computed, getCurrentInstance, ref, useAttrs, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { useConfirmStore } from '../stores/useConfirm.Store';
    import { getCssSize } from '../helpers/getCssSize';

    function getRefString(vnodeRef: any): string | undefined {
        if (!vnodeRef) return undefined;
        const str = typeof vnodeRef === 'string' ? vnodeRef : (typeof vnodeRef?.r === 'string' ? vnodeRef.r : undefined);
        if (!str || str === 'VTU_COMPONENT') return undefined;
        return str;
    }

    const confirm_store = useConfirmStore();
    const attrs = useAttrs();
    const instance = getCurrentInstance();

    const has_image_error = ref(false);

    const props = withDefaults(defineProps<{
        /** URL da imagem do avatar */
        imageUrl?: string | null;
        /** Alias de imageUrl */
        image?: string | null;
        /** Alias de imageUrl */
        url?: string | null;
        /** Alias de imageUrl */
        href?: string | null;
        /** Nome do usuário (usado para gerar iniciais ou tooltip) */
        name?: string;
        /** Define se exibe um tooltip com o nome ao passar o mouse */
        showTooltip?: boolean;
        /** Define a rota que deve ser chamada para carregar a imagem */
        routeImage?: string | null;
        /** Define a rota que deve ser chamada para carregar a imagem */
        requestImageData?: string | null;
        /** Ativa o modo de remoção: overlay "×" no hover e confirmação ao clicar */
        remove?: boolean;
        /** Mensagem/label exibida na confirmação de remoção */
        labelRemove?: string;
        /** Desativa qualquer ação de clique */
        noClick?: boolean;
        /** Define altura e largura com este valor */
        height?: string | number;
        /** Define altura e largura com este valor */
        width?: string | number;
        /** Define altura e largura com este valor */
        size?: string | number;
        /** Limite máximo de largura e altura (e define width/height como 100% caso não informado) */
        maxWidth?: string | number;
        'max-width'?: string | number;
        /** Limite máximo de largura e altura (e define width/height como 100% caso não informado) */
        maxHeight?: string | number;
        'max-height'?: string | number;
    }>(), {
        showTooltip: true,
        remove: false,
        noClick: false
    });

    const emit = defineEmits<{ remove: [] }>();

    const resolvedImageUrl = computed(() => {
        return props.imageUrl
            || props.image
            || props.url
            || props.href
            || (attrs.ref as string | undefined)
            || getRefString(instance?.vnode?.ref)
            || null;
    });

    watch(resolvedImageUrl, () => {
        has_image_error.value = false;
    });

    const userInitials = computed(() => {
        if (typeof props.name !== 'string' || props.name.trim().length === 0) return '';
        const parts = props.name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

        const firstChar = parts[0]?.[0] ?? '';
        const lastChar = parts[parts.length - 1]?.[0] ?? '';
        return (firstChar + lastChar).toUpperCase();
    });

    const resolvedSize = computed(() => {
        const val = props.size ?? props.width ?? props.height;
        if (val !== undefined && val !== null && val !== '') return getCssSize(val);

        return undefined;
    });

    const resolvedMaxSize = computed(() => {
        const val = props.maxWidth ?? props['max-width'] ?? props.maxHeight ?? props['max-height'];
        if (val !== undefined && val !== null && val !== '') return getCssSize(val);

        return undefined;
    });

    const avatarStyle = computed(() => {
        const style: Record<string, string> = {
            width: '40px',
            height: '40px'
        };

        if (resolvedMaxSize.value) {
            style.maxWidth = resolvedMaxSize.value;
            style.maxHeight = resolvedMaxSize.value;
            if (resolvedSize.value) {
                style.width = resolvedSize.value;
                style.height = resolvedSize.value;
            } else {
                style.width = '100%';
                style.height = '100%';
            }
        } else if (resolvedSize.value) {
            style.width = resolvedSize.value;
            style.height = resolvedSize.value;
        }

        return style;
    });

    const isInteractiveButton = computed(() => Boolean(props.remove && !props.noClick));

    const accessibleLabel = computed(() => {
        if (props.labelRemove && props.labelRemove.trim()) return props.labelRemove.trim();
        if (props.name && props.name.trim()) return `Remover ${props.name.trim()}`;
        return 'Remover responsável';
    });

    const triggerConfirm = (target?: HTMLElement) => {
        if (props.noClick || !props.remove) return;
        const rect = target?.getBoundingClientRect ? target.getBoundingClientRect() : { x: 0, y: 0, height: 0, width: 0 };
        confirm_store.confirm({
            message: props.labelRemove ?? 'Remover responsável?',
            messageIcon: 'mingcute:user-remove-fill',
            rejectProps: { label: 'Voltar', icon: 'weui:back-filled', action: () => {} },
            acceptProps: { label: 'Remover', icon: 'trash', action: () => emit('remove') },
            x: rect?.x ?? 0,
            y: rect?.y ?? 0,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0,
            target: target ?? null
        });
    };

    const onAvatarClick = (event: MouseEvent) => {
        if (props.noClick) {
            event?.stopImmediatePropagation?.();
            event?.preventDefault?.();
            return;
        }
        triggerConfirm((event?.currentTarget || event?.target) as HTMLElement | undefined);
    };

    const onKeydownAction = (event: KeyboardEvent) => {
        if (!isInteractiveButton.value) return;
        triggerConfirm((event?.currentTarget || event?.target) as HTMLElement | undefined);
    };
</script>

<style lang="scss" scoped>
    .max-user-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        min-width: 16px;
        min-height: 16px;
        border-radius: 50% !important;
        overflow: hidden !important;
        clip-path: circle(50% at 50% 50%);
        aspect-ratio: 1 / 1;
        font-size: 0.875rem;
        line-height: 1;
        user-select: none;
        position: relative;
        flex-shrink: 0;
        container-type: inline-size;
        background: transparent;
        border: none;
        padding: 0;
        margin: 0;
        font-family: inherit;
        color: inherit;

        &[type='button'] {
            cursor: pointer;

            &:focus-visible {
                outline: var(--max-focus-outline, 2px solid var(--max-primary-500, #00768e));
                outline-offset: 2px;
                box-shadow: var(--max-focus-ring, 0 0 0 2px var(--background-0, #fff), 0 0 0 4px var(--max-primary-500, #00768e));
            }
        }

        &.no-click {
            cursor: default !important;
        }

        .max-user-avatar__image {
            width: 100% !important;
            height: 100% !important;
            aspect-ratio: 1 / 1 !important;
            object-fit: cover !important;
            display: block !important;
            border-radius: 50% !important;
            clip-path: circle(50% at 50% 50%);
        }

        .max-user-avatar__initials {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50% !important;
            clip-path: circle(50% at 50% 50%);
            background-color: var(--max-primary-50, #67C8DB);
            color: var(--max-primary-600, #005f77);
            font-weight: 700;
            font-size: 0.875rem;
            font-size: 40cqw;
            line-height: 1;
            text-transform: uppercase;
        }

        .max-user-avatar__icon-wrapper {
            width: 100%;
            height: 100%;
            border-radius: 50% !important;
            overflow: hidden !important;
            clip-path: circle(50% at 50% 50%);
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--max-primary-600, #005f77);
            color: var(--max-user-avatar-color, #fff);

            :deep(.max-user-avatar__icon) {
                width: 72% !important;
                height: 72% !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #fff !important;

                .max-icon {
                    width: 100% !important;
                    height: 100% !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: #fff !important;
                }

                svg {
                    width: 100% !important;
                    height: 100% !important;
                    max-width: 100% !important;
                    max-height: 100% !important;
                    display: block;
                    transform: none;
                }
            }
        }

        &.removable {
            position: relative;
            cursor: pointer;

            &::after {
                content: '×';
                position: absolute;
                inset: 0;
                display: grid;
                place-items: center;
                border-radius: 50%;
                font-size: 0.9em;
                font-weight: 700;
                line-height: 1;
                color: #fff;
                background-color: rgb(220 38 38 / 45%);
                opacity: 0;
                transition: opacity 0.15s ease;
                pointer-events: none;
            }

            &:hover::after {
                opacity: 1;
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        *,
        ::before,
        ::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
        }
    }
</style>
