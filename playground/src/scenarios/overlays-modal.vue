<template>
    <div class="scenario-content" data-scenario="overlays-modal">
        <h2>Cenário overlays-modal</h2>
        <div class="scenario-inner">
            <div class="variants">
                <div class="component-block">
                    <h3>Modal com Selects (Validação de Z-Index)</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Modal com MaxInputSelect e MaxTagSelect</span>
                            <MaxModal title="Modal com Seletores" sub-title="Teste de Z-Index de dropdowns">
                                <template #button>
                                    <MaxButton label="Abrir Modal com Selects" />
                                </template>
                                <template #default>
                                    <div class="modal-form-demo">
                                        <MaxInputSelect
                                            v-model="selectedFruit"
                                            label="Selecione uma fruta"
                                            :options="fruits"
                                        />
                                        <MaxTagSelect
                                            v-model="selectedTags"
                                            label="Selecione categorias"
                                            :options="tagOptions"
                                        />
                                    </div>
                                </template>
                            </MaxModal>
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxModal</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxModal />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxModal disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxModal error severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxModal, MaxButton, MaxInputSelect, MaxTagSelect } from '@maxvue/max-components-ui';

    const selectedFruit = ref(null);
    const fruits = [
        { value: 'apple', label: 'Maçã' },
        { value: 'banana', label: 'Banana' },
        { value: 'orange', label: 'Laranja' },
        { value: 'grape', label: 'Uva' }
    ];

    const selectedTags = ref([]);
    const tagOptions = [
        { value: 'tech', label: 'Tecnologia' },
        { value: 'finance', label: 'Finanças' },
        { value: 'health', label: 'Saúde' }
    ];
</script>

<style lang="scss" scoped>
    .scenario-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .variants {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .component-block {
        border: 1px solid var(--layout-border, #ccc);
        padding: 1rem;
        border-radius: 8px;
    }

    .modal-form-demo {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        min-width: 320px;
        padding: 1rem 0;
    }

    .states {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        margin-top: 1rem;
    }

    .state-col {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
