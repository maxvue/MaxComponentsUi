# Kanban de Acompanhamento de Homologação Solar

## 1. Visão Geral no Odoo

No **Odoo (Projects & CRM)**, a gestão de fluxos de trabalho é estruturada através de uma interface **Kanban altamente configurável, dinâmica e visual**:

- **Estágios Customizáveis com Regras de Transição**: Permite configurar colunas correspondentes às fases do projeto, com requisitos específicos para que um card avance (ex.: bloqueio de avanço se um anexo obrigatório não foi incluído).
- **Controle Rigoroso de SLA (Service Level Agreement)**: Indicadores visuais de tempo limite em cada etapa. Cartões com prazos expirados ou próximos de expirar mudam de cor (amarelo/vermelho), alertando a equipe antes do descumprimento de prazos.
- **Automação de Ações por Mudança de Estágio**: Ao arrastar um card para uma nova coluna, o Odoo pode disparar automaticamente e-mails/notificações para o cliente, atribuir novos responsáveis, agendar tarefas de retorno e atualizar campos do banco de dados.
- **Visualização Rápida e Filtros Multifacetados**: Agrupamento dinâmico por responsável, empresa parceira, prioridade ou urgência, com busca textual instantânea e somatórios automáticos (ex.: valor total de projetos ou potência total em kWp por coluna).
- **Interação Direta no Card**: Permite adicionar notas rápidas, agendar próximas atividades (ligações, e-mails, vistorias) e visualizar o avatar do responsável diretamente na visualização Kanban sem precisar abrir o registro completo.

---

## 2. Situação Atual no Engeapp

No **Engeapp**, o acompanhamento das etapas de homologação solar apresenta desafios e limitações quando comparado à experiência do Odoo:

- **Predomínio de Listas Tabulares Estáticas**: A visualização principal dos projetos em andamento é fortemente baseada em tabelas (`MaxTable`) com paginação e filtros tradicionais. Embora funcional para busca analítica, ela não oferece uma visão panorâmica e intuitiva do funil operacional de homologação.
- **Falta de Gestão Visual de Prazos Regulatórios (SLA ANEEL)**: A homologação solar no Brasil é regida por prazos rígidos da Resolução Normativa ANEEL nº 1.000/2021 (ex.: 15 dias úteis para parecer de acesso sem obras, 30/45 dias com necessidade de reforço de rede, 7 dias úteis para vistoria da concessionária e 5 dias úteis para substituição do medidor por bidirecional). No Engeapp atual, a contagem e os alertas desses prazos dependem de conferência manual de datas ou alertas isolados.
- **Transições Manuais Desconectadas**: A mudança de status do projeto exige a abertura de modais ou edição de campos de formulário, em vez de uma transição fluida de arrastar e soltar (drag-and-drop) que já execute as ações decorrentes do novo estágio.
- **Visibilidade Limitada dos Gargalos por Concessionária**: É difícil para os gestores identificar visualmente em qual etapa as concessionárias (ex.: Cemig, Equatorial, CPFL, Enel, Neoenergia, Energisa) estão represando os projetos ou gerando pareceres com pendências técnicas.

---

## 3. Valor Agregado para o Engeapp

A introdução de um módulo de Kanban dedicado para a homologação solar agrega valor substancial aos integradores e à equipe de engenharia:

- **Redução Drástica de Perdas de Prazos Regulatórios**: A equipe visualiza em tempo real os projetos em risco de estouro de prazo, permitindo abrir chamados e reclamações formais junto à ouvidoria da concessionária ou à ANEEL antes que o cliente sofra atrasos.
- **Gestão de Alta Performance do Funil de Engenharia**: Visão instantânea da carga de trabalho: quantos projetos estão em "Elaboração de Documentação", "Aguardando Parecer de Acesso", "Com Pendência/Nota Técnica", "Solicitação de Vistoria" e "Homologados com Troca de Medidor".
- **Comunicação Automatizada com o Integrador**: Ao arrastar o card para "Parecer de Acesso Emitido", o sistema pode disparar automaticamente um aviso via WhatsApp ou notificação no painel do integrador com o documento em anexo.
- **Maior Produtividade da Equipe Operacional**: Ações rápidas no card (abrir portal da distribuidora, copiar protocolo, visualizar ART/diagrama unifilar, anexar parecer) reduzem o tempo de navegação entre telas em até 40%.

---

## 4. Especificação Técnica Proposta

### Arquitetura Frontend (Vue 3 + Pinia + UnoCSS)

- **Store Especializada (`useHomologationKanbanStore`)**:
  - Estado reativo com caching via `@maxvue/max-pinia`.
  - Estrutura de colunas baseada no ciclo regulatório da ANEEL:
    1. `DRAFT`: Coleta de Documentos / Vistoria Realizada
    2. `PROJECT_DESIGN`: Elaboração de Projeto e Diagramas Unifilares
    3. `SUBMITTED`: Protocolado na Concessionária (Registro de Protocolo e Data)
    4. `ACCESS_ANALYSIS`: Em Análise de Parecer de Acesso (Controle de SLA)
    5. `PENDING_REVIEW`: Pendência Concessionária / Nota Técnica (Contador de dias para saneamento)
    6. `ACCESS_APPROVED`: Parecer de Acesso Deferido / Autorização de Obra
    7. `INSPECTION_REQUESTED`: Obra Concluída / Solicitação de Vistoria da Distribuidora
    8. `METER_CHANGE`: Vistoria Aprovada / Aguardando Substituição do Medidor
    9. `COMPLETED`: Homologado / Conexão Ativa no Sistema de Compensação
- **Drag-and-Drop Fluido e Acessível**: Implementação baseada em `@vueuse/gesture` ou `sortablejs` com suporte a teclado e toque para tablets.
- **Controle de SLA Reativo**: Helper computado calculando a contagem regressiva em dias úteis com base no calendário de feriados nacionais e da concessionária.
- **Websockets em Tempo Real (Laravel Reverb)**: Atualização instantânea dos cards entre diferentes membros da equipe de engenharia sem recarregar a página (eventos `HomologationStatusChanged`, `SlaBreachedWarning`).

### Backend (Laravel 13 + PHP 8.5 + Horizon)

- **Modelos e Estrutura**:
  - `HomologationProcess`: Entidade com relacionamento para `Project`, `Customer`, `UtilityCompany` (Concessionária), `Stage`, `SlaDeadline`, `Protocols`.
  - `HomologationStage`: Definição dinâmica de colunas, prazos padrão de SLA e gatilhos de automação.
  - `HomologationHistory`: Log imutável de transições de estágio com tempo de permanência em cada coluna.
- **Jobs de Verificação de SLA (Scheduled via Horizon)**:
  - Job executado a cada hora para recalcular status dos prazos e disparar alertas preventivos de SLA.
- **Transições de Estado com Spatie Model States**:
  - Validação estrita das regras de negócio (ex.: não é possível mover para `SUBMITTED` sem o campo `numero_protocolo` e arquivo de solicitação de acesso anexado).

---

## 5. Componentes de UI Sugeridos

### Componentes Existentes em `MaxComponentsUi`:
- `MaxPageLayout` / `MaxPageContent`: Estrutura principal da página com cabeçalho de busca e ações.
- `MaxTopToolbar`: Barra superior contendo filtros rápidos por Concessionária, Tipo de Ligação (Grupo B / Grupo A) e Integrador.
- `MaxInputSearch`: Campo de busca em tempo real por nome do cliente, código da UC ou número de protocolo.
- `MaxBadge`: Exibição visual de status, prioridade (Alta, Média, Baixa) e alertas de SLA (ex.: "Vence em 2 dias", "Atrasado há 1 dia").
- `MaxUserAvatar`: Foto do projetista ou engenheiro responsável pelo processo.
- `MaxIconButton`: Botões de ações contextuais nos cards (abrir WhatsApp, visualizar PDF do parecer, anexar documento).
- `MaxModal`: Janela modal para saneamento rápido de pendências ou entrada de protocolo.
- `MaxToast`: Mensagens de confirmação ao mover cards ou acionar integrações.

### Novos Componentes a Serem Desenvolvidos:
- `MaxKanbanBoard`: Container flexível com rolagem horizontal suave e gerenciamento de colunas.
- `MaxKanbanColumn`: Coluna individual com cabeçalho contendo contagem de cards, soma de potência (kWp), indicador de colapso/expansão e lista ordenável.
- `MaxKanbanCard`: Card do projeto contendo dados essenciais da UC, concessionária, potência, protocolo, badge de SLA com contador regressivo e avatares.
- `MaxSlaIndicator`: Barra ou chip com cores dinâmicas (verde, amarelo, vermelho) indicando o percentual decorrido do prazo da ANEEL.
