# Máquina de Estados de Faturamento, Cancelamento e Notas de Crédito (Invoice Lifecycle & Credit Notes)

## 1. Visão Geral no Lago
No Lago, o ciclo financeiro de qualquer cobrança é governado por uma **Máquina de Estados Finitos (Finite State Machine - FSM)** estrita e imutável:
- **Estados do Ciclo de Vida da Fatura**: As faturas progridem de forma determinística entre estados claramente mapeados: `draft` (em elaboração) -> `finalized` (congelada para cobrança) -> `payment_pending` (aguardando retorno bancário) -> `paid` (liquidada) / `failed` (falha na cobrança) -> `void` (anulada) ou `uncollectible` (perda financeira/inadimplência irrecuperável).
- **Transições Blindadas contra Erros**: Transições ilegais (ex.: passar diretamente de `void` para `paid` ou alterar valores de uma fatura `finalized`) são bloqueadas em nível de domínio com disparo de exceções.
- **Notas de Crédito (Credit Notes) e Estornos Estruturados**: No Lago, faturas finalizadas nunca são deletadas ou alteradas retroativamente. Caso um cliente cancele o contrato ou receba um abatimento comercial, o Lago emite uma `Credit Note` vinculada à fatura original. A nota de crédito formaliza o estorno, atualiza o livro-razão contábil e pode gerar saldo credor na carteira do cliente para abater cobranças futuras.

## 2. Situação Atual no Engeapp
No Engeapp, a gestão do ciclo de vida de cobranças de homologação solar e serviços técnicos carece de rigor formal:
- **Estados Informais e Alterações Soltas no Banco**: O status da cobrança é manipulado como strings soltas em tabelas (`payments`, `projects`), sem uma classe de controle de máquina de estados. Qualquer rotina ou tela administrativa pode alterar o status sem validação prévia de transição legal.
- **Cancelamentos Desestruturados e Sobrescrita de Registros**: Quando um projeto de energia solar é reprovado na distribuidora, cancelado pelo integrador ou precisa de readequação de potência (ex.: troca de inversor de 5 kW para 8 kW com ajuste de taxa), o registro financeiro anterior é frequentemente sobrescrito ou até mesmo apagado, aniquilando a trilha de auditoria contábil.
- **Inexistência de Notas de Crédito e Gestão de Saldos**: Não há o conceito formal de Nota de Crédito (*Credit Note*). Se o cliente pagou uma homologação e desistiu antes do protocolo na concessionária, o financeiro do Engeapp realiza transferências manuais sem vínculo sistêmico, ou o saldo a favor do integrador fica "anotado" sem abatimento automático em futuros projetos solares.
- **Cobranças Órfãs nos Gateways Bancários**: Quando um projeto é cancelado internamente no Engeapp, muitas vezes o Pix na Efí ou o Boleto no Banco Inter permanece ativo no gateway bancário, correndo o risco de o cliente pagar um boleto de um projeto já descontinuado.

## 3. Valor Agregado para o Engeapp
A implementação de uma Máquina de Estados de Faturamento acompanhada de Notas de Crédito entrega solidez empresarial indispensável:
- **Conformidade Fiscal e Governança Contábil**: Faturas finalizadas tornam-se documentos imutáveis. Qualquer ajuste financeiro é efetuado através de Notas de Crédito, atendendo a exigências de auditoria e contabilidade sem divergências de conciliação.
- **Cancelamento Sincronizado com Bancos**: Ao transicionar uma fatura para `void` (anulada), o sistema automaticamente cancela a cobrança ativa na API da Efí (`/v2/cob/{txid}`) ou dá baixa no boleto via API do Banco Inter (`/cobranca/v3/cobrancas/{nossoNumero}/cancelar`), impedindo pagamentos indevidos.
- **Aproveitamento Ágil de Créditos em Novos Projetos**: Ao emitir uma Credit Note para um projeto cancelado, o valor pode ser automaticamente convertido em crédito na carteira do integrador parceiro, permitindo que ele aplique o saldo imediatamente na homologação de outro cliente solar.
- **Métricas Financeiras Claras e Confiáveis**: Separação precisa entre faturamento bruto, cancelamentos justificados, créditos concedidos e inadimplência real, permitindo análises executivas precisas da saúde financeira do Engeapp.

## 4. Especificação Técnica Proposta

### Arquitetura Backend (Laravel 13 + Horizon + Efí/Inter)
- **PHP 8.5 Backed Enum `InvoiceStatus`**:
  ```php
  enum InvoiceStatus: string {
      case Draft = 'draft';
      case Finalized = 'finalized';
      case PaymentPending = 'payment_pending';
      case Paid = 'paid';
      case InDunning = 'in_dunning';
      case Void = 'void';
      case Uncollectible = 'uncollectible';
  }
  ```
- **Service & State Machine `InvoiceStateMachine`**:
  - Métodos `canTransitionTo(InvoiceStatus $newStatus): bool` e `transitionTo(InvoiceStatus $newStatus, ?string $reason = null)`.
  - Impede qualquer transição a partir do estado terminal `Void`.
  - Dispara eventos de domínio: `InvoiceFinalizedEvent`, `InvoicePaidEvent`, `InvoiceVoidedEvent`.
  - Listener `CancelBankChargesOnVoidListener`: ao anular uma fatura, despacha job no Horizon para cancelar o QR Code Pix na Efí e baixar o boleto no Banco Inter.
- **Model & Migration `CreditNote`**:
  - `id`, `uuid`, `invoice_id`, `partner_id`, `amount_in_cents`, `reason` (`project_cancelled`, `concessionaire_rejection`, `potency_adjustment`, `commercial_discount`), `refund_type` (`wallet_credit`, `pix_refund`), `status` (`issued`, `settled`), `justification`, `created_by`, `issued_at`.
- **Integração com Carteira do Integrador (`PartnerWallet`)**:
  - Se `refund_type === 'wallet_credit'`, credita instantaneamente o valor em `partner_wallet_ledger` para abatimento no checkout de próximos projetos solares.

### Arquitetura Frontend (Vue 3 + UnoCSS + MaxComponentsUi)
- **Visualizador do Ciclo de Vida da Fatura (`InvoiceLifecycleTracker.vue`)**:
  - Exibição gráfica dos estados percorridos pela fatura (Rascunho -> Finalizada -> Cobrança Ativa -> Paga/Anulada) com carimbos de data/hora.
- **Modal de Emissão de Nota de Crédito / Cancelamento (`CreditNoteModal.vue`)**:
  - Interface protegida para operadores financeiros inserirem motivo, justificativa e opção de destinação do valor (devolver via Pix ou creditar na carteira do integrador).
- **Aba de Notas de Crédito no Detalhe da Fatura (`CreditNotesList.vue`)**:
  - Tabela com histórico de abatimentos e notas de crédito emitidas para aquela cobrança.

## 5. Componentes de UI Sugeridos
- `MaxBadge`: Badges semânticos de alto contraste indicando o status estrito da fatura (`Rascunho`, `Finalizada`, `Aguardando Pagamento`, `Liquidada`, `Anulada`, `Nota de Crédito Vinculada`).
- `MaxTable`, `MaxTableColumn`, `MaxTableFields`: Listagem de faturas e notas de crédito com filtros por status do ciclo de vida e motivo de estorno.
- `MaxModal`: Modal responsivo para anulação de fatura e emissão justificada de Nota de Crédito.
- `MaxButtonConfirm`: Confirmação em duas etapas para ações irreversíveis (invalidar/anular fatura com cancelamento de boleto bancário ativo).
- `MaxInputSelect`: Seleção obrigatória de motivo do estorno (`Projeto Cancelado pelo Cliente`, `Reprovação Definitiva na Concessionária`, `Ajuste de Potência kWp`, `Desconto Comercial`).
- `MaxInputTextArea`: Justificativa detalhada para fins de auditoria contábil.
- `MaxInputNumber`: Campo de moeda formatado para inserção do valor da Nota de Crédito.
- `MaxToast`: Notificação flutuante de sucesso na transição de estado da fatura e cancelamento bancário.
