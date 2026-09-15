<template>
    <div class="scenario-content" data-scenario="inputs-coords">
        <h2>Cenário inputs-coords</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputCoordinateDecimalLat</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCoordinateDecimalLat v-model="lat" label="Latitude" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCoordinateDecimalLat v-model="latDisabled" label="Latitude" disabled />
                        </div>
                        <!-- Com erro -->
                        <div class="state-col">
                            <span>Com erro</span>
                            <MaxInputCoordinateDecimalLat v-model="latError" label="Latitude" :error="'Latitude inválida'" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCoordinateDecimalLng</h3>
                    <div class="states">
                        <!-- Normal -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCoordinateDecimalLng v-model="lng" label="Longitude" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCoordinateDecimalLng v-model="lngDisabled" label="Longitude" disabled />
                        </div>
                        <!-- Preenchido -->
                        <div class="state-col">
                            <span>Preenchido</span>
                            <MaxInputCoordinateDecimalLng v-model="lngFilled" label="Longitude" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxInputCoordinateDecimalLat, MaxInputCoordinateDecimalLng } from '@maxvue/max-components-ui';

    const lat = ref('');
    const latDisabled = ref('-23.5505');
    const latError = ref('999');

    const lng = ref('');
    const lngDisabled = ref('-46.6333');
    const lngFilled = ref('-46.6333');
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
