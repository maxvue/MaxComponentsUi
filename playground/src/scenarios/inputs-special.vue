<template>
    <div class="scenario-content" data-scenario="inputs-special">
        <h2>Cenário inputs-special</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputIconPicker</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputIconPicker v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputIconPicker v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputIconPicker v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputNumber</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputNumber v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputNumber v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputNumber v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputOTP</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputOTP v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputOTP v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputOTP v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputTextList</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputTextList v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputTextList v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputTextList v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxColorPicker</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxColorPicker v-bind="scenarioProps"  />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxColorPicker v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxColorPicker v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputPercent</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputPercent v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputPercent v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputPercent v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputPower</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputPower v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputPower v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputPower v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCurrent</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCurrent v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCurrent v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputCurrent v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputVoltage</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputVoltage v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputVoltage v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputVoltage v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputDistance</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputDistance v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputDistance v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputDistance v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputDuration</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputDuration v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputDuration v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputDuration v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputTokenLimit</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputTokenLimit v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputTokenLimit v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputTokenLimit v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputMonthDays</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputMonthDays v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputMonthDays v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputMonthDays v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputWeekInterval</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputWeekInterval v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputWeekInterval v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputWeekInterval v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputSocialPlatform</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputSocialPlatform v-bind="scenarioProps" />
                        </div>
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputSocialPlatform v-bind="scenarioProps" disabled />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputSocialPlatform v-bind="scenarioProps" error severity="danger" />
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
    import { MaxInputIconPicker } from '@maxvue/max-components-ui';
    import { MaxInputNumber } from '@maxvue/max-components-ui';
    import { MaxInputOTP } from '@maxvue/max-components-ui';
    import { MaxInputTextList } from '@maxvue/max-components-ui';
    import { MaxColorPicker } from '@maxvue/max-components-ui';
    import { MaxInputPercent } from '@maxvue/max-components-ui';
    import { MaxInputPower } from '@maxvue/max-components-ui';
    import { MaxInputCurrent } from '@maxvue/max-components-ui';
    import { MaxInputVoltage } from '@maxvue/max-components-ui';
    import { MaxInputDistance } from '@maxvue/max-components-ui';
    import { MaxInputDuration } from '@maxvue/max-components-ui';
    import { MaxInputTokenLimit } from '@maxvue/max-components-ui';
    import { MaxInputMonthDays } from '@maxvue/max-components-ui';
    import { MaxInputWeekInterval } from '@maxvue/max-components-ui';
    import { MaxInputSocialPlatform } from '@maxvue/max-components-ui';
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
