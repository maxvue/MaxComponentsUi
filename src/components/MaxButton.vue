<template>
    <Button v-bind="buttonProps" :iconPos="iconPos" uppercase v-if="props.label" @click.stop="(event) => props.action?.({ event, data: props.data ?? {} }) ?? onClick">
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

    <MaxIconButton  v-bind="{...props, ...attrs}" v-else />
</template>

<script setup lang="ts">
    import { computed, useAttrs } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import Button from 'primevue/button';
    import { goToRoute } from '@maxvue/max-use';
    import { MaxButtonsType } from '../types';

    const attrs = useAttrs();

    const props = withDefaults(defineProps<MaxButtonsType>(), {
        iconSize: 1.4,
        dark: undefined,
        light: 0.6,
        route: null,
        params: null,
        data: null,
        query: null,
        uppercase: false
    });

    /** Props filtradas para o componente Button do PrimeVue, excluindo props customizadas incompatíveis */
    const buttonProps = computed(() => {
        const { id, size, ...rest } = props;
        return { ...rest, size: size?.toString(), id: id?.toString() };
    });

    const iconPos = computed(() => {
        if (props.iconPos) return props.iconPos;
        if (props.iconRight) return 'right';
        return 'left';
    });

    const emit = defineEmits<{
        click: [value: boolean];
    }>();

    const onClick = (event: any) => {
        if (props.route) {
            goToRoute(props.route, { ...(props.params ?? {}), ...(props.data ?? {}), ...(props.query ?? {}) });
            return;
        }

        if (props.action) {
            props.action(event);
            return;
        }

        emit('click', true);
    };

</script>
