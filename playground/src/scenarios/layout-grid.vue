<template>
    <div class="scenario-content" data-scenario="layout-grid">
        <h2>Cenário layout-grid</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxGrid</h3>
                    <p class="max-grid-doc-note">
                        Contêiner flexbox com quebra natural (flex-wrap) e suporte a quebras explícitas com marcadores start e end. Tokens com sufixo de dispositivo (mobile, tablet, desktop) aplicam dimensionamento e fragmentação responsivos via @media CSS (ex.: s11-11 s20-full-mobile), mas o particionamento estrutural de linhas no VDOM permanece exclusivo de marcadores sem dispositivo.
                    </p>
                    <div class="states">
                        <!-- 1. Flex-wrap natural sem marcadores -->
                        <div class="state-col">
                            <span>Flex-wrap natural (sem marcadores)</span>
                            <MaxGrid label="Campos Cadastrais">
                                <MaxInputText class="s10-full" label="Nome do Cliente" v-model="formExemplo.nome" />
                                <MaxInputText class="s10-20" label="Código do Registro" v-model="formExemplo.codigo" />
                            </MaxGrid>
                        </div>

                        <!-- 2. Quebras explícitas de linha (start/end) -->
                        <div class="state-col">
                            <span>Quebras explícitas (s7-end e s3-10-start)</span>
                            <MaxGrid label="Linhas Explícitas">
                                <MaxInputText s7-end label="Item 1 (s7-end encerra linha)" v-model="formExemplo.item1" />
                                <MaxInputText class="s3-10-start" label="Item 2 (s3-10-start inicia linha)" v-model="formExemplo.item2" />
                                <MaxInputText class="s10-full" label="Item 3 (elástico na linha)" v-model="formExemplo.item3" />
                            </MaxGrid>
                        </div>

                        <!-- 3. Label centralizado e flag no-message -->
                        <div class="state-col">
                            <span>Label centralizado e flag no-message</span>
                            <MaxGrid no-message label="Filtros Compactos" :labelCenter="true">
                                <MaxInputText s10-full label="Pesquisa Rápida" v-model="formExemplo.pesquisa" />
                                <MaxInputText class="s10-20" label="Status" v-model="formExemplo.status" />
                            </MaxGrid>
                        </div>

                        <!-- 4. Override responsivo de dispositivo (s11-11 desktop, s20-full no mobile) -->
                        <div class="state-col">
                            <span>Composição responsiva (s11-11 s20-full-mobile)</span>
                            <MaxGrid label="Responsividade por Dispositivo">
                                <MaxInputText s11-11 s20-full-mobile label="Documento (s11-11 desktop / full mobile)" v-model="formExemplo.doc" />
                                <MaxInputText s10-full label="Complemento" v-model="formExemplo.complemento" />
                            </MaxGrid>
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxGridCols</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxGridCols />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxGridCols disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxGridCols error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxEmptyDiv</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxEmptyDiv />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxEmptyDiv disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxEmptyDiv error severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxGrid } from '@maxvue/max-components-ui';
    import { MaxGridCols } from '@maxvue/max-components-ui';
    import { MaxEmptyDiv } from '@maxvue/max-components-ui';
    import { MaxInputText } from '@maxvue/max-components-ui';

    const formExemplo = ref({
        nome: 'João Silva',
        codigo: 'ENG-2026',
        item1: 'Valor 1',
        item2: 'Valor 2',
        item3: 'Valor 3',
        pesquisa: '',
        status: 'Ativo',
        doc: '123.456.789-00',
        complemento: ''
    });
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
    .max-grid-doc-note {
        font-size: 0.85rem;
        color: var(--background-750, #555);
        margin-top: 0.5rem;
        line-height: 1.4;
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
