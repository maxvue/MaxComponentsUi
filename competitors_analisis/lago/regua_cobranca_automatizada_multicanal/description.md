# Régua de Cobrança Automatizada Multicanal (Dunning Management & Smart Reminders)

## 1. Visão Geral no Lago
No Lago (plataforma open-source de metering e billing engine), o gerenciamento de inadimplência e cobrança preventiva/reativa (**Dunning Management**) é tratado como uma esteira orientada a eventos e regras temporais configuráveis:
- **Agendamento de Dunning Parametrizável**: O Lago permite configurar períodos de tolerância (*grace periods*), janelas de retentativa automática de pagamentos (*smart payment retries*) e intervalos de lembrete com base no ciclo de vida da fatura.
- **Eventos Granulares de Faturamento**: Cada alteração no estado da cobrança dispara webhooks padronizados, tais como `invoice.created`, `invoice.payment_overdue`, `invoice.payment_failed` e `invoice.dunning_started`.
- **Idempotência e Rastreabilidade**: Notificações e tentativas de retentativa de cobrança possuem rastreabilidade transacional estrita com chaves de idempotência, garantindo que nenhum cliente receba cobranças duplicadas ou mensagens fora da sequência planejada.
- **Integração com Mecanismos de Notificação**: Embora o Lago delegue a entrega final (e-mail, SMS, mensageria) para serviços acoplados via webhook, a máquina de controle de inadimplência é centralizada e totalmente auditável.

## 2. Situação Atual no Engeapp
No ecossistema atual do Engeapp (responsável pela gestão de clientes, projetos fotovoltaicos e faturamento de homologação em concessionárias de energia):
- **Cobrança Passiva e Manual**: As cobranças Pix (via Efí) e Boletos (via Banco Inter / Efí) são geradas de forma pontual no momento do cadastro do projeto ou envio da documentação técnica. Caso o cliente ou integrador não pague até o vencimento, o sistema não executa nenhuma ação autônoma.
- **Ausência de Escalonamento Multicanal**: Não existe uma régua de cobrança programada disparando alertas preventivos (ex.: 3 dias antes do vencimento) e reativos (no dia do vencimento, 3 dias após e 7 dias após). A comunicação recai integralmente sobre operadores humanos que precisam consultar relatórios estáticos e enviar mensagens manuais pelo WhatsApp.
- **Falta de Lembretes Dinâmicos com QR Code Atualizado**: O Pix e o Boleto bancário possuem prazos de validade. Quando vencem, o cliente não recebe de forma automatizada uma chave Pix atualizada ou um boleto com novo vencimento e cálculo de juros/multa pelo WhatsApp Cloud API da Engeapp.
- **Risco Operacional na Homologação**: Projetos continuam com técnicos alocados ou até mesmo com documentos enviados para a concessionária sem a confirmação do pagamento das taxas de serviço, gerando retrabalho e prejuízo direto de fluxo de caixa.

## 3. Valor Agregado para o Engeapp
A implementação de uma Régua de Cobrança Automatizada Multicanal entrega impacto financeiro imediato:
- **Redução Significativa da Inadimplência (DSO - Days Sales Outstanding)**: Lembretes automáticos prévios (D-3, D-0) reduzem o esquecimento casual em até 65%, especialmente no mercado solar onde integradores gerenciam dezenas de clientes em paralelo.
- **Automação Completa via WhatsApp Cloud API**: O Engeapp já possui conexão com a API oficial do WhatsApp Cloud. O envio automático de mensagens ricas (com QR Code Pix Copia-e-Cola em botão interativo de 1 toque e PDF do Boleto anexado) maximiza a taxa de conversão instantânea.
- **Alinhamento com a Esteira Técnica Solar**: A régua não atua apenas no aspecto financeiro, mas congela/descongela automaticamente as etapas de homologação (ex.: se a fatura vencer em D+5, o envio do protocolo para a concessionária é suspenso automaticamente no sistema, alertando o integrador).
- **Desafogamento da Equipe Operacional**: Elimina o tempo gasto por assistentes e gestores financeiros cobrando boletos manualmente, permitindo que a equipe foque em relacionamento comercial e análise de projetos complexos.

## 4. Especificação Técnica Proposta

### Arquitetura Backend (Laravel 13 + Horizon + Efí/Inter)
- **Model & Migration `DunningSchedule`**:
  - `id`, `uuid`, `name`, `trigger_days` (inteiro relativo: -3, 0, +2, +5, +10), `channel` (`whatsapp`, `email`, `sms`), `template_identifier`, `action_type` (`reminder`, `regenerate_pix`, `suspend_project`), `is_active`.
- **Model & Migration `DunningActionLog`**:
  - `id`, `invoice_id`, `dunning_schedule_id`, `recipient_phone`, `channel`, `status` (`queued`, `sent`, `delivered`, `failed`), `idempotency_key` (ex.: `dunning_{invoice_id}_{schedule_id}_{date}`), `response_payload`, `executed_at`.
- **Console Command & Scheduler**:
  - `php artisan billing:run-dunning-rules`: executado via cron diário (ex.: às 08:00 e 14:00).
  - Consulta faturas nos status `pending` e `overdue`, avalia as regras aplicáveis e despacha jobs dedicados.
- **Laravel Horizon Queued Jobs**:
  - `ProcessDunningActionJob`: job assíncrono com retries controlados e isolamento na fila `dunning` do Horizon.
  - Se a regra exigir regeneração do Pix/Boleto: utiliza os SDKs PHP existentes (`efipay/sdk-php-apis-efi` para gerar nova cobrança imediata ou atualizar vencimento da cobrança via `inter-co/pj-sdk-php`).
  - Disparo de mensagem rica através do serviço `WhatsAppCloudService` (templates de mensagem interativa com botões de CTA `Copiar Código Pix` e link para a fatura).
- **Eventos e WebSockets**:
  - Disparo de `DunningActionDispatched` via Laravel Reverb para atualizar o painel financeiro do Engeapp em tempo real.

### Arquitetura Frontend (Vue 3 + UnoCSS + MaxComponentsUi)
- **View de Configuração da Régua (`DunningConfigView.vue`)**:
  - Interface visual para o time financeiro parametrizar a linha do tempo de cobrança (dias antes/depois, mensagens e canais).
- **Widget de Histórico na Tela do Projeto/Fatura (`DunningTimelineWidget.vue`)**:
  - Exibição cronológica dos lembretes enviados, status de entrega no WhatsApp (enviado, lido, respondido) e ações executadas.

## 5. Componentes de UI Sugeridos
- `MaxBadge`: Exibição visual do status de cobrança na lista de projetos/faturas (`Lembrete D-3 Enviado`, `Vencido - Dunning Ativo`, `Projeto Congelado`).
- `MaxTable`, `MaxTableColumn`, `MaxTableFields`: Grid administrativo para gerenciar as regras de régua ativas e histórico de disparos com paginação e busca.
- `MaxInputSelect`: Seleção de canais de envio (`WhatsApp Cloud`, `E-mail`, `Notificação no App`) e gatilhos temporais.
- `MaxInputNumber`: Configuração dos dias relativos ao vencimento (`-3`, `0`, `+3`, `+7`).
- `MaxInputSwitch`: Toggle rápido para ativar/desativar cada passo da régua ou suspensão automática de projetos solares.
- `MaxModal`: Modal de criação/edição de regras de dunning com preview de template de mensagem.
- `MaxButtonConfirm`: Botão de parada emergencial da régua de cobrança para clientes com negociação especial em andamento.
- `MaxToast`: Alertas de confirmação de disparos manuais ou reenvio de cobrança via interface.
