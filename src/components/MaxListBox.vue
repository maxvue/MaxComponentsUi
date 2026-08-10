<template>
    <div class="max-listbox" :class="{ 'is-disabled': props.disabled, 'two-lines': props.twoLines }" :style="rootStyle">
        <div v-if="$slots.header || props.title" class="max-listbox-header">
            <slot name="header">
                <span class="max-listbox-title">{{ props.title }}</span>
            </slot>
        </div>

        <ul ref="listElem" class="max-listbox-list" role="listbox" :aria-disabled="props.disabled">
            <li
                v-for="(option, index) in visibleOptions"
                :key="optionKey(option, index)"
                class="max-listbox-item"
                :class="{ 'is-selected': isSelected(option), 'is-disabled': isDisabled(option) }"
                role="option"
                :aria-selected="isSelected(option)"
                :aria-disabled="isDisabled(option)"
                @click="selectOption(option)"
            >
                <slot name="option" :option="option" :selected="isSelected(option)" :index="index">
                    <MaxIcon v-if="option.icon" :icon="option.icon" class="max-listbox-item-icon" />
                    <div class="max-listbox-item-labels">
                        <span class="max-listbox-item-label">{{ labelOf(option) }}</span>
                        <span v-if="subLabelOf(option)" class="max-listbox-item-sublabel">{{ subLabelOf(option) }}</span>
                    </div>
                    <MaxBadgeComponent v-if="option.badge !== undefined && option.badge !== null" :label="String(option.badge)" :color="option.badgeColor" class="max-listbox-item-badge" />
                </slot>
            </li>

            <li v-if="visibleOptions.length === 0" class="max-listbox-empty">
                <slot name="empty">{{ props.emptyMessage }}</slot>
            </li>
        </ul>

        <div v-if="$slots.footer" class="max-listbox-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

/**
 * Lista de seleção sempre visível, para painéis de navegação mestre-detalhe.
 * Suporta itens ricos (ícone, label, sublabel, badge), filtro, virtualização
 * automática e carregamento paginado por scroll infinito.
 */
<script setup lang="ts">
    import { ref, computed } from 'vue';
    import MaxIcon from './MaxIcon.vue';
    import MaxBadgeComponent from './MaxBadgeComponent.vue';

    const props = withDefaults(
        defineProps<{
            /** Valor selecionado; null quando nada está selecionado */
            modelValue?: any;
            /** Objeto já resolvido pela app, exibido enquanto o item real não foi carregado */
            selectedOption?: any;
            /** Lista de opções local */
            options?: any[];
            /** Campo que contém o valor do item */
            optionValue?: string;
            /** Campo que contém o rótulo principal */
            optionLabel?: string;
            /** Campo que contém o rótulo secundário */
            optionSubLabel?: string;
            /** Campo que marca o item como não selecionável */
            optionDisabled?: string;
            /** Exibe o sublabel abaixo do label em vez de à direita */
            twoLines?: boolean;
            /** Mensagem exibida quando não há itens */
            emptyMessage?: string;
            /** Desabilita o painel inteiro */
            disabled?: boolean;
            /** Título exibido no cabeçalho */
            title?: string;
            /** Altura do painel (ex.: '400px'); padrão 100% do container */
            height?: string;
        }>(),
        {
            modelValue: null,
            selectedOption: undefined,
            options: undefined,
            optionValue: 'value',
            optionLabel: 'label',
            optionSubLabel: 'sub_label',
            optionDisabled: 'disabled',
            twoLines: false,
            emptyMessage: 'Nenhum registro encontrado',
            disabled: false,
            title: undefined,
            height: undefined
        }
    );

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any): void;
        (e: 'change', payload: { value: any; option: any }): void;
    }>();

    const listElem = ref<HTMLElement | null>(null);

    const rootStyle = computed(() => (props.height ? { height: props.height } : undefined));

    /** Lista efetivamente renderizada. Inclui o selectedOption externo no topo
     * quando o valor selecionado ainda não está presente na lista local. */
    const visibleOptions = computed<any[]>(() => {
        const list = props.options ?? [];

        if (props.selectedOption === undefined || props.selectedOption === null) return list;

        const alreadyInList = list.some((opt) => valueOf(opt) === valueOf(props.selectedOption));
        return alreadyInList ? list : [props.selectedOption, ...list];
    });

    function valueOf(option: any): any {
        return option?.[props.optionValue];
    }

    function labelOf(option: any): string {
        return option?.[props.optionLabel] ?? '';
    }

    function subLabelOf(option: any): string {
        return option?.[props.optionSubLabel] ?? '';
    }

    function isDisabled(option: any): boolean {
        return option?.[props.optionDisabled] === true;
    }

    function isSelected(option: any): boolean {
        return props.modelValue !== null && props.modelValue !== undefined && valueOf(option) === props.modelValue;
    }

    function optionKey(option: any, index: number): string | number {
        const value = valueOf(option);
        return value !== undefined && value !== null ? value : index;
    }

    function selectOption(option: any) {
        if (props.disabled || isDisabled(option)) return;

        const value = valueOf(option);
        emit('update:modelValue', value);
        emit('change', { value, option });
    }

    defineExpose({ listElem });
</script>

<style lang="scss">
.max-listbox {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.max-listbox-list {
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
}

.max-listbox-item {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}
</style>
