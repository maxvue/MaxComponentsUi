<template>
    <div class="scenario-content" data-scenario="overlays-popover">
        <h2>Cenário overlays-popover</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxPopover</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxPopover label="Mais ações" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxPopover label="Carregando" loading />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxPopover label="Ajuda" icon="iconoir:help-circle" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxPopoverConfirm</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxPopoverConfirm />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxPopoverConfirm />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxPopoverConfirm />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxPopoverMenu</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxPopoverMenu label="Menu" :items="menuItems" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxPopoverMenu label="Menu vazio" :items="[]" />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxPopoverMenu label="Menu com ícone" icon="iconoir:menu" :items="menuItems" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxTogglePopover</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxTogglePopover label="Confirmar" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxTogglePopover label="Carregando" loading />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxTogglePopover label="Atenção" message="Esta ação precisa de confirmação." />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { MaxPopover } from '@maxvue/max-components-ui';
    import { MaxPopoverConfirm } from '@maxvue/max-components-ui';
    import { MaxPopoverMenu } from '@maxvue/max-components-ui';
    import { MaxTogglePopover } from '@maxvue/max-components-ui';

    const menuItems = [{ label: 'Editar', icon: 'iconoir:edit-pencil' }];
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
