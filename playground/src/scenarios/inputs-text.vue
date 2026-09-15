<template>
    <div class="flex flex-col gap-4 p-4">
        <h2>Inputs Text</h2>
        <MaxInputText v-model="val" label="Default Input" placeholder="Type here..." />
        <MaxInputText v-model="val2" label="Error Input" has-error message="This field is required" />
        <MaxInputText v-model="val3" label="Disabled Input" disabled />
    </div>
</template>
<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxInputText } from '../../../src';

    const val = ref('');
    const val2 = ref('');
    const val3 = ref('disabled value');
</script>
