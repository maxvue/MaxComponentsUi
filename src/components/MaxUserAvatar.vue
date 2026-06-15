<template>
    <Avatar :image="props.imageUrl" shape="circle" v-if="props.imageUrl" :class="{ removable: remove }" @click="onAvatarClick" v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null" />
    <Avatar :label="name?.substring(0, 2).toUpperCase() ?? '' " style="background-color: #ece9fc; color: #2a1261;" shape="circle" pointer v-else :class="{ removable: remove }" @click="onAvatarClick" v-tooltip.top="showTooltip ? (remove ? (labelRemove ?? name) : name) : null" />
</template>

/**
 * Componente de avatar do usuário.
 * Exibe a imagem do usuário ou as iniciais baseadas no nome.
 * Quando `remove` está ativo, exibe um overlay "×" no hover e, ao clicar,
 * solicita confirmação (via useConfirmStore) antes de emitir o evento `remove`.
 */
<script setup lang="ts">

    import Avatar from 'primevue/avatar';
    import { useConfirmStore } from '../stores/useConfirm.Store';

    const confirm_store = useConfirmStore();

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
