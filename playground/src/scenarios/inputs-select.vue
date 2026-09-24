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
                            <MaxTagSelect
                                v-model="selectedTag"
                                :options="energyTags"
                                filter
                                option-label="name"
                                option-value="id"
                                placeholder="Concessionária"
                            />
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
        MaxTagSelect
    } from '@maxvue/max-components-ui';

    // Props neutras permitem exercitar os estados sem omitir contratos obrigatórios.
    const scenarioProps: any = { modelValue: '', options: [], items: [], route: '/', target: document.body };

    const ufSelected = ref('SP');
    const ufWithBr = ref('BR');
    const ufState = ref('Rio de Janeiro');
    const ufMin = ref('R. G. do Sul');

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
