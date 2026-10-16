<template>
    <div :id="props.id" class="max-input-color-palette" role="group" :aria-label="resolvedLabel" :aria-describedby="props.ariaDescribedby">
        <div v-if="resolvedLabel" class="palette-header">
            <label class="palette-label">{{ resolvedLabel }}</label>
        </div>
        <div class="palette-items-list">
            <div v-for="(item, index) in items" :key="index" class="palette-item-row">
                <div class="palette-picker-wrapper">
                    <MaxColorPicker :modelValue="getValidColor(item.color)" :disabled="props.disabled" :noMessage="true" class="palette-picker" @update:modelValue="(val: string) => updateColor(index, val)" />
                </div>
                <div class="palette-hex-wrapper">
                    <MaxInputText :modelValue="item.color" :disabled="props.disabled" placeholder="#000000" :noMessage="true" :error="!isValidHex(item.color)" class="palette-hex" @update:modelValue="(val: any) => updateColor(index, val ? String(val) : '')" />
                </div>
                <div class="palette-details-wrapper">
                    <MaxInputText :modelValue="item.details" :disabled="props.disabled" placeholder="Descrição / detalhes de uso" :noMessage="true" class="palette-details" @update:modelValue="(val: any) => updateDetails(index, val ? String(val) : '')" />
                </div>
                <div class="palette-actions-wrapper">
                    <MaxIconButton ref="removeButtons" icon="tabler:trash" ariaLabel="Remover cor" :disabled="props.disabled" class="palette-remove-btn" @click="() => removeItem(index)" />
                </div>
            </div>
        </div>
        <div class="palette-footer">
            <MaxButton ref="addButtonRef" label="Adicionar cor" :disabled="props.disabled" class="palette-add-btn" @click="addItem" />
        </div>
        <div v-if="effectiveError && !props.noMessage" class="palette-error-message" role="alert">
            {{ effectiveError }}
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed, nextTick, ref } from 'vue';
    import MaxButton from './MaxButton.vue';
    import MaxColorPicker from './MaxColorPicker.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import MaxInputText from './MaxInputText.vue';
    import type { ColorPaletteItem, MaxInputColorPaletteProps } from '../types/specializedInputs';

    const HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

    const props = withDefaults(defineProps<MaxInputColorPaletteProps>(), {
        modelValue: () => [],
        id: undefined,
        label: undefined,
        disabled: false,
        required: false,
        error: undefined,
        caution: undefined,
        noMessage: false,
        ariaDescribedby: undefined
    });

    const emit = defineEmits<{
        'update:modelValue': [value: ColorPaletteItem[]];
        'change': [value: ColorPaletteItem[]];
    }>();

    const addButtonRef = ref<any>(null);
    const removeButtons = ref<any[]>([]);

    const items = computed<ColorPaletteItem[]>(() => props.modelValue ?? []);

    const resolvedLabel = computed<string>(() => {
        if (props.label !== undefined) return props.label;
        return 'Paleta de cores';
    });

    function isValidHex(hex: string): boolean {
        if (typeof hex !== 'string') return false;
        return HEX_REGEX.test(hex.trim());
    }

    function getValidColor(color: string): string {
        if (isValidHex(color)) return color.trim();
        return '#000000';
    }

    const hasInvalidColors = computed<boolean>(() => {
        return items.value.some((item) => !isValidHex(item.color));
    });

    const effectiveError = computed<string | null>(() => {
        if (typeof props.error === 'string' && props.error !== '') return props.error;
        if (props.error === true) return 'Paleta de cores inválida';
        if (props.required && items.value.length === 0) return 'Pelo menos uma cor é obrigatória';
        if (hasInvalidColors.value) return 'Uma ou mais cores possuem formato hexadecimal inválido';
        return null;
    });

    const updateColor = (index: number, newColor: string) => {
        if (props.disabled) return;
        const current = items.value;
        const next = current.map((it, i) => (i === index ? { ...it, color: newColor } : { ...it }));
        emit('update:modelValue', next);
        emit('change', next);
    };

    const updateDetails = (index: number, newDetails: string) => {
        if (props.disabled) return;
        const current = items.value;
        const next = current.map((it, i) => (i === index ? { ...it, details: newDetails } : { ...it }));
        emit('update:modelValue', next);
        emit('change', next);
    };

    const addItem = () => {
        if (props.disabled) return;
        const current = items.value;
        const next = [...current.map((it) => ({ ...it })), { color: '#000000', details: '' }];
        emit('update:modelValue', next);
        emit('change', next);
    };

    const removeItem = (index: number) => {
        if (props.disabled) return;
        const current = items.value;
        const next = current.filter((_, i) => i !== index).map((it) => ({ ...it }));
        emit('update:modelValue', next);
        emit('change', next);

        nextTick(() => {
            if (next.length === 0) {
                const addEl = addButtonRef.value?.$el ?? addButtonRef.value;
                addEl?.focus?.();
            } else {
                const targetIdx = Math.min(index, next.length - 1);
                const targetBtn = removeButtons.value?.[targetIdx]?.$el ?? removeButtons.value?.[targetIdx];
                targetBtn?.focus?.();
            }
        });
    };
</script>

<style lang="scss" scoped>
    .max-input-color-palette {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
    }

    .palette-label {
        font-size: 13px;
        font-weight: 600;
        color: var(--max-text-primary, #334155);
    }

    .palette-items-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .palette-item-row {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .palette-picker-wrapper {
        flex-shrink: 0;
        width: 40px;
    }

    .palette-hex-wrapper {
        flex-shrink: 0;
        width: 110px;
    }

    .palette-details-wrapper {
        flex-grow: 1;
    }

    .palette-actions-wrapper {
        flex-shrink: 0;
    }

    .palette-footer {
        display: flex;
        padding-top: 4px;
    }

    .palette-error-message {
        font-size: 12px;
        color: var(--max-danger-500, #ef4444);
    }
</style>
