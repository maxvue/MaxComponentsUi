<template>
    <div class="scenario-content" data-scenario="panels-accordion">
        <h2>Accordion</h2>
        <p>Itens são sempre montados dentro do provedor <code>MaxAccordion</code>.</p>
        <MaxAccordion v-model:value="openItem">
            <MaxAccordionItem value="details" title="Detalhes">
                Conteúdo do primeiro item.
            </MaxAccordionItem>
            <MaxAccordionItem value="settings" title="Configurações">
                Conteúdo do segundo item.
            </MaxAccordionItem>
            <MaxAccordionItem value="disabled" title="Indisponível" disabled>
                Este item não pode ser aberto.
            </MaxAccordionItem>
        </MaxAccordion>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxAccordion, MaxAccordionItem } from '@maxvue/max-components-ui';

    const openItem = ref<string | undefined>('details');
</script>

<style lang="scss" scoped>
    .scenario-content { display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
</style>
