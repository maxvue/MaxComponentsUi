import { watchDebounced, size } from '@maxvue/max-use';
import { defineStore } from 'pinia';
import type { Ref } from 'vue';
import { ref, computed, onScopeDispose } from 'vue';
import { sanitizeSvg } from '../helpers/sanitizeSvg';
import { getMaxAppConfig } from '../helpers/maxAppConfig';
import { ICON_CACHE_KEY } from '../helpers/maxCacheKeys';

// Chave versionada: caches gravados antes da sanitização (achado 06) não devem
// ser lidos como válidos, então trocamos a chave para forçar seu descarte.
// Definida em `maxCacheKeys` para que o registro de chaves da biblioteca e a
// store compartilhem a mesma constante.
const CACHE_KEY = ICON_CACHE_KEY;

export const useIconStore = defineStore('icons', () => {
    const icons_data: Ref = ref({});

    const list_icons_waiting_request: Ref = computed(() => Object.keys(icons_data.value ?? {}).filter((icon_name: string) => icons_data.value[icon_name] === 'waiting'));

    const isSafeIconName = (name: string): boolean => {
        if (!name || typeof name !== 'string') return false;
        if (name.includes('..') || name.includes('<') || name.includes('>')) return false;
        if (/^(?:https?|javascript|data|file|vbscript):/i.test(name)) return false;
        return /^(?:[a-z0-9_-]+:)?[a-z0-9_/-]+$/i.test(name);
    };

    const getIcon = (icon_name: string) => {
        if (!icon_name || typeof icon_name !== 'string') return null;
        icon_name = icon_name.trim();
        if (!isSafeIconName(icon_name)) return null;
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

    const fetchIconFallback = async (iconName: string): Promise<string | null> => {
        try {
            const fallbackBase = getMaxAppConfig().routeIconsFallback ?? 'https://api.iconify.design';
            const cleanBase = fallbackBase.replace(/\/$/, '');
            const url = `${cleanBase}/${encodeURIComponent(iconName)}.svg`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'image/svg+xml, application/json' }
            });
            if (!res.ok) return null;
            const svg = await res.text();
            return sanitizeSvg(svg);
        } catch {
            return null;
        }
    };

    const syncIconToBackend = async (icon: string, svg: string): Promise<void> => {
        try {
            const syncUrl = getMaxAppConfig().routeIconsSync ?? getMaxAppConfig().routeIcons ?? 'https://engeapp.com.br/api/icons';
            await fetch(syncUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ icon, svg })
            });
        } catch {
            // Falha na sincronização não interrompe o funcionamento no frontend
        }
    };

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
            }).then(async (res) => {
                if (res.ok === false) throw new Error(`HTTP ${res.status}`);

                return res.json();
            }).then(async (data) => {
                const updated_data = { ...icons_data.value };
                const missing_icons: string[] = [];

                for (const icon_name of icons_to_fetch) {
                    if (data && data[icon_name]) {
                        updated_data[icon_name] = sanitizeSvg(data[icon_name]);
                        delete errors.value[icon_name];
                        continue;
                    }
                    missing_icons.push(icon_name);
                }

                errors.value['fetch'] = 0;
                icons_data.value = updated_data;
                saveCache();

                if (missing_icons.length > 0) await Promise.all(missing_icons.map(async (icon_name) => {
                    const fallbackSvg = await fetchIconFallback(icon_name);
                    if (fallbackSvg) {
                        icons_data.value[icon_name] = fallbackSvg;
                        delete errors.value[icon_name];
                        saveCache();
                        syncIconToBackend(icon_name, fallbackSvg);
                        return;
                    }

                    errors.value[icon_name] = (errors.value[icon_name] ?? 0) + 1;
                    console.error('Erro na obtenção do ícone', icon_name);

                    if (errors.value[icon_name] >= MAX_ICON_RETRIES) icons_data.value[icon_name] = '';
                }));

            }).catch((error) => {
                console.error('Erro na Requisição dos ícones', { 'url': requestUrl, 'error': error });
                errors.value['fetch'] += 1;

                if (errors.value['fetch'] >= MAX_FETCH_RETRIES) scheduleFetchErrorReset();

                Promise.all(icons_to_fetch.map(async (icon_name) => {
                    const fallbackSvg = await fetchIconFallback(icon_name);
                    if (fallbackSvg) {
                        icons_data.value[icon_name] = fallbackSvg;
                        delete errors.value[icon_name];
                        saveCache();
                        syncIconToBackend(icon_name, fallbackSvg);
                    }
                }));
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
