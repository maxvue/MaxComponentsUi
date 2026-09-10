# Caixa de Entrada Compartilhada para WhatsApp (Shared Team Inbox)

## 1. Visão Geral no Chatwoot
No Chatwoot, a **Caixa de Entrada Compartilhada** (*Shared Inbox*) é o coração da plataforma de atendimento omnicanal. Ela permite que múltiplos atendentes e equipes colaborem sobre o mesmo número oficial de WhatsApp sem sobreposição ou conflito. Seus pilares funcionais incluem:
- **Gestão de Estados da Conversa:** Fluxo de ciclo de vida bem definido entre `Open` (aberto para atendimento), `Pending` (aguardando resposta do cliente ou ação de terceiro), `Snoozed` (adiado até um horário específico) e `Resolved` (resolvido).
- **Atribuição Inteligente (*Assignment*):** Distribuição de conversas para agentes individuais ou equipes específicas (*Teams*), com filtros rápidos: "Atribuídos a mim", "Não atribuídos" e "Todos".
- **Prevenção de Colisão em Tempo Real (*Collision Detection*):** Indicador visual que sinaliza quando outro operador está visualizando a mesma conversa ou digitando uma resposta, evitando que dois atendentes enviem mensagens divergentes ao mesmo cliente.
- **Indicadores de Presença e Digitação em Tempo Real:** WebSockets exibem status de atividade dos agentes e do contato instantaneamente.
- **Filtros e Visualizações Personalizadas:** Filtros avançados por etiquetas (*labels*), status, canal e atendente, permitindo segmentar o fluxo de mensagens com facilidade.

---

## 2. Situação Atual no Engeapp
Atualmente no Engeapp:
- O canal de WhatsApp oficial (Meta Cloud API) opera prioritariamente como uma ferramenta pontual ou passiva para notificações e resolução de chamados de suporte/reclamações, sem uma central de atendimento unificada para múltiplos operadores.
- Não há gestão formal de status de conversa (`Open`, `Pending`, `Resolved`), fazendo com que mensagens de integradores de energia solar fiquem misturadas ou dependam de acompanhamento informal.
- Ausência de mecanismo de prevenção de colisão: se dois engenheiros ou atendentes acessarem a tela do cliente ao mesmo tempo, ambos podem responder sem saber que o colega está redigindo ou interagindo.
- A distribuição de conversas entre setores (Comercial, Engenharia de Homologação, Financeiro/Cobrança) é manual ou inexistente dentro da interface de mensageria, gerando gargalos e atrasos nas respostas para integradores parceiros.

---

## 3. Valor Agregado para o Engeapp
A implementação de uma Caixa de Entrada Compartilhada profissional traz impactos diretos e mensuráveis para o modelo de negócios de homologação solar do Engeapp:
1. **Redução Drástica do Tempo de Primeira Resposta (SLA):** Integradores fotovoltaicos necessitam de agilidade para tirar dúvidas sobre documentos de homologação (ex.: aprovação de parecer de acesso na Equatorial, Cemig, CPFL ou Enel). Com filas dedicadas e triagem, o tempo de espera cai expressivamente.
2. **Eliminação de Respostas Conflitantes:** A engenharia e o suporte comercial não correm o risco de falar mensagens contraditórias ao mesmo cliente no WhatsApp.
3. **Visibilidade Operacional de Gargalos:** Gestores conseguem visualizar quantas conversas estão pendentes em cada fase (ex.: "Aguardando ART", "Pendência com Concessionária", "Dúvida de Cobrança Efí/Inter"), mensurando a produtividade de cada analista.
4. **Continuidade do Histórico:** Caso um analista saia de férias ou mude de setor, toda a trilha de interação do integrador permanece intacta, associada ao projeto fotovoltaico correspondente.

---

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Store Dedicada:** `useWhatsAppInboxStore` criada com `@maxvue/max-pinia`, responsável por:
  - Cache reativo de conversas ativas, contadores de mensagens não lidas e status de fila (`open`, `pending`, `resolved`).
  - Atualização otimista da lista de conversas ao receber novos eventos.
- **Detecção de Presença e Digitação:** `usePresenceStore` conectada via cliente WebSocket para rastrear quem está com a conversa aberta no momento (`viewing_agent_id`) e quem está digitando (`typing_agent_id`).
- **Layout de Três Colunas Responsivo:**
  1. *Coluna 1 (Navegação & Filtros):* Filtros rápidos (Meus, Não Atribuídos, Todos), caixas de entrada por setor (Engenharia, Comercial, Cobrança) e busca via Meilisearch.
  2. *Coluna 2 (Lista de Conversas):* Cards de conversa com avatar, nome do integrador, último snippet de mensagem, badges de status, tags e carimbo de tempo.
  3. *Coluna 3 (Thread de Mensagens & Composer):* Linha do tempo de mensagens (balões de WhatsApp com status de envio/entrega/leitura), área de notas internas e barra de envio de mensagens com suporte a anexos.
  4. *Painel Lateral Retrátil (Contexto Solar):* Dados do projeto fotovoltaico vinculado (número da UC, concessionária, potência do sistema, status da homologação).

### 4.2. Arquitetura Backend (Laravel 13 + Horizon + Reverb + Meta Cloud API)
- **Webhooks & Ingestão:** Webhook da Meta WhatsApp Cloud API processado de forma assíncrona pelo **Laravel Horizon** (fila `whatsapp-inbound`) para garantir resposta HTTP 200 em milissegundos e tolerância a picos de tráfego.
- **Modelagem de Dados:**
  - `whatsapp_conversations`: `id`, `contact_id`, `assigned_user_id`, `status` (`open`, `pending`, `snoozed`, `resolved`), `last_message_at`, `solar_project_id`.
  - `whatsapp_messages`: `id`, `conversation_id`, `sender_type` (`agent`, `contact`, `system`), `sender_id`, `message_type` (`text`, `image`, `document`, `interactive`, `template`), `body`, `metadata`, `whatsapp_message_id`, `status` (`sent`, `delivered`, `read`, `failed`).
- **WebSockets em Tempo Real (Laravel Reverb):**
  - Canal privado `private-inbox.{inboxId}` para novos eventos de mensagens e mudanças de status.
  - Canal de presença `presence-conversation.{conversationId}` para broadcasting de digitando (`UserTyping`) e agentes visualizando (`AgentViewing`).
- **Transações Seguras:** Toda atribuição de conversa gera um registro de auditoria e emite um evento Reverb para atualizar a tela de todos os operadores simultaneamente sem refresh.

---

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- **`MaxContainerApp`:** Estrutura base de tela de altura total com padding otimizado para aplicações SPA.
- **`MaxDrawer` / `MaxBottomMenu`:** Para visualização ágil dos detalhes do projeto solar do cliente no mobile ou tela reduzida.
- **`MaxBadge` & `MaxBadgeComponent`:** Exibição do status da conversa (`Aberto` em verde, `Pendente` em laranja, `Resolvido` em cinza) e contadores de mensagens não lidas.
- **`MaxAvatar`:** Identificação visual do integrador, cliente final ou agente responsável.
- **`MaxButton` & `MaxIconButton`:** Ações rápidas de atribuição, resolução de conversa, anexar arquivos e envio.
- **`MaxInputText` & `MaxInputAutoCompleteApi`:** Campo de busca rápida de conversas por nome, telefone ou número do projeto solar.
- **`MaxPopoverMenu`:** Menu de três pontos no topo da conversa para transferir atendente, alterar status ou vincular a outro projeto fotovoltaico.
- **`MaxSkeleton`:** Loading states elegantes durante a alternância entre conversas e carregamento da timeline.
- **`MaxTabs` & `MaxTab`:** Alternância rápida entre abas "Minhas Conversas", "Não Atribuídas" e "Resolvidas".

### 5.2. Novos Componentes Necessários
- **`MaxChatTimeline`:** Componente de scroll infinito invertido otimizado para balões de chat (com separadores de data, indicadores de entrega com ticks duplos do WhatsApp e status de erro).
- **`MaxChatCollisionBanner`:** Alerta suave no topo do composer informando: *"Engenheiro Carlos está visualizando esta conversa agora"* ou *"Carlos está digitando..."*.
- **`MaxChatComposer`:** Área de texto rica com auto-crescimento, suporte a atalhos de teclado (`Enter` para enviar, `Shift+Enter` para quebra de linha), inserção de emojis e arrastar-e-soltar de arquivos técnicos (PDFs de diagramas, faturas de energia).
