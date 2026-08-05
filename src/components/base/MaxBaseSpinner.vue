<template>
    <div class="p-progressspinner max-base-spinner" role="progressbar" aria-busy="true" :aria-label="ariaLabel">
        <svg class="p-progressspinner-spin" viewBox="25 25 50 50" :style="{ animationDuration }">
            <circle
                class="p-progressspinner-circle"
                cx="50"
                cy="50"
                r="20"
                :fill="fill"
                :stroke-width="strokeWidth"
                :style="{ animationDuration }"
                stroke-miterlimit="10"
            />
        </svg>
    </div>
</template>

<script setup lang="ts">
    /**
     * Indicador de carregamento circular. Substitui o `ProgressSpinner` do PrimeVue.
     *
     * O `viewBox="25 25 50 50"` com `r="20"` é o padrão de spinner circular do
     * Material e não deve mudar — é o que faz o traço fechar o círculo.
     */
    withDefaults(
        defineProps<{
            /** Espessura do traço do círculo */
            strokeWidth?: string;
            /** Preenchimento do círculo */
            fill?: string;
            /** Duração de uma volta completa */
            animationDuration?: string;
            /** Rótulo acessível; sobrescrito por um aria-label passado como atributo */
            ariaLabel?: string;
        }>(),
        { strokeWidth: '2', fill: 'none', animationDuration: '2s', ariaLabel: 'Carregando' }
    );
</script>

<style lang="scss">
.p-progressspinner {
    position: relative;
    display: inline-block;
    width: 100px;
    height: 100px;

    .p-progressspinner-spin {
        width: 100%;
        height: 100%;
        transform-origin: center center;
        animation: p-progressspinner-rotate 2s linear infinite;
    }

    .p-progressspinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;

        // Cor única do tema: o PrimeVue ciclava por 4 tons do Material
        // (vermelho/azul/amarelo/verde), que nunca combinaram com o tema Max.
        stroke: var(--max-primary-500);
        animation: p-progressspinner-dash 1.5s ease-in-out infinite;
        stroke-linecap: round;
    }
}

@keyframes p-progressspinner-rotate {
    100% { transform: rotate(360deg); }
}

@keyframes p-progressspinner-dash {
    0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
    50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
    100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
}

@media (prefers-reduced-motion: reduce) {
    // Desacelera em vez de remover: é indicador de progresso, precisa seguir animando.
    .p-progressspinner .p-progressspinner-spin,
    .p-progressspinner .p-progressspinner-circle {
        animation-duration: 4s !important;
    }
}
</style>
