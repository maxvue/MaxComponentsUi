<template>
    <div
        class="p-avatar p-avatar-circle max-user-avatar"
        :class="{ removable: remove, 'has-fallback-icon': !props.imageUrl || has_image_error }"
        @click="onAvatarClick"
        v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null"
    >
        <img
            v-if="props.imageUrl && !has_image_error"
            class="max-user-avatar__image"
            :src="props.imageUrl"
            :alt="name ?? ''"
            @error="has_image_error = true"
        />
        <div v-else class="max-user-avatar__icon-wrapper">
            <MaxIcon
                icon="clarity:avatar-solid"
                class="max-user-avatar__icon"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();

    const has_image_error = ref(false);

    const props = withDefaults(defineProps<{
        /** URL da imagem do avatar */
        imageUrl?: string;
        /** Nome do usuário (usado para gerar iniciais ou tooltip) */
        name?: string;
        /** Define se exibe um tooltip com o nome ao passar o mouse */
        showTooltip?: boolean;
        /** Define a rota que deve ser chamada para carregar a imagem */
        routeImage?: string | null | undefined;
        /** Define a rota que deve ser chamada para carregar a imagem */
        requestImageData?: string | null | undefined;
        /** Ativa o modo de remoção: overlay "×" no hover e confirmação ao clicar */
        remove?: boolean;
        /** Mensagem/label exibida na confirmação de remoção */
        labelRemove?: string;
    }>(), {
        showTooltip: true,
        route: null
    });

    const emit = defineEmits<{ remove: [] }>();

    watch(() => props.imageUrl, () => {
        has_image_error.value = false;
    });

    const onAvatarClick = (event: MouseEvent) => {
        if (!props.remove) return;

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        confirm_store.x = rect.x;
        confirm_store.y = rect.y;
        confirm_store.height = rect.height;
        confirm_store.width = rect.width;
        confirm_store.message = props.labelRemove ?? 'Remover responsável?';
        confirm_store.messageIcon = 'mingcute:user-remove-fill';
        confirm_store.rejectProps = { label: 'Voltar', icon: 'weui:back-filled', action: () => {} };
        confirm_store.acceptProps = { label: 'Remover', icon: 'trash', action: () => emit('remove') };
        confirm_store.show = true;
    };
</script>

<style lang="scss">
    .p-avatar.max-user-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 2rem;
        border-radius: 50% !important;
        overflow: hidden !important;
        aspect-ratio: 1 / 1;
        font-size: 0.875rem;
        line-height: 1;
        user-select: none;
        position: relative;
    }

    .max-user-avatar__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border-radius: 50%;
    }

    .max-user-avatar__icon-wrapper {
        width: 100%;
        height: 100%;
        border-radius: 50% !important;
        overflow: hidden !important;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background-color: var(--blue-750, #1e3a5f);
        color: var(--max-user-avatar-color, #fff);

        .max-user-avatar__icon {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-end;
            justify-content: center;

            :deep(.max-icon-div) {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                color: #fff !important;

                svg {
                    width: 88%;
                    height: 88%;
                    transform: translateY(8%) scale(1.18);
                }
            }
        }
    }

    .p-avatar.removable {
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
</style>
