<template>
    <div class="scenario-content" data-scenario="inputs-cards">
        <h2>Cenário inputs-cards</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputCreditCard</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCreditCard v-model="cardNumber" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCreditCard v-model="cardNumberDisabled" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputCreditCard v-model="cardNumberError" :error="'Cartão inválido'" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCreditCardCvv</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCreditCardCvv v-model="cvv" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCreditCardCvv v-model="cvvDisabled" disabled />
                        </div>
                        <!-- Preenchido -->
                        <div class="state-col">
                            <span>Preenchido</span>
                            <MaxInputCreditCardCvv v-model="cvvFilled" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCreditCardDate</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCreditCardDate v-model="cardDate" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCreditCardDate v-model="cardDateDisabled" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputCreditCardDate v-model="cardDateError" :error="'Data expirada'" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxInputCreditCard, MaxInputCreditCardCvv, MaxInputCreditCardDate } from '@maxvue/max-components-ui';

    const cardNumber = ref('');
    const cardNumberDisabled = ref('1234 **** **** 5678');
    const cardNumberError = ref('1234');

    const cvv = ref('');
    const cvvDisabled = ref('');
    const cvvFilled = ref('123');

    const cardDate = ref('');
    const cardDateDisabled = ref('12/28');
    const cardDateError = ref('01/20');
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
