# Fluxo de Consumo Automatizado (Watch Folders, IMAP e Roteamento Inteligente)

## 1. Visão Geral no Paperless-ngx
O recurso de maior destaque e assinatura do **Paperless-ngx** é o seu pipeline de consumo autônomo e contínuo de documentos (*Document Consumption Pipeline*):
- **Pasta Vigiada em Tempo Real (*Consume Folder*)**: Monitora diretórios do sistema de arquivos através de eventos de kernel (`inotify`). Qualquer arquivo PDF ou imagem depositado na pasta (seja por scanner de rede com SMB/FTP, impressora multifuncional ou sincronização em nuvem) é detectado instantaneamente, consumido e enfileirado para processamento.
- **Ingestão Multicanal por E-mail (IMAP Polling)**: O Paperless conecta-se a caixas de e-mail via IMAP, processa mensagens recebidas com base em regras configuráveis (remetente, assunto, corpo da mensagem), extrai anexos PDF/imagens e arquiva o corpo do e-mail.
- **Hooks de Pré e Pós-Consumo (*Pre/Post-Consumption Scripts*)**: Permite acionar scripts personalizados antes e depois do processamento do documento para executar rotinas externas, sanitização ou disparos de webhooks.
- **Roteamento Inteligente e Atribuição Automática de Metadados**: O sistema analisa o texto extraído e aplica algoritmos de correspondência (Matching Rules) para categorizar automaticamente o tipo de documento, atribuir tags temáticas, definir o correspondente emissor e alocar o arquivo em diretórios lógicos de armazenamento (*Storage Paths*).

## 2. Situação Atual no Engeapp
No sistema **Engeapp**, todo o fluxo de entrada de documentos é estritamente passivo e manual:
- **Dependência Absoluta de Upload Manual Tela a Tela**: Para que um documento entre no sistema, o usuário precisa obrigatoriamente abrir o navegador, logar no Engeapp, navegar até a tela específica do projeto ou do cliente, rolar até o componente `MaxInputFileProject` e fazer o upload manual arquivo por arquivo.
- **Gargalo no Recebimento de E-mails de Concessionárias de Energia**:
  - As concessionárias de energia (Cemig, CPFL, Enel, Neoenergia, etc.) comunicam o andamento dos processos de homologação exclusivamente por e-mail:
    1. *Parecer de Acesso Deferido* (com as condições de conexão da usina);
    2. *Nota de Devolução / Exigência Técnica*;
    3. *Notificação de Agendamento de Vistoria*;
    4. *Orçamento Prévio de Obras de Reforço de Rede*.
  - No modelo atual do Engeapp, esses e-mails chegam na caixa postal do engenheiro. Se o engenheiro estiver em campo, de folga ou sobrecarregado, o documento fica esquecido na caixa de entrada. O prazo regulatório da ANEEL (muitas vezes de apenas 30 dias para aceitar o orçamento ou cumprir a exigência) começa a correr sem que a equipe saiba.
- **Desconexão com Scanners Físicos e WhatsApp de Integradores**:
  - Em escritórios de engenharia solar com scanners de mesa ou pastas de rede compartilhadas no servidor NAS (Unraid), os arquivos escaneados não entram sozinhos no Engeapp.
  - Documentos e fotos enviados pelos integradores via WhatsApp precisam ser baixados no computador para depois serem submetidos na plataforma.
- **Ausência de Triagem e Classificação Inteligente**: O sistema não é capaz de inspecionar um documento recebido e deduzir automaticamente: *"Este arquivo é um Parecer de Acesso da Cemig referente ao projeto solar da Fazenda Boa Esperança (UC 3001234567)"*.

## 3. Valor Agregado para o Engeapp
A implementação de uma esteira autônoma de consumo inspirada no Paperless-ngx gerará um salto de eficiência operacional e competitividade para o Engeapp:
- **Ingestão "Zero-Touch" de Pareceres de Acesso e Exigências**: Conexão direta com a caixa postal de homologação da empresa. No momento em que a concessionária envia o e-mail com o parecer, o Engeapp captura o PDF, identifica a UC ou o número do protocolo, vincula o documento ao projeto correspondente e atualiza o status do projeto no sistema.
- **Alertas Imediatos via WhatsApp para o Integrador Solar**: Assim que o Parecer de Acesso for ingerido e roteado, a API Oficial WhatsApp Cloud do Engeapp dispara uma notificação instantânea para o integrador e para o cliente final: *"Excelente notícia! O Parecer de Acesso da sua usina solar foi emitido pela concessionária e já está disponível no portal"*.
- **Prevenção de Perda de Prazos Regulatórios**: Redução a zero do risco de perda de prazos de orçamentos de conexão de rede ou cumprimento de exigências técnicas estabelecidas pela ANEEL.
- **Centralização de Scanners Físicos do Escritório**: Diretórios vigiados no servidor local (CT LXC / NAS Unraid) permitem que a secretária apenas passe um calhamaço de documentos no scanner rápido para que tudo seja distribuído automaticamente no Engeapp.

## 4. Especificação Técnica Proposta

### 4.1 Backend (Laravel 13 + Horizon + Spatie MediaLibrary + IMAP Client + Inotify/Watcher)
- **Serviço de Ingestão de E-mails (`FetchConcessionaireEmailsCommand`)**:
  - Comando agendado no Laravel Scheduler (`schedule->everyFiveMinutes()`) ou worker contínuo de monitoramento IMAP via socket.
  - Varre as pastas de entrada de e-mails de concessionárias (`cemig@`, `homologacao@engeapp.com.br`).
  - Extrai os anexos PDF, analisa assunto e corpo do e-mail.
- **Pipeline de Roteamento Inteligente (`DocumentIngestionRouterService`)**:
  - O documento é submetido ao pipeline de extração rápida de texto (OCR / regex):
    1. Busca por padrões de protocolo de concessionária (ex.: `PROTOCOLO:\s*([0-9A-Z\-\/]+)`);
    2. Busca por números de Unidade Consumidora / Instalação cadastrados no banco do Engeapp (`SELECT project_id FROM photovoltaic_projects WHERE uc_number = ?`);
    3. Busca por CPF/CNPJ do titular do projeto.
  - Se houver correspondência exata de alta confiança (> 95%), o documento é associado diretamente ao projeto fotovoltaico na coleção correta da `Spatie MediaLibrary` (ex.: `access_opinions` ou `technical_requirements`).
  - Se a correspondência for ambígua ou incompleta, o documento é encaminhado para a **Fila de Triagem Rápida** do Engeapp.
- **Vigilante de Diretório Local (`ConsumptionFolderWatcherService`)**:
  - Script daemon em PHP/Node monitorando a pasta `/storage/consumption` montada no servidor de produção (LXC CloudPanel com SSD NVMe).
  - Ao detectar que um arquivo finalizou a cópia, move para quarentena e despacha o job `ProcessIngestedFileJob` no Laravel Horizon.
- **Notificações em Tempo Real**:
  - Disparo de eventos via **Laravel Reverb** para atualizar o dashboard da equipe de engenharia e envio de mensagem via WhatsApp Cloud API.

### 4.2 Frontend (Vue 3 Composition API + Pinia + MaxComponentsUi)
- **Store Pinia (`useIngestionQueueStore`)**:
  - Armazena a lista de documentos consumidos recentemente e documentos aguardando triagem manual.
  - Notificações de novos documentos recebidos em tempo real via canal de websockets.
- **Painel de Triagem Rápida (Inbox de Homologação)**:
  - Uma central unificada de documentos recém-chegados onde o usuário vê o documento à esquerda e a sugestão de projeto feita pela IA/Regex à direita, com botão de confirmação em 1 clique ("Vincular ao Projeto").

## 5. Componentes de UI Sugeridos

| Componente | Origem | Papel na Funcionalidade |
|---|---|---|
| `MaxIngestionPipelineStatus` | **Novo Componente** | Card analítico no topo do painel de engenharia exibindo contadores em tempo real: "Documentos Ingeridos Hoje", "Em Processamento OCR", "Pendentes de Triagem" e "Pareceres Vinculados Automaticamente". |
| `MaxTableFields` | Existente (`src/components/MaxTableFields.vue`) | Tabela interativa da fila de triagem com colunas: "Origem (E-mail Cemig / Scanner / WhatsApp)", "Arquivo", "Projeto Sugerido", "Score de Confiança" e "Ações". |
| `MaxButtonConfirm` | Existente (`src/components/MaxButtonConfirm.vue`) | Botão de confirmação rápida para validar a atribuição do documento ao projeto com um único clique. |
| `MaxBadge` | Existente (`src/components/MaxBadge.vue`) | Indicadores visuais de canal de captura (`E-mail Concessionária`, `Scanner Escritório`, `WhatsApp Integrador`) e de nível de confiança da correspondência. |
| `MaxModal` | Existente (`src/components/MaxModal.vue`) | Modal de triagem manual para reatribuir o documento a outro projeto ou criar um novo projeto a partir daquele documento. |
