# Gestão de Comissões e Split de Pagamentos para Integradores e Parceiros

## 1. Visão Geral no Lago
No Lago, o suporte a modelos complexos de monetização B2B e parcerias inclui mecanismos avançados de rateio e carteiras digitais:
- **Wallets e Contas Gráficas**: O Lago gerencia carteiras virtuais pré-pagas e pós-pagas com controle estrito de créditos e débitos granulares vinculados a cada evento ou fatura emitida.
- **Cálculo Dinâmico de Tarifas e Splits**: Permite aplicar taxas percentuais, fixas ou híbridas sobre cada transação, calculando automaticamente deduções e repasses devidos a parceiros ou contas associadas.
- **Ledger de Créditos e Extratos Auditáveis**: Toda transação de acréscimo ou desconto na carteira do parceiro é registrada em uma trilha contábil imutável com rastreabilidade de fatura de origem, saldo anterior e saldo resultante.

## 2. Situação Atual no Engeapp
O modelo de negócios do Engeapp é estruturado em torno da rede de **integradores de energia solar**, que intermedeiam clientes finais e contratam a engenharia do Engeapp para elaboração de projetos e homologação em concessionárias de energia elétrica (ex.: Neoenergia, Cemig, CPFL, Enel, Equatorial):
- **Controle Fragmentado e Manual de Comissões**: As comissões ou repasses de integradores e parceiros comerciais são calculados manualmente, mantidos em planilhas externas ou anotados em campos genéricos de texto dentro do cadastro de clientes/projetos.
- **Desconexão com a Liquidação Bancária Real**: Não há vínculo programático entre a compensação da fatura (Pix ou Boleto pago pelo cliente via Efí ou Banco Inter) e a liberação da comissão. Isso gera frequentes riscos de adiantamentos indevidos sobre boletos que sequer foram pagos.
- **Inexistência de Marcos Técnicos de Liberação**: Na engenharia fotovoltaica, as remunerações costumam ser escalonadas por marcos do projeto (ex.: 30% na entrada/protocolo do projeto, 40% na aprovação do Parecer de Acesso pela concessionária e 30% após a vistoria e troca do medidor bidirecional). No Engeapp atual, não há mecanismo para reter ou liberar comissões atreladas à esteira técnica do projeto.
- **Falta de uma Área Financeira do Integrador**: O integrador não possui um extrato transparente onde possa visualizar faturas liquidadas de seus clientes, comissões acumuladas, valores a liberar e histórico de saques.

## 3. Valor Agregado para o Engeapp
A implementação de uma gestão automatizada de comissões e carteira do integrador traz vantagens competitivas substanciais:
- **Transparência e Fidelização da Rede Solar**: O integrador ganha previsibilidade total sobre seus ganhos, visualizando o saldo de comissões em tempo real diretamente na plataforma Engeapp.
- **Blindagem Financeira Contra Inadimplência**: A comissão só é provisionada e liberada após a conciliação bancária do pagamento do cliente final (Pix Efí ou Boleto Inter compensado). Se o cliente não pagar, a comissão não é indevidamente liberada.
- **Sincronização com a Engenharia Fotovoltaica**: Integração perfeita entre o departamento técnico e financeiro: o cumprimento de cada marco técnico (aprovação de parecer de acesso, vistoria concluída) desbloqueia automaticamente a parcela correspondente de comissão.
- **Liquidação Instantânea via Pix Efí**: O Engeapp pode permitir ao integrador resgatar suas comissões de forma automatizada via API de Pix Envio da Efí (`/v2/gn/pix/envio`), agilizando repasses e eliminando rotinas bancárias manuais no financeiro.

## 4. Especificação Técnica Proposta

### Arquitetura Backend (Laravel 13 + Horizon + Efí/Inter)
- **Model & Migration `PartnerCommissionRule`**:
  - `id`, `partner_id` (integrador ou parceiro comercial), `calculation_type` (`percentage_project`, `fixed_per_kwp`, `fixed_per_homologation`), `value` (em centavos ou base de pontos decimais), `milestone_distribution` (JSON definindo percentuais por marco: `{"protocol": 30, "access_opinion_approved": 40, "inspection_completed": 30}`), `is_active`.
- **Model & Migration `PartnerWalletLedger`**:
  - `id`, `partner_id`, `invoice_id`, `solar_project_id`, `type` (`credit_provisioned`, `credit_released`, `withdrawal_pix`, `chargeback`), `amount_in_cents`, `balance_after_in_cents`, `milestone_status` (`pending_milestone`, `released`, `paid`), `idempotency_key`, `created_at`.
- **Domain Event Listener `ProcessCommissionOnPaymentListener`**:
  - Escuta o evento `PaymentConfirmedEvent`.
  - Localiza o integrador associado ao projeto solar da fatura e aplica as regras de `PartnerCommissionRule`.
  - Registra os lançamentos no `PartnerWalletLedger` como `credit_provisioned` (bloqueados até o atingimento dos marcos técnicos).
- **Domain Event Listener `ReleaseCommissionOnMilestoneListener`**:
  - Escuta eventos da esteira solar (ex.: `AccessOpinionApprovedEvent`, `InspectionCompletedEvent`).
  - Altera os lançamentos provisionados para `credit_released` (saldo disponível para saque).
- **Service `PartnerPayoutService` & Job Horizon**:
  - Executa repasses via Pix utilizando a rota `/v2/gn/pix/envio` da API Efí com mTLS e chave privada.
  - Grava o código de autenticação bancária e atualiza o saldo da carteira do integrador de forma atômica (`DB::transaction`).

### Arquitetura Frontend (Vue 3 + UnoCSS + MaxComponentsUi)
- **Painel Financeiro do Integrador (`PartnerCommissionsView.vue`)**:
  - Visão geral da conta do integrador: saldo total faturado pelos seus clientes, comissões retidas em esteira técnica e saldo disponível para resgate.
- **Extrato Detalhado de Comissões (`CommissionLedgerTable.vue`)**:
  - Relação de cada cliente, potência da usina solar (kWp), fatura vinculada, marcos atingidos e valor da comissão.
- **Modal de Solicitação de Saque Pix (`WithdrawalPixModal.vue`)**:
  - Formulário para o integrador conferir sua chave Pix cadastrada e confirmar a transferência dos valores disponíveis.

## 5. Componentes de UI Sugeridos
- `MaxStats`: Indicadores principais no topo da página: Saldo Disponível para Saque, Saldo em Homologação (Aguardando Marcos), Total de Comissões Pagas e Faturas de Clientes Pendentes.
- `MaxTable`, `MaxTableColumn`, `MaxTableFields`: Tabela com paginação, filtros e ordenação para navegação no livro-razão de comissões por projeto solar.
- `MaxBadge`: Tags semânticas para o estado da comissão (`Provisionada`, `Aguardando Parecer da Concessionária`, `Liberada para Saque`, `Paga via Pix`).
- `MaxModal`: Modal de resgate de comissões e visualização do comprovante da transferência bancária Pix.
- `MaxButtonConfirm`: Botão de solicitação de saque Pix com diálogo de confirmação contendo os dados da chave Pix do recebedor.
- `MaxInputNumber`, `MaxInputSelect`: Campos para cadastro e ajuste fino das regras de comissionamento (% sobre o valor do projeto ou R$/kWp da usina).
- `MaxToast`: Alerta de notificação de solicitação de saque enviada e crédito Pix liberado.
