<template>
    <div v-if="!noErrors" :class="typeSelect" class="labels text-xs pt-1 subpixel-antialiased">
        <span v-if="obrigatorio" class="obrigatorio">*</span>
        <div v-if="msgError" class="erro">
            <div class="fill"></div>
            <div class="div_msg">
                {{ msgError }}
            </div>
        </div>
        <div v-else-if="msg" class="div_mensagem">
            {{ msg }}
        </div>
    </div>
</template>
<script setup lang="ts">
    const _props = withDefaults(defineProps<{
        noErrors?: boolean;
        typeSelect?: string;
        obrigatorio?: boolean;
        msgError?: string;
        msg?: string;
    }>(), {
        noErrors: false,
        obrigatorio: false
    });
</script>

<style scoped lang="scss">
    .labels {
        pointer-events: none;
        height: 100%;
        width: 100%;
        font-size: 0.8rem;
        padding: 0 !important;
        display: grid;
        grid-template-columns: 1fr;
        place-items: center;

        &.select {
            .botao-input {
                pointer-events: all;
                position: absolute;
                top: 0;
                right: 30px;
                width: 40px;
            }
        }

        .lupa {
            width: 25px !important;

            &.slim {
                i {
                    font-size: 5px !important;
                }
            }
        }

        .obrigatorio {
            position: absolute;
            top: 3px;
            right: 7px;
            color: var(--alerta-b);
        }

        .botao-input {
            pointer-events: all;
            position: absolute;
            top: 0;
            right: 5px;
            width: 40px;
        }

        .botao-left {
            pointer-events: all;
            position: absolute;
            top: 22px;
            left: 0;
            width: 40px;
            height: 40px;
            z-index: 999999;
        }

        .erro {
            width: calc(100% - 8px);
            text-align: right;
            right: 8px;
            height: 100%;
            color: var(--alerta-c);
            display: grid;
            grid-template-columns: 1fr auto auto;
            cursor: pointer;

            .div_icone {
                position: relative;
                left: 0;
                width: 15px;
                height: calc(100% - 3.5px);
                padding-top: 3.5px;
                text-align: center;

                i {
                    width: 100%;
                }
            }

            .div_msg {
                display: block;
                width: auto;
                height: 100%;
                height: calc(100% - 2px);
                padding-top: 2px;
            }
        }

        .div_mensagem {
            padding-left: 8px;
            color: var(--text-c);
            width: calc(100% - 8px);
            text-align: right;
        }
    }
</style>
