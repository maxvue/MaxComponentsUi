<template>
    <Button :iconPos="iconPos" >
        <template #default>
            <slot></slot>
        </template>
        <template #icon>
            <MaxIcon :icon="props.icon" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1.4'" class="content-button-icon" flex />
        </template>
    </Button>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import Button from 'primevue/button';
    import type { ButtonProps } from 'primevue/button';

    interface btnProps extends /* @vue-ignore */ ButtonProps {
        iconLeft?: string;
        iconRight?: string;
        sizeIcon?: number | string;
        iconSize?: number | string;
    }

    const props = withDefaults(defineProps<btnProps>(), {
        iconSize: 1.4
    });

    const iconPos = computed(() => {
        if (props.iconPos) return props.iconPos;
        if (props.iconRight) return 'right';
        return 'left';
    });

</script>
