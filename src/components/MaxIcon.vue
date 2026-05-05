<template>
    <div class="max-icon-div" v-html="iconData" :style="{ width: size, height: size }"></div>
</template>

/**
 * Componente de ícone padronizado.
 * Busca ícones do ecossistema Iconify e os exibe como SVG.
 * Possui sistema de cache local para performance.
 */
<script setup lang="ts">
    import { getCached } from '../helpers/getCached';
    import { setCached } from '../helpers/setCached';

    const props = defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Largura específica */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
    }>();

    const iconName = computed(() => props.icon || props.i || '');

    const iconData = ref('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="18" d="M12 3c4.97 0 9 4.03 9 9"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="18;0"/><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path><path stroke-dasharray="60" d="M12 3c4.97 0 9 4.03 9 9c0 4.97 -4.03 9 -9 9c-4.97 0 -9 -4.03 -9 -9c0 -4.97 4.03 -9 9 -9Z" opacity="0.3"><animate fill="freeze" attributeName="stroke-dashoffset" dur="1.2s" values="60;0"/></path></g></svg>');

    const size = computed(() => {
        const props_wh = props.width ?? props.height ?? null;
        const props_size = props.size ?? props.scale ?? null;
        const size_prop = props_wh ?? props_size;

        if (!size_prop) return '16px';


        if (typeof props_size === 'number') return `${16 * props_size}px`;
        if (typeof size_prop === 'number') return `${size_prop}px`;
        return /^[0-9.]+$/.test(size_prop) ? `${size_prop}px` : size_prop;
    });

    const alias: Record<string, string> = { 'arrow':'majesticons:arrow-up-line','arrows':'material-symbols:compare-arrows-rounded','audio':'tdesign:sound-filled','sound':'tdesign:sound-filled','bell':'mdi-light:bell','binocul':'fa6-solid:binoculars','chat-check':'garden:check-sm-fill-16','chat-check-double':'garden:check-double-fill-16','check-double':'garden:check-double-fill-16','double-check':'garden:check-double-fill-16','check-two':'garden:check-double-fill-16','two-check':'garden:check-double-fill-16','check-circle':'material-symbols:check-circle-outline-rounded','done':'material-symbols:check-circle-outline-rounded','circle-check':'material-symbols:check-circle-outline-rounded','check-circle-fill':'material-symbols:check-circle-rounded','check-fill':'material-symbols:check-circle-rounded','chevron-right':'ic:round-chevron-right','right-chevron':'ic:round-chevron-right','chev-right':'ic:round-chevron-right','right-chev':'ic:round-chevron-right','circle-plus':'akar-icons:circle-plus','plus-circle':'akar-icons:circle-plus','circle plus':'akar-icons:circle-plus','plus circle':'akar-icons:circle-plus','contact':'hugeicons:contact-01','copy':'mingcute:copy-line','created':'custom:created','dashboard':'bi:grid-1x2-fill','denied':'mdi:denied','proibido':'mdi:denied','doc-sign':'bitcoin-icons:sign-filled','procuracao':'bitcoin-icons:sign-filled','power-attorney':'bitcoin-icons:sign-filled','dollar-circle':'iconoir:dollar-circle','circle-dollar':'iconoir:dollar-circle','dots-horizontal':'tabler:dots-filled','horizontal-dots':'tabler:dots-filled','other':'tabler:dots-filled','dots-y':'mage:dots','dots-v':'mage:dots','y-dots':'mage:dots','download':'material-symbols:download-rounded','downloading':'line-md:downloading-loop','emojis':'fluent:emoji-24-regular','emoji':'fluent:emoji-24-regular','exclamation':'humbleicons:exclamation','caution':'humbleicons:exclamation','exclamation-circle':'stash:exclamation-circle','circle-exclamation':'stash:exclamation-circle','error':'stash:exclamation-circle','icon-fail':'stash:exclamation-circle','file-arrow':'prime:file-arrow-up','arrow-file':'prime:file-arrow-up','document-arrow':'prime:file-arrow-up','arrow-document':'prime:file-arrow-up','folder-arrow':'fluent:folder-arrow-up-32-regular','arrow-folder':'fluent:folder-arrow-up-32-regular','folder-open':'material-symbols-light:folder-open','open-folder':'material-symbols-light:folder-open','hourglass':'prime:hourglass','hour-glass':'prime:hourglass','id-card':'mage:id-card-fill','user-doc':'mage:id-card-fill','doc-user':'mage:id-card-fill','identifi':'mage:id-card-fill','inmetro':'custom:inmetro','load':'material-symbols:refresh-rounded','refresh':'material-symbols:refresh-rounded','spinner':'material-symbols:refresh-rounded','reload':'material-symbols:refresh-rounded','loading':'line-md:loading-loop','lock':'material-symbols:lock-outline','message':'teenyicons:message-solid','no-message':'teenyicons:message-no-access-outline','plant':'ph:plant-light','plus':'ic:round-plus','projects':'fluent:task-list-square-20-regular','required':'fa7-solid:star-of-life','star-of-life':'fa7-solid:star-of-life','search':'ic:round-search','send':'material-symbols:send-rounded','settings':'mdi:cog','cog':'mdi:cog','siren':'ph:siren','alarm':'ph:siren','timer':'ri:timer-line','transform':'custom:transformer','trash':'tabler:trash','delete':'tabler:trash','lixeira':'tabler:trash','excluir':'tabler:trash','exclude':'tabler:trash','trello':'mdi:trello','board':'mdi:trello','upload':'bi:cloud-upload','user-plus':'lucide:user-plus','plus-user':'lucide:user-plus','users-crown':'iconoir:user-crown','integrator':'iconoir:user-crown','user-solar-company':'iconoir:user-crown','xmark':'fa7-solid:xmark','x-mark':'fa7-solid:xmark','mark-x':'fa7-solid:xmark','close':'fa7-solid:xmark' };

    const STORAGE_KEY = computed(() => alias[iconName.value] ?? 'max-icon-' + iconName.value + '-' + size.value);

    watch(
        STORAGE_KEY,
        () => {
            const data = getCached(STORAGE_KEY.value);

            if (data) {
                iconData.value = data;
                return;
            }

            const prefix = iconName.value.split(':')[0];
            const name = iconName.value.split(':')[1];

            fetch('https://api.iconify.design/' + prefix + '/' + name + '.svg?height=' + size.value, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
            })
                .then((response) => {
                    if (response.ok) response.text().then((data) => {
                        console.log(data);
                        iconData.value = data;
                        setCached(STORAGE_KEY.value, data);
                    });

                })
                .catch((error) => {
                    console.error(error);
                });
        },
        { immediate: true }
    );


</script>

<style lang="scss" scoped>
    .max-icon-div {
        display: grid;
        place-items: center;

        svg {
            min-width: 100% !important;
            min-height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
        }
    }
</style>
