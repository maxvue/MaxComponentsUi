<template>
    <div class="playground-shell" :class="{ dark: isDark }">
        <header class="playground-shell__header">
            <div class="header-title-group">
                <h1>
                    <span>MaxComponentsUi</span>
                    <span class="header-badge">Design System</span>
                </h1>
                <p>Matriz canônica de componentes, estados e acessibilidade (WCAG 2.1 AA)</p>
            </div>
        </header>

        <main class="playground-shell__body">
            <PlaygroundToolbar
                v-model:active-viewport="activeViewport"
                v-model:selected-family="selectedFamily"
                v-model:search-query="searchQuery"
                v-model:is-dark="isDark"
            />

            <div :class="['playground-shell__viewport-container', `playground-shell__viewport-container--${activeViewport}`]">
                <section
                    v-for="family in visibleFamilies"
                    :key="family.id"
                    class="family-section"
                    :data-family="family.id"
                >
                    <h2 class="family-heading">{{ family.label }}</h2>
                    <p class="family-desc">{{ family.description }}</p>

                    <div class="family-scenarios-grid">
                        <ScenarioCard
                            v-for="item in getFilteredScenariosForFamily(family.id)"
                            :key="item.scenarioId"
                            :title="item.name"
                            :family="item.family"
                            :description="item.description"
                            :is-alias="item.isAlias"
                            :alias-of="item.aliasOf"
                        >
                            <component
                                :is="getScenarioComponent(item.scenarioId)"
                                v-if="getScenarioComponent(item.scenarioId)"
                            />
                            <div v-else class="scenario-placeholder">
                                Carregando cenário {{ item.scenarioId }}...
                            </div>
                        </ScenarioCard>
                    </div>
                </section>

                <div v-if="visibleFamilies.length === 0" class="empty-results">
                    <p>Nenhum componente ou família encontrado para a busca "{{ searchQuery }}".</p>
                </div>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, watch, onMounted, defineAsyncComponent, type Component } from 'vue';
    import PlaygroundToolbar from './components/PlaygroundToolbar.vue';
    import ScenarioCard from './components/ScenarioCard.vue';
    import { FAMILIES, PLAYGROUND_CATALOG, type ComponentFamily, type CatalogComponent } from './catalog';
    import { SCENARIO_LOADERS } from './scenarios';

    // Estados de controle da vitrine
    const activeViewport = ref<string>('desktop');
    const selectedFamily = ref<string>('all');
    const searchQuery = ref<string>('');
    const isDark = ref<boolean>(false);

    // Mapa reativo/estável de componentes de cenários carregados assincronamente via SCENARIO_LOADERS
    const scenarioComponentCache = new Map<string, Component>();

    function getScenarioComponent(scenarioId: string): Component | null {
        if (scenarioComponentCache.has(scenarioId)) return scenarioComponentCache.get(scenarioId)!;


        const loader = SCENARIO_LOADERS[scenarioId];
        if (!loader) return null;


        const asyncComp = defineAsyncComponent({
            loader,
            loadingComponent: undefined,
            delay: 50,
            timeout: 10000
        });

        scenarioComponentCache.set(scenarioId, asyncComp);
        return asyncComp;
    }

    // Filtragem de componentes por busca
    function getFilteredComponentsForFamily(familyId: ComponentFamily): CatalogComponent[] {
        let items = PLAYGROUND_CATALOG.filter((c) => c.family === familyId);
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.trim().toLowerCase();
            items = items.filter((c) =>
                c.name.toLowerCase().includes(q)
                || c.description.toLowerCase().includes(q)
                || c.scenarioId.toLowerCase().includes(q)
            );
        }
        return items;
    }

    /**
     * Um arquivo de cenário demonstra uma família de componentes correlatos.
     * Montá-lo uma vez por entrada do catálogo criava várias instâncias do
     * mesmo estado (e repetia side effects); cada cenário deve ter um mount
     * independente e representativo.
     */
    function getFilteredScenariosForFamily(familyId: ComponentFamily): CatalogComponent[] {
        const scenarios = new Map<string, CatalogComponent>();
        for (const item of getFilteredComponentsForFamily(familyId)) if (!scenarios.has(item.scenarioId)) scenarios.set(item.scenarioId, item);

        return [...scenarios.values()];
    }

    // Famílias visíveis de acordo com filtro selecionado e busca
    const visibleFamilies = computed(() => {
        let list = FAMILIES;
        if (selectedFamily.value !== 'all') list = list.filter((f) => f.id === selectedFamily.value);

        if (searchQuery.value.trim()) list = list.filter((f) => getFilteredComponentsForFamily(f.id).length > 0);

        return list;
    });

    // Inicialização a partir dos parâmetros de URL
    onMounted(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('theme') === 'dark') isDark.value = true;
        if (params.get('width')) activeViewport.value = params.get('width') || 'desktop';
        if (params.get('family')) selectedFamily.value = params.get('family') || 'all';
        if (params.get('q')) searchQuery.value = params.get('q') || '';

        updateDarkClass(isDark.value);
    });

    function updateDarkClass(dark: boolean): void {
        document.documentElement.classList.toggle('dark', dark);
        if (dark) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
    }

    watch(isDark, (dark) => {
        updateDarkClass(dark);
        syncUrlParams();
    });

    watch([activeViewport, selectedFamily, searchQuery], () => {
        syncUrlParams();
    });

    function syncUrlParams(): void {
        const params = new URLSearchParams();
        if (isDark.value) params.set('theme', 'dark');
        if (activeViewport.value !== 'desktop') params.set('width', activeViewport.value);
        if (selectedFamily.value !== 'all') params.set('family', selectedFamily.value);
        if (searchQuery.value) params.set('q', searchQuery.value);

        const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState(null, '', newSearch);
    }
</script>

<style lang="scss" scoped>
    .playground-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;

        &__header {
            .header-badge {
                font-size: 0.75rem;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                background-color: var(--max-primary-500, #00768e);
                color: #fff;
                font-weight: 600;
            }
        }

        .family-section {
            margin-bottom: 2.5rem;

            .family-heading {
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--max-primary-500, #00768e);
                margin: 0 0 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid var(--background-200, #e2e8f0);

                .dark & {
                    color: var(--max-primary-400, #178da5);
                    border-bottom-color: var(--background-700, #27272a);
                }
            }

            .family-desc {
                margin: -0.5rem 0 1.25rem;
                font-size: 0.9rem;
                color: var(--max-content-secondary, #64748b);

                .dark & {
                    color: var(--background-300, #d4d4d8);
                }
            }

            .family-scenarios-grid {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
            }
        }

        .empty-results {
            padding: 3rem;
            text-align: center;
            color: var(--max-content-secondary, #64748b);
            font-size: 1.1rem;
        }

        .scenario-placeholder {
            padding: 1.5rem;
            text-align: center;
            color: var(--max-content-secondary, #64748b);
            font-style: italic;
        }

        .demo-stack {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .demo-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .demo-actions-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
        }

        .code-container {
            height: 220px;
            width: 100%;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid var(--background-300, #cbd5e1);
        }

        .modal-body-demo {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;

            .modal-actions {
                display: flex;
                justify-content: flex-end;
            }
        }

        .drawer-body-demo {
            padding: 1.5rem;
        }

        .dividers-container {
            height: 160px;
            border: 1px solid var(--background-200, #e2e8f0);
            border-radius: 8px;
            overflow: hidden;
        }

        .divider-pane {
            padding: 1rem;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .image-preview-box {
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--background-200, #e2e8f0);
        }

        .credit-card-box {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            cursor: pointer;

            .tip-label {
                font-size: 0.75rem;
                color: var(--max-content-secondary, #64748b);
            }
        }

        .loaders-box {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: var(--background-100, #f1f5f9);
            border-radius: 8px;

            .dark & {
                background-color: var(--background-800, #27272a);
            }
        }

        .tab-text,
        .accordion-text {
            margin: 0;
            padding: 0.75rem 0;
            font-size: 0.9rem;
            color: var(--background-700, #334155);

            .dark & {
                color: var(--background-200, #e2e8f0);
            }
        }
    }
</style>
