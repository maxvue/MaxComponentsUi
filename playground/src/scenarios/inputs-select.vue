<template>
    <div class="scenario-content" data-scenario="inputs-select">
        <h2>Cenário inputs-select</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputSelect</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputSelect v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputSelect v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputSelect v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputDatePicker</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputDatePicker v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputDatePicker v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputDatePicker v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputAutoComplete</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputAutoComplete v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputAutoComplete v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputAutoComplete v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputAutoCompleteApi</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputAutoCompleteApi v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputAutoCompleteApi v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputAutoCompleteApi v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    // Props neutras permitem exercitar os estados sem omitir contratos obrigatórios.
    const scenarioProps: any = { modelValue: '', options: [], items: [], route: '/', target: document.body };
    import { MaxInputSelect } from '@maxvue/max-components-ui';
    import { MaxInputDatePicker } from '@maxvue/max-components-ui';
    import { MaxInputAutoComplete } from '@maxvue/max-components-ui';
    import { MaxInputAutoCompleteApi } from '@maxvue/max-components-ui';
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
