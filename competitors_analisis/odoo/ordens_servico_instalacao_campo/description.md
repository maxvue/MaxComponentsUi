# Gestão de Ordens de Serviço de Instalação e Campo (Field Service O&M)

## 1. Visão Geral no Odoo

No **Odoo Field Service (Serviços de Campo) e Inventory**, a execução de instalações e manutenções é gerida através de **Ordens de Serviço (Work Orders / Tasks) totalmente conectadas ao ciclo operacional**:

- **Agendamento e Despacho de Equipes (Dispatching)**: Visualização em Mapa e Calendário (Gantt) para roteirização e alocação de equipes técnicas próprias ou integradores terceirizados com base na disponibilidade geográfica e especialização técnica.
- **Rastreamento de Tempo de Execução (Timesheet / Timer)**: O aplicativo de campo permite que o líder de instalação acione um cronômetro digital ("Iniciar Trabalho", "Pausa", "Concluir"), registrando com precisão as horas gastas no canteiro de obras.
- **Baixa de Materiais e Equipamentos em Campo**: Registro em tempo real dos itens instalados a partir do pedido ou projeto (ex.: número de série dos módulos solares, inversores, stringbox, metragem de cabos solares, conectores MC4 e estruturas de fixação), dando baixa automática no estoque do almoxarifado ou alertando sobre sobras e perdas.
- **Testes de Comissionamento e Startup**: Validação técnica dos parâmetros elétricos de funcionamento antes da entrega da usina: medição de tensão de circuito aberto ($V_{oc}$), corrente de curto-circuito ($I_{sc}$), resistência de aterramento e configuração do datalogger/Wi-Fi do inversor no aplicativo de monitoramento.
- **Termo de Recebimento de Obra com Assinatura**: Geração instantânea do Termo de Conclusão e Entrega da Usina com colheita da assinatura do cliente no local, ativando formalmente a garantia da instalação.

---

## 2. Situação Atual no Engeapp

No **Engeapp**, a fase que compreende a montagem física no telhado, o comissionamento elétrico e a manutenção pós-venda (O&M) apresenta os seguintes pontos de atenção:

- **Desconexão entre Homologação e Execução Física**: O foco histórico do sistema é centrado na documentação e engenharia regulatória junto às distribuidoras de energia. O acompanhamento da obra de instalação em si costuma ficar descentralizado em planilhas, conversas de WhatsApp ou relatórios manuais avulsos.
- **Falta de Rastreamento de Números de Série**: Não há fluxo nativo estruturado para vincular os números de série (SN) dos equipamentos instalados (inversores e módulos) à ficha do cliente durante a execução do serviço, dificultando futuras operações de garantia e suporte técnico (RMA).
- **Sem Formulário Estruturado de Comissionamento Elétrico**: Os testes de partida e funcionamento da usina solar não possuem campos específicos de registro (tensão de strings, comunicação do inversor com a rede), ficando à mercê de anotações soltas dos instaladores.
- **Ausência de Termo Formal de Entrega Mobile**: O aceite da instalação física pelo cliente não é colhido de maneira digital padronizada através do aplicativo com coordenadas GPS e assinatura na tela.

---

## 3. Valor Agregado para o Engeapp

A incorporação da gestão de Ordens de Serviço de Instalação e Pós-Venda transforma o Engeapp em um ERP/Field Service vertical completo para o setor solar:

- **Controle Ponta a Ponta (360°)**: O integrador e a franqueadora passam a ter visibilidade total: desde o lead no CRM, passando pela vistoria técnica, homologação na concessionária, até a instalação física, comissionamento e manutenção preventiva/corretiva.
- **Eliminação de Disputas de Garantia (RMA)**: O registro fotográfico dos testes de isolamento e dos números de série de cada módulo/inversor comprova a correta instalação e parametrização, agilizando trocas em garantia com fabricantes (Growatt, Deye, Huawei, Sungrow, Canadian, etc.).
- **Satisfação e Segurança para o Cliente Final**: O cliente assina um documento formal de entrega com fotos da instalação concluída e orientações de segurança, elevando o profissionalismo percebido da empresa integradora.
- **Redução de Custos de Deslocamento**: Gestão de rotas e prioridades de chamados de pós-venda (usina offline, microinversor desconectado, disjuntor desarmando) com histórico centralizado das intervenções.

---

## 4. Especificação Técnica Proposta

### Arquitetura Frontend (Vue 3 + Composition API + Pinia)

- **Store Dedicada (`useFieldServiceOrderStore`)**:
  - Gerenciamento de ciclo de vida da OS: `DRAFT` (Criada) -> `SCHEDULED` (Agendada) -> `IN_TRANSIT` (Em Deslocamento) -> `IN_PROGRESS` (Em Execução com Timer) -> `COMMISSIONING` (Comissionamento e Testes) -> `SIGNED` (Assinada) -> `COMPLETED` (Finalizada).
  - Controle de Equipamentos: Mapeamento de itens com leitor de código de barras / QR Code via câmera (usando biblioteca `@zxing/library` ou `html5-qrcode`) para bipar números de série de módulos e inversores.
  - Seção de Comissionamento:
    - Registro de medições elétricas ($V_{oc}$, $I_{sc}$, Tensão da Rede CA, Frequência).
    - Status de emparelhamento Wi-Fi / Comunicação com a nuvem do inversor.
    - Fotos do padrão finalizado, inversor ligado e placas montadas no telhado.
- **Interface Otimizada para Tablet e Mobile**:
  - Cards touch-friendly, botões grandes de ação com feedback háptico e layout contrastante para uso sob luz solar direta em telhados/canteiros.

### Backend (Laravel 13 + Spatie MediaLibrary + Meilisearch)

- **Estrutura de Banco de Dados**:
  - Tabela `service_orders`: `project_id`, `assigned_team_id`, `scheduled_at`, `started_at`, `completed_at`, `status`, `lat_checkin`, `lng_checkin`, `signature_path`.
  - Tabela `service_order_items`: Itens instalados com `serial_number`, `equipment_type`, `model`, `warranty_until`.
  - Tabela `service_order_commissionings`: Medições de grandezas elétricas e checklist de testes.
- **Indexação com Meilisearch**:
  - Busca instantânea por número de série de inversores e módulos em toda a base de clientes para suporte e recall imediato.
- **Websockets com Laravel Reverb**:
  - Atualização em tempo real no painel de despacho da central quando a equipe inicia ou encerra uma instalação.

---

## 5. Componentes de UI Sugeridos

### Componentes Existentes em `MaxComponentsUi`:
- `MaxPageMobileLayout` e `MaxBottomMenu`: Interface ergonômica para instaladores em campo.
- `MaxInputText`: Entrada de dados de medições elétricas e modelo de inversor.
- `MaxInputNumber`: Valores numéricos de tensão ($V_{oc}$), corrente ($I_{sc}$) e potência.
- `MaxInputSwitch`: Checklists rápidos (ex.: "Cabos protegidos contra intempéries?", "Aterramento equalizado?").
- `MaxInputFileUploadBig`: Registro de fotos da obra concluída (visão do telhado, stringbox aberta e fechada, inversor em operação).
- `MaxBadge`: Exibição do estado da ordem de serviço.
- `MaxButton`: Botões de transição de status ("Iniciar Instalação", "Registrar Testes", "Concluir").
- `MaxModal`: Janela para bipar ou inserir novos números de série de equipamentos.

### Novos Componentes a Serem Desenvolvidos:
- `MaxQrBarcodeScanner`: Componente com integração à câmera do dispositivo para leitura contínua de códigos de barra e QR codes dos módulos e inversores solares.
- `MaxTimerWidget`: Widget de cronômetro flutuante para registro das horas de trabalho com botões de play, pause e stop.
- `MaxSignaturePad`: Componente de coleta de assinatura digital do cliente no aceite formal da usina instalada.
