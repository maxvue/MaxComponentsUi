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
                    <h3>MaxInputUF</h3>
                    <div class="states">
                        <!-- Padrão (UF) -->
                        <div class="state-col" style="min-width: 170px;">
                            <span>Padrão (v-model: {{ ufSelected || 'vazio' }})</span>
                            <MaxInputUF v-model="ufSelected" placeholder="Selecione a UF" clearable />
                        </div>
                        <!-- Com showBr -->
                        <div class="state-col" style="min-width: 170px;">
                            <span>Com Brasil (v-model: {{ ufWithBr || 'vazio' }})</span>
                            <MaxInputUF v-model="ufWithBr" show-br placeholder="Com opção BR" clearable />
                        </div>
                        <!-- value="state" -->
                        <div class="state-col" style="min-width: 220px;">
                            <span>Por Extenso (state: {{ ufState || 'vazio' }})</span>
                            <MaxInputUF v-model="ufState" value="state" label="estado" placeholder="Nome completo" clearable />
                        </div>
                        <!-- value="min" -->
                        <div class="state-col" style="min-width: 190px;">
                            <span>Abreviado (min: {{ ufMin || 'vazio' }})</span>
                            <MaxInputUF v-model="ufMin" value="min" label="min" placeholder="Abreviado" clearable />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputUF model-value="SP" disabled />
                        </div>
                        <!-- Error -->
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputUF error="UF obrigatória" required />
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
                    <h3>MaxInputBirthday</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal (Vazio)</span>
                            <MaxInputBirthday label="Data de Nascimento" />
                        </div>
                        <!-- Preenchido -->
                        <div class="state-col">
                            <span>Preenchido (2000-01-15)</span>
                            <MaxInputBirthday model-value="2000-01-15" label="Data de Nascimento" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputBirthday model-value="1995-10-25" label="Data de Nascimento" disabled />
                        </div>
                        <!-- Error -->
                        <div class="state-col">
                            <span>Com Erro</span>
                            <MaxInputBirthday label="Data de Nascimento" error="Data obrigatória" />
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

                <div class="component-block">
                    <h3>MaxTagSelect — Largura Dinâmica e Reticências</h3>
                    <div class="states">
                        <div class="state-col" style="width: 140px;">
                            <span>Gatilho Estreito (140px)</span>
                            <MaxTagSelect v-model="selectedTag" :options="energyTags" filter option-label="name" option-value="id" placeholder="Concessionária" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputPhase (D01)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 180px;">
                            <span>Interativo (v-model: {{ phaseVal ?? 'vazio' }})</span>
                            <MaxInputPhase v-model="phaseVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputPhase :model-value="2" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputPhase error="Fase obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputWireSize (D02)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 200px;">
                            <span>Interativo (v-model: {{ wireSizeVal ?? 'vazio' }})</span>
                            <MaxInputWireSize v-model="wireSizeVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputWireSize :model-value="10" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputWireSize error="Seção obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputWireType (D03)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 220px;">
                            <span>Interativo (v-model: {{ wireTypeVal ?? 'vazio' }})</span>
                            <MaxInputWireType v-model="wireTypeVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputWireType model-value="copper-90" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputWireType error="Tipo obrigatório" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputAiExecutionType (D04)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 180px;">
                            <span>Interativo (v-model: {{ aiExecVal ?? 'vazio' }})</span>
                            <MaxInputAiExecutionType v-model="aiExecVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputAiExecutionType model-value="local" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputAiExecutionType error="Execução obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputAiBillingMode (D05)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 190px;">
                            <span>Interativo (v-model: {{ aiBillingModeVal ?? 'vazio' }})</span>
                            <MaxInputAiBillingMode v-model="aiBillingModeVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputAiBillingMode model-value="free" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputAiBillingMode error="Cobrança obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputAiBillingUnit (D06)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 210px;">
                            <span>Interativo (v-model: {{ aiBillingUnitVal ?? 'vazio' }})</span>
                            <MaxInputAiBillingUnit v-model="aiBillingUnitVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputAiBillingUnit model-value="tokens" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputAiBillingUnit error="Unidade obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputPaymentMethod (D07)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 180px;">
                            <span>Interativo (v-model: {{ paymentVal ?? 'vazio' }})</span>
                            <MaxInputPaymentMethod v-model="paymentVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputPaymentMethod model-value="credit_card" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputPaymentMethod error="Método obrigatório" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputScheduleType (D08)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 210px;">
                            <span>Interativo (v-model: {{ scheduleVal ?? 'vazio' }})</span>
                            <MaxInputScheduleType v-model="scheduleVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputScheduleType model-value="monthly_days" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputScheduleType error="Agendamento obrigatório" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputMonthOccurrence (D09)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 180px;">
                            <span>Interativo (v-model: {{ occurrenceVal ?? 'vazio' }})</span>
                            <MaxInputMonthOccurrence v-model="occurrenceVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputMonthOccurrence :model-value="5" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputMonthOccurrence error="Ocorrência obrigatória" required />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputContentType (D10)</h3>
                    <div class="states">
                        <div class="state-col" style="min-width: 180px;">
                            <span>Interativo (v-model: {{ contentVal ?? 'vazio' }})</span>
                            <MaxInputContentType v-model="contentVal" clearable />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Disabled</span>
                            <MaxInputContentType model-value="url" disabled />
                        </div>
                        <div class="state-col" style="min-width: 160px;">
                            <span>Com Erro</span>
                            <MaxInputContentType error="Tipo obrigatório" required />
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
        MaxInputSelect,
        MaxInputUF,
        MaxInputDatePicker,
        MaxInputBirthday,
        MaxInputAutoComplete,
        MaxInputAutoCompleteApi,
        MaxTagSelect,
        MaxInputPhase,
        MaxInputWireSize,
        MaxInputWireType,
        MaxInputAiExecutionType,
        MaxInputAiBillingMode,
        MaxInputAiBillingUnit,
        MaxInputPaymentMethod,
        MaxInputScheduleType,
        MaxInputMonthOccurrence,
        MaxInputContentType,
        type PhaseValue,
        type WireSizeValue,
        type WireTypeValue,
        type AiExecutionTypeValue,
        type AiBillingModeValue,
        type AiBillingUnitValue,
        type PaymentMethodValue,
        type ScheduleTypeValue,
        type MonthOccurrenceValue,
        type ContentTypeValue
    } from '@maxvue/max-components-ui';

    // Props neutras permitem exercitar os estados sem omitir contratos obrigatórios.
    const scenarioProps: any = { modelValue: '', options: [], items: [], route: '/', target: document.body };

    const ufSelected = ref('SP');
    const ufWithBr = ref('BR');
    const ufState = ref('Rio de Janeiro');
    const ufMin = ref('R. G. do Sul');

    const phaseVal = ref<PhaseValue | null>(1);
    const wireSizeVal = ref<WireSizeValue | null>(2.5);
    const wireTypeVal = ref<WireTypeValue | null>('copper-70');
    const aiExecVal = ref<AiExecutionTypeValue | null>('cloud');
    const aiBillingModeVal = ref<AiBillingModeValue | null>('dollar');
    const aiBillingUnitVal = ref<AiBillingUnitValue | null>('m_tokens');
    const paymentVal = ref<PaymentMethodValue | null>('pix');
    const scheduleVal = ref<ScheduleTypeValue | null>('weekly');
    const occurrenceVal = ref<MonthOccurrenceValue | null>(1);
    const contentVal = ref<ContentTypeValue | null>('image');

    const selectedTag = ref(null);
    const energyTags = [
        { id: 1, name: 'Amazonas Energia', icon: 'lucide:zap', tag_color: '#4ade80' },
        { id: 2, name: 'Celesc Santa Catarina', icon: 'lucide:zap', tag_color: '#84cc16' },
        { id: 3, name: 'Cemig', icon: 'lucide:zap', tag_color: '#22c55e' },
        { id: 4, name: 'Chesp', icon: 'lucide:zap', tag_color: '#10b981' },
        { id: 5, name: 'Copel', icon: 'lucide:zap', tag_color: '#b45309' },
        { id: 6, name: 'EDP São Paulo', icon: 'lucide:zap', tag_color: '#84cc16' },
        { id: 7, name: 'EDP Espírito Santo', icon: 'lucide:zap', tag_color: '#84cc16' },
        { id: 8, name: 'Enel Ceará', icon: 'lucide:zap', tag_color: '#f472b6' },
        { id: 9, name: 'Enel São Paulo', icon: 'lucide:zap', tag_color: '#f472b6' },
        { id: 10, name: 'Enel Rio de Janeiro', icon: 'lucide:zap', tag_color: '#f472b6' },
        { id: 11, name: 'Energisa Acre', icon: 'lucide:zap', tag_color: '#fb923c' },
        { id: 12, name: 'Energisa Mato Grosso', icon: 'lucide:zap', tag_color: '#f97316' },
        { id: 13, name: 'Energisa Mato Grosso do Sul Distribuidora com Nome Muito Longo para Teste de Reticências no Limite', icon: 'lucide:zap', tag_color: '#ea580c' }
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
