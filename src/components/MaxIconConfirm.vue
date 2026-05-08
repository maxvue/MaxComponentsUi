<template>
    <MaxIconButton v-bind="props" v-tooltip="null" pointer @click.stop="toggle" />
    <Popover ref="op">
        <div class="flex flex-col gap-4 w-[25rem]">
            <div p10>
                {{ props.message ?? 'Você confirma a operação?' }}
            </div>
            <grid full pw10 pb10>
                <MaxButton s50 @click.stop="confirm" info :label="props.acceptLabel ?? 'Sim'" :icon="props.acceptIcon" />
                <MaxButton s50 @click.stop="cancel" :label="props.cancelLabel ?? 'Não'" :icon="props.cancelIcon" />
            </grid>
        </div>
    </Popover>
</template>

<script setup lang="ts">
    import MaxIconButton from './MaxIconButton.vue';
    import MaxButton from './MaxButton.vue';
    import Popover from 'primevue/popover';
    import { ref, computed } from 'vue';

    const props = withDefaults(defineProps<{
        /** Nome do ícone (ex: 'mdi:home') */
        icon?: string;
        /** Alias para o nome do ícone */
        i?: string;
        /** link para abrir em nova aba */
        blank?: string;
        /** Rotação do ícone em graus */
        route?: string;
        /** Query data */
        data?: any;
        /** params data */
        params?: any;
        /** Rotação do ícone em graus */
        rotate?: number;
        /** Inversão do ícone */
        flip?: 'horizontal' | 'vertical' | 'h' | 'v' | 'x' | 'y' | 'xy';
        /** Tamanho do ícone (em px ou multiplicador) */
        size?: string | number;
        /** Alias para o tamanho */
        scale?: string | number;
        /** Mensagem de confirmação */
        message?: string;
        /** Label do botão de sim */
        acceptLabel?: string;
        /** Icone do botão de sim */
        acceptIcon?: string;
        /** Label do botão de não */
        cancelLabel?: string;
        /** Icone do botão de não */
        cancelIcon?: string;
        /** Largura específica */
        width?: string | number;
        /** Altura específica */
        height?: string | number;
        /** Icone escuro referente ao fundo */
        dark?: boolean | string | number | undefined;
        /** Icone claro referente ao fundo */
        light?: boolean | string | number | undefined;
        /** Icone de checagem */
        checked?: boolean | string | number | undefined;
        /** Icone de adição opcional */
        plus?: boolean | string | number | undefined;
    }>(), {
        dark: 0.4,
        light: undefined
    });

    const op = ref();

    const toggle = (event: any) => op.value.toggle(event);

    // Define os eventos e os tipos dos argumentos (payload) que eles enviam
    const emit = defineEmits<{
        confirm: [value: boolean];
        accept: [value: boolean];
        cancel: [value: boolean];
        reject: [value: boolean];
    }>();

    const confirm = () => {
        emit('confirm', true);
        emit('accept', true);
    };

    const cancel = () => {
        emit('cancel', false);
        emit('reject', false);
    };

    const size = computed(() => 16 * Number(props.size ?? 1) + 'px');
</script>

<style lang="scss">
    .icon-div {
        display: grid;
        place-items: center;
        width: auto;
        height: 100%;
        max-width: 100%;
        max-height: 100%;
        transition: transform 0.3s ease, color 0.2s ease-in-out;
        position: relative;

        &.ico-btn {
            &:hover {
                transform: scale(1.3) !important;
            }
        }
    }
</style>
