<template>
    <RouterLink to="/">
        <div class="logo" v-bind="attrs" pointer >
            <img :src="`/${attrs.src ?? 'get_file?file=logo.svg'}`" alt="Image" />
        </div>
    </RouterLink>
</template>

<script setup lang="ts">
    const attrs = useAttrs();
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
