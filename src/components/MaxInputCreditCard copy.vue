<template>
    <InputBase v-bind="props" class="input-base-phone-mail-main-div" :value="modelValue" :done="done ?? undefined" :caution="caution" :error="error_msg ?? undefined" :icon-right="loading ? 'loading' : undefined">
        <InputText ref="el" type="text" :style="`letter-spacing: ${space_letters}px; padding-left: ${space_letters * 2}px; padding-right: 0px;`" v-bind="attrs" v-maska:unmaskedValue.unmasked="maskValue" placeholder="0000" :model-value="props.modelValue" @update:model-value="$emit('update:modelValue', $event)" />
    </InputBase>
</template>

<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { ref, computed } from 'vue';
    import { useElementSize, isValidCreditCard } from '@maxvue/max-use';

    const props = defineProps({
        modelValue: { default: '' },
        label: { default: '' }
    });

    const unmaskedValue = ref('');

    const el = ref(null);
    const { width } = useElementSize(el);

    const space_letters = computed(() => (width.value ? (width.value - 120) / 4 : 0));

    const done = computed(() => isValidCreditCard(props.modelValue));

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            '@': { pattern: /[0-9]/, optional: true }
        };

        let mask_string: string = '####';

        const msk = {
            tokens: tokens,
            mask: mask_string
        };

        return msk;
    });

    defineExpose({ unmaskedValue });

</script>

<style lang="scss">
.input-credit-card-number-base {
    input {
        text-align: center !important;
    }
}
</style>
