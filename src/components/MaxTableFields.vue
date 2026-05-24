<template>
    <div class="max-table-fields-wrapper" :id="tableId">
        <table class="max-table-fields">
            <!-- Cabeçalho -->
            <thead class="max-table-fields-head">
                <tr class="max-table-fields-head-row">
                    <th v-for="col in columns" :key="col.field" class="max-table-fields-th" :style="getColumnStyle(col)" >
                        <slot :name="`header-${col.field}`" :column="col">
                            {{ col.header }}
                        </slot>
                    </th>
                    <!-- Coluna extra para botões de ação -->
                    <th v-if="hasButtons" class="max-table-fields-th max-table-fields-th-buttons" :style="buttonsWidth ? `width: ${buttonsWidth}; max-width: ${buttonsWidth};` : undefined" >
                        <slot name="buttons-header" />
                    </th>
                </tr>
            </thead>

            <!-- Corpo -->
            <tbody class="max-table-fields-body">
                <template v-if="normalizedList.length > 0">
                    <tr v-for="(row, index) in normalizedList" :key="index" class="max-table-fields-row" :class="{ 'max-table-fields-row-even': index % 2 === 0, 'max-table-fields-row-odd': index % 2 !== 0 }" >
                        <td v-for="col in columns" :key="col.field" class="max-table-fields-td" :style="getColumnStyle(col)" >
                            <!-- Slot customizado tem prioridade -->
                            <slot v-if="col.slot" :name="col.slot" :data="row" :value="getFieldValue(row, col.field)" :index="index" :field="col.field" >
                                {{ getFieldValue(row, col.field) }}
                            </slot>

                            <!-- Input de incremento (+/-) -->
                            <div v-else-if="col.input === 'increment'" class="max-table-fields-increment">
                                <MaxIconButton i="icons8:minus" size="1.3" dark @click.stop="decrementValue(row, col)" />
                                <MaxInputText :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full text-center :placeholder="col.placeholder" :required="col.required" />
                                <MaxIconButton i="icons8:plus" size="1.3" dark @click.stop="incrementValue(row, col)" />
                            </div>

                            <!-- Input de texto -->
                            <MaxInputText v-else-if="col.input === 'text' || col.input === 'input'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :placeholder="col.placeholder" :required="col.required" />

                            <!-- Input numérico -->
                            <MaxInputNumber v-else-if="col.input === 'number'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :placeholder="col.placeholder" :required="col.required" />

                            <!-- Select -->
                            <MaxInputSelect v-else-if="col.input === 'select'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :options="col.options ?? []" :placeholder="col.placeholder" :required="col.required" />

                            <!-- Date Picker -->
                            <MaxInputDatePicker v-else-if="col.input === 'date'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :placeholder="col.placeholder" :required="col.required" />

                            <!-- Checkbox -->
                            <MaxInputCheckbox v-else-if="col.input === 'checkbox'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full />

                            <!-- Textarea -->
                            <MaxInputTextArea v-else-if="col.input === 'textarea'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :placeholder="col.placeholder" :required="col.required" />

                            <!-- AutoComplete -->
                            <MaxInputAutoComplete v-else-if="col.input === 'auto-complete'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :options="col.options ?? []" :placeholder="col.placeholder" :required="col.required" />

                            <!-- AutoComplete via API -->
                            <MaxInputAutoCompleteApi v-else-if="col.input === 'auto-complete-api'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :route="col.route ?? ''" :data="resolveData(row, col.data)" :placeholder="col.placeholder" :required="col.required" />

                            <!-- Phone Number -->
                            <MaxPhoneField v-else-if="col.input === 'phone-number'" :modelValue="getFieldValue(row, col.field)" @update:modelValue="setFieldValue(row, col.field, $event, col)" w-full :placeholder="col.placeholder" :required="col.required" />

                            <!-- Sem input: exibe o valor como texto -->
                            <template v-else>
                                {{ getFieldValue(row, col.field) }}
                            </template>
                        </td>

                        <!-- Coluna de botões -->
                        <td v-if="hasButtons" class="max-table-fields-td max-table-fields-buttons" >
                            <slot name="buttons" :data="row" :index="index" />
                        </td>
                    </tr>
                </template>

                <!-- Estado vazio -->
                <tr v-else class="max-table-fields-row max-table-fields-empty">
                    <td :colspan="totalColspan" class="max-table-fields-td max-table-fields-empty-cell">
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
    // Componentes de input
    import MaxInputText from './MaxInputText.vue';
    import MaxInputNumber from './MaxInputNumber.vue';
    import MaxInputSelect from './MaxInputSelect.vue';
    import MaxInputDatePicker from './MaxInputDatePicker.vue';
    import MaxInputCheckbox from './MaxInputCheckbox.vue';
    import MaxInputTextArea from './MaxInputTextArea.vue';
    import MaxInputAutoComplete from './MaxInputAutoComplete.vue';
    import MaxInputAutoCompleteApi from './MaxInputAutoCompleteApi.vue';
    import MaxPhoneField from './MaxPhoneField.vue';
    import MaxIconButton from './MaxIconButton.vue';
    import { getCssSize } from '../helpers/getCssSize';

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

    const emit = defineEmits<{
        /** Emitido quando o valor de um campo é alterado */
        'update:field': [payload: { row: any; field: string; value: any; index?: number }];
    }>();

    /** Normaliza a lista: se for Record converte para array */
    const normalizedList = computed<any[]>(() => {
        if (Array.isArray(props.list)) return props.list;
        return Object.values(props.list);
    });

    /** Acessa o valor de um campo, suportando notação com ponto (ex: 'user.name') */
    function getFieldValue(row: any, field: string): any {
        return field.split('.').reduce((obj, key) => obj?.[key], row);
    }

    /** Define o valor de um campo no objeto da linha, suportando notação com ponto */
    function setFieldValue(row: any, field: string, value: any, col?: MaxTableColumn): void {
        const keys = field.split('.');
        let target = row;
        for (let i = 0; i < keys.length - 1; i++) target = target?.[keys[i]];

        if (target) {
            target[keys[keys.length - 1]] = value;
            col?.onChange?.(value);
            emit('update:field', { row, field, value });
        }
    }

    /** Incrementa o valor numérico do campo */
    function incrementValue(row: any, col: MaxTableColumn): void {
        const current = Number(getFieldValue(row, col.field)) || 0;
        setFieldValue(row, col.field, current + 1, col);
    }

    /** Decrementa o valor numérico do campo */
    function decrementValue(row: any, col: MaxTableColumn): void {
        const current = Number(getFieldValue(row, col.field)) || 0;
        setFieldValue(row, col.field, current - 1, col);
    }

    /**
     * Resolve o campo 'data' da coluna usando os valores da linha atual.
     * - Se for string (ex: 'brand.name'), retorna o valor de row.brand.name
     * - Se for objeto (ex: { width: 'car.size.width', color: 'car.color' }),
     *   retorna { width: row.car.size.width, color: row.car.color }
     * - Valores que não são strings são mantidos como estão
     */
    function resolveData(row: any, data: any): any {
        if (!data) return data;
        if (typeof data === 'string') return getFieldValue(row, data);
        if (typeof data === 'object' && !Array.isArray(data)) {
            const resolved: Record<string, any> = {};
            for (const key in data) resolved[key] = typeof data[key] === 'string' ? (getFieldValue(row, data[key])) ?? data[key] : data[key];


            return resolved;
        }
        return data;
    }

    /** Gera o estilo inline de uma coluna baseado nas suas propriedades */
    function getColumnStyle(col: MaxTableColumn): Record<string, any> {
        const style: Record<string, any> = { ...(col.style ?? {}) };
        if (col.width) {
            style.width = getCssSize(col.width);
            style.maxWidth = getCssSize(col.width);
        }
        if (col.size) {
            style.width = getCssSize(col.size);
            style.maxWidth = getCssSize(col.size);
        }
        if (col.minWidth) style.minWidth = getCssSize(col.minWidth);
        if (col.maxWidth) style.maxWidth = getCssSize(col.maxWidth);
        if (col.align) style.textAlign = col.align;


        console.log('STYLE', style);

        return style;
    }

    defineExpose({ tableId });
</script>


<style lang="scss">
.max-table-fields-wrapper {
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

.max-table-fields {
    width: 100%;
    height: 100%;
    border-collapse: collapse;
    display: grid;
    grid-template-rows: auto 1fr;
}

// CABEÇALHO
.max-table-fields-head {
    display: grid;
    position: sticky;
    top: 0;
    z-index: 1;

    .max-table-fields-head-row {
        display: flex;
        height: 40px;
        padding: 0 6px;
        gap: 6px;
        background-color: var(--blue-800);
    }

    .max-table-fields-th {
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

    .max-table-fields-th-buttons {
        flex-grow: 0;
        width: auto;
    }
}

// CORPO DA TABELA
.max-table-fields-body {
    display: grid;
    align-content: start;
    overflow-y: auto;
    font-family: Jost, sans-serif;

    .max-table-fields-row {
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
        &.max-table-fields-row-even {
            background-color: var(--primary-25);
        }

        &.max-table-fields-row-odd {
            background-color: var(--primary-100);
        }
    }

    .max-table-fields-td {
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

    // Input de incremento (+/-)
    .max-table-fields-increment {
        display: grid;
        grid-template-columns: auto 1fr auto;
        place-items: center;
        gap: 10px;
        width: 100%;
        padding: 0 10px;
    }

    // Botões de ação
    .max-table-fields-buttons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        width: auto;
        flex-grow: 0;
        padding: 0 6px;
    }

    // Estado vazio
    .max-table-fields-empty-cell {
        padding: 24px;
        text-align: center;
        color: var(--text-400);
        font-style: italic;
    }
}
</style>
