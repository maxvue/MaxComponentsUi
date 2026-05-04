<template>
    <Transition name="fadelight">
        <slot></slot>
    </Transition>
</template>

<style>
    /* Estado ATIVO (durante a animação) */
    .fadelight-enter-active,
    .fadelight-leave-active {
        transition: opacity 0.5s ease; /* 0.5s é mais usual que 1.5s */
    }

    /* Estado INICIAL (entrada) e FINAL (saída) */
    .fadelight-enter-from,
    .fadelight-leave-to {
        opacity: 0; /* Totalmente invisível */
    }
</style>
