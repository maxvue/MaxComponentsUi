# Coleta e Upload Inteligente de Documentos via Chat com Validação e OCR

## 1. Visão Geral no Typebot
No **Typebot**, a coleta de arquivos e documentos é tratada de forma nativa e flexível por meio de blocos de entrada dedicados:
- **Bloco de Upload de Arquivos (File Upload Input):** Permite que o usuário faça o envio de arquivos arrastando e soltando ou selecionando a partir do dispositivo móvel ou computador.
- **Filtros e Validações Granulares:** Configuração de restrições rígidas no editor visual:
  - Formatos permitidos por tipo MIME (ex.: `application/pdf`, `image/jpeg`, `image/png`).
  - Limite de tamanho máximo de arquivo (ex.: até 10 MB ou 25 MB).
  - Quantidade de anexos (arquivo único ou múltiplos arquivos em lote).
- **Armazenamento e Exposição de Variáveis:** O Typebot efetua o upload para um provedor de armazenamento em nuvem (S3, MinIO ou bucket interno) e grava a URL final ou array de URLs diretamente em variáveis de contexto (`{{url_fatura}}`, `{{url_cnh}}`).
- **Encadeamento Imediato de Webhooks:** Logo após o recebimento do arquivo, o fluxo pode invocar um webhook de inteligência artificial ou OCR para analisar o documento e retornar dados estruturados para orientar os próximos passos do diálogo.

## 2. Situação Atual no Engeapp
No Engeapp, a tramitação documental é o coração do processo de homologação de sistemas fotovoltaicos junto às distribuidoras de energia (CEMIG, CPFL, Enel, Neoenergia, Energisa, Equatorial). No entanto:
- **Recepção Desestruturada e Manual:** Quando o cliente ou integrador envia documentos pelo WhatsApp, as fotos e PDFs caem na timeline genérica de mensagens como anexos soltos.
- **Retrabalho de Download e Re-upload:** O atendente humano precisa abrir o chat, baixar o arquivo para seu computador local, renomear manualmente (ex.: `fatura_cemig_joao_silva.pdf`) e depois navegar até a ficha do cliente/projeto no Engeapp para fazer o upload manual através do VueFinder ou do formulário de anexos com Spatie MediaLibrary.
- **Falta de Validação Imediata no WhatsApp:** Se o cliente envia uma foto tremida, cortada, com baixa resolução ou uma página da conta de luz que não contém o código da Unidade Consumidora (UC) e o histórico de consumo em kWh, o operador só nota a falha horas ou dias depois quando o engenheiro tenta submeter a homologação na concessionária.
- **Risco de Perda de Documentos:** Documentos enviados no WhatsApp podem se perder no histórico caso a conversa tenha muitas mensagens, gerando retrabalho de cobrança e insatisfação do cliente.

## 3. Valor Agregado para o Engeapp
- **Automação do Dossiê de Homologação Solar:** Redução de mais de 75% no tempo gasto entre o primeiro contato e a prontidão do dossiê técnico para submissão na concessionária.
- **Indexação Automática no Spatie MediaLibrary:** O sistema ingere arquivos recebidos no chat diretamente nas coleções de mídia apropriadas da model `Client` ou `SolarProject`:
  - `solar_invoices`: Faturas de energia da distribuidora.
  - `identification_docs`: CNH, RG ou Contrato Social.
  - `powers_of_attorney`: Procurações assinadas para representação perante a concessionária.
  - `roof_photos`: Fotos do padrão de entrada, disjuntor geral, telhado e área de instalação do inversor.
- **Extração Inteligente por OCR Solar:** Leitura instantânea por IA dos metadados vitais da conta de luz:
  1. Concessionária responsável e código da Unidade Consumidora (UC).
  2. Histórico de consumo dos últimos 12 meses (kWh).
  3. Tipo de fornecimento e tensão de entrada (Monofásico, Bifásico, Trifásico - 127V/220V/380V).
  4. Valor total da fatura (R$) e itens de cobrança (CIP/Iluminação Pública, Bandeiras Tarifárias).
- **Auto-preenchimento Cadastral:** Os dados extraídos pelo OCR alimentam automaticamente os campos do projeto fotovoltaico, eliminando a digitação manual de 12 meses de histórico de consumo.
- **Feedback em Tempo Real ao Cliente:** Se o arquivo for inválido ou ilegível, o bot do WhatsApp avisa na hora: *"Identificamos que a foto da sua fatura está cortada e não conseguimos ler o código da UC e o histórico de consumo. Por favor, envie uma nova foto aberta da primeira folha da conta."*

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Visualizador e Validador de Documentos no Chat (`ChatCustomerDocsDossier.vue`):**
  - Integrado à interface de atendimento ao cliente em `resources/Vue/Sections/supportChat/`.
  - Exibe um painel lateral retrátil ou aba no suporte com todos os documentos solicitados pelo fluxo automatizado e seu status de conferência.
  - Renderização de PDFs através do componente `MaxPdfView` do `MaxComponentsUi`, permitindo zoom, rotação e visualização em página dupla.
  - Suporte a preview de imagens de alta resolução com ferramenta de ampliação e controle de contraste para leitura de faturas difíceis.
- **Painel de Auditoria de OCR (`SolarOcrReviewDrawer.vue`):**
  - Gaveta lateral que compara a imagem da fatura enviada lado a lado com os campos estruturados extraídos pela automação (UC, Concessionária, Consumo Mensal).
  - Permite ao atendente confirmar ou corrigir qualquer valor com 1 clique antes da gravação definitiva no projeto.
- **Store Pinia (`useChatCustomerDocsStore`):**
  - Gerencia o estado reativo dos arquivos associados à conversa atual.
  - Escuta eventos de WebSocket via Laravel Reverb (`document.uploaded`, `ocr.completed`) para atualizar os cards de documento sem necessidade de recarregar a página (`F5`).

### 4.2. Arquitetura Backend (Laravel 13 + Spatie MediaLibrary + WhatsApp Cloud API)
- **Captura Segura de Mídias via Webhook da Meta:**
  - `WebhookWhatsAppController`: Detecta mensagens do tipo `image` ou `document`.
  - Obtém a URL temporária da mídia chamando a Meta Graph API (`GET /{media-id}`) com o access token seguro da WhatsApp Cloud API.
  - Realiza streaming de download seguro através de chunks em disco temporário/Redis, impedindo sobrecarga de memória RAM do FrankenPHP/Octane.
- **Processamento Assíncrono com Laravel Horizon:**
  - `IngestChatDocumentJob`:
    - Valida o MIME type e sanitiza o nome do arquivo conforme convenções do Engeapp.
    - Utiliza o método `addMedia()` do Spatie MediaLibrary, atribuindo propriedades personalizadas (`custom_properties`):
      ```php
      $media = $solarProject->addMedia($tempFilePath)
          ->usingFileName($sanitizedFileName)
          ->withCustomProperties([
              'origin' => 'whatsapp_chat',
              'wa_message_id' => $messageId,
              'doc_type' => $docTypeEnum,
              'ocr_status' => 'processing',
          ])
          ->toMediaCollection($targetCollection);
      ```
  - `ProcessSolarInvoiceOcrJob`:
    - Dispara motor de OCR e inteligência visual (AWS Textract / Vision AI / Tesseract especializado em faturas de distribuidoras brasileiras).
    - Parseia os dados retornados e calcula automaticamente a média de consumo anual e o valor total.
    - Atualiza a model `SolarProject` e dispara broadcast Reverb `SolarInvoiceOcrFinishedEvent`.
    - Envia mensagem interativa de confirmação no WhatsApp com resumo dos dados identificados para validação do usuário.

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- `MaxPdfView`: Visualizador nativo de faturas e contratos em PDF diretamente na interface web sem plugins de terceiros.
- `MaxImage`: Renderização otimizada com lazy loading e controle de aspect ratio para fotos de padrões elétricos e telhados.
- `MaxInputFileUpload` e `MaxInputFileUploadBig`: Utilizados quando o próprio atendente ou cliente no portal precisa complementar o envio de documentos.
- `MaxBadge` e `MaxBadgeComponent`: Indicadores visuais de status:
  - `Pendente Envio` (cinza)
  - `Processando OCR` (azul animado)
  - `Aprovado` (verde)
  - `Documento Ilegível` (vermelho)
- `MaxDrawer`: Painel lateral retrátil para conferência e edição dos dados extraídos pela leitura da fatura.
- `MaxButtonConfirm` e `MaxIconConfirm`: Ações de rejeição com confirmação rápida ("Solicitar reenvio de fatura legível").
- `MaxToast`: Alertas de notificação quando um novo documento crítico é processado pela fila de background.

### 5.2. Novos Componentes Visuais Propostos
- `MaxChatDocumentCard.vue`: Card compacto embutido no histórico de mensagens do chat com miniatura da mídia, tipo de documento identificado, badges de validação e botão de ação rápida "Abrir no Dossiê".
- `MaxSolarOcrComparisonView.vue`: Componente split-view para inspeção lado a lado (fatura em PDF à esquerda, formulário editável de consumo em kWh à direita).
- `MaxDocUploadProgressBubble.vue`: Balão de mensagem simulado indicando o progresso da extração de dados e status do documento dentro da timeline da conversa.
