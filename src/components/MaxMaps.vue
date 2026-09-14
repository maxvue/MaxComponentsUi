<template>
    <div class="max-maps map-main-div" v-if="coordinates.latitude !== 0 && coordinates.longitude !== 0">
        <div class="mapa" ref="mapDiv" v-if="effectiveApiKey">
            <GoogleMap :api-key="effectiveApiKey" class="google-map-canvas" :center="center" :zoom="zoom" ref="mapRef" :mapTypeId="props.mapTypeId" :mapId="effectiveMapId" v-if="isMounted">
                <AdvancedMarker :options="marker_options" :pin-options="pinOptions" ref="markerRef" @dragend="onDrag" />
            </GoogleMap>
        </div>
        <div class="no-map" v-else>
            <div class="content">
                <MaxIcon icon="lucide:map-pin-off" size="3" />
                <div class="t1">Mapa Indisponível</div>
                <div class="t2">A chave da API do Google Maps não foi configurada.</div>
            </div>
        </div>

        <!-- Controles acessíveis de coordenadas para teclado e tecnologias assistivas -->
        <div class="map-accessible-controls sr-only" role="region" aria-label="Controles acessíveis de coordenadas do mapa">
            <label>
                <span>Latitude:</span>
                <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    :value="coordinates.latitude"
                    aria-label="Latitude do marcador"
                    @change="onLatitudeChange"
                />
            </label>
            <label>
                <span>Longitude:</span>
                <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    :value="coordinates.longitude"
                    aria-label="Longitude do marcador"
                    @change="onLongitudeChange"
                />
            </label>
            <button type="button" aria-label="Mover marcador para o Norte" @click="stepCoordinate(0.0005, 0)">Norte</button>
            <button type="button" aria-label="Mover marcador para o Sul" @click="stepCoordinate(-0.0005, 0)">Sul</button>
            <button type="button" aria-label="Mover marcador para o Oeste" @click="stepCoordinate(0, -0.0005)">Oeste</button>
            <button type="button" aria-label="Mover marcador para o Leste" @click="stepCoordinate(0, 0.0005)">Leste</button>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { toNumber } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
    import { GoogleMap, AdvancedMarker } from 'vue3-google-map';
    import MaxIcon from './MaxIcon.vue';
    import { getMaxAppConfig } from '../helpers/maxAppConfig';

    const props = withDefaults(defineProps<{
        modelValue: { latitude: number; longitude: number } | null;
        apiKey?: string;
        mapId?: string;
        mapTypeId?: string;
    }>(), {
        modelValue: null,
        apiKey: undefined,
        mapId: undefined,
        mapTypeId: 'satellite'
    });

    const effectiveApiKey = computed(() => props.apiKey || getMaxAppConfig().googleMapsApiKey || '');
    const effectiveMapId = computed(() => props.mapId || getMaxAppConfig().googleMapsMapId || undefined);

    const coordinates = ref({ latitude: Number(props.modelValue?.latitude ?? 0), longitude: Number(props.modelValue?.longitude ?? 0) });

    const emit = defineEmits<{
        'update:modelValue': [coordinates: { latitude: number; longitude: number }];
    }>();


    watch(() => [coordinates.value.latitude, coordinates.value.longitude], () => emit('update:modelValue', coordinates.value));

    watch(
        () => [props.modelValue?.latitude, props.modelValue?.longitude],
        () => {
            const lat = Number(props.modelValue?.latitude ?? 0);
            const lng = Number(props.modelValue?.longitude ?? 0);
            const is_valid = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
            const is_different = coordinates.value.latitude !== lat || coordinates.value.longitude !== lng;

            if (is_valid && is_different) coordinates.value = { latitude: lat, longitude: lng };
        },
        { immediate: true, deep: true }
    );

    const center: Ref = ref({ lat: coordinates.value.latitude, lng: coordinates.value.longitude });
    const zoom: Ref = ref(20);
    const marker_options = ref({
        position: center.value,
        gmpDraggable: true,
        click: function (_e: any) {
        }
    });
    const pinOptions = ref({
        background: 'var(--red-650)',
        borderColor: 'var(--red-750)',
        glyphColor: 'var(--red-775)'
    });


    function onDrag(event: any) {
        coordinates.value.latitude = Number(event.latLng.lat().toFixed(7));
        coordinates.value.longitude = Number(event.latLng.lng().toFixed(7));
    }

    watch( () => [coordinates.value.latitude, coordinates.value.longitude], () => {
        center.value = { lat: toNumber(coordinates.value.latitude), lng: toNumber(coordinates.value.longitude) };
        marker_options.value = {
            position: center.value,
            gmpDraggable: true,
            click: function (_e: any) {
            }
        };
    },{ immediate: true });

    const isMounted = ref<boolean>(false);
    let is_active_mount = true;

    onMounted(async () => {
        is_active_mount = true;
        await nextTick();
        if (is_active_mount) isMounted.value = true;
    });

    const onLatitudeChange = (event: Event) => {
        const val = Number((event.target as HTMLInputElement).value);
        if (!isNaN(val) && val >= -90 && val <= 90) coordinates.value.latitude = Number(val.toFixed(7));

    };

    const onLongitudeChange = (event: Event) => {
        const val = Number((event.target as HTMLInputElement).value);
        if (!isNaN(val) && val >= -180 && val <= 180) coordinates.value.longitude = Number(val.toFixed(7));

    };

    const stepCoordinate = (deltaLat: number, deltaLng: number) => {
        const newLat = Math.min(90, Math.max(-90, coordinates.value.latitude + deltaLat));
        const newLng = Math.min(180, Math.max(-180, coordinates.value.longitude + deltaLng));
        coordinates.value = {
            latitude: Number(newLat.toFixed(7)),
            longitude: Number(newLng.toFixed(7))
        };
    };

    onBeforeUnmount(() => {
        is_active_mount = false;
    });

    defineExpose({
        coordinates,
        stepCoordinate,
        onLatitudeChange,
        onLongitudeChange
    });
</script>

<style lang="scss" scoped>
    .map-main-div {
        height: 100%;
        width: 100%;
        border: 1px dashed var(--text-c);
        grid-column: span 24 !important;
        border-radius: 1rem;
        position: relative;
        overflow: hidden;

        .mapa {
            height: 100%;
            width: 100%;

            .google-map-canvas {
                width: 100%;
                height: 100%;
            }

            .map {
                height: calc(100%);
                width: 100%;
                border-radius: 0.9rem;
                overflow: hidden;
            }
        }

        .no-map {
            height: 100%;
            width: 100%;
            display: grid;
            place-items: center;
            border: 1px dashed var(--background-600) !important;
            border-radius: 1rem;

            .content {
                text-align: center;
                font-size: 0.85rem;
                display: grid;
                gap: 1rem;

                i {
                    font-size: 3rem;
                    color: var(--background-700);
                }

                .t1 {
                    font-weight: 400;
                    color: var(--background-700);
                    font-size: 0.9rem;
                }

                .t2 {
                    font-weight: 300;
                    color: var(--background-650);
                    font-size: 0.85rem;
                }
            }
        }

        .bar_tool_map {
            position: absolute;
            top: 37px;
            left: 7px;
            background-color: var(--primary-a);
            width: 40px;
            z-index: 9;
            border-radius: 0.6rem;
            display: grid;
            grid-template-rows: 1fr 1fr 1fr;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
            border: 0;
        }
    }
</style>
