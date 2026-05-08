import { watchDebounced, apiGetRoute, cloneDeep, uniq } from '@maxvue/max-use';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, shallowRef } from 'vue';

export const useIconStore = defineStore('icons', () => {
    const privateData: Ref = shallowRef({});

    const icons_to_request: Ref = ref([]);

    watchDebounced(
        icons_to_request,
        () => {
            if (icons_to_request.value.length > 0) {
                const icons_in_request = uniq(cloneDeep(icons_to_request.value));
                icons_to_request.value = [];

                apiGetRoute('icons', { icons: icons_in_request }).then((data) => {
                    const newData = { ...privateData.value };
                    icons_in_request.forEach((icon: any) => {
                        if (data && data[icon]) newData[icon] = data[icon];
                        else newData[icon] = false;

                    });
                    privateData.value = cloneDeep(newData);
                    countRequestsAttempts.value++;
                    icons_updated.value++;
                }).catch(() => {
                    // Em caso de erro, apenas incrementa para destravar
                    icons_updated.value++;
                });
            }
        },
        { debounce: 50, maxWait: 150, deep: true }
    );

    const icons_updated = ref(0);
    const getInCache = () => {
        const data = localStorage.getItem('all_icons');
        if (data) privateData.value = JSON.parse(data);

        icons_updated.value++;
    };

    const getIcon = (icon_name: string) => {
        icon_name = icon_name.trim();
        if (icons_updated.value === 0) {
            getInCache();
            return null;
        }

        if (icon_name.length <= 2) return null;


        if (privateData.value[icon_name]) return privateData.value[icon_name];


        if (!icons_to_request.value.includes(icon_name)) icons_to_request.value.push(icon_name);

        return null;
    };

    const countRequestsAttempts: Ref = ref(0);
    watchDebounced(
        () => [countRequestsAttempts.value],
        () => {
            saveCache();
        },
        { debounce: 1000 }
    );

    const saveCache = () => {
        localStorage.setItem('all_icons', JSON.stringify(privateData.value));
    };

    return { getIcon, icons_updated, countRequestsAttempts, icons_to_request, privateData };
});