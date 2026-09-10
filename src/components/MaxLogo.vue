<template>
    <div class="max-logo logo" :rounded="props.rounded ? true : undefined" :no-padding="props.noPadding ? true : undefined">
        <RouterLink :to="props.to">
            <img v-if="props.src" :src="`${props.src}`" alt="Image" />
        </RouterLink>
    </div>
</template>

<script setup lang="ts">
    import { RouterLink } from 'vue-router';

    const props = withDefaults(
        defineProps<{
            src?: string;
            rounded?: boolean;
            noPadding?: boolean;
            to?: string;
        }>(),
        { src: undefined, rounded: false, noPadding: false, to: '/' }
    );
</script>

<style scoped lang="scss">
    @mixin rounded($value) {
        border-radius: #{$value}rem;
    }

    .logo {
        cursor: pointer;
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        aspect-ratio: 1/1;
        padding: 20px;
        box-sizing: border-box;

        &:hover {
            transform: scale(1.1);
        }

        &[no-padding],
        &[no-padding='true'] {
            padding: 0 !important;
        }

        &[fill] {
            background-color: var(--layout-shell-bg, #003048);
        }

        &[rounded-3] {
            border-radius: 3rem;
        }

        &[rounded] {
            @include rounded(3);
        }

        &[pp] {
            max-width: 50px;
        }

        &[p] {
            max-width: 100px;
        }

        &[m] {
            max-width: 150px;
        }

        &[g] {
            max-width: 200px;
        }

        &[gg] {
            max-width: 250px;
        }

        a {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            text-decoration: none;
            box-sizing: border-box;
        }

        img {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
        }
    }
</style>
