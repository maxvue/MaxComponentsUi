# Checklist de Vistoria Técnica Mobile (Field Service)

## 1. Visão Geral no Odoo

No ecossistema **Odoo (Field Service & Projects)**, as vistorias de campo são tratadas através de tarefas móveis com **Worksheets customizáveis** e integração nativa com o app mobile e modo offline:

- **Worksheet Templates Dinâmicos**: O Odoo permite definir modelos de formulários de vistoria específicos por tipo de serviço (ex.: Vistoria Residencial, Comercial, Subestação/Usina de Solo). O formulário adapta-se com campos condicionais e etapas sequenciais obrigatórias.
- **Captura e Anotação de Mídia em Tempo Real**: O aplicativo mobile permite tirar fotos diretamente pela câmera do dispositivo, anexando-as aos itens da vistoria com carimbo automático de coordenadas geográficas (latitude/longitude EXIF) e timestamp. Permite ainda desenhar sobre as imagens para destacar não conformidades.
- **Georreferenciamento e Check-in/Check-out**: Ao iniciar a visita em campo, o técnico faz check-in georreferenciado, validando se está de fato no endereço da unidade consumidora (UC).
- **Assinatura Digital no Dispositivo (Sign-on-Glass)**: Ao final do checklist, o cliente ou responsável técnico assina digitalmente direto na tela do smartphone/tablet, gerando uma assinatura criptográfica anexada ao relatório.
- **Operação Offline**: Se o técnico estiver em área rural ou sem cobertura 4G/5G, os dados são persistidos no armazenamento local (IndexedDB) e sincronizados em segundo plano assim que a conexão for restabelecida.

---

## 2. Situação Atual no Engeapp

No **Engeapp**, a vistoria técnica e a coleta de dados de campo possuem as seguintes limitações em relação ao padrão do Odoo:

- **Upload Passivo e Desestruturado**: Atualmente, o envio de fotos de vistoria (padrão de entrada, disjuntor geral, telhado, inversor, transformador) é frequentemente realizado via upload genérico de arquivos soltos ou através de formulários desktop não responsivos.
- **Ausência de Checklist Guiado e Obrigatório**: Não há uma esteira mobile passo-a-passo que force o vistoriador a checar itens mandatórios antes de liberar o projeto para os engenheiros projetistas (ex.: bitola do ramal de entrada, estado do aterramento, espaço no quadro de distribuição, azimute e inclinação do telhado).
- **Sem Validação de Georreferenciamento no Momento da Foto**: As fotos muitas vezes vêm sem metadados precisos de localização ou são recebidas via WhatsApp, perdendo compressão e coordenadas, o que gera dúvidas sobre se a foto realmente pertence àquela instalação.
- **Falta de Coleta de Assinatura In Loco**: A validação de conformidade da vistoria pelo cliente ou vistoriador não é capturada digitalmente em tela sensível ao toque no ato do atendimento.
- **Sensibilidade a Falhas de Conexão**: Não há suporte estruturado a PWA offline para preenchimento de formulários de campo em regiões remotas ou fazendas solares sem sinal de internet.

---

## 3. Valor Agregado para o Engeapp

A implementação deste recurso no Engeapp trará impacto direto na eficiência operacional e na redução de custos:

- **Zero Retrabalho de Engenharia**: Vistorias incompletas ou com fotos desfocadas/faltantes são a principal causa de reprovação de projetos nas concessionárias (Equatorial, Cemig, CPFL, Enel, etc.) e de erros no dimensionamento dos cabos e disjuntores. Um checklist com validação obrigatória elimina retornos a campo.
- **Agilidade no Fluxo de Homologação**: O engenheiro recebe os dados instantaneamente em formato padronizado (com dados de disjuntor, tensão de atendimento, tipo de telha e coordenadas GPS exatas), podendo emitir a ART/TRT e o Diagrama Unifilar minutos após o encerramento da vistoria.
- **Rastreabilidade e Segurança Jurídica**: Fotos georreferenciadas com timestamp e assinatura digital do cliente na tela atestam a data da visita, o estado original da edificação e a autorização para intervenção no telhado/padrão elétrico.
- **Autonomia para Integradores e Terceirizados**: Integradores parceiros podem delegar vistorias para seus próprios técnicos de campo através de um link rápido ou PWA leve, garantindo o padrão de qualidade do Engeapp.

---

## 4. Especificação Técnica Proposta

### Arquitetura Frontend (Vue 3 + PWA + Pinia)

- **Layout Mobile-First**: Utilização de `MaxPageMobileLayout` com navegação por etapas (Stepper / Tabs inferiores com `MaxBottomMenu`).
- **PWA com Suporte Offline**: Service Worker (Workbox) com cache de assets estáticos e `IndexedDB` (via `idb` ou `Dexie.js`) para gravação dos formulários e imagens em fila de sincronização (`syncQueue`).
- **Store de Vistoria (`useTechnicalSurveyStore`)**:
  - Estado reativo gerenciando as seções do checklist:
    1. *Identificação e Georreferenciamento*: Coleta automática via Geolocation API (`navigator.geolocation.getCurrentPosition`), preenchendo latitude/longitude.
    2. *Padrão de Entrada*: Tipo de padrão (monofásico/bifásico/trifásico), disjuntor geral (A), ramal de entrada (mm²), fotos do medidor e caixa de medição.
    3. *Estrutura e Telhado*: Tipo de telha (cerâmica, fibrocimento, metálica), orientação/azimute, inclinação, estado das terças/caibros, fotos panorâmicas e de detalhe.
    4. *Infraestrutura e Inversores*: Local sugerido para inversor, distância até o quadro, aterramento, fotos do quadro geral.
    5. *Encerramento e Assinatura*: Canvas de assinatura digital (`signature_pad`) com carimbo de confirmação.
- **Compressão de Imagens no Cliente**: Processamento via Canvas/Web Worker antes do envio para evitar sobrecarga de rede móvel (resolução máxima de 1920x1080 com qualidade 85% e preservação/gravação de metadados).

### Backend (Laravel 13 + PHP 8.5 + Horizon)

- **Rotas de API Dedicadas**:
  - `POST /api/surveys`: Criação da ordem de vistoria associada ao projeto fotovoltaico.
  - `POST /api/surveys/{id}/items`: Atualização parcial com auto-save das respostas do checklist.
  - `POST /api/surveys/{id}/photos`: Upload multipart com metadados EXIF sanitizados e persistência via Spatie MediaLibrary.
  - `POST /api/surveys/{id}/sign`: Registro do SVG/Base64 da assinatura com hash SHA-256 e IP do dispositivo.
- **Jobs Assíncronos (Laravel Horizon)**:
  - Processamento em background de otimização de imagens, extração de metadados geográficos e geração do laudo preliminar em PDF.

---

## 5. Componentes de UI Sugeridos

### Componentes Existentes em `MaxComponentsUi`:
- `MaxPageMobileLayout`: Casca do layout otimizado para smartphones e tablets.
- `MaxBottomMenu`: Ações de navegação rápida entre etapas do checklist (Padrão, Telhado, Inversor, Resumo).
- `MaxInputCoordinateDecimalLat` e `MaxInputCoordinateDecimalLng`: Registro e validação das coordenadas da unidade consumidora.
- `MaxMaps`: Visualização do mapa interativo confirmando a posição do técnico no local do imóvel.
- `MaxInputSelect`: Seleção de tipos de padrão, fabricantes de disjuntor e modelos de fixação.
- `MaxInputSwitch`: Alternadores rápidos de conformidade (ex.: "Aterramento em conformidade?", "Espaço para disjuntor reserva?").
- `MaxInputTextArea`: Observações do vistoriador sobre particularidades do local.
- `MaxInputFileUploadBig`: Zona de captura rápida de foto com acionamento direto da câmera do smartphone.
- `MaxBadge`: Badges de status dos passos (Pendente, Em Andamento, Concluído, Crítico).
- `MaxToast`: Notificação flutuante de salvamento automático e sincronização offline.

### Novos Componentes a Serem Desenvolvidos:
- `MaxSignaturePad`: Componente sensível ao toque para coleta de assinatura digital na tela com suporte a limpeza, visualização prévia e exportação em SVG/PNG transparente.
- `MaxCameraCaptureGeo`: Componente especializado de câmera web com sobreposição automática de carimbo (Data, Hora, Latitude, Longitude, Nome do Técnico e Endereço da UC).
- `MaxChecklistStepper`: Barra de progresso mobile indicando etapas obrigatórias e pendências impeditivas.
