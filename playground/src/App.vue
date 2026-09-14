<template>
    <div class="playground-shell" :class="{ dark: isDark }">
        <header class="playground-shell__header">
            <div class="header-title-group">
                <h1>
                    <span>MaxComponentsUi</span>
                    <span class="header-badge">Design System</span>
                </h1>
                <p>Matriz canônica de componentes, estados e acessibilidade (WCAG 2.1 AA)</p>
            </div>
        </header>

        <main class="playground-shell__body">
            <PlaygroundToolbar
                v-model:active-viewport="activeViewport"
                v-model:selected-family="selectedFamily"
                v-model:search-query="searchQuery"
                v-model:is-dark="isDark"
            />

            <div :class="['playground-shell__viewport-container', `playground-shell__viewport-container--${activeViewport}`]">
                <!-- FAMÍLIA: INPUTS -->
                <section v-if="shouldShowFamily('inputs')" class="family-section">
                    <h2 class="family-heading">Formulários & Inputs</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputText') || matchesSearch('MaxInputTextArea') || matchesSearch('InputBase')"
                        title="Campos Textuais (MaxInputText, MaxInputTextArea, InputBase)"
                        family="inputs"
                        description="Variações de tamanho, ícones, estados de validação, auto-resize e mensagens acessíveis."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <MaxInputText label="Input Obrigatório (50%)" v-model="value.a" required s50 />
                                <MaxInputText label="Com ícone à esquerda" v-model="value.b" icon="humbleicons:box" s50 />
                            </div>
                            <div class="demo-row">
                                <MaxInputText label="Com mensagem informativa" v-model="value.c" message="Mensagem de ajuda acessível" s50 />
                                <MaxInputText label="Desabilitado" v-model="value.d" disabled s50 />
                            </div>
                            <div class="demo-row">
                                <MaxInputTextArea label="Textarea com Auto-resize (maxRows 6)" v-model="textAreaValue1" :maxRows="6" s50 />
                                <MaxInputTextArea label="Textarea Fixo (rows 3)" v-model="textAreaValue3" :autoResize="false" :rows="3" s50 />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputSelect') || matchesSearch('MaxInputAutoComplete')"
                        title="Seletores & AutoComplete (MaxInputSelect, MaxInputAutoComplete)"
                        family="inputs"
                        description="Seletores dropdown estilizados, suporte a ícones e busca dinâmica."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <MaxInputSelect v-model="selectValue" :options="options" label="Select Básico" s50 />
                                <MaxInputSelect v-model="selectValue" :options="optionsWithIcons" label="Select com Ícones" icon="humbleicons:box" s50 />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputPhone') || matchesSearch('MaxInputCep') || matchesSearch('MaxInputCpfCnpj')"
                        title="Máscaras Oficiais Brasileiras (MaxInputPhone, MaxInputCep, MaxInputCpfCnpj)"
                        family="inputs"
                        description="Máscaras reativas para telefone, CEP e alternância automática entre CPF e CNPJ."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <MaxInputPhone v-model="maskPhone" label="Telefone com DDD" s33 />
                                <MaxInputCep v-model="maskCep" label="CEP (8 dígitos)" s33 />
                                <MaxInputCpfCnpj v-model="maskCpf" label="CPF / CNPJ dinâmico" s33 />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputIconPicker') || matchesSearch('MaxColorPicker')"
                        title="Seletores Especiais (MaxInputIconPicker, MaxColorPicker)"
                        family="inputs"
                        description="Seletor interativo de ícones com modal/drawer e paleta de cores hexadecimal."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <MaxInputIconPicker v-model="iconValue" label="Ícone da Categoria" s50 />
                                <MaxColorPicker v-model="colorValue" label="Cor do Tema" s50 />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputMarkdown') || matchesSearch('MaxInputCode')"
                        title="Editores Ricos (MaxInputMarkdown, MaxInputCode)"
                        family="inputs"
                        description="Editor WYSIWYG de Markdown com imagens e editor de código Monaco com realce de sintaxe."
                    >
                        <div class="demo-stack">
                            <MaxInputMarkdown
                                v-model="markdownValue"
                                label="Conteúdo Formatado em Markdown"
                                minHeight="160px"
                                maxHeight="300px"
                            />
                            <div class="code-container">
                                <MaxInputCode v-model="codeValue" language="typescript" />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxInputSwitch') || matchesSearch('MaxInputToggle') || matchesSearch('MaxInputCheckbox')"
                        title="Alternadores & Controles Binários (MaxInputSwitch, MaxInputToggle, MaxInputCheckbox)"
                        family="inputs"
                        description="Controles binários estilizados de ativação e múltipla escolha."
                    >
                        <div class="demo-row">
                            <MaxInputSwitch v-model="switchValue" label="Interruptor Ativo" />
                            <MaxInputToggle v-model="toggleValue" label="Alternador Sim/Não" />
                            <MaxInputCheckbox v-model="checkboxValue" label="Aceito os termos e condições" />
                        </div>
                    </ScenarioCard>
                </section>

                <!-- FAMÍLIA: BOTÕES -->
                <section v-if="shouldShowFamily('buttons')" class="family-section">
                    <h2 class="family-heading">Botões & Ações</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxButton') || matchesSearch('MaxIconButton') || matchesSearch('MaxLikeButton')"
                        title="Variantes e Severidades de Ação (MaxButton, MaxIconButton, MaxLikeButton)"
                        family="buttons"
                        description="Botões com hierarquia visual clara, ícones e estados de hover, active e foco."
                    >
                        <div class="demo-stack">
                            <div class="demo-actions-row">
                                <MaxButton label="Primário (Teal)" severity="primary" @click="handleClick('Primário')" />
                                <MaxButton label="Secundário" severity="secondary" @click="handleClick('Secundário')" />
                                <MaxButton label="Sucesso" severity="success" @click="handleClick('Sucesso')" />
                                <MaxButton label="Atenção" severity="warning" @click="handleClick('Atenção')" />
                                <MaxButton label="Perigo" severity="danger" @click="handleClick('Perigo')" />
                                <MaxButton label="Desabilitado" disabled />
                            </div>
                            <div class="demo-actions-row">
                                <MaxIconButton icon="humbleicons:box" aria-label="Abrir caixa" @click="handleClick('Icon Box')" />
                                <MaxIconButton icon="humbleicons:refresh" aria-label="Recarregar dados" @click="handleClick('Icon Refresh')" />
                                <MaxIconButton icon="humbleicons:trash" aria-label="Excluir item" light @click="handleClick('Icon Trash')" />
                                <MaxLikeButton v-model="likeCount" />
                            </div>
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxButtonConfirm') || matchesSearch('MaxIconConfirm')"
                        title="Ações com Confirmação (MaxButtonConfirm, MaxIconConfirm)"
                        family="buttons"
                        description="Gatilhos de confirmação defensiva para prevenir ações destrutivas acidentais."
                    >
                        <div class="demo-actions-row">
                            <MaxButtonConfirm
                                label="Excluir Registro"
                                severity="danger"
                                confirmTitle="Excluir Permanentemente?"
                                confirmMessage="Esta ação não poderá ser desfeita. Tem certeza de que deseja continuar?"
                                @confirm="handleClick('Registro excluído com sucesso!')"
                            />
                            <MaxIconConfirm
                                icon="humbleicons:trash"
                                aria-label="Remover anexo"
                                confirmTitle="Remover Anexo?"
                                @confirm="handleClick('Anexo removido!')"
                            />
                        </div>
                    </ScenarioCard>

                    <ScenarioCard
                        v-if="matchesSearch('MaxBadge') || matchesSearch('MaxBadgeButton')"
                        title="Badges & Indicadores (MaxBadge, MaxBadgeButton, MaxBadgeButtonsGroup)"
                        family="buttons"
                        description="Pílulas de contagem, estado de processo e severidades visuais."
                    >
                        <div class="demo-actions-row">
                            <MaxBadge value="Novo" severity="info" />
                            <MaxBadge value="12 pendentes" severity="warning" />
                            <MaxBadge value="Concluído" severity="success" />
                            <MaxBadge value="Erro" severity="danger" />
                            <MaxBadgeButton label="Mensagens" badge="5" severity="primary" />
                        </div>
                    </ScenarioCard>
                </section>

                <!-- FAMÍLIA: OVERLAYS -->
                <section v-if="shouldShowFamily('overlays')" class="family-section">
                    <h2 class="family-heading">Overlays & Diálogos</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxModal') || matchesSearch('MaxDrawer') || matchesSearch('MaxToast')"
                        title="Modais, Gavetas & Feedback (MaxModal, MaxDrawer, MaxToast)"
                        family="overlays"
                        description="Camadas acessíveis de diálogo, gavetas deslizantes e notificações do sistema."
                    >
                        <div class="demo-actions-row">
                            <MaxButton label="Abrir Modal de Teste" @click="modalAberto = true" />
                            <MaxButton label="Abrir Gaveta Direita" severity="secondary" @click="drawer_visivel = true" />
                            <MaxButton label="Disparar Toast de Sucesso" severity="success" @click="showSampleToast" />
                        </div>

                        <MaxModal v-model:visible="modalAberto" title="Exemplo de Diálogo Modal">
                            <div class="modal-body-demo">
                                <p>Este modal demonstra a contenção de foco, backdrop escuro e fechamento com a tecla Escape.</p>
                                <div class="modal-actions">
                                    <MaxButton label="Fechar Janela" @click="modalAberto = false" />
                                </div>
                            </div>
                        </MaxModal>

                        <MaxDrawer v-model:visible="drawer_visivel" position="right" title="Gaveta Lateral">
                            <div class="drawer-body-demo">
                                <h4>Informações do Registro</h4>
                                <p>Conteúdo detalhado exibido em painel lateral sem perder o contexto principal.</p>
                            </div>
                        </MaxDrawer>
                    </ScenarioCard>
                </section>

                <!-- FAMÍLIA: PAINÉIS & ABAS -->
                <section v-if="shouldShowFamily('panels')" class="family-section">
                    <h2 class="family-heading">Painéis & Abas</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxTabs') || matchesSearch('MaxAccordion')"
                        title="Navegação por Abas & Acordeões (MaxTabs, MaxAccordion)"
                        family="panels"
                        description="Estruturações expansíveis de informação com transições limpas e acessíveis."
                    >
                        <div class="demo-stack">
                            <MaxTabs v-model="tab_ativa">
                                <MaxTabList>
                                    <MaxTab value="0">Informações Gerais</MaxTab>
                                    <MaxTab value="1">Configurações de Rede</MaxTab>
                                    <MaxTab value="2">Histórico de Alterações</MaxTab>
                                </MaxTabList>
                                <MaxTabPanels>
                                    <MaxTabPanel value="0">
                                        <p class="tab-text">Painel 1: Dados cadastrais da empresa e contatos autorizados.</p>
                                    </MaxTabPanel>
                                    <MaxTabPanel value="1">
                                        <p class="tab-text">Painel 2: Parâmetros do inversor e conexões elétricas homologadas.</p>
                                    </MaxTabPanel>
                                    <MaxTabPanel value="2">
                                        <p class="tab-text">Painel 3: Registro cronológico de auditoria e aprovação técnica.</p>
                                    </MaxTabPanel>
                                </MaxTabPanels>
                            </MaxTabs>

                            <MaxAccordion v-model:value="painel_aberto">
                                <MaxAccordionItem value="a" title="1. O que é a biblioteca @maxvue/max-components-ui?">
                                    <p class="accordion-text">É a suíte oficial de componentes de UI do ecossistema Max, focada em alto desempenho, densidade operacional e acessibilidade WCAG 2.1 AA.</p>
                                </MaxAccordionItem>
                                <MaxAccordionItem value="b" title="2. Como funciona o suporte a tema escuro?">
                                    <p class="accordion-text">Através do seletor .dark na raiz da aplicação, tokens semânticos de superfície e contraste ajustam automaticamente a rampa cromática.</p>
                                </MaxAccordionItem>
                            </MaxAccordion>
                        </div>
                    </ScenarioCard>
                </section>

                <!-- FAMÍLIA: TABELAS & DADOS -->
                <section v-if="shouldShowFamily('data')" class="family-section">
                    <h2 class="family-heading">Tabelas & Exibição</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxListBox') || matchesSearch('MaxDividers')"
                        title="Listagem & Divisores Interativos (MaxListBox, MaxDividers)"
                        family="data"
                        description="Listas com rolagem infinita, filtragem e divisão responsiva com drill-down móvel."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <MaxListBox
                                    v-model="listBoxValue"
                                    :options="listBoxOptions"
                                    placeholder="Buscar empresa..."
                                    style="max-width: 480px;"
                                />
                            </div>
                            <div class="dividers-container">
                                <MaxDividers v-model:active="dividerActivePane" mobile second-title="Detalhes do Registro">
                                    <template #first="{ next }">
                                        <div class="divider-pane">
                                            <strong>Painel Principal (1)</strong>
                                            <p>Simulação de lista com divisão móvel.</p>
                                            <MaxButton label="Ver Detalhes ->" @click="next" />
                                        </div>
                                    </template>
                                    <template #second="{ back }">
                                        <div class="divider-pane">
                                            <strong>Painel Secundário (2)</strong>
                                            <p>Detalhes do registro carregados com navegação de retorno.</p>
                                            <MaxButton label="Voltar" severity="secondary" @click="back" />
                                        </div>
                                    </template>
                                </MaxDividers>
                            </div>
                        </div>
                    </ScenarioCard>
                </section>

                <!-- FAMÍLIA: MÍDIA & IDENTIDADE -->
                <section v-if="shouldShowFamily('media')" class="family-section">
                    <h2 class="family-heading">Mídia & Identidade</h2>

                    <ScenarioCard
                        v-if="matchesSearch('MaxImage') || matchesSearch('MaxCreditCard') || matchesSearch('MaxLoaderIcon')"
                        title="Imagens, Cartões & Indicadores (MaxImage, MaxCreditCard, MaxLoaderIcon)"
                        family="media"
                        description="Visualizadores com zoom e lightbox, cartões interativos e spinners suaves."
                    >
                        <div class="demo-stack">
                            <div class="demo-row">
                                <div class="image-preview-box">
                                    <MaxImage :src="sampleImage1" alt="Amostra de foto 1" width="220px" height="150px" />
                                </div>
                                <div class="credit-card-box">
                                    <MaxCreditCard
                                        name="FULANO DE TAL"
                                        number="4111 2222 3333 4444"
                                        date="12/28"
                                        cvv="123"
                                        :is-flipped="creditCardFlipped"
                                        @click="creditCardFlipped = !creditCardFlipped"
                                    />
                                    <span class="tip-label">Clique no cartão para girar (ou alternar face sem rotação em reduced motion)</span>
                                </div>
                                <div class="loaders-box">
                                    <MaxLoaderIcon />
                                    <MaxDoneIcon />
                                    <MaxErrorIcon />
                                    <MaxWaitIcon />
                                </div>
                            </div>
                        </div>
                    </ScenarioCard>
                </section>
            </div>
        </main>
    </div>
</template>

<script setup lang="ts">
    import { ref, watch, onMounted } from 'vue';
    import PlaygroundToolbar from './components/PlaygroundToolbar.vue';
    import ScenarioCard from './components/ScenarioCard.vue';
    import { PLAYGROUND_CATALOG, type ComponentFamily } from './catalog';

    // Estados de controle da vitrine
    const activeViewport = ref<string>('desktop');
    const selectedFamily = ref<string>('all');
    const searchQuery = ref<string>('');
    const isDark = ref<boolean>(false);

    // Estados reativos dos componentes
    const modalAberto = ref(false);
    const drawer_visivel = ref(false);
    const creditCardFlipped = ref(false);
    const likeCount = ref(42);
    const switchValue = ref(true);
    const toggleValue = ref(false);
    const checkboxValue = ref(true);
    const maskPhone = ref('11987654321');
    const maskCep = ref('01310100');
    const maskCpf = ref('12345678901');
    const colorValue = ref('#00768e');
    const iconValue = ref('humbleicons:box');

    const sampleImage1 = ref('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600');
    const dividerActivePane = ref<1 | 2>(1);

    const textAreaValue1 = ref('Linha 1\nLinha 2\nLinha 3');
    const textAreaValue3 = ref('Texto fixo em 3 linhas\nLinha 2\nLinha 3');
    const markdownValue = ref('# MaxComponentsUi\n\nDesign system operacional com **acessibilidade nativa**.');
    const codeValue = ref('export const config = { active: true, ratio: 0.78 };\n');

    const value = ref({
        a: '',
        b: '',
        c: '',
        d: 'Texto desabilitado'
    });

    const selectValue = ref(1);
    const listBoxValue = ref(null);

    const listBoxOptions = ref([
        { value: 1, label: 'Construtora Alfa', sub_label: 'CNPJ 11.111.111/0001-11', icon: 'mdi:office-building' },
        { value: 2, label: 'Beta Solar', sub_label: 'CNPJ 22.222.222/0001-22', icon: 'mdi:office-building' }
    ]);

    const options = ref([
        { label: 'Opção 1', value: 1 },
        { label: 'Opção 2', value: 2 }
    ]);

    const optionsWithIcons = ref([
        { label: 'Opção Caixa', value: 1, icon: 'humbleicons:box' },
        { label: 'Opção Usuário', value: 2, icon: 'humbleicons:user' }
    ]);

    const tab_ativa = ref('0');
    const painel_aberto = ref<string | undefined>('a');

    // Inicialização a partir dos parâmetros de URL
    onMounted(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('theme') === 'dark') isDark.value = true;
        if (params.get('width')) activeViewport.value = params.get('width') || 'desktop';
        if (params.get('family')) selectedFamily.value = params.get('family') || 'all';
        if (params.get('q')) searchQuery.value = params.get('q') || '';

        updateDarkClass(isDark.value);
    });

    function updateDarkClass(dark: boolean): void {
        document.documentElement.classList.toggle('dark', dark);
        if (dark) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
    }

    watch(isDark, (dark) => {
        updateDarkClass(dark);
        syncUrlParams();
    });

    watch([activeViewport, selectedFamily, searchQuery], () => {
        syncUrlParams();
    });

    function syncUrlParams(): void {
        const params = new URLSearchParams();
        if (isDark.value) params.set('theme', 'dark');
        if (activeViewport.value !== 'desktop') params.set('width', activeViewport.value);
        if (selectedFamily.value !== 'all') params.set('family', selectedFamily.value);
        if (searchQuery.value) params.set('q', searchQuery.value);

        const newSearch = params.toString() ? `?${params.toString()}` : window.location.pathname;
        window.history.replaceState(null, '', newSearch);
    }

    function shouldShowFamily(family: ComponentFamily): boolean {
        if (selectedFamily.value !== 'all' && selectedFamily.value !== family) return false;
        if (!searchQuery.value) return true;

        const q = searchQuery.value.toLowerCase();
        return PLAYGROUND_CATALOG.some((c) => c.family === family && c.name.toLowerCase().includes(q));
    }

    function matchesSearch(componentName: string): boolean {
        if (!searchQuery.value) return true;
        return componentName.toLowerCase().includes(searchQuery.value.toLowerCase());
    }

    function handleClick(msg: string): void {
        console.log('Ação acionada:', msg);
    }

    function showSampleToast(): void {
        alert('Toast disparado! (Integrado via useToastStore)');
    }
</script>

<style lang="scss" scoped>
    .playground-shell {
        display: flex;
        flex-direction: column;
        min-height: 100vh;

        &__header {
            .header-badge {
                font-size: 0.75rem;
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                background-color: var(--max-primary-500, #00768e);
                color: #fff;
                font-weight: 600;
            }
        }

        .family-section {
            margin-bottom: 2.5rem;

            .family-heading {
                font-size: 1.35rem;
                font-weight: 700;
                color: var(--max-primary-500, #00768e);
                margin: 0 0 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid var(--background-200, #e2e8f0);

                .dark & {
                    color: var(--max-primary-400, #178da5);
                    border-bottom-color: var(--background-700, #27272a);
                }
            }
        }

        .demo-stack {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
        }

        .demo-row {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
        }

        .demo-actions-row {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
        }

        .code-container {
            height: 220px;
            width: 100%;
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid var(--background-300, #cbd5e1);
        }

        .modal-body-demo {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;

            .modal-actions {
                display: flex;
                justify-content: flex-end;
            }
        }

        .drawer-body-demo {
            padding: 1.5rem;
        }

        .dividers-container {
            height: 160px;
            border: 1px solid var(--background-200, #e2e8f0);
            border-radius: 8px;
            overflow: hidden;
        }

        .divider-pane {
            padding: 1rem;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .image-preview-box {
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid var(--background-200, #e2e8f0);
        }

        .credit-card-box {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            cursor: pointer;

            .tip-label {
                font-size: 0.75rem;
                color: var(--max-content-secondary, #64748b);
            }
        }

        .loaders-box {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background-color: var(--background-100, #f1f5f9);
            border-radius: 8px;

            .dark & {
                background-color: var(--background-800, #27272a);
            }
        }

        .tab-text,
        .accordion-text {
            margin: 0;
            padding: 0.75rem 0;
            font-size: 0.9rem;
            color: var(--background-700, #334155);

            .dark & {
                color: var(--background-200, #e2e8f0);
            }
        }
    }
</style>
