# Notas Internas Colaborativas na Conversa (Private Internal Notes)

## 1. Visão Geral no Chatwoot
No Chatwoot, o recurso de **Notas Privadas/Internas** (*Private Notes*) permite que os atendentes conversem entre si dentro da própria linha do tempo da conversa com o cliente, mantendo total sigilo:
- **Alternância Fluida de Modo:** No campo de digitação (*composer*), o operador pode alternar com um clique entre "Mensagem" (que é enviada ao cliente via WhatsApp) e "Nota Privada" (visível apenas para a equipe interna).
- **Diferenciação Visual Instantânea:** As notas internas possuem destaque visual inconfundível (geralmente fundo amarelo/âmbar suave com ícone de cadeado e borda destacada), garantindo que o operador nunca confunda uma nota interna com uma mensagem pública enviada ao cliente.
- **Mencionar Colegas com Notificação (@mentions):** Ao digitar `@nome_do_agente`, abre-se um popover de autocomplete de usuários. O colega mencionado recebe imediatamente uma notificação no sistema (push/web/email) e um link direto para a mensagem, podendo responder na mesma thread.
- **Anexo de Documentos Internos:** Capacidade de anexar arquivos, planilhas ou capturas de tela que permanecem acessíveis apenas aos membros da equipe interna, sem envio para o canal externo do cliente.

---

## 2. Situação Atual no Engeapp
Atualmente no ecossistema Engeapp:
- A comunicação entre o analista de atendimento comercial e o engenheiro de homologação ocorre de forma fragmentada:
  - Ou por anotações isoladas no histórico do projeto solar (aba "Observações/Histórico"), que não têm relação direta com o chat em andamento;
  - Ou através de grupos externos de WhatsApp/Slack/Teams, onde o contexto da conversa com o integrador é perdido e precisa ser resumido ou copiado manualmente.
- Não há possibilidade de marcar colegas (@mentions) dentro do fluxo de atendimento ao vivo para solicitar esclarecimentos técnicos (por exemplo: validar se o padrão de entrada suporta o inversor fotovoltaico de 10kW ou se haverá necessidade de troca de disjuntor geral).
- Risco de vazamento de informações confidenciais: quando operadores utilizam o próprio campo de chat para redigir rascunhos ou testes, correm o risco gravíssimo de enviar mensagens de controle interno diretamente para o integrador ou cliente final.

---

## 3. Valor Agregado para o Engeapp
Integrar notas internas colaborativas no atendimento do Engeapp gera impactos cruciais no dia a dia da engenharia e do suporte:
1. **Resolução Ágil de Impasses de Homologação:** Quando a concessionária (ex.: Cemig ou Equatorial) emite uma nota de pendência sobre a documentação técnica (ART, memorial descritivo, diagrama trifilar), o atendente pode imediatamente abrir uma nota interna: *"@carlos_eng Por favor verificar a folha 3 do diagrama, a concessionária apontou divergência de disjuntor"*. O engenheiro responde no mesmo local em minutos.
2. **Contexto Centralizado sem Perda de Dados:** Novos operadores ou supervisores que assumirem o atendimento conseguem ver todo o histórico de decisões e justificativas técnicas tomadas internamente, sem poluir a experiência do integrador no WhatsApp.
3. **Privacidade e Governança:** Separação rígida entre o que é comunicação oficial e o que é discussão técnica preliminar de viabilidade e faturamento.
4. **Alinhamento entre Engenharia e Cobrança:** Setor financeiro pode incluir notas sobre pendências de pagamento de boletos ou Pix da taxa de homologação antes da liberação dos arquivos assinados.

---

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Composer com Alternância de Modo:**
  - Componente que mantém estado reativo `isPrivateNote: ref(boolean)`.
  - Quando ativado, muda o estilo do container do composer (borda âmbar, badge *"Modo Nota Privada - Visível apenas para a equipe"* e botão de ação *"Adicionar Nota"*).
- **Mecanismo de Menções Reativas:**
  - Monitoramento de digitação no campo de texto: ao detectar `@`, dispara pesquisa instantânea no store de usuários/colaboradores da equipe.
  - Dropdown posicionado acima do cursor com lista de usuários, foto, nome e especialidade (ex.: "Eng. Eletricista", "Suporte", "Financeiro").
  - Inserção de markup padronizado no texto (ex.: `@[Carlos Silva](user:42)`).
- **Renderização Distinta na Timeline:**
  - Mensagens normais são renderizadas com balão clássico de WhatsApp.
  - Mensagens com `is_private: true` são renderizadas com visual de *card* de memorando interno (fundo âmbar `var(--background-100)` ou token de alerta, ícone de cadeado `solar:lock-bold` ou `lucide:lock`, carimbo de quem publicou e chips destacados para `@menções`).

### 4.2. Arquitetura Backend (Laravel 13 + Horizon + Reverb)
- **Extensão da Tabela `whatsapp_messages`:**
  - Campo `is_private` (booleano, default `false`).
  - Campo `metadata` (JSON): armazena IDs dos usuários mencionados (`mentioned_user_ids: [12, 45]`), anexos internos e tipo de nota.
- **Regra Rígida de Despacho (Security Gateway):**
  - O Job de envio para a Meta Cloud API (`SendWhatsAppMessageJob`) possui uma trava obrigatória de validação:
    ```php
    if ($message->is_private) {
        throw new LogicException('Tentativa de enviar nota interna para a API externa do WhatsApp!');
    }
    ```
- **Broadcasting via Laravel Reverb:**
  - Emite evento `InternalNoteCreated` apenas para canais autenticados de funcionários (`private-team.inbox`), nunca para canais públicos ou webhooks de webhook externo.
  - Disparo de notificações internas assíncronas via Horizon (`SendMentionNotificationJob`) para alertar o usuário mencionado (notificação no sino do topo do Engeapp e notificação push no navegador).

---

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- **`MaxTabs` / `MaxTab`:** Alternância visual no topo do composer entre *"WhatsApp (Cliente)"* e *"Nota Interna"*.
- **`MaxInputTextArea`:** Campo expansível de digitação de texto com suporte a auto-resize e eventos de teclado.
- **`MaxAvatar`:** Exibição do avatar do funcionário que redigiu a nota interna na timeline.
- **`MaxBadge` & `MaxTag`:** Etiqueta visual indicadora *"Nota Privada"* ou *"Confidencial"* acompanhada de ícone de bloqueio.
- **`MaxButton` & `MaxIconButton`:** Botão de submissão estilizado em tom âmbar/amarelo quando no modo de nota interna.
- **`MaxInputFileUploadButton`:** Upload rápido de documentos ou prints técnicos restritos à nota.
- **`MaxPopover`:** Janela flutuante de sugestão de membros da equipe ao digitar `@`.
- **`MaxToast`:** Notificação toast na tela do engenheiro mencionado quando alguém o marcar em uma conversa.

### 5.2. Novos Componentes Necessários
- **`MaxChatPrivateNoteCard`:** Componente de exibição de nota interna na timeline com avatar do autor, data/hora relativa, corpo formatado com menções clicáveis e lista de anexos internos para download.
- **`MaxMentionAutoComplete`:** Overlay inteligente acoplado ao textarea para filtragem e seleção de usuários via setas do teclado e `Enter`.
