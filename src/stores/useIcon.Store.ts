import { watchDebounced, size } from '@maxvue/max-use';
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

    // Carrega os ícones do cache local sem tentar mutar o computed
    const getInCache = () => {
        const data = localStorage.getItem('all_icons');
        if (data) icons_data.value = JSON.parse(data);
    };

    const errors = ref<Record<string, number>>({
        fetch: 0
    });

    const MAX_FETCH_RETRIES = 4;

    watchDebounced(() => [list_icons_waiting_request.value, errors.value], () => {
        // Captura snapshot da lista no momento da requisição para evitar condição de corrida
        const icons_to_fetch = [...list_icons_waiting_request.value];

        if (size(icons_to_fetch) > 0 && errors.value['fetch'] < MAX_FETCH_RETRIES) {
            const params = new URLSearchParams();
            icons_to_fetch.forEach((icon) => params.append('icons[]', icon));

            fetch(`https://engeapp.com.br/icons?${params.toString()}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }).then((res) => res.json()).then((data) => {

                console.trace('Ícones requisitados com sucesso', icons_to_fetch);
                const updated_data = { ...icons_data.value };

                for (const icon_name of icons_to_fetch) {

                    if (data && data[icon_name]) {
                        updated_data[icon_name] = data[icon_name];
                        continue;
                    }

                    errors.value[icon_name] = (errors.value[icon_name] ?? 0) + 1;
                    console.error('Erro na obtenção do ícone', icon_name);

                    if (errors.value[icon_name] >= 4) updated_data[icon_name] = '';

                }

                errors.value['fetch'] = 0;

                icons_data.value = updated_data;
                saveCache();
            }).catch((error) => {
                console.error('Erro na Requisição dos ícones', error);
                errors.value['fetch'] += 1;
            });
        }

    }, { debounce: 50, maxWait: 150, deep: true });

    const saveCache = () => localStorage.setItem('all_icons', JSON.stringify(icons_data.value));

    return { getIcon, list_icons_waiting_request, icons_data };
});