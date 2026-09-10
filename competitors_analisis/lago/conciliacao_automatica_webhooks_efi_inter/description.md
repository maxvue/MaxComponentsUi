# Conciliação Automática e Idempotência de Webhooks Efí / Banco Inter

## 1. Visão Geral no Lago
No Lago, a confiabilidade das transações financeiras e o tratamento de eventos externos de cobrança assentam-se sobre três pilares inegociáveis:
- **Idempotência Estrita de Ponta a Ponta**: Cada evento financeiro recebido ou disparado pelo Lago deve conter obrigatoriamente um identificador unívoco (`idempotency_key`). Se o mesmo evento for entregue múltiplas vezes pelo gateway de pagamento (devido a retentativas de rede, timeouts ou replays), o sistema identifica a chave no banco, evita reprocessamento e retorna a mesma resposta sem alterar saldos ou estados.
- **Tratamento Resiliente de Webhooks**: Webhooks contam com verificação de assinatura criptográfica (HMAC-SHA256 ou mTLS), fila de processamento assíncrono com Dead-Letter Queue (DLQ) para falhas transitórias e reprocessamento manual seguro através de painel administrativo.
- **Ledger Imutável e Reconciliação Transacional**: Todas as transições de pagamento (`pending`, `succeeded`, `failed`) são registradas em um livro-razão (*ledger*) de auditoria. Faturas e pagamentos são conciliados com separação clara entre o valor bruto faturado, as taxas cobradas pelo provedor de pagamento e o valor líquido creditado.

## 2. Situação Atual no Engeapp
No Engeapp, a integração de pagamentos utiliza os SDKs oficiais PHP `efipay/sdk-php-apis-efi` (para Pix e Boletos Efí) e `inter-co/pj-sdk-php` (para Boletos e Pix do Banco Inter), mas apresenta fragilidades estruturais no pipeline de conciliação:
- **Proteção Frágil Contra Reprocessamento Concorrente**: O processamento do webhook da Efí no job `ProcessEfiWebhookJob` baseia-se exclusivamente em um guarda simples `$payment->status !== 'paid'`. Se dois webhooks chegarem quase simultaneamente (condição de corrida) ou se uma rotina de sincronização estiver ativa, não há lock atômico distribuído no Redis.
- **Ausência de Chave de Idempotência com Índice Único**: Não existe uma chave de idempotência persistida com restrição de unicidade (`UNIQUE index`) na tabela `bank_webhooks`. Quando a Efí ou o Banco Inter reenviaram um webhook devido a um pico de latência na resposta HTTP 200, os dados são duplicados na tabela `webhook_data_received`, corrompendo a rastreabilidade histórica.
- **Dependência Excessiva de Webhooks Passivos**: Se a concessionária de rede ou o gateway sofrer instabilidade e o webhook se perder (timeout de conexão), a fatura permanece indefinidamente com status pendente. A conciliação depende do comando esporádico `SyncEfiPaymentsStatusCommand` que apenas consulta status pontuais, sem uma varredura de conciliação ativa com base nos extratos bancários das APIs.
- **Falta de Discriminação de Tarifas Bancárias**: Ao receber o pagamento de uma homologação, o sistema não calcula nem desconecta automaticamente a taxa bancária descontada pela Efí ou pelo Banco Inter, dificultando o fechamento contábil e o cálculo exato da margem de lucro por projeto fotovoltaico.

## 3. Valor Agregado para o Engeapp
A implementação de uma conciliação automática moderna e um pipeline idempotente de webhooks confere solidez operacional crítica:
- **Risco Zero de Duplicação Financeira**: Garantia matemática de que nenhum crédito, comissão de integrador ou liberação de documento na concessionária seja processado duas vezes.
- **Conformidade Contábil e Auditoria Imutável**: Registro transparente de cada evento bancário com o `endToEndId` do Banco Central no Pix e o código de barras/autenticação no Boleto, permitindo auditar qualquer divergência em segundos.
- **Reconciliação Bidirecional Ativa (Webhook + Extrato de Contingência)**: Identificação e liquidação automática de faturas pagas cujos webhooks foram interceptados ou caíram em timeout bancário, evitando que clientes com pagamentos compensados fiquem com a esteira solar bloqueada.
- **Visibilidade de Custos Financeiros Reais**: Apuração exata das tarifas bancárias retidas pela Efí e pelo Banco Inter em cada cobrança, permitindo otimizar a rota de menor custo (Pix Efí vs Boleto Inter).

## 4. Especificação Técnica Proposta

### Arquitetura Backend (Laravel 13 + Horizon + Redis + Efí/Inter)
- **Migração e Model `BankWebhookEvent`**:
  - `id`, `bank_provider` (`efi`, `inter`), `idempotency_key` (`VARCHAR(191) UNIQUE`), `event_type` (`pix.received`, `boleto.paid`, `charge.expired`), `payload` (`json`), `status` (`pending`, `processed`, `failed`), `attempts`, `error_message`, `processed_at`.
  - A `idempotency_key` é gerada deterministicamente: para Pix Efí utiliza o `endToEndId` (fallback para `txid`); para Boleto Inter utiliza `codigoSolicitacao` / `nossoNumero`.
- **Camada de Ingestão e Verificação Rápida**:
  - Controller dedicado `BankWebhookReceiverController`: valida a assinatura/certificado mTLS do webhook, grava imediatamente o registro em `BankWebhookEvent` via transação atômica (`INSERT IGNORE` ou `upsert` protegida pelo índice único) e retorna `HTTP 200 OK` em menos de 100ms para evitar retentativas agressivas dos bancos.
- **Processamento Assíncrono com Lock Distribuído**:
  - Job `ProcessBankWebhookJob` no Laravel Horizon:
  - Adquire lock atômico no Redis via `Cache::lock("webhook_lock:{$idempotencyKey}", 15)`.
  - Atualiza a fatura (`Payment`/`Invoice`), altera o status para `paid`, registra a data/hora exata da liquidação bancária e armazena as tarifas retidas.
  - Dispara o evento de domínio `PaymentConfirmedEvent`.
- **Serviço de Conciliação Ativa (`BankReconciliationService`)**:
  - Comando agendado `php artisan billing:reconcile-bank-statements`: roda a cada 1 hora.
  - Consulta o extrato de movimentações via API da Efí (`/v2/gn/extrato` ou lista de Pix recebidos) e via API do Banco Inter (`/cobranca/v3/cobrancas/resumo`).
  - Cruza transações pagas com o banco de dados local. Caso encontre faturas pendentes que já constam liquidadas no banco, executa a baixa automática e notifica a equipe sobre a divergência de webhook.
- **Broadcast em Tempo Real**:
  - Disparo de `PaymentReconciledEvent` através do Laravel Reverb (Websockets) para atualizar o dashboard dos analistas solares instantaneamente.

### Arquitetura Frontend (Vue 3 + UnoCSS + MaxComponentsUi)
- **Painel de Conciliação Bancária (`BankReconciliationDashboard.vue`)**:
  - Visão geral das transações diárias de Efí e Inter: comparativo entre faturado, recebido, taxas retidas e divergências.
- **Aba de Auditoria de Webhooks (`WebhookAuditView.vue`)**:
  - Histórico detalhado de todos os webhooks recebidos com status de idempotência, tempo de resposta, payload JSON formatado e botão de reprocessamento manual seguro.

## 5. Componentes de UI Sugeridos
- `MaxBadge`: Indicadores de status da conciliação (`Conciliado via Webhook`, `Conciliado via Extrato`, `Idempotente (Duplicata Descartada)`, `Falha de Assinatura`).
- `MaxTable`, `MaxTableColumn`, `MaxTableFields`: Listagem completa do livro-razão financeiro com ordenação por data, banco (Efí / Banco Inter), valor bruto, taxa e valor líquido.
- `MaxStats`: Cartões de indicadores superiores com métricas chave: Total Liquidado no Dia, Total em Taxas Bancárias, Webhooks Processados (100% Idempotência) e Divergências Pendentes.
- `MaxModal`: Modal de inspeção profunda do payload bruto do webhook recebido e rastreamento da pilha de execução do job do Horizon.
- `MaxButtonConfirm`: Ação protegida com modal de confirmação para forçar reprocessamento de webhook com falha estrutural.
- `MaxInputDatePicker`: Filtro por período de conciliação financeira e datas de corte bancário.
- `MaxToast`: Notificação flutuante de sincronização de extrato concluída com sucesso.
