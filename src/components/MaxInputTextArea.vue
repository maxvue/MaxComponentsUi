<template>
    <InputBase v-bind="attrs" class="input-text-area-main-div">
        <Textarea v-bind="attrs" :autoResize="attrs.autoResize !== false && attrs['auto-resize'] !== false" :rows="(attrs.rows as any) ?? 3" v-model="temp_value" @blur="checkDone()"/>
    </InputBase>
</template>

<script setup lang="ts">
    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: string;
            done?: boolean;
        }>(),
        { modelValue: '' }
    );

    const isDone = ref(props.done ?? null);
    
    const checkDone = () => {
        isDone.value = props.done ?? null;
    };

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    watch(
        temp_value,
        () => {
            emit('update:modelValue', temp_value.value);
        },
        { immediate: true }
    );

    watch(() => props.modelValue, (val) => temp_value.value = val);

    const countLines = computed(() => {
        const min_linest = attrs.minLines ? Number(attrs.minLines) : 1;
        if (!temp_value.value || temp_value.value.length === 0) return min_linest;

        const lines = temp_value.value.split(/\r\n|\r|\n/).length > min_linest ? temp_value.value.split(/\r\n|\r|\n/).length : min_linest;
        return lines > 13 ? 13 : lines;
    });

    const rows = computed(() => attrs.numLines ?? attrs.rows ?? countLines.value);
</script>

<style lang="scss">
    .input-text-area-main-div {
        textarea {
            border: none !important;
            box-shadow: none !important;
            width: 100%;
            background: transparent;
            outline: none;
            resize: none;
        }
    }
</style>
