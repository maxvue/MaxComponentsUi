<template>
    <div class="scenario-content" data-scenario="inputs-files">
        <h2>Cenário inputs-files</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputFile</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputFile v-model="files" label="Selecionar arquivo" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputFile disabled label="Desabilitado" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputFileProject</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal (lista vazia)</span>
                            <MaxInputFileProject :files="projectFiles" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputFileUpload</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputFileUpload label="Enviar arquivo" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputFileUpload label="Desabilitado" disabled />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputFileUploadBig</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputFileUploadBig />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputFileUploadBig disabled />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputFileUploadButton</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputFileUploadButton />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputFileUploadButton disabled />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import {
        MaxInputFile,
        MaxInputFileProject,
        MaxInputFileUpload,
        MaxInputFileUploadBig,
        MaxInputFileUploadButton
    } from '@maxvue/max-components-ui';

    const files = ref<File[]>([]);
    const projectFiles = ref<any[]>([]);
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
        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
