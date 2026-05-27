<template>
    <Button v-bind="props as PrimeButtonProps" :iconPos="iconPos" uppercase v-if="props.label" @click.stop="props.action?.({event: $event, data: data}) ?? onClick">
        <template #default>
            <slot></slot>
        </template>
        <template #icon>
            <MaxIcon v-if="props.icon ?? props.i" :icon="props.icon ?? props.i" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" :dark="props.dark" :light="props.light" />
        </template>
        <template #loadingicon>
            <MaxIcon icon="loading" :size="props.size ?? props.sizeIcon ?? props.iconSize ?? '1'" class="content-button-icon" flex />
        </template>
    </Button>

    <MaxIconButton  v-bind="{...props}" v-else />
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import Button from 'primevue/button';
    import { goToRoute } from '@maxvue/max-use';
    import { MaxButtonsType } from '../types';
    import type { ButtonProps as PrimeButtonProps } from 'primevue/button';

    const props = withDefaults(defineProps<MaxButtonsType>(), { iconSize: 1.4, dark: undefined, light: 0.6, route: null, params: {}, data: {}, query: {}, uppercase: false });

    const iconPos = computed<'left' | 'right'>(() => {
        if (props.iconRight) return 'right';
        if (props.iconPos) return props.iconPos;
        return 'left';
    });

    const data = computed(() => ({ ...(props.data ?? {}), ...(props.query ?? {}), ...(props.params ?? {}) }));

    const emit = defineEmits<{
        click: [value: boolean];
    }>();

    const onClick = (event: any) => {
        if (props.route) {
            goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
            return;
        }

        if (props.action) {
            props.action({ event: event, data: data.value });
            return;
        }

        emit('click', true);
    };

</script>
