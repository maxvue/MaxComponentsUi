import { GoogleMap, AdvancedMarker } from 'vue3-google-map';
const coordinates = ref({ latitude: 0, longitude: 0 });
const center = ref({ lat: coordinates.value.latitude, lng: coordinates.value.longitude });
const zoom = ref(20);
const marker_options = ref({
    position: center.value,
    gmpDraggable: true,
    click: function (e) {
        console.log('click', e);
    }
});
const pinOptions = ref({
    background: 'var(--red-650)',
    borderColor: 'var(--red-750)',
    glyphColor: 'var(--red-775)'
});
function onDrag(event) {
    coordinates.value.latitude = parseFloat(event.latLng.lat().toFixed(7));
    coordinates.value.longitude = parseFloat(event.latLng.lng().toFixed(7));
}
watch(() => [coordinates.value.latitude, coordinates.value.longitude], () => {
    center.value = { lat: toNumber(coordinates.value.latitude), lng: toNumber(coordinates.value.longitude) };
    marker_options.value = {
        position: center.value,
        gmpDraggable: true,
        click: function (e) {
            console.log('click', e);
        }
    };
}, { immediate: true });
const isMounted = ref(false);
onMounted(() => {
    setTimeout(() => {
        isMounted.value = true;
    }, 50);
});
const __VLS_ctx = {
    ...{},
    ...{},
};
let __VLS_components;
let __VLS_intrinsics;
let __VLS_directives;
if (__VLS_ctx.coordinates.latitude && __VLS_ctx.coordinates.longitude) {
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "map-main-div" },
        s24: true,
    });
    /** @type {__VLS_StyleScopedClasses['map-main-div']} */ ;
    __VLS_asFunctionalElement1(__VLS_intrinsics.div, __VLS_intrinsics.div)({
        ...{ class: "mapa" },
        ref: "mapDiv",
    });
    /** @type {__VLS_StyleScopedClasses['mapa']} */ ;
    if (__VLS_ctx.isMounted) {
        let __VLS_0;
        /** @ts-ignore @type { | typeof __VLS_components.GoogleMap | typeof __VLS_components.GoogleMap} */
        GoogleMap;
        // @ts-ignore
        const __VLS_1 = __VLS_asFunctionalComponent1(__VLS_0, new __VLS_0({
            apiKey: "AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY",
            ...{ style: {} },
            center: (__VLS_ctx.center),
            zoom: (__VLS_ctx.zoom),
            ref: "mapRef",
            mapTypeId: "satellite",
            mapId: "ENGEAPP_MAP",
        }));
        const __VLS_2 = __VLS_1({
            apiKey: "AIzaSyCIrTVDHOyXkRnkxVOK8xSdcVyp1NkrZeY",
            ...{ style: {} },
            center: (__VLS_ctx.center),
            zoom: (__VLS_ctx.zoom),
            ref: "mapRef",
            mapTypeId: "satellite",
            mapId: "ENGEAPP_MAP",
        }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        var __VLS_5 = {};
        const { default: __VLS_7 } = __VLS_3.slots;
        let __VLS_8;
        /** @ts-ignore @type { | typeof __VLS_components.AdvancedMarker} */
        AdvancedMarker;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent1(__VLS_8, new __VLS_8({
            ...{ 'onDragend': {} },
            options: (__VLS_ctx.marker_options),
            pinOptions: (__VLS_ctx.pinOptions),
            ref: "markerRef",
        }));
        const __VLS_10 = __VLS_9({
            ...{ 'onDragend': {} },
            options: (__VLS_ctx.marker_options),
            pinOptions: (__VLS_ctx.pinOptions),
            ref: "markerRef",
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        let __VLS_13;
        const __VLS_14 = ({ dragend: {} },
            { onDragend: (__VLS_ctx.onDrag) });
        var __VLS_15 = {};
        var __VLS_11;
        var __VLS_12;
        // @ts-ignore
        [coordinates, coordinates, isMounted, center, zoom, marker_options, pinOptions, onDrag,];
        var __VLS_3;
    }
}
// @ts-ignore
var __VLS_6 = __VLS_5, __VLS_16 = __VLS_15;
// @ts-ignore
[];
const __VLS_export = (await import('vue')).defineComponent({});
export default {};
