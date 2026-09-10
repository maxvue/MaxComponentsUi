# Mensagens Interativas no WhatsApp: Botões e Listas (Interactive WhatsApp Messages)

## 1. Visão Geral no Chatwoot
No Chatwoot e nas implementações modernas de atendimento via **WhatsApp Cloud API**, as **Mensagens Interativas** (*Interactive Messages*) substituem o ultrapassado e frágil modelo de menus de texto digitado (*"Digite 1 para X, 2 para Y"*). Elas oferecem uma experiência gráfica nativa no aplicativo do cliente:
- **Botões de Resposta Rápida (*Quick Reply Buttons*):** Mensagens acompanhadas de até 3 botões clicáveis diretamente na tela do WhatsApp do cliente (ex.: `[Aprovar Parecer]`, `[Solicitar Revisão]`, `[Falar com Engenheiro]`).
- **Mensagens de Lista Interativa (*Interactive List Messages*):** Menu expansível contendo até 10 opções organizadas em seções temáticas, com título, descrição detalhada e botão seletor (ex.: Selecionar Concessionária de Energia: Cemig, CPFL Paulista, Enel SP, Neoenergia Elektro).
- **Botões de Chamada para Ação (*Call-to-Action / CTA*):** Botões que redirecionam para links externos seguros (como a página de download do Parecer de Acesso assinado ou checkout de pagamento Pix do boleto de homologação).
- **Tratamento de Callbacks Estruturados:** Ao clicar em um botão ou item de lista, o WhatsApp não devolve um texto qualquer, mas sim um identificador único de payload (`payload_id` / `row_id`), permitindo automação determinística e sem falhas de interpretação de linguagem natural.

---

## 2. Situação Atual no Engeapp
No ecossistema atual do Engeapp:
- Grande parte dos fluxos de triagem e notificações via WhatsApp ocorre através de mensagens puramente textuais ou templates estáticos.
- Quando o integrador solar recebe uma mensagem automática solicitando uma decisão ou dado (por exemplo: confirmação se a taxa de vistoria da concessionária foi paga), ele precisa digitar uma resposta livre (como *"já paguei"*, *"pago ontem"*, *"sim"*).
- Isso exige processamento manual pelo atendente humano ou depende de rotinas frágeis de regex/NLP que frequentemente falham, gerando atrito e confusão no atendimento.
- Os operadores de suporte não possuem na interface web do Engeapp uma ferramenta visual para compor e disparar mensagens interativas de forma intuitiva durante o chat ao vivo.

---

## 3. Valor Agregado para o Engeapp
O uso de Mensagens Interativas nativas do WhatsApp traz uma transformação substancial para a operação de homologação fotovoltaica:
1. **Zero Erro de Interpretação em Processos Críticos:** Ao enviar um aviso de aprovação de parecer de acesso com botões `[Aprovar Proposta]` e `[Ajustar Potência Inversor]`, o clique do integrador é registrado instantaneamente no banco de dados do Engeapp com o ID exato da ação, sem ambiguidade.
2. **Autoatendimento Veloz para Integradores:** Integradores podem consultar o status de homologação de seus projetos diretamente pelo WhatsApp clicando em uma lista interativa com seus projetos ativos.
3. **Aceleração da Arrecadação e Pagamentos:** Envio de mensagens interativas com botão de pagamento Pix (integrado às APIs Efí/Inter) logo após a emissão da guia de homologação, reduzindo o tempo médio de liquidação de dias para minutos.
4. **Experiência de Usuário Premium:** Posiciona o Engeapp como uma plataforma tecnológica de ponta perante os integradores solares, muito à frente de concorrentes que ainda utilizam robôs de texto rudimentares.

---

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Simulador e Construtor de Mensagens Interativas (`MaxInteractiveMessageBuilder`):**
  - Componente modal ou drawer onde o operador ou administrador pode montar a mensagem:
    - Campo de Cabeçalho (*Header*: Texto, Imagem ou Documento PDF).
    - Corpo da Mensagem (*Body*: Texto formatado com suporte a variáveis do projeto).
    - Rodapé (*Footer*: Informação de apoio ou instrução).
    - Seletor de Tipo: **Botões (até 3)** ou **Lista (até 10 itens em seções)**.
  - **Live Preview em Tempo Real:** Pré-visualização com estilo visual autêntico do WhatsApp (fundo verde claro do balão, fontes e sombras idênticas ao app nativo), permitindo verificar como a mensagem aparecerá para o integrador antes de disparar.
- **Renderização na Timeline do Atendimento:**
  - Componente na timeline que renderiza mensagens interativas enviadas e desabilita ou destaca visualmente o botão/item que o integrador clicou quando a resposta retornar via webhook.

### 4.2. Arquitetura Backend (Laravel 13 + Horizon + Reverb + Meta WhatsApp Cloud API)
- **Payload Padronizado para a Meta Cloud API:**
  - Envio via `Http::withToken()->post("https://graph.facebook.com/v21.0/{phone_number_id}/messages")`:
    ```json
    {
      "messaging_product": "whatsapp",
      "recipient_type": "individual",
      "to": "5531999999999",
      "type": "interactive",
      "interactive": {
        "type": "button",
        "header": { "type": "text", "text": "Homologação Solar - Parecer Emitido" },
        "body": { "text": "O parecer da Cemig para o projeto #10420 (15kWp) foi emitido. Deseja prosseguir com o agendamento da vistoria?" },
        "footer": { "text": "Engeapp Engenharia Solar" },
        "action": {
          "buttons": [
            { "type": "reply", "reply": { "id": "btn_approve_parecer_10420", "title": "Aprovar e Agendar" } },
            { "type": "reply", "reply": { "id": "btn_request_change_10420", "title": "Solicitar Ajuste" } }
          ]
        }
      }
    }
    ```
- **Processamento de Retorno no Webhook:**
  - O webhook da Meta recebe o evento `messages.interactive`:
    - `type: "button_reply"` com `id` e `title`;
    - `type: "list_reply"` com `id`, `title` e `description`.
  - O **Laravel Horizon** direciona o job para a fila `whatsapp-interactive-handlers`:
    - Atualiza a mensagem na conversa registrando a resposta clicada.
    - Dispara o evento de domínio no Engeapp (ex.: `SolarHomologationApprovedEvent`).
    - Atualiza a tela dos operadores em tempo real via **Laravel Reverb**.

---

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- **`MaxCard`:** Estrutura base dos blocos do configurador de mensagens interativas e dos containers de botões.
- **`MaxButton` & `MaxIconButton`:** Ações de adicionar botão, remover botão, adicionar seção de lista e envio da mensagem.
- **`MaxInputText` & `MaxInputTextArea`:** Edição dos campos de título, corpo da mensagem, texto dos botões (limitado a 20 caracteres por exigência da Meta) e IDs de payload.
- **`MaxInputSelect`:** Seleção do tipo de mensagem interativa (*Botões de Resposta Rápida*, *Lista de Opções*, *Call-to-Action*).
- **`MaxChips`:** Representação das opções selecionadas e restrições de limites de caracteres.
- **`MaxBadge`:** Contador dinâmico de caracteres e limite de botões (ex.: `2/3 botões utilizados`).
- **`MaxModal`:** Janela de montagem e confirmação de envio da mensagem interativa durante o atendimento ao vivo.
- **`MaxToast`:** Notificações de validação de regras da Meta (ex.: aviso de que o título do botão não pode ultrapassar 20 caracteres).

### 5.2. Novos Componentes Necessários
- **`MaxWhatsAppInteractivePreview`:** Simulador visual completo de balão de WhatsApp interativo, espelhando fielmente a tipografia, botões em linha, listas expansíveis e rodapé nativos do WhatsApp iOS e Android.
- **`MaxInteractiveListEditor`:** Editor visual de seções e linhas para listas do WhatsApp com validação em tempo real de limites de itens e tamanhos de texto impostos pela Meta Cloud API.
