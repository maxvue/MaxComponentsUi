<template>
    <div class="scenario-content" data-scenario="inputs-text">
        <h2>Cenário inputs-text</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>InputBase</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <InputBase label="Rótulo Base">
                                <template #default>
                                    <input type="text" placeholder="Campo nativo" class="w-full p-2 border rounded" />
                                </template>
                            </InputBase>
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <InputBase label="Rótulo Desabilitado" disabled>
                                <template #default>
                                    <input type="text" disabled placeholder="Desabilitado" class="w-full p-2 border rounded" />
                                </template>
                            </InputBase>
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <InputBase label="Com Erro" has-error message="Campo com erro">
                                <template #default>
                                    <input type="text" placeholder="Erro" class="w-full p-2 border rounded" />
                                </template>
                            </InputBase>
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputText</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputText v-model="textVal1" label="Texto Normal" placeholder="Digite algo..." />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputText v-model="textVal2" label="Texto Desabilitado" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputText v-model="textVal3" label="Texto com Erro" has-error message="Este campo é obrigatório" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputTextArea</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputTextArea v-model="textAreaVal1" label="Área de Texto Normal" placeholder="Digite sua mensagem..." />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputTextArea v-model="textAreaVal2" label="Área Desabilitada" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputTextArea v-model="textAreaVal3" label="Área com Erro" has-error message="Texto muito curto" />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { InputBase, MaxInputText, MaxInputTextArea } from '@maxvue/max-components-ui';

    const textVal1 = ref('');
    const textVal2 = ref('Valor inicial');
    const textVal3 = ref('');

    const textAreaVal1 = ref('');
    const textAreaVal2 = ref('Área desabilitada com texto prévio');
    const textAreaVal3 = ref('');
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
        min-width: 200px;
        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
