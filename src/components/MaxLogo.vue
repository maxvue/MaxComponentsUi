<template>
    <div class="logo" pointer >
        <RouterLink to="/">
            <img :src="`${props.src}`" alt="Image" />
        </RouterLink>
    </div>

</template>

<script setup lang="ts">
    import { RouterLink } from 'vue-router';


    const props = withDefaults(
        defineProps<{
            src?: string;
            rounded?: boolean;
        }>(),
        { src: '/get_file?file=logo.svg', rounded: false }
    );
</script>

<style scoped lang="scss">
    @mixin rounded($value) {
        &[rounded='#{$value}'] {
            border-radius: #{$value}rem;
        }
    }

    .logo {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        aspect-ratio: 1/1;
        padding: 20px;

        &:hover {
            transform: scale(1.1);
        }

        &[fill] {
            background-color: var(--sky-950);
        }

        &[rounded-3] {
            border-radius: 3rem;
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

        img {
            height: 100%;
            max-width: 100%;
            max-height: 100%;
        }
    }
</style>
