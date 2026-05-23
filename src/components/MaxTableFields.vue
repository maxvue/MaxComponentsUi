<template>
    <div class="max-new-table-wrapper" :id="tableId">
        <table class="max-new-table">
            <!-- Cabeçalho -->
            <thead class="max-new-table-head">
                <tr class="max-new-table-head-row">
                    <th v-for="col in columns" :key="col.field" class="max-new-table-th" :style="getColumnStyle(col)" >
                        <slot :name="`header-${col.field}`" :column="col">
                            {{ col.header }}
                        </slot>
                    </th>
                    <!-- Coluna extra para botões de ação -->
                    <th v-if="hasButtons" class="max-new-table-th max-new-table-th-buttons" :style="buttonsWidth ? `width: ${buttonsWidth}; max-width: ${buttonsWidth};` : undefined" >
                        <slot name="buttons-header">
                            <!-- Vazio por padrão -->
                        </slot>
                    </th>
                </tr>
            </thead>

            <!-- Corpo -->
            <tbody class="max-new-table-body">
                <template v-if="normalizedList.length > 0">
                    <tr v-for="(row, index) in normalizedList" :key="index" class="max-new-table-row" :class="{ 'max-new-table-row-even': index % 2 === 0, 'max-new-table-row-odd': index % 2 !== 0 }" >
                        <td v-for="col in columns" :key="col.field" class="max-new-table-td" :style="getColumnStyle(col)" >

                            <slot
                                v-if="col.slot"
                                :name="col.slot"
                                :data="row"
                                :value="getFieldValue(row, col.field)"
                                :index="index"
                                :field="col.field"
                            >
                                {{ getFieldValue(row, col.field) }}
                            </slot>
                            <!-- Senão exibe o valor diretamente -->
                            <template v-else>
                                {{ getFieldValue(row, col.field) }}
                            </template>
                        </td>
                        <!-- Coluna de botões -->
                        <td
                            v-if="hasButtons"
                            class="max-new-table-td max-new-table-buttons"
                        >
                            <slot name="buttons" :data="row" :index="index"></slot>
                        </td>
                    </tr>
                </template>

                <!-- Estado vazio -->
                <tr v-else class="max-new-table-row max-new-table-empty">
                    <td :colspan="totalColspan" class="max-new-table-td max-new-table-empty-cell">
                        <slot name="empty">
                            {{ emptyMessage }}
                        </slot>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
    import type { MaxTableColumn } from '../types';
    import { computed, useSlots } from 'vue';
    import { ulid } from '@maxvue/max-use';

    const props = withDefaults(
        defineProps<{
            /** Lista de valores para preencher a tabela */
            list: any[] | Record<string, any>;
            /** Definição das colunas */
            columns: MaxTableColumn[];
            /** Identificador único da tabela */
            id?: string;
            /** Mensagem exibida quando a lista está vazia */
            emptyMessage?: string;
            /** Largura da coluna de botões (ex: '120px') */
            buttonsWidth?: string;
        }>(),
        {
            list: () => ({}),
            columns: () => [],
            emptyMessage: 'Nenhum registro encontrado'
        }
    );

    const slots = useSlots();
    const tableId = computed(() => props.id ?? ulid());

    /** Verifica se o slot de botões foi fornecido */
    const hasButtons = computed(() => !!slots['buttons']);

    /** Total de colunas para o colspan do estado vazio */
    const totalColspan = computed(() => props.columns.length + (hasButtons.value ? 1 : 0));

    /** Normaliza a lista: se for Record converte para array */
    const normalizedList = computed<any[]>(() => {
        if (Array.isArray(props.list)) return props.list;
        return Object.values(props.list);
    });

    /** Acessa o valor de um campo, suportando notação com ponto (ex: 'user.name') */
    function getFieldValue(row: any, field: string): any {
        return field.split('.').reduce((obj, key) => obj?.[key], row);
    }

    /** Gera o estilo inline de uma coluna baseado nas suas propriedades */
    function getColumnStyle(col: MaxTableColumn): Record<string, string> {
        const style: Record<string, string> = {};
        if (col.width) {
            style.width = col.width;
            style.maxWidth = col.width;
        }
        if (col.minWidth) style.minWidth = col.minWidth;
        if (col.maxWidth) style.maxWidth = col.maxWidth;
        if (col.align) style.textAlign = col.align;
        return style;
    }

    defineExpose({ tableId });
</script>


<style lang="scss">
.max-new-table-wrapper {
    border-radius: 1rem;
    overflow: hidden;
    max-height: 100%;
    width: 100%;
    height: 100%;
    border: 1px solid var(--background-300);
    position: relative;
    display: grid;
    grid-template-rows: 1fr;
}

.max-new-table {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    display: grid;
    grid-template-rows: auto 1fr;
}

// CABEÇALHO
.max-new-table-head {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 1;

    .max-new-table-head-row {
        display: flex;
        height: 40px;
        padding: 0 6px;
        gap: 6px;
        background-color: var(--blue-800);
    }

    .max-new-table-th {
        padding: 0;
        background-color: transparent;
        color: var(--blue-200);
        font-family: Jost, sans-serif;
        font-weight: 400;
        flex-grow: 1;
        border: none;
        height: 100%;
        display: grid;
        place-items: center;
        text-align: center;
    }

    .max-new-table-th-buttons {
        flex-grow: 0;
        width: auto;
    }
}

// CORPO DA TABELA
.max-new-table-body {
    display: grid;
    align-content: start;
    overflow-y: auto;
    font-family: Jost, sans-serif;

    .max-new-table-row {
        display: flex;
        width: 100%;
        height: auto;
        gap: 0 6px;
        padding: 3px 6px;

        &:first-of-type {
            padding-top: 6px;
        }

        &:last-of-type {
            padding-bottom: 6px;
        }

        // Linhas listradas
        &.max-new-table-row-even {
            background-color: var(--primary-25);
        }

        &.max-new-table-row-odd {
            background-color: var(--primary-100);
        }
    }

    .max-new-table-td {
        flex-grow: 1;
        padding: 0;
        display: grid;
        place-items: center;
        outline: none;
        border: none;
        border-radius: 0;

        // Quando inputs estão dentro da célula
        .max-input-main-div {
            grid-template-rows: 1fr;

            .message-spacer, .input-message {
                display: none;
            }
        }
    }

    // Botões de ação
    .max-new-table-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        width: auto;
        flex-grow: 0;
        padding: 0 6px;
    }

    // Estado vazio
    .max-new-table-empty-cell {
        padding: 24px;
        text-align: center;
        color: var(--text-400);
        font-style: italic;
    }
}
</style>
