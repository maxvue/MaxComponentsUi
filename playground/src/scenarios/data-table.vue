<template>
    <div class="scenario-content" data-scenario="data-table">
        <h2>Cenário data-table</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxTable</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTable />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxTable disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxTable error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTableFields</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTableFields />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxTableFields disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxTableFields error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTimeline</h3>
                    <div class="states">
                        <div class="state-col">
                            <span>Center (Padrão)</span>
                            <MaxTimeline :value="timelineEvents">
                                <template #opposite="{ item }">
                                    <small>{{ item.date }}</small>
                                </template>
                                <template #content="{ item }">
                                    <span>{{ item.status }}</span>
                                </template>
                            </MaxTimeline>
                        </div>
                        <div class="state-col">
                            <span>Icon Left (Ícone à Esquerda)</span>
                            <MaxTimeline
                                :value="timelineEvents"
                                icon-position="left"
                            >
                                <template #opposite="{ item }">
                                    <small>{{ item.date }}</small>
                                </template>
                                <template #content="{ item }">
                                    <span>{{ item.status }}</span>
                                </template>
                            </MaxTimeline>
                        </div>
                        <div class="state-col">
                            <span>Icon Right (Ícone à Direita)</span>
                            <MaxTimeline
                                :value="timelineEvents"
                                icon-position="right"
                            >
                                <template #opposite="{ item }">
                                    <small>{{ item.date }}</small>
                                </template>
                                <template #content="{ item }">
                                    <span>{{ item.status }}</span>
                                </template>
                            </MaxTimeline>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxTable } from '@maxvue/max-components-ui';
    import { MaxTableFields } from '@maxvue/max-components-ui';
    import { MaxTimeline } from '@maxvue/max-components-ui';

    const timelineEvents = ref([
        { status: 'Criado', date: '10:00', severity: 'info' },
        { status: 'Processando', date: '10:30', severity: 'warning' },
        { status: 'Concluído', date: '11:00', severity: 'success' }
    ]);
</script>

<style lang="scss" scoped>
    .scenario-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }
    .variants {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }
    .component-block {
        border: 1px solid var(--layout-border, #ccc);
        padding: 1rem;
        border-radius: 8px;
    }
    .states {
        display: flex;
        flex-wrap: wrap;
        gap: 2rem;
        margin-top: 1rem;
    }
    .state-col {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        span {
            font-size: 0.8rem;
            color: #666;
        }
    }
</style>
