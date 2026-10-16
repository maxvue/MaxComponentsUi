<template>
    <div class="max-segmented-control" :class="[`max-segmented-control--${props.size}`, { 'is-disabled': props.disabled }]" role="radiogroup" :aria-label="props.ariaLabel" :aria-disabled="props.disabled ? 'true' : undefined">
        <button v-for="(option, index) in props.options" :key="String(option.value) + '-' + index" :ref="(el) => setButtonRef(el, index)" type="button" role="radio" class="max-segmented-control__option" :class="{ 'is-selected': isSelected(option), 'is-disabled': isOptionDisabled(option) }" :aria-checked="isSelected(option) ? 'true' : 'false'" :aria-disabled="isOptionDisabled(option) ? 'true' : undefined" :disabled="isOptionDisabled(option)" :tabindex="getTabIndex(option, index)" @click="selectOption(option)" @keydown.space.prevent="selectOption(option)" @keydown.enter.prevent="selectOption(option)" @keydown="handleKeyDown($event, index)">
            <slot name="option" :option="option" :selected="isSelected(option)">
                <MaxIcon v-if="option.icon" :icon="option.icon" size="16px" class="max-segmented-control__icon" aria-hidden="true" />
                <span class="max-segmented-control__label">{{ option.label }}</span>
            </slot>
        </button>
    </div>
</template>

<script setup lang="ts">
    import { computed, ref, type ComponentPublicInstance } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import type { MaxSegmentOption, MaxSegmentedControlProps } from '../types/selection';

    const props = withDefaults(defineProps<MaxSegmentedControlProps>(), {
        disabled: false,
        size: 'normal'
    });

    const emit = defineEmits<{
        'update:modelValue': [value: string | number | null];
    }>();

    const buttonRefs = ref<(HTMLButtonElement | null)[]>([]);

    const setButtonRef = (el: Element | ComponentPublicInstance | null, index: number): void => {
        buttonRefs.value[index] = el as HTMLButtonElement | null;
    };

    const isSelected = (option: MaxSegmentOption): boolean => {
        return option.value === props.modelValue;
    };

    const isOptionDisabled = (option: MaxSegmentOption): boolean => {
        return Boolean(props.disabled || option.disabled);
    };

    const enabledOptions = computed(() => {
        return props.options
            .map((opt, index) => ({ opt, index }))
            .filter(({ opt }) => !isOptionDisabled(opt));
    });

    const activeTabIndex = computed<number>(() => {
        if (props.disabled || enabledOptions.value.length === 0) return -1;

        // Se a opção selecionada for válida e habilitada, ela tem o tabstop
        const selectedEnabled = enabledOptions.value.find(({ opt }) => isSelected(opt));
        if (selectedEnabled) return selectedEnabled.index;

        // Caso contrário, o primeiro item habilitado recebe o tabstop
        return enabledOptions.value[0].index;
    });

    const getTabIndex = (_option: MaxSegmentOption, index: number): number => {
        return index === activeTabIndex.value ? 0 : -1;
    };

    const selectOption = (option: MaxSegmentOption): void => {
        if (isOptionDisabled(option)) return;
        if (option.value === props.modelValue) return;
        emit('update:modelValue', option.value);
    };

    const handleKeyDown = (event: KeyboardEvent, currentIndex: number): void => {
        if (props.disabled || enabledOptions.value.length === 0) return;

        const currentPos = enabledOptions.value.findIndex(({ index }) => index === currentIndex);
        if (currentPos === -1) return;

        let targetIndex: number | null = null;

        switch (event.key) {
            case 'ArrowRight':
            case 'ArrowDown': {
                event.preventDefault();
                const nextPos = (currentPos + 1) % enabledOptions.value.length;
                targetIndex = enabledOptions.value[nextPos].index;
                break;
            }
            case 'ArrowLeft':
            case 'ArrowUp': {
                event.preventDefault();
                const prevPos = (currentPos - 1 + enabledOptions.value.length) % enabledOptions.value.length;
                targetIndex = enabledOptions.value[prevPos].index;
                break;
            }
            case 'Home': {
                event.preventDefault();
                targetIndex = enabledOptions.value[0].index;
                break;
            }
            case 'End': {
                event.preventDefault();
                targetIndex = enabledOptions.value[enabledOptions.value.length - 1].index;
                break;
            }
        }

        if (targetIndex !== null) {
            const btn = buttonRefs.value[targetIndex];
            if (btn && typeof btn.focus === 'function') btn.focus();

        }
    };
</script>

<style lang="scss" scoped>
.max-segmented-control {
    display: inline-flex;
    align-items: center;
    background-color: var(--background-100, #f1f5f9);
    border: 1px solid var(--background-200, #e2e8f0);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
    user-select: none;
    font-family: Quicksand, sans-serif;
    position: relative;

    &--small {
        padding: 2px;

        .max-segmented-control__option {
            height: 26px;
            padding: 0 10px;
            font-size: 12px;
        }
    }

    &--normal {
        .max-segmented-control__option {
            height: 32px;
            padding: 0 14px;
            font-size: 13px;
        }
    }

    &--large {
        padding: 4px;

        .max-segmented-control__option {
            height: 38px;
            padding: 0 18px;
            font-size: 14px;
        }
    }

    &.is-disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
    }

    &__option {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: transparent;
        border: none;
        border-radius: 6px;
        color: var(--background-700, #334155);
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        white-space: nowrap;

        &:hover:not(.is-disabled, .is-selected) {
            background-color: rgb(0 0 0 / 4%);
            color: var(--background-900, #0f172a);
        }

        &.is-selected {
            background-color: var(--background-0, #fff);
            color: var(--max-primary-600, #005F77);
            box-shadow: 0 1px 3px rgb(0 0 0 / 10%);
        }

        &.is-disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }

        &:focus-visible {
            outline: 2px solid var(--max-focus-ring-color, #00768e);
            outline-offset: 1px;
            z-index: 1;
        }
    }
}

@media (prefers-reduced-motion: reduce) {
    .max-segmented-control__option {
        transition: none !important;
    }
}
</style>
