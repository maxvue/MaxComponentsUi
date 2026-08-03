<template>
    <InputBase label="Vencimento:" v-bind="attrs" textCenter class="input-credit-card-cvv-base">
        <InputText ref="el" type="text" :style="`letter-spacing: ${space_letters}px; padding-left: ${space_letters + 8}px`" v-bind="attrs" v-maska:unmaskedValue.unmasked="maskValue" erro="" autoClear="false" slotChar=" " fluid :model-value="props.modelValue" @update:model-value="$emit('update:modelValue', $event)" />
    </InputBase>
</template>

<script setup lang="ts">
    import { vMaska } from 'maska/vue';
    import { ref, computed } from 'vue';
    import { useElementSize, isValidCreditCard } from '@maxvue/max-use';

    const props = defineProps({
        modelValue: { default: '' }
    });
    const done = ref(false);

    const attrs: any = useAttrs();

    const unmaskedValue = ref('');

    const len = computed(() => attrs.len ?? 3);

    const el: any = useTemplateRef('el');
    const { width } = useElementSize(el);

    const space_letters = computed(() => (width.value ? (width.value - len.value * 12) / len.value : 0));

    const maskValue = computed(() => {
        const tokens = {
            '#': { pattern: /[0-9]/ },
            '@': { pattern: /[0-9]/, optional: true }
        };

        const date_split = props.modelValue.split(' / ');
        let mask_string: string = '###';

        if (len.value === 4) mask_string = '####';


        const msk = {
            tokens: tokens,
            mask: mask_string
        };

        return msk;
    });

    defineExpose({ unmaskedValue });
</script>
