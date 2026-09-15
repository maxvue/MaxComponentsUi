<template>
    <div class="scenario-content" data-scenario="inputs-masks">
        <h2>Cenário inputs-masks</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputPhone</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputPhone v-model="phone" label="Telefone" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputPhone v-model="phoneDisabled" label="Telefone" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputPhone v-model="phoneError" label="Telefone" :error="'Número inválido'" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputPhoneMail</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputPhoneMail v-model="phoneMail" label="Telefone / E-mail" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputPhoneMail v-model="phoneMailDisabled" label="Telefone / E-mail" disabled />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCep</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCep v-model="cep" label="CEP" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCep v-model="cepDisabled" label="CEP" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputCep v-model="cepError" label="CEP" :error="'CEP não encontrado'" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCpfCnpj</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCpfCnpj v-model="cpfCnpj" label="CPF / CNPJ" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCpfCnpj v-model="cpfCnpjDisabled" label="CPF / CNPJ" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputCpfCnpj v-model="cpfCnpjError" label="CPF / CNPJ" :error="'Documento inválido'" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputTypeAddress</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputTypeAddress v-model="address" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputTypeAddress v-model="addressDisabled" disabled />
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
        MaxInputPhone,
        MaxInputPhoneMail,
        MaxInputCep,
        MaxInputCpfCnpj,
        MaxInputTypeAddress
    } from '@maxvue/max-components-ui';

    const phone = ref('');
    const phoneDisabled = ref('(11) 99999-9999');
    const phoneError = ref('123');

    const phoneMail = ref('');
    const phoneMailDisabled = ref('contato@empresa.com.br');

    const cep = ref('');
    const cepDisabled = ref('01310-100');
    const cepError = ref('00000');

    const cpfCnpj = ref<string | null>(null);
    const cpfCnpjDisabled = ref<string | null>('123.456.789-09');
    const cpfCnpjError = ref<string | null>('111.111.111-11');

    const address = ref('');
    const addressDisabled = ref('Rua das Flores');
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
        min-width: 220px;
        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
