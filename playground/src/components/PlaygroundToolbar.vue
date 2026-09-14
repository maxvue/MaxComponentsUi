<template>
    <div class="playground-toolbar">
        <div class="playground-toolbar__row">
            <div class="filter-group">
                <label for="family-filter" class="filter-label">Família:</label>
                <select
                    id="family-filter"
                    :value="selectedFamily"
                    class="filter-select"
                    @change="onFamilyChange"
                >
                    <option value="all">Todas as famílias (113)</option>
                    <option
                        v-for="family in families"
                        :key="family.id"
                        :value="family.id"
                    >
                        {{ family.label }} ({{ getFamilyCount(family.id) }})
                    </option>
                </select>
            </div>

            <div class="search-group">
                <input
                    :value="searchQuery"
                    type="text"
                    placeholder="Filtrar por nome do componente..."
                    class="search-input"
                    @input="onSearchInput"
                />
            </div>

            <div class="viewport-group">
                <span class="viewport-label">Largura:</span>
                <div class="viewport-buttons" role="group" aria-label="Largura de tela">
                    <button
                        v-for="vp in viewports"
                        :key="vp.id"
                        type="button"
                        :class="['viewport-btn', { 'is-active': activeViewport === vp.id }]"
                        :title="vp.label"
                        @click="setViewport(vp.id)"
                    >
                        {{ vp.shortLabel }}
                    </button>
                </div>
            </div>

            <div class="theme-group">
                <button
                    type="button"
                    class="theme-btn"
                    :title="isDark ? 'Alternar para tema Claro' : 'Alternar para tema Escuro'"
                    @click="toggleDark"
                >
                    <span v-if="isDark" class="theme-icon">☀️ Claro</span>
                    <span v-else class="theme-icon">🌙 Escuro</span>
                </button>
            </div>

            <div class="stats-badge" title="Cobertura total do manifesto de componentes">
                {{ stats.canonical }}+{{ stats.aliases }} / {{ stats.total }} ({{ stats.coveragePercentage }}%)
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { FAMILIES, PLAYGROUND_CATALOG, getCoverageStats, type ComponentFamily } from '../catalog';

    const props = defineProps<{
        activeViewport: string;
        selectedFamily: string;
        searchQuery: string;
        isDark: boolean;
    }>();

    const emit = defineEmits<{
        'update:activeViewport': [value: string];
        'update:selectedFamily': [value: string];
        'update:searchQuery': [value: string];
        'update:isDark': [value: boolean];
    }>();

    const families = FAMILIES;
    const stats = computed(() => getCoverageStats());

    const viewports = [
        { id: 'desktop', label: 'Desktop (1400px)', shortLabel: 'Desktop' },
        { id: 'tablet', label: 'Tablet (768px)', shortLabel: '768px' },
        { id: 'mobile', label: 'Mobile (320px)', shortLabel: '320px' },
        { id: 'narrow', label: 'Estreito (240px)', shortLabel: '240px' }
    ];

    function getFamilyCount(familyId: ComponentFamily): number {
        return PLAYGROUND_CATALOG.filter((c) => c.family === familyId).length;
    }

    function onFamilyChange(event: Event): void {
        const target = event.target as HTMLSelectElement;
        emit('update:selectedFamily', target.value);
    }

    function onSearchInput(event: Event): void {
        const target = event.target as HTMLInputElement;
        emit('update:searchQuery', target.value);
    }

    function setViewport(id: string): void {
        emit('update:activeViewport', id);
    }

    function toggleDark(): void {
        emit('update:isDark', !props.isDark);
    }
</script>

<style lang="scss" scoped>
    .playground-toolbar {
        background-color: var(--background-0, #fff);
        border: 1px solid var(--background-200, #e2e8f0);
        border-radius: 8px;
        padding: 0.75rem 1.25rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgb(0 0 0 / 5%);
        width: 100%;
        box-sizing: border-box;

        .dark & {
            background-color: var(--background-850, #18181b);
            border-color: var(--background-700, #27272a);
        }

        &__row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .filter-group,
        .viewport-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .filter-label,
        .viewport-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--background-700, #334155);

            .dark & {
                color: var(--background-200, #e2e8f0);
            }
        }

        .filter-select {
            padding: 0.35rem 0.65rem;
            border-radius: 6px;
            border: 1px solid var(--background-300, #cbd5e1);
            background-color: var(--background-0, #fff);
            color: var(--background-800, #0f172a);
            font-size: 0.85rem;
            font-family: inherit;
            outline: none;

            &:focus-visible {
                outline: 2px solid var(--max-primary-500, #00768e);
                outline-offset: 1px;
            }

            .dark & {
                background-color: var(--background-800, #27272a);
                border-color: var(--background-600, #52525b);
                color: var(--background-50, #f8fafc);
            }
        }

        .search-group {
            flex: 1;
            min-width: 200px;
        }

        .search-input {
            width: 100%;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            border: 1px solid var(--background-300, #cbd5e1);
            background-color: var(--background-0, #fff);
            color: var(--background-800, #0f172a);
            font-size: 0.85rem;
            font-family: inherit;
            box-sizing: border-box;
            outline: none;

            &:focus-visible {
                outline: 2px solid var(--max-primary-500, #00768e);
                outline-offset: 1px;
            }

            &::placeholder {
                color: var(--max-content-placeholder, #94a3b8);
            }

            .dark & {
                background-color: var(--background-800, #27272a);
                border-color: var(--background-600, #52525b);
                color: var(--background-50, #f8fafc);
            }
        }

        .viewport-buttons {
            display: flex;
            border: 1px solid var(--background-300, #cbd5e1);
            border-radius: 6px;
            overflow: hidden;

            .dark & {
                border-color: var(--background-600, #52525b);
            }
        }

        .viewport-btn {
            background: transparent;
            border: none;
            padding: 0.35rem 0.65rem;
            font-size: 0.8rem;
            font-weight: 500;
            color: var(--background-700, #334155);
            cursor: pointer;
            transition: background-color 0.15s ease, color 0.15s ease;

            &:not(:last-child) {
                border-right: 1px solid var(--background-300, #cbd5e1);

                .dark & {
                    border-right-color: var(--background-600, #52525b);
                }
            }

            &:hover {
                background-color: var(--background-100, #f1f5f9);
            }

            &.is-active {
                background-color: var(--max-primary-500, #00768e);
                color: #fff;
            }

            .dark & {
                color: var(--background-200, #e2e8f0);

                &:hover {
                    background-color: var(--background-700, #3f3f46);
                }

                &.is-active {
                    background-color: var(--max-primary-500, #00768e);
                    color: #fff;
                }
            }
        }

        .theme-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.35rem 0.75rem;
            border-radius: 6px;
            border: 1px solid var(--background-300, #cbd5e1);
            background-color: var(--background-0, #fff);
            color: var(--background-700, #334155);
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.15s ease;

            &:hover {
                background-color: var(--background-100, #f1f5f9);
            }

            .dark & {
                background-color: var(--background-800, #27272a);
                border-color: var(--background-600, #52525b);
                color: var(--background-100, #f1f5f9);

                &:hover {
                    background-color: var(--background-700, #3f3f46);
                }
            }
        }

        .stats-badge {
            margin-left: auto;
            font-size: 0.8rem;
            font-weight: 700;
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
            background-color: var(--background-100, #f1f5f9);
            color: var(--max-primary-500, #00768e);
            border: 1px solid var(--background-200, #e2e8f0);

            .dark & {
                background-color: var(--background-800, #27272a);
                border-color: var(--background-700, #3f3f46);
                color: var(--max-primary-400, #178da5);
            }
        }
    }
</style>
