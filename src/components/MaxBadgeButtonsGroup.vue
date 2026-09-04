<template>
    <div
        class="max-badge-buttons-group"
        :class="props.class"
        :style="resolvedStyle"
        role="group"
    >
        <MaxBadgeButton
            v-for="item in props.items"
            :key="item.value ?? item.label"
            :label="item.label"
            :icon="item.icon"
            :color="item.color"
            :neon="item.neon"
            :status="item.status"
            :overlay="item.overlay"
            :uppercase="item.uppercase"
            :size="item.size"
            :background="item.background"
            :text-color="item.textColor"
            :model-value="isItemSelected(item)"
            :disabled="props.disabled || item.disabled"
            @click.stop="(event: MouseEvent) => handleItemClick(item, event)"
        />
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, useAttrs } from 'vue';
    import MaxBadgeButton from './MaxBadgeButton.vue';
    import type { MaxBadgeButtonProps } from './MaxBadgeButton.vue';

    export interface MaxBadgeButtonsGroupItem extends Omit<MaxBadgeButtonProps, 'modelValue' | 'onClick'> {
        /** Valor que identifica o item e é emitido no v-model */
        value: any;
        /** Identificador opcional */
        id?: any;
        /** Propriedades adicionais arbitrárias */
        [key: string]: any;
    }

    export interface MaxBadgeButtonsGroupProps {
        /** Valor do v-model contendo array de itens selecionados (valores ou objetos) */
        modelValue?: any[];
        /** Lista de itens a serem renderizados no grupo */
        items?: MaxBadgeButtonsGroupItem[];
        /** Permite selecionar apenas 1 item por vez (padrão: true) */
        onlyOne?: boolean;
        /** Se true, o v-model retorna o array de objetos completos em vez de apenas os values (padrão: false) */
        returnObject?: boolean;
        /** Propriedade do item a ser extraída caso returnObject seja false (ex: 'value', 'id'). Padrão: 'value' */
        returnValue?: string;
        /** Permite desmarcar o último item selecionado (padrão: true) */
        allowEmpty?: boolean;
        /** Valor default inicial caso modelValue esteja vazio ou undefined */
        default?: any | any[];
        /** Espaçamento entre os badges (padrão: '0.5rem') */
        gap?: string | number;
        /** Desabilita todos os botões do grupo */
        disabled?: boolean;
        /** Classes CSS adicionais */
        class?: any;
        /** Callback disparado na seleção */
        onSelect?: (selectedItems: MaxBadgeButtonsGroupItem[], selectedValues: any[]) => void;
        /** Callback disparado no clique de um item */
        onClick?: (item: MaxBadgeButtonsGroupItem, event: MouseEvent) => void;
    }

    const props = withDefaults(defineProps<MaxBadgeButtonsGroupProps>(), {
        modelValue: undefined,
        items: () => [],
        onlyOne: true,
        returnObject: false,
        returnValue: 'value',
        allowEmpty: true,
        default: undefined,
        gap: '0.5rem',
        disabled: false,
        class: undefined,
        onSelect: undefined,
        onClick: undefined
    });

    const emit = defineEmits<{
        (e: 'update:modelValue', value: any[]): void;
        (e: 'change', value: any[]): void;
        (e: 'select', selectedItems: MaxBadgeButtonsGroupItem[], selectedValues: any[]): void;
        (e: 'click', item: MaxBadgeButtonsGroupItem, event: MouseEvent): void;
    }>();

    const attrs = useAttrs();
    const internalValue = ref<any[]>([]);

    const isOnlyOne = computed<boolean>(() => {
        if (attrs['only-one'] !== undefined) return attrs['only-one'] === true || attrs['only-one'] === '' || attrs['only-one'] === 'true';

        return Boolean(props.onlyOne);
    });

    const isReturnObject = computed<boolean>(() => {
        if (attrs['return-object'] !== undefined) return attrs['return-object'] === true || attrs['return-object'] === '' || attrs['return-object'] === 'true';

        return Boolean(props.returnObject);
    });

    const isAllowEmpty = computed<boolean>(() => {
        if (attrs['allow-empty'] !== undefined) return attrs['allow-empty'] === true || attrs['allow-empty'] === '' || attrs['allow-empty'] === 'true';

        return Boolean(props.allowEmpty);
    });

    const resolvedReturnValueKey = computed<string>(() => {
        const attrCustom = attrs['return-value'];
        if (typeof attrCustom === 'string' && attrCustom.length > 0) return attrCustom;
        if (typeof props.returnValue === 'string' && props.returnValue.length > 0) return props.returnValue;

        return 'value';
    });

    const currentModelValue = computed<any[]>(() => {
        if (props.modelValue !== undefined) return Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue];

        return internalValue.value;
    });

    const resolvedStyle = computed(() => {
        const gapValue = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;

        return {
            gap: gapValue
        };
    });

    function getItemValue(item: MaxBadgeButtonsGroupItem): any {
        if (isReturnObject.value) return item;

        const key = resolvedReturnValueKey.value;
        if (item[key] !== undefined) return item[key];

        return item.value;
    }

    function isSameItem(a: MaxBadgeButtonsGroupItem, b: MaxBadgeButtonsGroupItem): boolean {
        if (a.value !== undefined && b.value !== undefined) return a.value === b.value;
        if (a.id !== undefined && b.id !== undefined) return a.id === b.id;

        return a === b;
    }

    function isItemSelected(item: MaxBadgeButtonsGroupItem): boolean {
        const currentList = currentModelValue.value;

        if (isReturnObject.value) return currentList.some((selected) => {
            if (typeof selected === 'object' && selected !== null) {
                if (selected.value !== undefined && item.value !== undefined) return selected.value === item.value;
                if (selected.id !== undefined && item.id !== undefined) return selected.id === item.id;

                return selected === item;
            }

            return selected === item.value;
        });


        const valueToCompare = getItemValue(item);

        return currentList.some((selected) => {
            if (typeof selected === 'object' && selected !== null) {
                const key = resolvedReturnValueKey.value;

                return selected[key] === valueToCompare || selected.value === item.value;
            }

            return selected === valueToCompare;
        });
    }

    function handleItemClick(item: MaxBadgeButtonsGroupItem, event: MouseEvent) {
        if (props.disabled || item.disabled) return;

        const currentlySelected = isItemSelected(item);
        const currentItems = props.items.filter((it) => isItemSelected(it));

        if (currentlySelected && !isAllowEmpty.value && currentItems.length === 1) {
            emit('click', item, event);

            return;
        }

        let newSelectedItems: MaxBadgeButtonsGroupItem[] = [];

        if (isOnlyOne.value) if (currentlySelected) if (isAllowEmpty.value) newSelectedItems = [];
        else newSelectedItems = [item];
        else newSelectedItems = [item];
        else
            if (currentlySelected) newSelectedItems = currentItems.filter((it) => !isSameItem(it, item));
            else newSelectedItems = [...currentItems, item];


        const newModelValue = isReturnObject.value
            ? newSelectedItems
            : newSelectedItems.map((it) => getItemValue(it));

        if (props.modelValue === undefined) internalValue.value = newModelValue;

        emit('update:modelValue', newModelValue);
        emit('change', newModelValue);
        emit('select', newSelectedItems, newModelValue);
        emit('click', item, event);
    }

    onMounted(() => {
        if ((props.modelValue === undefined || props.modelValue.length === 0) && props.default !== undefined) {
            const defaults = Array.isArray(props.default) ? props.default : [props.default];

            const initialItems = props.items.filter((it) => {
                const itemVal = getItemValue(it);

                return defaults.some((d) => (typeof d === 'object' && d !== null ? (d.value ?? d) === it.value : d === itemVal || d === it.value));
            });

            const resolvedInitialItems = isOnlyOne.value && initialItems.length > 1
                ? [initialItems[0]]
                : initialItems;

            const initialModelValue = isReturnObject.value
                ? resolvedInitialItems
                : resolvedInitialItems.map((it) => getItemValue(it));

            if (props.modelValue === undefined) internalValue.value = initialModelValue;

            emit('update:modelValue', initialModelValue);
            emit('change', initialModelValue);
            emit('select', resolvedInitialItems, initialModelValue);
        }
    });
</script>

<style lang="scss">
    .max-badge-buttons-group {
        display: inline-flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }
</style>
