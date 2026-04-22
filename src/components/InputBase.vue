<template>
    <FloatLabel variant="on" class="max-input-base" :class="{ float: attrs.float !== undefined, done: done, caution: caution || done === false }">
        <IconField>
            <InputIcon v-if="icon ?? iconLeft ?? i">
                <MaxIcon :icon="icon ?? iconLeft ?? i" />
            </InputIcon>
            <slot></slot>
            <InputIcon v-if="iconRight">
                <MaxIcon :icon="iconRight" />
            </InputIcon>
        </IconField>

        <label for="in_label" v-if="label" class="max-input-label active">{{ label }}</label>
        <Message size="small" :class="`input-message ${done === false ? 'error' : ''}`" variant="simple" v-if="message">
            <template #icon>
                <MaxIcon :icon="iconMessage" v-if="iconMessage" :size="0.9" />
            </template>
            {{ message }}
        </Message>
        <div v-else style="height: 16px; width: 100%"></div>
        <div class="is-done" v-if="done">
            <MaxIcon icon="lets-icons:check-fill" :size="0.9" />
        </div>
        <div class="required" v-else-if="required">**a</div>
    </FloatLabel>
    <div style="color: green" class="no-style">
        Texto Verde (sem classe)
    </div>

    <div class="in-stylex">
        Texto Laranja no Style
    </div>
</template>

<script setup lang="ts">
    import MaxIcon from './MaxIcon.vue';
    import FloatLabel from 'primevue/floatlabel';
    import Message from 'primevue/message';

    import IconField from 'primevue/iconfield';
    import InputIcon from 'primevue/inputicon';

    import { hasContent } from '@/helpers/hasContent';
    import { computed, useAttrs } from 'vue';

    const attrs: any = useAttrs();

    interface Props {
        value?: string;
        modelValue?: string | undefined;
        icon?: string | undefined;
        iconLeft?: string | undefined;
        iconRight?: string | undefined;
        i?: string | undefined;
        disabled?: boolean | undefined;
        float?: boolean | undefined;
        msg?: string | undefined;
        message?: string | undefined;
        iconMessage?: string | undefined;
        label?: string | undefined;
        done?: boolean | undefined;
        error?: string | boolean | undefined;
        caution?: string | boolean | undefined;
        required?: boolean | undefined;
    }

    const props = withDefaults(defineProps<Props>(), { value: '' });

    const message = computed(() => {
        if (hasContent(props.message ?? props.msg)) return props.message ?? props.msg;
        if (typeof props.error === 'string' && hasContent(props.error)) return props.error;
        if (typeof props.caution === 'string' && hasContent(props.caution)) return props.caution;
        return false;
    });
</script>

<style lang="scss">
    .max-input {
        .max-input-label {
            &.active {
                top: 0;
                transform: translateY(-50%);
                border-radius: var(--max-floatlabel-on-border-radius);
                background: var(--max-floatlabel-on-active-background);
                padding: 0 5px !important;
                font-size: var(--max-floatlabel-active-font-size);
                font-weight: var(--max-floatlabel-active-font-weight);
                inset-inline-start: 15px !important;
            }
        }
        .required {
            position: absolute;
            top: 3px;
            right: 5px;
            color: #336699;
        }
        .is-done {
            position: absolute;
            top: 3px;
            right: 5px;
            color: #16a34a;
        }
        &.caution {
            label {
                color: darkorange;
            }
            input {
                border-color: darkorange;
            }
        }
        .input-message {
            .p-message-content {
                justify-content: flex-end;
                padding: 0 6px;
                padding-top: 4px;
                color: var(--max-surface-400);
            }
            .p-message-text {
                font-size: 10px !important;
            }
            &.error {
                color: darkorange !important;
            }
        }
    }
    .in-stylex {
        color: orange;
    }
</style>
