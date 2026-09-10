# Fluxo Conversacional Visual para Triagem e Qualificação de Leads Solares

## 1. Visão Geral no Typebot
O **Typebot** é uma das principais referências globais em automação conversacional visual no-code/low-code. Sua arquitetura e experiência de usuário baseiam-se em:
- **Construtor Visual de Grafos (Node-Based Flow Builder):** Interface drag-and-drop intuitiva com canvas infinito, onde blocos de conteúdo e interação são organizados em grupos e nós conectados por arestas direcionadas.
- **Blocos Nativos Especializados:** 
  - *Mensagens:* Texto formatado com rich text, imagens, vídeos, áudios e embeds.
  - *Entradas de Usuário (Input Blocks):* Coleta de texto livre, números com validação de formato, email, telefone com validação de código de país, botões de escolha única (Quick Replies) e menus suspensos com busca.
  - *Lógica e Condicionais:* Blocos de bifurcação (Branching/Condition) que avaliam expressões lógicas baseadas no valor de variáveis da sessão (ex.: `fatura > 500 AND tipo_imovel == 'proprio'`).
  - *Manipulação de Variáveis:* Criação dinâmica de variáveis em tempo de execução (`{{nome}}`, `{{consumo_kwh}}`, `{{concessionaria}}`), interpolação de strings e cálculos via JavaScript em blocos de script.
  - *Integrações Externas:* Blocos de requisição HTTP (Webhook / API Call) assíncronas com tratamento de resposta JSON e mapeamento de campos para variáveis internas.
- **Execução Omnichannel:** O mesmo fluxo desenhado no canvas pode ser executado em formato de widget web incorporado, página de destino (landing page) dedicada ou adaptado para canais de mensageria como WhatsApp.

## 2. Situação Atual no Engeapp
Atualmente, no ecossistema Engeapp:
- **Módulo de Chat Estritamente Reativo e Humano:** A interface de WhatsApp do Engeapp (`resources/Vue/Sections/supportChat/`) funciona como um mensageiro centralizado para atendentes humanos. O envio de mensagens automatizadas é limitado a templates pré-aprovados da Meta (`ChatInputTemplatesPopover.vue`).
- **Inexistência de Construtor de Fluxos Visuais:** Não há qualquer editor gráfico no Engeapp para desenhar árvores de decisão, árvores de diálogo ou fluxos conversacionais ramificados.
- **Triagem Inexistente ou Rígida via Código:** Qualquer tentativa de automação de primeiro contato exige implementação estática em código PHP/Laravel (`switch/case` ou `if/else`), sem flexibilidade para o integrador fotovoltaico ou administrador da plataforma alterar perguntas, ordens ou regras de qualificação sem deploy de código.
- **Gargalo no Primeiro Atendimento de Leads:** Fora do horário comercial (noites e finais de semana), o lead solar que entra em contato via WhatsApp fica sem resposta por horas. Quando o vendedor assume a conversa, o lead frequentemente já perdeu o interesse ou fechou com um concorrente que ofereceu atendimento imediato.
- **Falta de Qualificação Prévia:** Vendedores e engenheiros perdem horas atendendo clientes que não possuem perfil para energia solar (ex.: moram em imóveis alugados sem autorização do proprietário, contas de luz com valor inferior à taxa mínima de disponibilidade ou fora da área de atuação da distribuidora atendida).

## 3. Valor Agregado para o Engeapp
- **SDR Virtual Especializado em Energia Solar:** Triagem e qualificação automática e ininterrupta (24 horas por dia, 7 dias por semana) para cada novo lead captado via campanhas de anúncios, site ou indicação.
- **Lead Scoring Fotovoltaico Automatizado:** O fluxo conversacional coleta e pontua dados críticos para a viabilidade do projeto:
  1. Valor médio da fatura de energia ou consumo em kWh.
  2. Concessionária de distribuição de energia (CEMIG, CPFL, Enel, Neoenergia, etc.).
  3. Tipo de imóvel (residencial, comercial, industrial ou rural).
  4. Titularidade da conta e posse do imóvel (próprio, alugado, financiado).
  5. Tipo de ligação elétrica (monofásica, bifásica ou trifásica).
- **Aumento na Taxa de Conversão de Propostas:** Ao responder em menos de 5 segundos, o Engeapp captura a intenção de compra no momento de maior interesse do lead, entregando ao vendedor um lead já qualificado, documentado e com a pré-análise de consumo concluída.
- **Roteamento Inteligente de Oportunidades:** Leads com potencial de alta potência (> 15 kWp ou contas comerciais acima de R$ 3.000/mês) são marcados como prioritários e direcionados imediatamente aos consultores seniores ou integradores credenciados do Engeapp.

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Editor Visual de Fluxos (`LeadFlowBuilder.vue`):**
  - Implementado em Vue 3.6 com Composition API (`<script setup lang="ts">`) e estilização estritamente em `<style lang="scss" scoped>` com variáveis do design system Engeapp.
  - Tela de edição baseada em nós com suporte a pan, zoom e conexões bezier entre portas de saída (output handles) e portas de entrada (input handles).
  - Categorias de nós arrastáveis a partir de um painel lateral:
    - `NodeMessage`: Envio de texto com suporte a interpolação de variáveis (`*Olá, {{nome}}!*`).
    - `NodeInteractiveButtons`: Envio de botões de resposta rápida do WhatsApp (até 3 botões com limite de 20 caracteres da Meta).
    - `NodeInteractiveList`: Envio de mensagem de lista interativa do WhatsApp (até 10 itens com seções).
    - `NodeSolarQuestion`: Bloco especializado com perguntas padronizadas do setor solar (faixas de consumo, tipo de imóvel, distribuidora).
    - `NodeCondition`: Avaliação de expressões condicionais (`variável`, `operador`, `valor`) direcionando para caminhos "Verdadeiro" ou "Falso".
    - `NodeAction`: Atribuição de tags, cálculo de score, disparo de webhook ou chamada para a engine de cálculo solar.
    - `NodeHandoff`: Transbordo para atendimento humano com definição de fila e prioridade.
- **Gerenciamento de Estado (Pinia):**
  - Store `useLeadFlowEditorStore` estruturada via `@maxvue/max-pinia`:
    - Estado com grafo serializável: `nodes: FlowNode[]`, `edges: FlowEdge[]`, `variables: FlowVariable[]`, `viewport: ViewportState`.
    - Métodos para adicionar, clonar, conectar e validar nós (detecção de ciclos e nós órfãos sem saída).
    - Salvamento com debounce através de `options.save` apontando para rota Ziggy nomeada `whatsapp.flows.save`.
- **Simulador Integrado em Tempo Real:**
  - Janela lateral em split-view (espelhando a convenção de `ChatInputTemplatesPopover.vue`) executando o fluxo interativamente através de componentes reutilizados: `ChatMessageMain`, `ChatMessageContent`, `ChatMessageButtonOptions` e balões interativos.

### 4.2. Arquitetura Backend (Laravel 13 + PHP 8.5 + MariaDB 11)
- **Modelagem de Dados:**
  - `conversational_flows`: Definição do fluxo (nome, canal WhatsApp ID, status ativo/inativo, gatilho de início).
  - `flow_nodes`: Dados estruturados de cada nó (tipo, payload JSON com configurações específicas, posições x/y para o canvas).
  - `flow_edges`: Conexões direcionadas entre nós (origem, destino, condição de disparo).
  - `flow_sessions`: Registro de sessões ativas com o número do WhatsApp do cliente, nó atual (`current_node_id`), variáveis de contexto (`context_payload` em JSON) e timestamp de última interação (para controle da janela de 24h da Meta).
- **Engine de Execução de Fluxo (State Machine Assíncrona):**
  - Serviço `FlowExecutionEngine.php`:
    - Processa payloads recebidos no webhook da Meta (`WebhookWhatsAppController`).
    - Carrega ou cria a `FlowSession` correspondente ao telefone.
    - Avalia a resposta do usuário contra as validações do nó atual (ex.: regex de número para valor da fatura, opção de botão selecionada).
    - Armazena a variável coletada no contexto da sessão (com persistência em Redis para alta performance e cache de curta duração).
    - Determina o próximo nó via `flow_edges` e despacha mensagens interativas pela WhatsApp Cloud API oficial.
  - Filas e Jobs via Laravel Horizon:
    - `SendInteractiveWhatsAppMessageJob`: Disparo de mensagens no WhatsApp respeitando rate limits da Meta e retentativas automáticas em caso de erro transitório.
    - `EvaluateLeadQualificationJob`: Ao final do fluxo, calcula a pontuação do lead e persiste os dados na entidade de Clientes/Propostas do Engeapp.

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- `MaxButton` e `Botao`: Gatilhos de ação no canvas (Salvar Fluxo, Publicar, Testar, Limpar).
- `MaxInputText`, `MaxInputNumber`, `MaxInputSelect`: Edição dos campos de configuração nos drawers laterais de cada nó.
- `MaxInputSwitch`: Alternância de opções binárias no nó (ex.: "Obrigatório responder", "Ignorar maiúsculas/minúsculas").
- `MaxBadge` e `MaxBadgeComponent`: Exibição visual de status do fluxo ("Rascunho", "Publicado", "Ativo", "Pausado") e tags de variáveis.
- `MaxDrawer`: Painel deslizante à direita para configurar parâmetros do nó selecionado sem obstruir a visão geral do canvas.
- `MaxModal`: Modais de confirmação de exclusão, importação/exportação de templates JSON de fluxo.
- `MaxToast`: Notificações reativas de salvamento com sucesso, erros de validação de conexões e avisos de integridade do fluxo.

### 5.2. Novos Componentes Visuais Propostos
- `MaxFlowCanvas.vue`: Contêiner de canvas interativo com suporte a renderização de grid com pontilhado semântico, detecção de drag-and-drop de nós e traçado dinâmico de conexões SVG.
- `MaxFlowNodeItem.vue`: Card visual de cada bloco no canvas, contendo cabeçalho com ícone descritivo, resumo do conteúdo, badge de tipo e pontos de ancoragem magnéticos (handles) de entrada e saída.
- `MaxFlowVariableTag.vue`: Tag estilizada para inserção rápida de variáveis nos campos de texto com menu dropdown de autocompletar.
- `MaxFlowSimulatorModal.vue`: Emulador flutuante de tela de smartphone simulando a conversa do WhatsApp em tempo real com controle de reiniciar e inspecionar variáveis de estado.
