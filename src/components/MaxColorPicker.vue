<template>
    <InputBase v-bind="props" :done="props.done ?? isDone" :error="props.error ?? error_msg" :caution="caution" class="max-input-color">
        <div ref="triggerRef" class="p-colorpicker-preview-wrapper" @click="toggleOverlay">
            <div class="p-colorpicker-preview" :style="{ backgroundColor: '#' + hexClean }"></div>
        </div>
        <MaxBaseInput v-model="modelValue" :disabled="props.disabled" />

        <MaxBaseOverlay v-model:visible="overlayVisible" :target="triggerRef">
            <div class="p-colorpicker-panel p-component" role="dialog">
                <div class="p-colorpicker-content">
                    <!-- Quadrado Saturação × Brilho -->
                    <div
                        ref="colorSelectorRef"
                        class="p-colorpicker-color-selector"
                        :style="{ backgroundColor: '#' + hueHex }"
                        @mousedown="onColorSelectorMouseDown"
                    >
                        <div class="p-colorpicker-color-background">
                            <div
                                class="p-colorpicker-color-handle"
                                :style="{ left: hsb.s + '%', top: (100 - hsb.b) + '%' }"
                            ></div>
                        </div>
                    </div>

                    <!-- Barra Vertical de Matiz -->
                    <div
                        ref="hueSelectorRef"
                        class="p-colorpicker-hue"
                        @mousedown="onHueSelectorMouseDown"
                    >
                        <div
                            class="p-colorpicker-hue-handle"
                            :style="{ top: (hsb.h / 360) * 100 + '%' }"
                        ></div>
                    </div>
                </div>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>

<script setup lang="ts">
    import { toSearchableString, hasContent } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, useAttrs, onBeforeUnmount } from 'vue';
    import InputBase from './InputBase.vue';
    import MaxBaseInput from './base/MaxBaseInput.vue';
    import MaxBaseOverlay from './base/MaxBaseOverlay.vue';

    const modelValue = defineModel<any>({ default: '' });
    const attrs: any = useAttrs();
    const triggerRef = ref<HTMLElement | null>(null);
    const colorSelectorRef = ref<HTMLElement | null>(null);
    const hueSelectorRef = ref<HTMLElement | null>(null);
    const overlayVisible = ref(false);

    interface Props {
        defaultColor?: string;
        format?: 'hex' | 'rgb' | 'hsb';
        inline?: boolean;
        panelClass?: any;
        appendTo?: 'body' | 'self' | string | any;
        autoZIndex?: boolean;
        baseZIndex?: number;
        inputId?: string;
        ariaLabel?: string;
        ariaLabelledby?: string;
        icon?: string | undefined;
        i?: string | undefined;
        disabled?: boolean | undefined;
        float?: boolean | undefined;
        msg?: string | undefined;
        message?: string | undefined;
        iconMessage?: string | undefined;
        label?: string | undefined;
        done?: boolean | undefined;
        error?: string | boolean | undefined;
        targetValue?: string;
        caution?: string | boolean | undefined;
        required?: boolean;
        placeholder?: string | undefined;
    }

    const props = withDefaults(
        defineProps<Props>(),
        {
            defaultColor: 'ff0000',
            format: 'hex',
            inline: false,
            appendTo: 'body',
            autoZIndex: true,
            baseZIndex: 0,
            done: undefined,
            required: false,
            caution: undefined,
            disabled: false,
            error: undefined
        }
    );

    // HSB state: h (0-360), s (0-100), b (0-100)
    const hsb = ref({ h: 0, s: 100, b: 100 });

    const hexClean = computed(() => {
        let val = String(modelValue.value || props.defaultColor).replace('#', '').trim();
        if (val.length === 3) val = val.split('').map((c) => c + c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(val)) return 'ff0000';
        return val;
    });

    const hueHex = computed(() => {
        const rgb = hsbToRgb(hsb.value.h, 100, 100);
        return rgbToHex(rgb);
    });

    // Conversões
    function hsbToRgb(h: number, s: number, b: number) {
        s /= 100; b /= 100;
        const k = (n: number) => (n + h / 60) % 6;
        const f = (n: number) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
        return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
    }

    function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
        return [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
    }

    function hexToRgb(hex: string) {
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map((c) => c + c).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
        return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    }

    function rgbToHsb({ r, g, b }: { r: number; g: number; b: number }) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d !== 0) if (max === r) h = 60 * (((g - b) / d) % 6);
        else if (max === g) h = 60 * ((b - r) / d + 2);
        else h = 60 * ((r - g) / d + 4);

        return { h: (h + 360) % 360, s: max === 0 ? 0 : (d / max) * 100, b: max * 100 };
    }

    const syncHsbFromHex = (hex: string) => {
        const rgb = hexToRgb(hex);
        if (rgb) hsb.value = rgbToHsb(rgb);

    };

    watch(() => modelValue.value, (val) => {
        if (val) syncHsbFromHex(String(val));
    }, { immediate: true });

    const emitColorChange = () => {
        const rgb = hsbToRgb(hsb.value.h, hsb.value.s, hsb.value.b);
        const hex = rgbToHex(rgb);
        modelValue.value = hex;
    };

    // Arraste no quadrado Saturação x Brilho
    let isDraggingColor = false;

    const handleColorMove = (event: MouseEvent) => {
        if (!colorSelectorRef.value || !isDraggingColor) return;
        const rect = colorSelectorRef.value.getBoundingClientRect();
        const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));

        hsb.value.s = Math.round((x / rect.width) * 100);
        hsb.value.b = Math.round((1 - y / rect.height) * 100);
        emitColorChange();
    };

    const stopColorDrag = () => {
        isDraggingColor = false;
        window.removeEventListener('mousemove', handleColorMove);
        window.removeEventListener('mouseup', stopColorDrag);
    };

    const onColorSelectorMouseDown = (event: MouseEvent) => {
        isDraggingColor = true;
        handleColorMove(event);
        window.addEventListener('mousemove', handleColorMove);
        window.addEventListener('mouseup', stopColorDrag);
    };

    // Arraste na barra de Matiz
    let isDraggingHue = false;

    const handleHueMove = (event: MouseEvent) => {
        if (!hueSelectorRef.value || !isDraggingHue) return;
        const rect = hueSelectorRef.value.getBoundingClientRect();
        const y = Math.max(0, Math.min(event.clientY - rect.top, rect.height));
        hsb.value.h = Math.round((y / rect.height) * 360);
        emitColorChange();
    };

    const stopHueDrag = () => {
        isDraggingHue = false;
        window.removeEventListener('mousemove', handleHueMove);
        window.removeEventListener('mouseup', stopHueDrag);
    };

    const onHueSelectorMouseDown = (event: MouseEvent) => {
        isDraggingHue = true;
        handleHueMove(event);
        window.addEventListener('mousemove', handleHueMove);
        window.addEventListener('mouseup', stopHueDrag);
    };

    onBeforeUnmount(() => {
        stopColorDrag();
        stopHueDrag();
    });

    const toggleOverlay = () => {
        if (props.disabled) return;
        overlayVisible.value = !overlayVisible.value;
    };

    const isDone: Ref = ref(props.done ?? null);

    const isEqual = computed(() => typeof props.targetValue === 'string' && hasContent(props.targetValue) ? toSearchableString(props.targetValue) === toSearchableString(modelValue.value) : null);

    const isRequiredDone = computed(() => (props.required ? hasContent(modelValue.value) : null));

    const testIsDone = () => {
        if (props.done !== undefined) return props.done;
        if (isEqual.value !== null) return isEqual.value;
        if (isRequiredDone.value !== null) return isRequiredDone.value;
        if (props.caution !== undefined) return !props.caution;
        return null;
    };

    const caution = computed(() => (props.caution !== undefined ? props.caution && isDone.value === false : isDone.value === false));

    const error_msg = computed(() => {
        if (!caution.value) return null;
        const attrs_error_message = attrs.errMsg ?? attrs.error_message ?? attrs.error_msg ?? null;
        if (isEqual.value === false) return attrs_error_message ?? 'Valor esperado: ' + (attrs.target_value ?? attrs.targetValue ?? attrs['target-value']);
        if (isRequiredDone.value === false) return attrs_error_message ?? 'Campo obrigatório';
        return attrs_error_message ?? 'Valor inválido';
    });

    watch(modelValue, () => {
        isDone.value = testIsDone();
    }, { immediate: true });
</script>

<style lang="scss">
.max-input-color {
    display: grid;
    grid-template-columns: 30px 1fr;
    place-items: center;
    grid-template-rows: 1fr !important;
    gap: 0.5rem;

    .message-spacer {
        display: none;
    }

    .p-floatlabel {
        grid-template-rows: 1fr !important;
    }

    .p-colorpicker-preview-wrapper {
        cursor: pointer;
        width: 24px;
        height: 24px;
    }

    .p-colorpicker-preview {
        outline: 1px solid var(--background-400);
        border-radius: 0.5rem;
        width: 100%;
        height: 100%;
    }
}

.p-colorpicker-panel {
    background-color: var(--background-0, #fff);
    border: 1px solid var(--max-border-color, #e2e8f0);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    padding: 8px;

    .p-colorpicker-content {
        display: flex;
        gap: 8px;
    }

    .p-colorpicker-color-selector {
        position: relative;
        width: 150px;
        height: 150px;
        cursor: crosshair;

        .p-colorpicker-color-background {
            position: absolute;
            inset: 0;
            background: linear-gradient(to right, #fff, rgb(255 255 255 / 0%)),
                linear-gradient(to top, #000, rgb(0 0 0 / 0%));
        }

        .p-colorpicker-color-handle {
            position: absolute;
            width: 10px;
            height: 10px;
            border: 1px solid #fff;
            border-radius: 50%;
            transform: translate(-5px, -5px);
            box-shadow: 0 0 2px rgb(0 0 0 / 50%);
            pointer-events: none;
        }
    }

    .p-colorpicker-hue {
        position: relative;
        width: 18px;
        height: 150px;
        background: linear-gradient(to bottom, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
        cursor: pointer;

        .p-colorpicker-hue-handle {
            position: absolute;
            left: 0;
            width: 100%;
            height: 4px;
            background-color: #fff;
            border: 1px solid rgb(0 0 0 / 50%);
            transform: translateY(-2px);
            pointer-events: none;
        }
    }
}
</style>