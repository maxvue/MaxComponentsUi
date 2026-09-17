<template>
    <div class="max-logo logo" :rounded="props.rounded ? true : undefined" :no-padding="props.noPadding ? true : undefined">

        <div v-if="props.noClick">
            <img v-if="props.src && !hasLoadError" :src="`${props.src}`" :alt="props.alt" @error="handleImageError" />
            <span v-else-if="hasLoadError" class="max-logo-fallback" role="img" :aria-label="props.alt" >
                {{ props.fallbackLabel }}
            </span>
        </div>

        <RouterLink :to="props.to" v-else>
            <img v-if="props.src && !hasLoadError" :src="`${props.src}`" :alt="props.alt" @error="handleImageError" />
            <span v-else-if="hasLoadError" class="max-logo-fallback" role="img" :aria-label="props.alt" >
                {{ props.fallbackLabel }}
            </span>
        </RouterLink>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch } from 'vue';
    import { RouterLink } from 'vue-router';

    const props = withDefaults(
        defineProps<{
            src?: string;
            alt?: string;
            fallbackLabel?: string;
            rounded?: boolean;
            noPadding?: boolean;
            to?: string;
            noClick?: boolean;
        }>(),
        {
            src: undefined,
            alt: 'Logo da aplicação',
            fallbackLabel: 'Aplicação',
            rounded: false,
            noPadding: false,
            to: '/'
        }
    );

    const hasLoadError = ref(false);

    function handleImageError(): void {
        hasLoadError.value = true;
    }

    watch(
        () => props.src,
        () => {
            hasLoadError.value = false;
        }
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

        .max-logo-fallback {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.875rem;
            letter-spacing: -0.02em;
            color: var(--text-b, #fff);
            white-space: nowrap;
            text-decoration: none;
            user-select: none;
        }
    }
</style>
