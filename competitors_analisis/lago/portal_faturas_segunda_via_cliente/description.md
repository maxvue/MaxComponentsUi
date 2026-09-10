# Portal de Faturas e 2ª Via Self-Service para Clientes e Integradores

## 1. Visão Geral no Lago
No Lago, o autosserviço financeiro é operacionalizado através do **Customer Portal**:
- **Acesso Seguro e Sem Fricção**: Os clientes recebem links tokenizados e assinados digitalmente (`customer_portal_url`), dispensando login e senha complexos para acessar suas obrigações financeiras.
- **Visualização Integral de Faturas e Recibos**: O portal exibe a lista histórica de faturas com status detalhado (`draft`, `open`, `paid`, `void`), permitindo o download direto de documentos fiscais e faturas em PDF de alta resolução.
- **Liquidação Autônoma com Múltiplos Meios**: Permite ao pagador liquidar débitos pendentes na hora, alternando entre métodos de pagamento configurados (cartão de crédito, débito bancário ou checkout dinâmico).
- **Transparência de Consumo e Itens Faturados**: Discriminação linha a linha de tudo o que compõe a fatura (taxas de serviço, assinaturas, consumos excedentes e créditos abatidos).

## 2. Situação Atual no Engeapp
No Engeapp, o fluxo de consulta de faturas e obtenção de 2ª via é inteiramente dependente de intervenção humana e atendimento manual:
- **Inexistência de um Portal Self-Service**: Não há uma página web pública ou autenticada onde o cliente final ou o integrador solar possa consultar seus boletos em aberto, histórico de pagamentos e comprovantes de quitação de homologação.
- **Fricção Crítica em Vencimentos e Expirações de Pix**: As chaves Pix dinâmicas da Efí possuem validade (ex.: 24 horas ou poucos dias), e os boletos do Banco Inter possuem data de vencimento rígida. Quando esses prazos expiram, o pagador é impedido de pagar e não possui meios de recalcular a cobrança sozinho.
- **Gargalo no Suporte via WhatsApp**: O cliente é forçado a acionar o time de atendimento da Engeapp solicitando uma "segunda via". O operador precisa abrir o sistema, cancelar a fatura anterior na Efí ou no Inter, emitir uma nova guia com novo vencimento, salvar o PDF e reenviar manualmente no chat do WhatsApp.
- **Atraso na Entrada dos Recursos**: A burocracia do processo de 2ª via faz com que pagamentos que poderiam ser resolvidos em minutos demorem dias, postergando o início dos serviços de engenharia e a liberação de projetos na concessionária.

## 3. Valor Agregado para o Engeapp
A implementação de um Portal de Faturas e 2ª Via Self-Service eleva o padrão operacional e a eficiência do faturamento:
- **Resolução Autônoma 24/7**: Clientes e integradores acessam o portal a qualquer momento (via link seguro enviado na régua de cobrança ou botão no WhatsApp) e emitem a 2ª via com atualização imediata de QR Code Pix e linha digitável com recálculo legal de juros/multa.
- **Aceleração do Fluxo de Caixa**: Eliminação da barreira do "Pix expirado"; o próprio portal gera instantaneamente uma nova cobrança Pix com o mesmo valor (ou valor corrigido) com 1 toque.
- **Experiência em Tempo Real com WebSockets**: A tela do portal escuta o canal do Laravel Reverb. No segundo em que o cliente escaneia o Pix no app do seu banco, a tela do portal muda automaticamente para "Pagamento Confirmado!", exibindo o comprovante e desbloqueando a fase de engenharia solar sem necessidade de recarregar a página (*refresh*).
- **Economia Drástica de Horas de Atendimento**: Reduz em mais de 80% as demandas repetitivas de atendimento financeiro no suporte do Engeapp.

## 4. Especificação Técnica Proposta

### Arquitetura Backend (Laravel 13 + Horizon + Efí/Inter + Reverb)
- **Rotas Públicas Seguras com Assinatura Criptográfica**:
  - `GET /cobrancas/portal/{invoiceUuid}` protegida por middleware `signed` (`URL::signedRoute`) com chave secreta HMAC e expiração configurável.
- **Controller `PublicInvoicePortalController`**:
  - Recupera a fatura e os dados do projeto fotovoltaico associado (titular, distribuidora de energia, potência kWp do sistema, número da UC).
  - Verifica o vencimento da cobrança original na Efí ou Banco Inter.
- **Service `InvoiceRenewalService`**:
  - Se a cobrança Pix estiver expirada: executa chamada na API Efí (`/v2/cob/{txid}`) para prorrogar validade ou emitir nova cobrança imediata vinculada à mesma fatura.
  - Se o boleto estiver vencido: calcula encargos contratuais e utiliza a API do Banco Inter (`/cobranca/v3/cobrancas`) para atualizar data de vencimento e linha digitável.
- **Canal de WebSocket Privado Temporário (Laravel Reverb)**:
  - Canal `presence-invoice.{uuid}`: quando o job `ProcessBankWebhookJob` confirma a compensação, dispara o evento `PaymentReceivedBroadcast`, enviando o sinal de sucesso instantâneo para a página aberta do cliente.
- **Geração e Download de Fatura/Comprovante**:
  - Endpoint `/cobrancas/portal/{invoiceUuid}/pdf`: gera o documento estilizado da fatura com QR Code Pix embutido, memorial de cálculo e recibo de quitação digital.

### Arquitetura Frontend (Vue 3 + UnoCSS + MaxComponentsUi)
- **View do Portal Público (`PublicInvoicePortalView.vue`)**:
  - Página limpa, totalmente responsiva (mobile-first), com o tema visual `MaxStyle`.
  - Exibição de cabeçalho do projeto solar, dados da fatura e valor total.
  - Bloco de pagamento rápido: QR Code Pix destacado, botão de cópia de 1 clique do código Pix Copia e Cola, e visualizador do Boleto PDF.
  - Aba opcional de pagamento com Cartão de Crédito para faturamento parcelado.
- **Escuta Reativa do WebSocket**:
  - Uso do `@maxvue/max-use` com listener de socket para transicionar o estado do portal de "Aguardando Pagamento" para "Pagamento Confirmado com Sucesso" em tempo real.

## 5. Componentes de UI Sugeridos
- `MaxPdfView`: Visualização embutida do PDF do boleto bancário ou fatura discriminada diretamente no navegador sem necessidade de abrir abas extras.
- `MaxCreditCard`: Componente interativo de cartão de crédito para simulação visual e digitação dos dados caso o cliente opte pelo pagamento em cartão.
- `MaxInputCreditCard`, `MaxInputCreditCardCvv`, `MaxInputCreditCardDate`: Conjunto de inputs com formatação automática de número do cartão, código de segurança e validade.
- `MaxBadge`: Tags visuais chamativas para indicar o estado da fatura (`Aguardando Pagamento`, `Pix Atualizado`, `Boleto Vencido`, `Fatura Liquidada`).
- `MaxButton`: Botão principal com ação de cópia rápida do código Pix Copia e Cola (`navigator.clipboard.writeText`) com feedback tátil.
- `MaxDoneIcon`, `MaxWaitIcon`: Ícones semânticos para transições de estado (spinner animado aguardando detecção do Pix e ícone de sucesso animado após a compensação).
- `MaxToast`: Mensagem flutuante discreta confirmando que a chave Pix foi copiada para a área de transferência.
