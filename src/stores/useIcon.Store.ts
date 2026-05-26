import { watchDebounced, apiGetRoute, cloneDeep, uniq, size } from '@maxvue/max-use';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';

export const useIconStore = defineStore('icons', () => {
    const icons_data: Ref = ref({});

    const list_icons_waiting_request: Ref = computed(() => Object.keys(icons_data.value ?? {}).filter((icon_name: string) => icons_data.value[icon_name] === 'waiting'));

    const getIcon = (icon_name: string) => {
        icon_name = icon_name.trim();
        if (size(icons_data.value) === 0) getInCache();
        if (icons_data.value[icon_name]) return icons_data.value[icon_name] !== 'waiting' ? icons_data.value[icon_name] : null;
        icons_data.value[icon_name] = 'waiting';
        return null;
    };

    const getInCache = () => {
        const data = localStorage.getItem('all_icons');
        if (data) icons_data.value = JSON.parse(data);
        list_icons_waiting_request.value++;
    };

    watchDebounced(list_icons_waiting_request, () => {
        if (size(list_icons_waiting_request.value) > 0) {
            apiGetRoute('icons', { icons: list_icons_waiting_request.value }).then((data) => {
                list_icons_waiting_request.value.forEach((icon: any) => {
                    const icon_not_found = '<svg xmlns="http://www.w3.org/2000/svg" width="70px" height="70px" viewBox="0 0 16 16"><path fill="currentColor" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-6.5a6.5 6.5 0 1 0 0 13a6.5 6.5 0 0 0 0-13M6.92 6.085h.001a.749.749 0 1 1-1.342-.67c.169-.339.436-.701.849-.977C6.845 4.16 7.369 4 8 4a2.76 2.76 0 0 1 1.637.525c.503.377.863.965.863 1.725c0 .448-.115.83-.329 1.15c-.205.307-.47.513-.692.662c-.109.072-.22.138-.313.195l-.006.004a6 6 0 0 0-.26.16a1 1 0 0 0-.276.245a.75.75 0 0 1-1.248-.832c.184-.264.42-.489.692-.661q.154-.1.313-.195l.007-.004c.1-.061.182-.11.258-.161a1 1 0 0 0 .277-.245C8.96 6.514 9 6.427 9 6.25a.61.61 0 0 0-.262-.525A1.27 1.27 0 0 0 8 5.5c-.369 0-.595.09-.74.187a1 1 0 0 0-.34.398M9 11a1 1 0 1 1-2 0a1 1 0 0 1 2 0"/></svg>';
                    icons_data.value[icon] = data && data[icon] ? data[icon] : icon_not_found;
                });
            });
            saveCache();
        }
    },{ debounce: 50, maxWait: 150, deep: true });

    const saveCache = () => localStorage.setItem('all_icons', JSON.stringify(icons_data.value));

    return { getIcon, list_icons_waiting_request, icons_data };
});