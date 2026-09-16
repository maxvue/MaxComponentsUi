<template>
    <div class="scenario-content" data-scenario="media-brand">
        <h2>Cenário media-brand</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxLogo</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLogo v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLogo v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLogo v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxMaps</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxMaps :modelValue="{ latitude: -15.7801, longitude: -47.9292 }" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxUserAvatar</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxUserAvatar v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxUserAvatar v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxUserAvatar v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxUserSection</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxUserSection v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxUserSection v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxUserSection v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxAuthCard</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxAuthCard v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxAuthCard v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxAuthCard v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxCreditCard</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxCreditCard v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxCreditCard v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxCreditCard v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTitle1</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTitle1 v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxTitle1 v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxTitle1 v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTitle2</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTitle2 v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxTitle2 v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxTitle2 v-bind="scenarioProps" error severity="danger" />
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
    import { MaxLogo } from '@maxvue/max-components-ui';
    import { MaxMaps } from '@maxvue/max-components-ui';
    import { MaxUserAvatar } from '@maxvue/max-components-ui';
    import { MaxUserSection } from '@maxvue/max-components-ui';
    import { MaxAuthCard } from '@maxvue/max-components-ui';
    import { MaxCreditCard } from '@maxvue/max-components-ui';
    import { MaxTitle1 } from '@maxvue/max-components-ui';
    import { MaxTitle2 } from '@maxvue/max-components-ui';
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
