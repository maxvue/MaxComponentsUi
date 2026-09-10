# Transbordo Humano Inteligente com Preservação de Contexto e Fila Dinâmica

## 1. Visão Geral no Typebot
No **Typebot**, o transbordo para atendimento humano (Human Takeover / Handoff) é tratado como uma transição de estado nativa e controlada dentro do fluxo conversacional:
- **Bloco de Transbordo Humano (Talk to Agent):** Pausa imediatamente o processamento automatizado do bot para a sessão do usuário em questão, garantindo que respostas automáticas não interfiram na conversa entre o operador humano e o cliente.
- **Preservação e Passagem Completa de Contexto:** Todas as variáveis coletadas até aquele instante (`nome`, `cidade`, `fatura_energia`, `score`, `duvida_especifica`) são consolidadas em um payload estruturado e despachadas para o sistema de live chat ou Helpdesk.
- **Alertas e Notificações Multicanal:** Disparo de webhooks em tempo real notificando canais de atendimento (Slack, Discord, Chatwoot ou CRM proprietário) com links diretos para a conversa aberta.
- **Mecanismos de Retomada e Timeout:** O bot pode ser reativado manualmente pelo operador após resolver o problema ou automaticamente por tempo limite (ex.: se o operador não responder em 5 minutos ou após o ticket ser marcado como "resolvido", o bot retoma para aplicar uma pesquisa de satisfação - CSAT).

## 2. Situação Atual no Engeapp
Atualmente, no módulo de atendimento via WhatsApp do Engeapp (`resources/Vue/Sections/supportChat/`):
- **Ausência de Máquina de Estados para a Conversa:** Não há uma demarcação clara entre "Cliente interagindo com automação" e "Cliente em atendimento humano". Isso impede que automações inteligentes coexistam com o time humano sem risco de conflito de mensagens.
- **Perda de Contexto e Retrabalho Humano:** Quando um lead chega ao atendimento humano, o operador precisa rolar manualmente todo o histórico de mensagens para decifrar:
  - Qual distribuidora atende o cliente;
  - Qual o valor da fatura mensal informado;
  - Se o imóvel é próprio ou alugado;
  - Se já foi feita alguma simulação de potência em kWp;
  - Se já houve envio de foto da conta de luz.
- **Fila Única sem Priorização:** Todos os contatos recebidos caem na mesma listagem cronológica linear. Um lead comercial quente com fatura de R$ 8.000/mês aguarda na mesma fila que um usuário solicitando uma segunda via de boleto ou um curioso sem perfil solar.
- **Inexistência de Devolução Automatizada:** Após o encerramento do atendimento humano, a conversa simplesmente cessa, sem disparo automático de pesquisa de satisfação (NPS/CSAT) ou agendamento de follow-up comercial no CRM do Engeapp.

## 3. Valor Agregado para o Engeapp
- **Aumento Drástico no First Contact Resolution (FCR):** O atendente ou consultor solar abre a tela já visualizando um resumo executivo com todas as respostas do cliente, documentos anexados e cálculo preliminar do sistema.
- **Fim da Frustração do Cliente:** Elimina a pergunta repetitiva mais odiada pelos consumidores: *"Com quem estou falando e qual o motivo do contato?"*, proporcionando uma experiência de atendimento personalizada e profissional.
- **Fila Inteligente com Score Fotovoltaico:**
  - Leads com pontuação máxima (conta alta + imóvel próprio + fatura já anexada) sobem automaticamente para o topo da fila com etiqueta vermelha/dourada de "Alta Prioridade".
  - Notificação sonora e visual instantânea para a equipe comercial via WebSockets.
- **Roteamento por Competência e Região:** Direcionamento automático para o integrador responsável pela cidade do cliente ou para o departamento específico (Vendas, Engenharia de Homologação, Financeiro, Pós-Venda).
- **Proteção Anticolisão de Respostas:** Trava atômica no backend que impede que mensagens automáticas sejam enviadas enquanto um operador humano estiver com o chat aberto e digitando.

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Barra de Controle de Sessão (`ChatHandoffControlBar.vue`):**
  - Componente posicionado no topo da interface de chat em `resources/Vue/Sections/supportChat/`.
  - Exibe o estado da sessão:
    - 🟢 `Bot em Execução`
    - 🟡 `Aguardando Atendente Humano (Fila)`
    - 🔵 `Atendimento Humano em Andamento (com [Nome do Operador])`
    - ⚪ `Encerrado / Pós-Atendimento`
  - Botões de comando:
    - `[Assumir Atendimento]`: Atribui a conversa ao usuário logado e ativa a trava anticolisão.
    - `[Transferir]`: Abre drawer para transferir a conversa para outro integrador, consultor ou departamento.
    - `[Devolver ao Bot com CSAT]`: Encerra a participação humana e dispara pesquisa de satisfação automática no WhatsApp.
- **Painel Lateral de Resumo Executivo do Lead (`LeadSolarContextSummaryCard.vue`):**
  - Card fixo ou expansível com resumo das variáveis coletadas pelo fluxo:
    - Nome, Telefone, Cidade e Distribuidora de Energia.
    - Faixa de Consumo (kWh) e Valor Médio da Fatura (R$).
    - Potência Fotovoltaica Calculada (kWp) e Economia Estimada.
    - Dossiê de Documentos recebidos com badges de validação OCR.
    - Score de Qualificação do Lead (0 a 100 pontos).
- **Integração em Tempo Real (WebSockets / Reverb):**
  - A store `useSupportChatStore` escuta canais privados do Laravel Reverb:
    - Canal `chat.queue.priority`: Atualiza a listagem de conversas em espera sem recarregar a tela.
    - Canal `chat.conversation.{id}`: Sincroniza status de atendimento, digitando (`typing indicator`) e mensagens recebidas.

### 4.2. Arquitetura Backend (Laravel 13 + Redis + Reverb)
- **Modelagem e Estados:**
  - Tabela `chat_conversations`:
    - `status`: Enum (`bot`, `waiting_human`, `in_service`, `closed`).
    - `assigned_user_id`: Chave estrangeira para `users` (atendente responsável).
    - `department_id`: Departamento ou integrador vinculado.
    - `priority_score`: Pontuação calculada pelo fluxo de triagem (0 a 100).
    - `context_snapshot`: Coluna JSON contendo o dump de variáveis coletadas no fluxo.
    - `handed_over_at`: Timestamp do momento do transbordo.
    - `human_started_at`: Timestamp do início do atendimento humano.
- **Trava de Sessão Atômica com Redis:**
  - Chave de controle: `chat:session:{phone}:mode` com valores `bot` ou `human`.
  - Quando a conversa entra em `in_service`, a chave é definida como `human` com TTL renovável a cada mensagem trocada.
  - No `WebhookWhatsAppController`, antes de despachar a mensagem para a engine do bot, o sistema verifica a chave no Redis: se estiver em modo `human`, ignora a árvore de nós e apenas persiste a mensagem na timeline do operador.
- **Eventos de Broadcast do Laravel (Reverb):**
  - `ConversationHandedOverEvent`: Disparado quando o nó de transbordo é atingido no fluxo. Envia payload com score e dados do lead para o canal da fila de espera.
  - `ConversationAssignedEvent`: Notifica todos os operadores que determinado ticket já foi assumido, evitando múltiplos atendentes respondendo ao mesmo tempo.
  - `ConversationClosedEvent`: Dispara o Job de envio do template de pesquisa de satisfação (CSAT) no WhatsApp Cloud API.

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- `MaxBadge` e `MaxBadgeComponent`: Exibição visual da prioridade do lead ("Alta Prioridade", "Média", "Baixa") e status do atendimento.
- `MaxUserAvatar` e `MaxUserSection`: Identificação do atendente responsável pela conversa e do perfil do cliente solar.
- `MaxButton` e `Botao`: Ações rápidas de assumir atendimento, devolver ao bot e transferir fila.
- `MaxButtonConfirm` e `MaxIconConfirm`: Confirmação segura para encerramento de ticket ou transferência de departamento.
- `MaxToast`: Alertas flutuantes emitindo aviso sonoro e visual para o atendente quando um novo lead qualificado entra na fila.
- `MaxDrawer`: Painel lateral retrátil para transferência de conversas entre setores e integradores.
- `MaxTabs` e `MaxTabPanel`: Navegação entre o Chat ao Vivo, Dossiê Documental, Simulação Solar e Histórico do CRM.

### 5.2. Novos Componentes Visuais Propostos
- `MaxHandoffStatusToolbar.vue`: Barra de ferramentas semântica fixada no topo do chat contendo status em tempo real, cronômetro de tempo de espera e botões de transição de estado.
- `MaxLeadContextSnapshot.vue`: Painel visual expansível que formata os dados do lead coletados pelo bot em seções semânticas (Dados Pessoais, Dados Elétricos, Dimensionamento Solar e Documentos).
- `MaxPriorityQueueCard.vue`: Item de lista aprimorado para a caixa de entrada de conversas, com borda colorida indicando prioridade de lead scoring, tempo na fila e badge da concessionária.
