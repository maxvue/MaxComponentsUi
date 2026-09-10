<template>
    <Transition name="fadelight">
        <slot></slot>
    </Transition>
</template>

<style lang="scss" scoped>
    /* Estado ATIVO (durante a animação) */
    :global(.fadelight-enter-active),
    :global(.fadelight-leave-active) {
        transition: opacity 0.5s ease;
    }

    /* Estado INICIAL (entrada) e FINAL (saída) */
    :global(.fadelight-enter-from),
    :global(.fadelight-leave-to) {
        opacity: 0;
    }
</style>
