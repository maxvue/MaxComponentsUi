<template>
    <div class="search-top-bar">
        <MaxInputText
            ref="input_search_ref"
            v-model="search_bar.input_value"
            w-max-400
            flex
            :placeholder="props.placeholder"
            class="search-top-bar-input"
            :icon="search_bar.is_filtering ? 'eos-icons:loading' : 'material-symbols:search-rounded'"
            no-message
        >
            <slot></slot>
        </MaxInputText>
    </div>
</template>

<script setup lang="ts">
    import type { Ref } from 'vue';
    import { ref, onMounted, onUnmounted } from 'vue';
    import { useMagicKeys, whenever } from '@maxvue/max-use';
    import MaxInputText from './MaxInputText.vue';
    import { useSearchBarStore } from '../stores/useSearchBar.Store';

    const props = withDefaults(defineProps<{
        /**
         * Texto do campo. No engeapp exibia a contagem de projetos, que vinha da
         * store do board — domínio da aplicação, por isso agora é uma prop.
         */
        placeholder?: string;
    }>(), {
        placeholder: 'Pesquisar'
    });

    const search_bar = useSearchBarStore();
    const input_search_ref: Ref<any> = ref();

    const keys = useMagicKeys();
    const isCtrlF = keys['Control+F'];

    whenever(isCtrlF, () => input_search_ref.value?.setFocus?.());

    /** Impede o Ctrl+F nativo do navegador enquanto a barra existe. */
    const handleSearchKeydown = (event: KeyboardEvent): void => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') event.preventDefault();
    };

    onMounted(() => document.addEventListener('keydown', handleSearchKeydown));
    onUnmounted(() => document.removeEventListener('keydown', handleSearchKeydown));
</script>

<style lang="scss">
    .search-top-bar {
        position: relative;
        display: grid;
        width: 100%;
        height: 36px;
        place-items: center;

        .max-input-field-div {
            border: none !important;
            outline: rgb(255 255 255 / 10%) 1px solid !important;
            background-color: rgb(0 0 0 / 10%) !important;
        }

        .search-top-bar-input {
            position: relative;

            input {
                border-color: rgb(255 255 255 / 7%);
                background-color: rgb(255 255 255 / 7%);
                color: rgb(255 255 255 / 70%);
                padding-left: 35px !important;
            }

            .max-icon-div {
                svg {
                    color: rgb(255 255 255 / 20%) !important;
                }
            }

            .checkbox-search-top {
                position: absolute;
                right: 15px;
                bottom: 8px;
                display: grid;
                place-items: center start;

                svg {
                    width: 10px;
                    height: 10px;
                }

                .p-checkbox-checked {
                    .p-checkbox-box {
                        border: 1px solid rgb(255 255 255 / 20%) !important;
                        background-color: rgb(0 0 0 / 20%) !important;
                    }
                }
            }
        }

        .p-checkbox-box {
            border: 1px solid rgb(255 255 255 / 10%) !important;
            background-color: rgb(255 255 255 / 10%) !important;
            min-width: 16px !important;
            width: 16px !important;
            min-height: 16px !important;
            height: 16px !important;
            transform: translateX(-45px) !important;
        }

        input {
            padding: 0 !important;
        }

        .p-checkbox-input {
            padding: 0 !important;
        }
    }
</style>
