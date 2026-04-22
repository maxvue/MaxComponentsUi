<template>
    <div class="max-icon-div" v-html="iconData" :style="{ width: size, height: size }"></div>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { getCached } from '@/helpers/getCached';
    import { setCached } from '@/helpers/setCached';

    const props = defineProps<{
        icon?: string;
        i?: string;
        rotate?: number;
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        size?: string | number;
        scale?: string | number;
        width?: string | number;
        height?: string | number;
    }>();

    const iconName = computed(() => {
        return props.icon || props.i || '';
    });

    const STORAGE_KEY = computed(() => 'max-icon-' + iconName.value);

    const iconData = ref('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="18;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path><path stroke-dasharray="60" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z" opacity="0.3"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="60;0"/></path></g></svg>');

    const size = computed(() => {
        const props_wh = props.width ?? props.height ?? null;
        const props_size = props.size ?? props.scale ?? null;
        const size_prop = props_wh ?? props_size;

        if (!size_prop) {
            return '16px';
        }

        if (typeof props_size === 'number') return `${16 * props_size}px`;
        if (typeof size_prop === 'number') return `${size_prop}px`;
        return /^[0-9.]+$/.test(size_prop) ? `${size_prop}px` : size_prop;
    });

    watch(
        STORAGE_KEY,
        () => {
            const data = getCached(STORAGE_KEY.value);

            if (data) {
                iconData.value = data;
                return;
            }

            const prefix = iconName.value.split(':')[0];
            const name = iconName.value.split(':')[1];

            fetch('https://api.iconify.design/' + prefix + '/' + name + '.svg', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            })
                .then((response) => {
                    if (response.ok) {
                        response.text().then((data) => {
                            console.log(data);
                            iconData.value = data;
                            setCached(STORAGE_KEY.value, data);
                        });
                    }
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        { immediate: true },
    );
</script>

<style lang="scss">
    .max-icon-div {
        display: grid;
        place-items: center;
        svg {
            width: 100% !important;
            height: 100% !important;
        }
    }
</style>
