<template>
    <div class="max-app">
        <slot name="login">
            <RouterView />
        </slot>
        <slot name="authenticated">
            <RouterView />
        </slot>
        <slot name="authenticated">
            <PageLayout :screen="system.type_device">
                <RouterView />
            </PageLayout>
        </slot>
        <LoadScreen />
    </div>

    <MaxPopoverConfirm />
    <MaxToast />
    <template v-if="user.status?.server?.get?.is_success && system?.user?.data?.id">
        <VoipDialer />
        <VoipReverbListener />
        <IncomingCallModal />
    </template>
</template>

<script setup lang="ts">


</script>

<style lang="scss">
    .app-container {
        min-height: 100vh;

        .fade-enter-active,
        .fade-leave-active {
            transition: opacity 0.2s ease;
        }

        .fade-enter-from,
        .fade-leave-to {
            opacity: 0;
        }
    }
</style>
