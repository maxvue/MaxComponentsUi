<template>
    <div class="scenario-content" data-scenario="inputs-rich">
        <h2>Cenário inputs-rich</h2>
        <div class="scenario-inner">
            <div class="variants">

                <div class="component-block">
                    <h3>MaxInputMarkdown</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputMarkdown v-bind="scenarioProps" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputMarkdown v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputMarkdown v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputMarkdownToolbar</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputMarkdownToolbar v-bind="scenarioProps" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputMarkdownToolbar v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputMarkdownToolbar v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                <div class="component-block">
                    <h3>MaxInputHtml</h3>
                    <div class="states">
                        <!-- Default com texto formatado de procuração -->
                        <div class="state-col">
                            <span>Normal (Exemplo Procuração Jurídica)</span>
                            <MaxInputHtml v-model="procuracaoHtml" min-height="180px" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputHtml v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputHtml v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputHtmlToolbar</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputHtmlToolbar v-bind="scenarioProps" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputHtmlToolbar v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputHtmlToolbar v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCode</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCode v-bind="scenarioProps" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCode v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputCode v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>

                <div class="component-block">
                    <h3>MaxInputCodeToolbar</h3>
                    <div class="states">
                        <!-- Default -->
                        <div class="state-col">
                            <span>Normal</span>
                            <MaxInputCodeToolbar v-bind="scenarioProps" />
                        </div>
                        <!-- Disabled -->
                        <div class="state-col">
                            <span>Disabled</span>
                            <MaxInputCodeToolbar v-bind="scenarioProps" disabled />
                        </div>
                        <!-- Error / Variant -->
                        <div class="state-col">
                            <span>Erro / Secundário</span>
                            <MaxInputCodeToolbar v-bind="scenarioProps" error severity="danger" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import { MaxInputMarkdown } from '@maxvue/max-components-ui';
    import { MaxInputMarkdownToolbar } from '@maxvue/max-components-ui';
    import { MaxInputHtml } from '@maxvue/max-components-ui';
    import { MaxInputHtmlToolbar } from '@maxvue/max-components-ui';
    import { MaxInputCode } from '@maxvue/max-components-ui';
    import { MaxInputCodeToolbar } from '@maxvue/max-components-ui';

    // Os cenários compartilham props neutras para satisfazer os contratos dos
    // componentes sem ocultar a renderização dos estados demonstrados.
    const scenarioProps: any = { modelValue: '', options: [], items: [], route: '/', target: document.body };

    const procuracaoHtml = ref(
        '<p class="ql-align-justify"><span>Por este instrumento de procuração e na melhor forma de direito, o outorgante <span style="font-weight: bold">WARLY REINIE ALVES PEREIRA</span>, brasileiro portador do CPF: <span nowrap style="white-space: nowrap;"><span style="font-weight: bold">045.111.211‑33</span></span> residente e domiciliado em <span style="font-weight: bold">RUA PEDRO OLIVEIRA RIBEIRO</span>, <span style="font-weight: bold">, SN</span>, <span style="font-weight: bold">QUADRA 06 LOTE 62, MANDINOPOLIS</span>, <span style="font-weight: bold">SETOR CENTRAL</span>, município de <span nowrap style="white-space: nowrap;"><span style="font-weight: bold">GUARINOS</span></span></span>, CEP: <span style="font-weight: bold"><span nowrap style="white-space: nowrap;">76374‑000</span></span> e constitui seu procurador legal o outorgado e responsável técnico <span style="font-weight: bold"><span nowrap style="white-space: nowrap;">JOHNATTAS CONRADY SANTANA</span></span>, portador do registro profissional e <span style="font-weight: bold"><span nowrap style="white-space: nowrap;">CPF 01706486138</span></span>, residente e domiciliado na <span style="font-weight: bold">RUA PRESIDENTE JACKSON, QD. 86,. LT. 14</span>, <span style="font-weight: bold">, S/N</span>, <span style="font-weight: bold">JARDIM PRESIDENTE</span>, município de <span nowrap style="white-space: nowrap;"><span style="font-weight: bold">GOIÂNIA</span></span></span>, CEP: <span style="font-weight: bold"><span nowrap style="white-space: nowrap;">74353‑200</span></span>, com poderes para junto à <span style="font-weight: bold">EQUATORIAL</span>, solicitar troca de titularidade, liberação de carga, autorizar e <span style="font-weight: bold">ASSINAR DOCUMENTOS RELACIONADOS À GERAÇÃO DISTRIBUÍDA</span>, incluindo projetos, cadastros, termos de compromissos e responsabilidades, parecer de acesso, ou outros documentos necessários para a homologação e execução do projeto fotovoltaico, proceder com eventuais reclamações formais junto à distribuidora, ouvidoria, PROCON estadual, Consumidor.gov ou ANEEL, solicitar acesso e vistorias <span style="font-weight: bold">PARA GERAÇÃO DISTRIBUÍDA</span>, enfim, praticar todos os atos necessários para registro, execução, vistoria e homologação de Usinas Solares Fotovoltaicas e seus excedentes de energia (quando houver), <span style="font-weight: bold">INCLUSIVE</span>, atividades ou processos de geração distribuída relacionados a <span style="font-weight: bold">OUTRAS UNIDADES CONSUMIDORAS</span> de propriedade ou responsabilidade do outorgante, e em especial a propriedade situada na <span style="font-weight: bold">RUA PEDRO OLIVEIRA RIBEIRO</span>, <span style="font-weight: bold">, SN</span>, <span style="font-weight: bold">QUADRA 06 LOTE 62, MANDINOPOLIS</span>, <span style="font-weight: bold">SETOR CENTRAL</span>, município de <span nowrap style="white-space: nowrap;"><span style="font-weight: bold">GUARINOS</span></span></span>, CEP: <span style="font-weight: bold"><span nowrap style="white-space: nowrap;">76374‑000</span></span> com unidade consumidora de número <span style="font-weight: bold">4529421263</span> de propriedade do outorgante. Permanecendo este documento com<span style="font-weight: bold"> VENCIMENTO</span> na data de aprovação da vistoria do projeto perante a concessionária ou no máximo <span style="font-weight: bold">180 dias</span>, o que ocorrer primeiro.<br><br><br>Guarinos, quinta-feira, 17 de setembro de 2026</span></p>'
    );
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
