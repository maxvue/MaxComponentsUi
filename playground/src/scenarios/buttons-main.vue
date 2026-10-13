<template>
    <div class="scenario-content" data-scenario="buttons-main">
        <h2>Cenário buttons-main</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxButton</h3>
                    <div class="states">
                        <!-- Default vs Slim -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxButton label="Salvar" />
                        </div>
                        <div class="state-col">
                            <span>Slim</span>
                            <MaxButton label="Salvar" slim />
                        </div>
                        <!-- Com Ícone -->
                        <div class="state-col">
                            <span>Com Ícone</span>
                            <MaxButton label="Salvar" icon="iconoir:check" />
                        </div>
                        <div class="state-col">
                            <span>Com Ícone Slim</span>
                            <MaxButton label="Salvar" icon="iconoir:check" slim />
                        </div>
                        <!-- Small vs Small Slim -->
                        <div class="state-col">
                            <span>Small</span>
                            <MaxButton label="Pequeno" size="small" />
                        </div>
                        <div class="state-col">
                            <span>Small Slim</span>
                            <MaxButton label="Pequeno" size="small" slim />
                        </div>
                        <!-- Large vs Large Slim -->
                        <div class="state-col">
                            <span>Large</span>
                            <MaxButton label="Grande" size="large" />
                        </div>
                        <div class="state-col">
                            <span>Large Slim</span>
                            <MaxButton label="Grande" size="large" slim />
                        </div>
                        <!-- Slot Default vs Slot Slim -->
                        <div class="state-col">
                            <span>Slot Padrão</span>
                            <MaxButton>Conteúdo do Slot</MaxButton>
                        </div>
                        <div class="state-col">
                            <span>Slot Slim</span>
                            <MaxButton slim>Conteúdo do Slot</MaxButton>
                        </div>
                        <!-- Variantes Slim -->
                        <div class="state-col">
                            <span>Outlined Slim</span>
                            <MaxButton label="Outlined" variant="outlined" slim />
                        </div>
                        <div class="state-col">
                            <span>Text Slim</span>
                            <MaxButton label="Text" variant="text" slim />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxButton label="Salvar" disabled />
                        </div>
                        <div class="state-col">
                            <span>Disabled Slim</span>
                            <MaxButton label="Salvar" disabled slim />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxButton label="Excluir" severity="danger" />
                        </div>
                        <div class="state-col">
                            <span>Erro / Secundário Slim</span>
                            <MaxButton label="Excluir" severity="danger" slim />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxIconButton</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxIconButton icon="iconoir:search" aria-label="Buscar" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxIconButton icon="iconoir:search" aria-label="Buscar desabilitado" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxIconButton icon="iconoir:trash" aria-label="Excluir" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLikeButton</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLikeButton />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLikeButton disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLikeButton error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxLink</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxLink />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxLink disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxLink error severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { MaxButton } from '@maxvue/max-components-ui';
    import { MaxIconButton } from '@maxvue/max-components-ui';
    import { MaxLikeButton } from '@maxvue/max-components-ui';
    import { MaxLink } from '@maxvue/max-components-ui';
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
