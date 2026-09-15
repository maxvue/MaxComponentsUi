<template>
    <div class="scenario-content" data-scenario="media-loaders">
        <h2>Cenário media-loaders</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxLoader</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLoader v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLoader v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLoader v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLoaderAi</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLoaderAi v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLoaderAi v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLoaderAi v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLoaderIcon</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLoaderIcon v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLoaderIcon v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLoaderIcon v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLoadScreen</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLoadScreen v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLoadScreen v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLoadScreen v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLoadScreenTarget</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLoadScreenTarget v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLoadScreenTarget v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLoadScreenTarget v-bind="scenarioProps" error severity="danger" />
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
    import { MaxLoader } from '@maxvue/max-components-ui';
    import { MaxLoaderAi } from '@maxvue/max-components-ui';
    import { MaxLoaderIcon } from '@maxvue/max-components-ui';
    import { MaxLoadScreen } from '@maxvue/max-components-ui';
    import { MaxLoadScreenTarget } from '@maxvue/max-components-ui';
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
