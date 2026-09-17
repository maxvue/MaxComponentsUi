import { SCENARIO_LOADERS } from './scenarios';

export type ComponentFamily =
    | 'inputs'
    | 'buttons'
    | 'navigation'
    | 'layout'
    | 'data'
    | 'overlays'
    | 'panels'
    | 'media'
    | 'transitions';

export interface CatalogComponent {
    name: string;
    family: ComponentFamily;
    scenarioId: string;
    description: string;
    isAlias?: boolean;
    aliasOf?: string;
    isExperimental?: boolean;
}

export interface FamilyInfo {
    id: ComponentFamily;
    label: string;
    description: string;
}

export const FAMILIES: FamilyInfo[] = [
    { id: 'inputs', label: 'Formulários & Inputs', description: 'Controles de entrada de texto, números, máscaras, datas e seletores.' },
    { id: 'buttons', label: 'Botões & Ações', description: 'Gatilhos de ação, botões com confirmação, ícones e badges.' },
    { id: 'navigation', label: 'Navegação & Menus', description: 'Barras de ferramentas, menus superiores, laterais e itens de navegação.' },
    { id: 'layout', label: 'Layout & Estrutura', description: 'Containers de aplicação, grids, divisores e cascas de página.' },
    { id: 'data', label: 'Tabelas & Exibição', description: 'Tabelas de dados, listagens, gráficos e visualizadores.' },
    { id: 'overlays', label: 'Overlays & Diálogos', description: 'Modais, drawers, popovers e notificações toast.' },
    { id: 'panels', label: 'Painéis & Abas', description: 'Acordeões, grupos de abas e painéis expansíveis.' },
    { id: 'media', label: 'Mídia & Identidade', description: 'Imagens, cartões, ícones semânticos, loaders e avatares.' },
    { id: 'transitions', label: 'Transições & Motion', description: 'Primitivas acessíveis de transição e animação.' }
];

export const PLAYGROUND_CATALOG: CatalogComponent[] = [
    // Inputs (39)
    { name: 'InputBase', family: 'inputs', scenarioId: 'inputs-text', description: 'Base estrutural e semântica compartilhada para campos de formulário.' },
    { name: 'MaxInputText', family: 'inputs', scenarioId: 'inputs-text', description: 'Campo de entrada textual com suporte a ícones, mensagens e estados.' },
    { name: 'MaxInputTextArea', family: 'inputs', scenarioId: 'inputs-text', description: 'Área de texto multilinha com auto-resize ou dimensões fixas.' },
    { name: 'MaxTextInputFloatLabel', family: 'inputs', scenarioId: 'inputs-text', description: 'Campo textual com rótulo flutuante estilizado.', isAlias: true, aliasOf: 'MaxInputText' },
    { name: 'MaxInputSelect', family: 'inputs', scenarioId: 'inputs-select', description: 'Seletor dropdown estilizado com busca e ícones opcionais.' },
    { name: 'MaxInputPhone', family: 'inputs', scenarioId: 'inputs-masks', description: 'Input telefônico com máscara nacional e internacional automática.' },
    { name: 'MaxInputPhoneMail', family: 'inputs', scenarioId: 'inputs-masks', description: 'Input dinâmico para telefone ou e-mail com alternância de máscara.' },
    { name: 'MaxInputCep', family: 'inputs', scenarioId: 'inputs-masks', description: 'Input de CEP brasileiro com máscara e validação de 8 dígitos.' },
    { name: 'MaxInputCheckbox', family: 'inputs', scenarioId: 'inputs-toggles', description: 'Caixa de seleção acessível com estados marcado, desmarcado e indeterminado.' },
    { name: 'MaxInputCpfCnpj', family: 'inputs', scenarioId: 'inputs-masks', description: 'Input com alternância inteligente de máscara entre CPF (11) e CNPJ (14).' },
    { name: 'MaxInputCoordinateDecimalLat', family: 'inputs', scenarioId: 'inputs-coords', description: 'Input especializado para latitude em graus decimais (-90 a 90).' },
    { name: 'MaxInputCoordinateDecimalLng', family: 'inputs', scenarioId: 'inputs-coords', description: 'Input especializado para longitude em graus decimais (-180 a 180).' },
    { name: 'MaxInputDatePicker', family: 'inputs', scenarioId: 'inputs-select', description: 'Seletor de data com calendário modal ou embutido no padrão pt-BR.' },
    { name: 'MaxInputBirthday', family: 'inputs', scenarioId: 'inputs-select', description: 'Seletor de data de nascimento com 3 seletores customizados (Dia, Mês, Ano) separados por "de".' },
    { name: 'MaxInputFile', family: 'inputs', scenarioId: 'inputs-files', description: 'Controle compacto para upload e seleção de arquivos locais.' },
    { name: 'MaxInputFileProject', family: 'inputs', scenarioId: 'inputs-files', description: 'Gerenciador especializado de anexos em nível de projeto.' },
    { name: 'MaxInputFileUpload', family: 'inputs', scenarioId: 'inputs-files', description: 'Área completa de envio de arquivos com barra de progresso.' },
    { name: 'MaxInputFileUploadBig', family: 'inputs', scenarioId: 'inputs-files', description: 'Área de dropzone ampla para arrastar e soltar múltiplos arquivos.' },
    { name: 'MaxInputFileUploadButton', family: 'inputs', scenarioId: 'inputs-files', description: 'Botão de disparo para seleção de arquivo no sistema.' },
    { name: 'MaxInputIconPicker', family: 'inputs', scenarioId: 'inputs-special', description: 'Seletor interativo de ícones com modal/drawer e busca.' },
    { name: 'MaxInputMarkdown', family: 'inputs', scenarioId: 'inputs-rich', description: 'Editor avançado de Markdown com visualização ao vivo e suporte a imagens.' },
    { name: 'MaxInputMarkdownToolbar', family: 'inputs', scenarioId: 'inputs-rich', description: 'Barra de ferramentas de formatação para o editor de Markdown.' },
    { name: 'MaxInputHtml', family: 'inputs', scenarioId: 'inputs-rich', description: 'Editor visual WYSIWYG de HTML rico com alinhamento de texto e formatações jurídicas.' },
    { name: 'MaxInputHtmlToolbar', family: 'inputs', scenarioId: 'inputs-rich', description: 'Barra de ferramentas de formatação e alinhamento para o editor HTML.' },
    { name: 'MaxInputCode', family: 'inputs', scenarioId: 'inputs-rich', description: 'Editor de código-fonte integrado com realce de sintaxe.' },
    { name: 'MaxInputCodeToolbar', family: 'inputs', scenarioId: 'inputs-rich', description: 'Barra de atalhos e utilitários para o editor de código.' },
    { name: 'MaxInputCreditCard', family: 'inputs', scenarioId: 'inputs-cards', description: 'Input para número do cartão de crédito com identificação da bandeira.' },
    { name: 'MaxInputCreditCardCvv', family: 'inputs', scenarioId: 'inputs-cards', description: 'Input numérico para código de segurança CVV/CVC do cartão.' },
    { name: 'MaxInputCreditCardDate', family: 'inputs', scenarioId: 'inputs-cards', description: 'Input para data de expiração MM/AA do cartão de crédito.' },
    { name: 'MaxInputNumber', family: 'inputs', scenarioId: 'inputs-special', description: 'Input numérico com controles incrementais e limites.' },
    { name: 'MaxInputOTP', family: 'inputs', scenarioId: 'inputs-special', description: 'Input segmentado para códigos de verificação em dois fatores (OTP).' },
    { name: 'MaxInputRadio', family: 'inputs', scenarioId: 'inputs-toggles', description: 'Botão de rádio acessível para opções exclusivas.' },
    { name: 'MaxInputSearch', family: 'inputs', scenarioId: 'inputs-text', description: 'Campo especializado para pesquisas rápidas com botão de limpar.' },
    { name: 'MaxInputSwitch', family: 'inputs', scenarioId: 'inputs-toggles', description: 'Interruptor estilo switch liga/desliga com estados nítidos.' },
    { name: 'MaxInputTextList', family: 'inputs', scenarioId: 'inputs-special', description: 'Lista dinâmica de entradas de texto adicionáveis e removíveis.' },
    { name: 'MaxInputToggle', family: 'inputs', scenarioId: 'inputs-toggles', description: 'Alternador binário estilizado com rótulo descritivo.' },
    { name: 'MaxInputTypeAddress', family: 'inputs', scenarioId: 'inputs-masks', description: 'Conjunto coordenado para preenchimento de endereço e logradouro.' },
    { name: 'MaxInputAutoComplete', family: 'inputs', scenarioId: 'inputs-select', description: 'Input com sugestões dinâmicas locais conforme digitação.' },
    { name: 'MaxInputAutoCompleteApi', family: 'inputs', scenarioId: 'inputs-select', description: 'Input com busca e sugestões via endpoint remoto assíncrono.' },
    { name: 'MaxChips', family: 'inputs', scenarioId: 'inputs-tags', description: 'Campo de entrada de tags em formato de pílula (chips).' },
    { name: 'MaxColorPicker', family: 'inputs', scenarioId: 'inputs-special', description: 'Seletor de cor hexadecimal com paleta e amostra visual.' },
    { name: 'MaxTagSelect', family: 'inputs', scenarioId: 'inputs-tags', description: 'Seletor múltiplo estilizado de tags com remoção rápida.' },
    { name: 'MaxTagsList', family: 'inputs', scenarioId: 'inputs-tags', description: 'Exibição de coleção de tags com variantes semânticas de cor.' },

    // Buttons (10)
    { name: 'MaxButton', family: 'buttons', scenarioId: 'buttons-main', description: 'Botão primário, secundário e variantes de severidade da marca Max.' },
    { name: 'MaxButtonConfirm', family: 'buttons', scenarioId: 'buttons-confirm', description: 'Botão que dispara diálogo/popover de confirmação antes de executar a ação.' },
    { name: 'MaxIconButton', family: 'buttons', scenarioId: 'buttons-main', description: 'Botão compacto com ícone central e estados de foco acessíveis.' },
    { name: 'MaxIconConfirm', family: 'buttons', scenarioId: 'buttons-confirm', description: 'Ícone interativo com confirmação popover integrada.' },
    { name: 'MaxBadgeButton', family: 'buttons', scenarioId: 'buttons-badges', description: 'Botão estilizado com indicador badge posicionado.' },
    { name: 'MaxBadgeButtonsGroup', family: 'buttons', scenarioId: 'buttons-badges', description: 'Grupo horizontal ou vertical de botões em formato de badge.' },
    { name: 'MaxBadge', family: 'buttons', scenarioId: 'buttons-badges', description: 'Indicador visual de contagem, estado ou severidade.' },
    { name: 'MaxBadgeComponent', family: 'buttons', scenarioId: 'buttons-badges', description: 'Alias de compatibilidade para MaxBadge.', isAlias: true, aliasOf: 'MaxBadge' },
    { name: 'MaxTag', family: 'buttons', scenarioId: 'buttons-badges', description: 'Alias de compatibilidade para MaxBadge.', isAlias: true, aliasOf: 'MaxBadge' },
    { name: 'MaxLikeButton', family: 'buttons', scenarioId: 'buttons-main', description: 'Botão reativo de curtir com animação e contador de likes.' },
    { name: 'MaxLink', family: 'buttons', scenarioId: 'buttons-main', description: 'Componente de navegação em link com estilo acessível.' },

    // Navigation (8)
    { name: 'MaxTopMenu', family: 'navigation', scenarioId: 'nav-menus', description: 'Menu de cabeçalho principal da aplicação com logo e perfil.' },
    { name: 'MaxTopMenuSearchBar', family: 'navigation', scenarioId: 'nav-menus', description: 'Barra de pesquisa integrada ao topo da aplicação.' },
    { name: 'MaxTopToolbar', family: 'navigation', scenarioId: 'nav-toolbars', description: 'Barra de ferramentas de ação contextual no topo da página.' },
    { name: 'MaxTopToolbarSubmenu', family: 'navigation', scenarioId: 'nav-toolbars', description: 'Menu desdobrável de ações para ferramentas de topo.' },
    { name: 'MaxBottomMenu', family: 'navigation', scenarioId: 'nav-menus', description: 'Barra de navegação inferior otimizada para dispositivos móveis.' },
    { name: 'MaxSideMenu', family: 'navigation', scenarioId: 'nav-side', description: 'Menu lateral expansível da aplicação desktop.' },
    { name: 'MaxSideMenuMobile', family: 'navigation', scenarioId: 'nav-side', description: 'Versão gaveta do menu lateral para telas menores.' },
    { name: 'MaxMenuVerticalItem', family: 'navigation', scenarioId: 'nav-side', description: 'Item semântico para listas de navegação vertical.' },

    // Layout (9)
    { name: 'MaxApp', family: 'layout', scenarioId: 'layout-shell', description: 'Casca raiz de layout e provedor global de tema do sistema.' },
    { name: 'MaxContainerApp', family: 'layout', scenarioId: 'layout-shell', description: 'Container estrutural com largura máxima e padding seguros.' },
    { name: 'MaxPageLayout', family: 'layout', scenarioId: 'layout-shell', description: 'Layout estruturado de página desktop com áreas de cabeçalho e corpo.' },
    { name: 'MaxPageMobileLayout', family: 'layout', scenarioId: 'layout-shell', description: 'Layout de página responsivo ajustado para viewports mobile.' },
    { name: 'MaxPageContent', family: 'layout', scenarioId: 'layout-shell', description: 'Área principal de conteúdo com moldura canônica e contraste.' },
    { name: 'MaxGrid', family: 'layout', scenarioId: 'layout-grid', description: 'Grid responsivo de 12 colunas com classes de largura s10 a s100.' },
    { name: 'MaxGridCols', family: 'layout', scenarioId: 'layout-grid', description: 'Container de colunas automáticas para layouts flexíveis.' },
    { name: 'MaxDividers', family: 'layout', scenarioId: 'layout-dividers', description: 'Divisores horizontais e verticais com rótulo ou drill-down.' },
    { name: 'MaxEmptyDiv', family: 'layout', scenarioId: 'layout-grid', description: 'Espaçador flexível para ajuste de alinhamento em grids.' },

    // Data (8)
    { name: 'MaxTable', family: 'data', scenarioId: 'data-table', description: 'Tabela de dados avançada com ordenação, paginação e seleções.' },
    { name: 'MaxTableColumn', family: 'data', scenarioId: 'data-table', description: 'Definição de coluna estruturada para MaxTable.' },
    { name: 'MaxTableFields', family: 'data', scenarioId: 'data-table', description: 'Configurador e organizador visual de colunas visíveis.' },
    { name: 'MaxListBox', family: 'data', scenarioId: 'data-listbox', description: 'Lista interativa de opções selecionáveis simples ou múltiplas.' },
    { name: 'MaxChart', family: 'data', scenarioId: 'data-chart', description: 'Renderizador de gráficos analíticos e métricas visuais.' },
    { name: 'MaxStats', family: 'data', scenarioId: 'data-stats', description: 'Card de estatísticas e indicadores com ícone e variação percentual.' },
    { name: 'MaxPdfView', family: 'data', scenarioId: 'data-pdf', description: 'Visualizador integrado de documentos PDF com controles.' },
    { name: 'MaxTimeline', family: 'data', scenarioId: 'data-table', description: 'Linha do tempo vertical ou horizontal para exibição de eventos sequenciais.' },

    // Overlays (8)
    { name: 'MaxModal', family: 'overlays', scenarioId: 'overlays-modal', description: 'Janela modal acessível com backdrop, foco controlado e fechar por Escape.' },
    { name: 'MaxDrawer', family: 'overlays', scenarioId: 'overlays-drawer', description: 'Gaveta deslizante lateral ou vertical para informações complementares.' },
    { name: 'MaxPopover', family: 'overlays', scenarioId: 'overlays-popover', description: 'Caixa de conteúdo contextual ancorada ao elemento disparador.' },
    { name: 'MaxPopoverConfirm', family: 'overlays', scenarioId: 'overlays-popover', description: 'Popover especializado em confirmação rápida Sim/Não.' },
    { name: 'MaxPopoverMenu', family: 'overlays', scenarioId: 'overlays-popover', description: 'Menu de contexto em popover com lista de ações.' },
    { name: 'MaxTogglePopover', family: 'overlays', scenarioId: 'overlays-popover', description: 'Gatilho de alternância simples para abrir e fechar popovers.' },
    { name: 'MaxToast', family: 'overlays', scenarioId: 'overlays-toast', description: 'Notificação flutuante com temporizador, ações e feedback acessível.' },
    { name: 'MaxMsgLabels', family: 'overlays', scenarioId: 'overlays-toast', description: 'Rótulos contextuais de mensagens informativas ou de alerta.' },

    // Panels (8)
    { name: 'MaxAccordion', family: 'panels', scenarioId: 'panels-accordion', description: 'Container agrupador de seções sanfonadas expansíveis.' },
    { name: 'MaxAccordionItem', family: 'panels', scenarioId: 'panels-accordion', description: 'Item individual sanfonado com cabeçalho e corpo colapsável.' },
    { name: 'MaxTabs', family: 'panels', scenarioId: 'panels-tabs', description: 'Container raiz para navegação por abas.' },
    { name: 'MaxTabList', family: 'panels', scenarioId: 'panels-tabs', description: 'Barra horizontal ou vertical de cabeçalhos de abas.' },
    { name: 'MaxTab', family: 'panels', scenarioId: 'panels-tabs', description: 'Gatilho de aba individual com estado ativo e foco.' },
    { name: 'MaxTabPanels', family: 'panels', scenarioId: 'panels-tabs', description: 'Container de exibição dos corpos de conteúdo das abas.' },
    { name: 'MaxTabPanel', family: 'panels', scenarioId: 'panels-tabs', description: 'Painel de conteúdo correspondente a uma aba.' },
    { name: 'MaxTabItem', family: 'panels', scenarioId: 'panels-tabs', description: 'Abstração consolidada de aba e conteúdo integrado.' },

    // Media & Identity (18)
    { name: 'MaxImage', family: 'media', scenarioId: 'media-image', description: 'Visualizador de imagem com zoom, fallback e lightbox integrado.' },
    { name: 'MaxIcon', family: 'media', scenarioId: 'media-icons', description: 'Renderizador padronizado de ícones Iconify com cache local.' },
    { name: 'MaxAiIcon', family: 'media', scenarioId: 'media-icons', description: 'Ícone semântico temático de inteligência artificial com variantes.' },
    { name: 'MaxDoneIcon', family: 'media', scenarioId: 'media-icons', description: 'Ícone indicador de conclusão e sucesso com cor canônica.' },
    { name: 'MaxErrorIcon', family: 'media', scenarioId: 'media-icons', description: 'Ícone indicador de erro ou falha operacional.' },
    { name: 'MaxWaitIcon', family: 'media', scenarioId: 'media-icons', description: 'Ícone indicador de espera ou processamento pendente.' },
    { name: 'MaxLoader', family: 'media', scenarioId: 'media-loaders', description: 'Indicador geral de carregamento com texto explicativo.' },
    { name: 'MaxLoaderAi', family: 'media', scenarioId: 'media-loaders', description: 'Loader estilizado com tema de processamento por IA.' },
    { name: 'MaxLoaderIcon', family: 'media', scenarioId: 'media-loaders', description: 'Ícone circular animado de carregamento contínuo.' },
    { name: 'MaxLoadScreen', family: 'media', scenarioId: 'media-loaders', description: 'Bloqueador visual de tela cheia para operações bloqueantes.' },
    { name: 'MaxLoadScreenTarget', family: 'media', scenarioId: 'media-loaders', description: 'Máscara de carregamento restrita a um elemento alvo.' },
    { name: 'MaxLogo', family: 'media', scenarioId: 'media-brand', description: 'Renderizador de logotipo da aplicação consumidora.' },
    { name: 'MaxMaps', family: 'media', scenarioId: 'media-brand', description: 'Visualizador de mapa geográfico com marcadores de coordenadas.' },
    { name: 'MaxUserAvatar', family: 'media', scenarioId: 'media-brand', description: 'Avatar de usuário com iniciais, imagem e indicador de status.' },
    { name: 'MaxUserSection', family: 'media', scenarioId: 'media-brand', description: 'Seção de perfil do usuário com avatar, nome e ações rápidas.' },
    { name: 'MaxAuthCard', family: 'media', scenarioId: 'media-brand', description: 'Cartão completo de login e autenticação com múltiplos métodos.' },
    { name: 'MaxCreditCard', family: 'media', scenarioId: 'media-brand', description: 'Representação visual de cartão de crédito com flip frente e verso.' },
    { name: 'MaxTitle1', family: 'media', scenarioId: 'media-brand', description: 'Título de nível 1 com tipografia canônica compacta.' },
    { name: 'MaxTitle2', family: 'media', scenarioId: 'media-brand', description: 'Título de nível 2 com contraste e hierarquia harmoniosa.' },

    // Transitions (4)
    { name: 'MaxAnimateFade', family: 'transitions', scenarioId: 'trans-fade', description: 'Transição suave de entrada e saída por opacidade.' },
    { name: 'MaxTransitionFadeLight', family: 'transitions', scenarioId: 'trans-fade', description: 'Transição leve de fade para elementos secundários.' },
    { name: 'MaxTransitionUp', family: 'transitions', scenarioId: 'trans-motion', description: 'Transição com deslizamento vertical e suporte a movimento reduzido.' },
    { name: 'TransitionFade', family: 'transitions', scenarioId: 'trans-fade', description: 'Primitiva pública de fade para transições de componentes.', isAlias: true, aliasOf: 'MaxAnimateFade' }
];

export function getComponentsByFamily(family: ComponentFamily): CatalogComponent[] {
    return PLAYGROUND_CATALOG.filter((item) => item.family === family);
}

export function getAllComponents(): CatalogComponent[] {
    return [...PLAYGROUND_CATALOG];
}

export function getCoverageStats() {
    const total = PLAYGROUND_CATALOG.length;
    const aliases = PLAYGROUND_CATALOG.filter((item) => item.isAlias).length;
    const canonical = total - aliases;
    const coveredCount = PLAYGROUND_CATALOG.filter((item) => Boolean(SCENARIO_LOADERS[item.scenarioId])).length;
    const coveragePercentage = total > 0 ? Math.round((coveredCount / total) * 100) : 0;
    return {
        total,
        canonical,
        aliases,
        coveredCount,
        coveragePercentage
    };
}
