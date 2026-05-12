<template>
    <Button :iconPos="iconPos" uppercase @click.stop="onClick">
        <template #default>
            <slot></slot>
        </template>
        <template #icon>
            <MaxIcon v-if="props.icon ?? props.i" :icon="props.icon ?? props.i" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" flex :dark="props.dark" :light="props.light" />
        </template>
        <template #loadingicon>
            <MaxIcon icon="loading" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" flex />
        </template>
    </Button>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import Button from 'primevue/button';
    import type { ButtonProps } from 'primevue/button';
    import { goToRoute } from '@maxvue/max-use';

    interface btnProps extends /* @vue-ignore */ ButtonProps {
        icon?: string;
        i?: string;
        iconLeft?: string;
        iconRight?: string;
        sizeIcon?: number | string;
        iconSize?: number | string;
        route?: string | null;
        params?: any;
        data?: any;
        query?: any;
        dark?: boolean | string | number | undefined;
        light?: boolean | string | number | undefined;
    }


    const props = withDefaults(defineProps<btnProps>(), {
        iconSize: 1.4,
        dark: undefined,
        light: 0.6,
        route: null,
        params: null,
        data: null,
        query: null
    });

    const iconPos = computed(() => {
        if (props.iconPos) return props.iconPos;
        if (props.iconRight) return 'right';
        return 'left';
    });

    const emit = defineEmits<{
        click: [value: boolean];
    }>();

    const onClick = () => {
        if (props.route) {
            console.log('goingToRoute', props.route);
            goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
            return;
        }

        emit('click', true);
    };

</script>
