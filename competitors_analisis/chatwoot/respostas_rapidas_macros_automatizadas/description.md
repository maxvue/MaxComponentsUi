# Respostas Rápidas e Macros Automatizadas (Canned Responses & Macros)

## 1. Visão Geral no Chatwoot
No Chatwoot, **Respostas Rápidas** (*Canned Responses*) e **Macros** são recursos de produtividade extrema que aceleram o atendimento e eliminam digitação repetitiva:
- **Respostas Rápidas via Atalho de Barra (`/`):**
  - Basta o operador digitar `/` seguido de uma palavra-chave no composer (ex.: `/documentos`, `/status`, `/dados_bancarios`) para abrir um menu flutuante instantâneo com as respostas cadastradas.
  - **Variáveis Dinâmicas de Interpolação:** As respostas suportam tags dinâmicas como `{{contact.name}}`, `{{agent.first_name}}`, `{{conversation.id}}`, que são substituídas pelos valores reais antes do envio.
- **Macros de Múltiplas Ações em 1 Clique:**
  - Uma macro permite encadear uma sequência de ações pré-definidas em uma única execução.
  - Exemplo de macro: Adicionar etiqueta *"Pendente Concessionária"*, atribuir conversa ao *"Engenheiro Eletricista"*, enviar uma mensagem padrão de aviso e alterar o status da conversa para *"Pendente"*.
  - Podem ser disparadas manualmente pelo operador através de um botão ou menu rápido, ou acionadas automaticamente por regras de automação.

---

## 2. Situação Atual no Engeapp
No modelo atual do Engeapp:
- Os analistas e engenheiros precisam digitar repetidamente as mesmas instruções técnicas para integradores fotovoltaicos (por exemplo: lista de fotos obrigatórias do padrão de entrada da concessionária, memorial descritivo, documentação de procuração para homologação e dados de inversores homologados pelo INMETRO).
- As alterações de status no projeto solar e as comunicações no WhatsApp ocorrem de maneira totalmente desconectada:
  1. O operador altera o status do projeto para *"Aguardando Documentos"* na tela de projetos;
  2. Em seguida, abre a conversa com o integrador no WhatsApp para redigir manualmente uma mensagem explicando quais documentos estão pendentes;
  3. Depois precisa lembrar de atribuir a tarefa ao setor correto.
- A falta de automação integrada gera erros humanos, divergências na orientação técnica dada por diferentes analistas e perda de tempo operacional significativo.

---

## 3. Valor Agregado para o Engeapp
A implementação de Respostas Rápidas e Macros para o ecossistema solar do Engeapp produz ganhos imediatos:
1. **Padronização Técnica Rigorosa:** Garante que todos os integradores recebam instruções claras e idênticas de acordo com as normas específicas de cada concessionária (ex.: NDU 001 da Energisa, NTD 015 da Enel, GED 2859 da CPFL).
2. **Economia de até 70% no Tempo de Atendimento:** Consultas frequentes sobre prazos de vistoria, taxas de conexão ou emissão de parecer são respondidas em menos de 5 segundos via atalho `/`.
3. **Sincronização de Status em 1 Clique:** Com as macros, o atendente clica em *"Macro: Notificar Pendência de Parecer"* e o sistema automaticamente:
   - Atualiza a fase da homologação no banco de dados para *"Com Pendência"* no Engeapp;
   - Anexa a tag correspondente;
   - Envia a mensagem detalhada para o WhatsApp do integrador com os dados da usina injetados dinamicamente;
   - Define o prazo de acompanhamento no Horizon.
4. **Onboarding Rápido de Novos Atendentes:** Analistas juniores conseguem atender com o mesmo nível técnico e qualidade de engenheiros seniores recorrendo ao repositório de macros e respostas rápidas.

---

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Store de Macros e Respostas Rápidas (`useCannedResponseStore`):**
  - Carregamento em cache local com `@maxvue/max-pinia` para resposta instantânea ao digitar `/` no composer.
  - Filtro por busca difusa (*fuzzy search*) em milissegundos.
- **Trigger de Barra no Composer (`/slash-command`):**
  - Detecção da tecla `/` no início de palavra.
  - Renderização de um `MaxPopover` flutuante alinhado à posição do cursor com lista de respostas categorizadas (Geral, Concessionária, Financeiro, Documentos).
  - Suporte a navegação por setas (↑ e ↓) e seleção por `Enter` ou `Tab`.
- **Interpolação de Variáveis do Projeto Solar:**
  - O frontend/backend interpola variáveis contextuais do projeto vinculado:
    - `{{integrador.nome}}`
    - `{{projeto.codigo}}`
    - `{{projeto.concessionaria}}`
    - `{{projeto.potencia_kwp}}`
    - `{{atendente.nome}}`
- **Painel/Drawer de Execução de Macros:**
  - Barra lateral com botões de macros favoritas (ex.: *"Aprovar Parecer"*, *"Solicitar Fotos Padrão"*, *"Cobrar Taxa de Homologação"*).

### 4.2. Arquitetura Backend (Laravel 13 + Horizon + Reverb)
- **Modelagem de Dados:**
  - `canned_responses`: `id`, `short_code` (ex.: `docs_cemig`), `content`, `category`, `created_by`, `variables` (JSON).
  - `macros`: `id`, `name`, `description`, `icon`, `actions` (JSON array: `[{action: 'change_status', value: 'pending'}, {action: 'send_message', template_id: 5}, {action: 'assign_team', team_id: 2}]`).
- **Serviço de Execução de Macros (`MacroExecutionService`):**
  - Executa todas as etapas em uma única transação atômica no banco de dados:
    ```php
    DB::transaction(function () use ($macro, $conversation, $user) {
        foreach ($macro->actions as $action) {
            $this->actionResolver->resolve($action)->execute($conversation, $user);
        }
    });
    ```
  - Dispara o envio para a Meta Cloud API via job assíncrono no Horizon.
  - Notifica a interface em tempo real via broadcast do Laravel Reverb (`ConversationUpdated`, `MessageSent`).

---

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- **`MaxPopover` & `MaxPopoverMenu`:** Menu flutuante acionado ao digitar `/` para seleção rápida da resposta.
- **`MaxButton` & `MaxBadgeButton`:** Botões compactos de disparo de macros no topo ou rodapé do painel de conversa.
- **`MaxModal`:** Modal administrativo para cadastro e gerenciamento de macros e respostas rápidas com preview dinâmico.
- **`MaxInputText` & `MaxInputTextArea`:** Campos de edição com suporte a inserção de tags/variáveis.
- **`MaxChips`:** Lista de variáveis disponíveis clicáveis (ex.: `[+ Nome do Integrador]`, `[+ Potência kWp]`, `[+ Concessionária]`) para inserção facilitada no texto.
- **`MaxBadge`:** Exibição da categoria da resposta rápida (ex.: *Engenharia*, *Comercial*, *Documental*).
- **`MaxToast`:** Feedback imediato de confirmação: *"Macro 'Notificar Pendência' executada com sucesso"*.

### 5.2. Novos Componentes Necessários
- **`MaxSlashMenu`:** Componente de dropdown acessível com atalhos de teclado completos, busca instantânea e prévia lateral do conteúdo expandido da resposta rápida.
- **`MaxMacroRunnerBar`:** Barra horizontal ou gaveta retrátil compacta contendo chips de macros rápidas específicas para a fase atual do projeto solar em atendimento.
