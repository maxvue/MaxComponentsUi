<template>
    <Avatar :image="props.imageUrl" shape="circle" v-if="props.imageUrl" v-tooltip.top="showTooltip ? name : null" />
    <Avatar :label="name?.substring(0, 2).toUpperCase() ?? '' " style="background-color: #ece9fc; color: #2a1261;" shape="circle" pointer v-else v-tooltip.top="showTooltip ? name : null" />
</template>

/**
 * Componente de avatar do usuário.
 * Exibe a imagem do usuário ou as iniciais baseadas no nome.
 */
<script setup lang="ts">

    import Avatar from 'primevue/avatar';

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

    }>(), {
        showTooltip: true,
        route: null
    });


</script>
