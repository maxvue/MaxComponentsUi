<template>
    <div class="map-main-div" s24 v-if="coordinates.latitude && coordinates.longitude">
        <div class="mapa" ref="mapDiv">
            <GoogleMap api-key="AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY" style="width: 100%; height: 100%;" :center="center" :zoom="zoom" ref="mapRef" mapTypeId="satellite" mapId="ENGEAPP_MAP" v-if="isMounted">
                <AdvancedMarker :options="marker_options" :pin-options="pinOptions" ref="markerRef" @dragend="onDrag" />
            </GoogleMap>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { toNumber } from '@maxvue/max-use';
    import type { Ref } from 'vue';
    import { ref, watch, onMounted } from 'vue';
    import { GoogleMap, AdvancedMarker } from 'vue3-google-map';

    const props = withDefaults(defineProps<{ modelValue: { latitude: number; longitude: number } | null }>(),{ modelValue: null });

    const coordinates = ref({ latitude: Number(props.modelValue?.latitude ?? 0),longitude: Number(props.modelValue?.longitude ?? 0) });

    const emit = defineEmits(['update:modelValue']);

    watch(() => [coordinates.value.latitude, coordinates.value.longitude], () => emit('update:modelValue', coordinates.value));

    watch(() => props.modelValue,() => {
        const is_valid = props.modelValue?.latitude && props.modelValue?.longitude;
        const is_different = coordinates.value.latitude !== Number(props.modelValue?.latitude) || coordinates.value.longitude !== Number(props.modelValue?.longitude);

        if (is_valid && is_different) coordinates.value = { latitude: Number(props.modelValue?.latitude), longitude: Number(props.modelValue?.longitude) };
    });

    const center: Ref = ref({ lat: coordinates.value.latitude, lng: coordinates.value.longitude });
    const zoom: Ref = ref(20);
    const marker_options = ref({
        position: center.value,
        gmpDraggable: true,
        click: function (e: any) {
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
            click: function (e: any) {
            }
        };
    },{ immediate: true });

    const isMounted = ref<boolean>(false);
    onMounted(() => {
        setTimeout(() => {
            isMounted.value = true;
        }, 50);
    });
</script>

<style lang="scss">
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
                    color: var(--text-c);
                }

                .t1 {
                    font-weight: 400;
                    color: var(--text-c);
                    font-size: 0.9rem;
                }

                .t2 {
                    font-weight: 300;
                    color: var(--text-d);
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
    }
</style>
