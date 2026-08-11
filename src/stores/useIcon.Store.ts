import { watchDebounced, size } from '@maxvue/max-use';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, onScopeDispose } from 'vue';
import { sanitizeSvg } from '../helpers/sanitizeSvg';
import { getMaxAppConfig } from '../helpers/maxAppConfig';

// Chave versionada: caches gravados antes da sanitização (achado 06) não devem
// ser lidos como válidos, então trocamos a chave para forçar seu descarte.
const CACHE_KEY = 'all_icons_v2';

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
        const data = localStorage.getItem(CACHE_KEY);
        if (!data) return;

        try {
            const parsed = JSON.parse(data);

            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
                localStorage.removeItem(CACHE_KEY);
                return;
            }

            // O cache é gravável por qualquer script do mesmo origin, então ele é
            // tratado como fonte não confiável: cada SVG é re-sanitizado na leitura.
            // O sentinela 'waiting' e valores vazios não são markup e passam direto
            // (sanitizá-los devolveria '' e apagaria o estado de "buscando").
            const sanitized: Record<string, string> = {};

            for (const [icon_name, value] of Object.entries(parsed)) {
                if (typeof value !== 'string') continue;
                sanitized[icon_name] = (value === 'waiting' || value === '') ? value : sanitizeSvg(value);
            }

            icons_data.value = sanitized;
        } catch {
            // Storage corrompido: descarta e segue com cache vazio, sem propagar o erro
            localStorage.removeItem(CACHE_KEY);
        }
    };

    const errors = ref<Record<string, number>>({
        fetch: 0
    });

    const MAX_FETCH_RETRIES = 4;
    const MAX_ICON_RETRIES = 4;
    const FETCH_RETRY_RESET_DELAY = 30000;

    let fetchResetTimer: ReturnType<typeof setTimeout> | null = null;

    // Agenda o reset do contador de falhas de fetch após um intervalo, evitando
    // que uma queda momentânea de rede trave novos ícones pelo resto da sessão.
    const scheduleFetchErrorReset = () => {
        if (fetchResetTimer !== null) return;
        fetchResetTimer = setTimeout(() => {
            fetchResetTimer = null;
            errors.value['fetch'] = 0;
        }, FETCH_RETRY_RESET_DELAY);
    };

    onScopeDispose(() => {
        if (fetchResetTimer !== null) {
            clearTimeout(fetchResetTimer);
            fetchResetTimer = null;
        }
    });

    watchDebounced(() => [list_icons_waiting_request.value, errors.value], () => {
        // Captura snapshot da lista no momento da requisição para evitar condição de corrida
        const icons_to_fetch = [...list_icons_waiting_request.value];

        if (size(icons_to_fetch) > 0 && errors.value['fetch'] < MAX_FETCH_RETRIES) {
            const params = new URLSearchParams();
            icons_to_fetch.forEach((icon) => params.append('icons[]', icon));

            const baseUrl = getMaxAppConfig().routeIcons ?? 'https://engeapp.com.br/api/icons';
            const requestUrl = `${baseUrl}?${params.toString()}`;

            fetch(requestUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            }).then((res) => {
                if (res.ok === false) throw new Error(`HTTP ${res.status}`);

                return res.json();
            }).then((data) => {

                const updated_data = { ...icons_data.value };

                for (const icon_name of icons_to_fetch) {

                    if (data && data[icon_name]) {
                        updated_data[icon_name] = sanitizeSvg(data[icon_name]);
                        continue;
                    }

                    errors.value[icon_name] = (errors.value[icon_name] ?? 0) + 1;
                    console.error('Erro na obtenção do ícone', icon_name);

                    if (errors.value[icon_name] >= MAX_ICON_RETRIES) updated_data[icon_name] = '';

                }

                errors.value['fetch'] = 0;

                icons_data.value = updated_data;
                saveCache();
            }).catch((error) => {
                console.error('Erro na Requisição dos ícones', { 'url': requestUrl, 'error': error });
                errors.value['fetch'] += 1;

                if (errors.value['fetch'] >= MAX_FETCH_RETRIES) scheduleFetchErrorReset();
            });
        }

    }, { debounce: 50, maxWait: 150, deep: true });

    const saveCache = () => {
        const cache_data: Record<string, string> = {};
        for (const [key, value] of Object.entries(icons_data.value)) if (value && value !== 'waiting') cache_data[key] = value as string;


        localStorage.setItem(CACHE_KEY, JSON.stringify(cache_data));
    };

    return { getIcon, list_icons_waiting_request, icons_data, saveCache };
});
