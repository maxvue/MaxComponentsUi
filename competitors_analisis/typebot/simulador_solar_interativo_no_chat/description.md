# Simulador Solar Interativo e Pré-Proposta Instantânea no Chat

## 1. Visão Geral no Typebot
O **Typebot** se destaca pela capacidade de executar lógicas e cálculos dinâmicos durante a própria sessão conversacional:
- **Execução de Fórmulas e Scripts em Tempo Real:** Blocos de código JavaScript e operações matemáticas em variáveis que permitem processar entradas do usuário instantaneamente (ex.: multiplicar consumo pela tarifa, subtrair taxas e estimar payback).
- **Apresentação em Cartões Ricos (Rich Cards e Carrosséis):** Capacidade de retornar os resultados calculados formatados com imagens dinâmicas, gráficos e blocos destacados de números.
- **Geração e Envio Imediato de Arquivos:** Integração com APIs externas de geração de PDF e envio imediato do link de download direto no chat para o cliente salvar no dispositivo.
- **Chamadas de Ação Interativas Pós-Cálculo:** Oferece botões de ação customizados com base no resultado (ex.: "Contratar com Financiamento", "Falar com Engenheiro", "Simular outro Valor").

## 2. Situação Atual no Engeapp
No Engeapp, a geração de orçamentos e propostas solares é um processo robusto, porém estritamente manual e voltado para uso interno:
- **Fluxo Burocrático de Propostas:** O integrador ou engenheiro precisa entrar na retaguarda do sistema, abrir a tela de propostas, preencher dados do cliente, escolher manualmente marcas de módulos (Aiko, Canadian, Jinko), inversores (Growatt, Deye, Huawei), estrutura de fixação, cabos, margens de lucro e taxas de instalação.
- **Inexistência de Autoatendimento Solar:** Não há qualquer ferramenta de simulação rápida exposta para que o cliente final calcule sozinho no WhatsApp quanto custaria seu sistema e quanto iria economizar.
- **Atrito e Perda de Oportunidades no Funil:** Em média, mais de 60% dos clientes que entram em contato no WhatsApp buscam apenas saber: *"Quanto custa para a minha conta de R$ 600,00?"*. Como o atendente precisa passar por todo o trâmite formal ou esperar o engenheiro fazer o dimensionamento, o cliente muitas vezes busca concorrentes que entregam uma estimativa instantânea.
- **Ausência de Mensagens Interativas Nativas:** O Engeapp não explora as *List Messages* e *Interactive Buttons* da WhatsApp Cloud API para permitir ao lead selecionar sua faixa de consumo com 1 toque (ex.: "R$ 300 a R$ 500", "R$ 500 a R$ 1.000", "Acima de R$ 1.000").

## 3. Valor Agregado para o Engeapp
- **Efeito Imediato de Conversão (Instant Gratification):** O consumidor recebe no WhatsApp, em menos de 15 segundos, o dimensionamento preliminar do seu sistema solar, transformando um contato frio em uma negociação de alto valor.
- **Métricas Cruciais Entregues Instantaneamente:**
  1. Potência recomendada do sistema fotovoltaico (em kWp).
  2. Quantidade estimada de painéis solares (ex.: 10 módulos de 550Wp).
  3. Área estimada necessária de telhado (em m²).
  4. Economia mensal projetada (R$) e economia acumulada em 25 anos.
  5. Tempo estimado de retorno do investimento (Payback em anos/meses) já considerando a Lei 14.300/2022 (Marco Legal da GD) e a taxa de transição do Fio B.
- **Geração Automática de Pré-Proposta em PDF:** O sistema gera um documento de pré-proposta visualmente elegante em PDF com a identidade visual (logo, cores, contatos) do integrador fotovoltaico cadastrado no Engeapp, enviando o link de visualização diretamente na conversa.
- **Qualificação Imbatível para o Vendedor:** Quando o consultor humano assume o atendimento, ele não precisa fazer perguntas básicas; ele já sabe exatamente a faixa de consumo, a potência calculada pelo simulador e se o cliente já baixou a pré-proposta.

## 4. Especificação Técnica Proposta

### 4.1. Arquitetura Frontend (Vue 3 + Pinia + MaxComponentsUi)
- **Painel de Parâmetros de Simulação Solar (`SolarSimulatorConfigView.vue`):**
  - Módulo administrativo onde o gestor ou integrador define as premissas de cálculo para o bot:
    - Base de dados de horas de sol pleno (HSP) por estado/cidade.
    - Tarifa média da concessionária local (R$/kWh) e custo de disponibilidade por tipo de rede (30 kWh mono, 50 kWh bi, 100 kWh trifásico).
    - Custo médio de referência por Wp instalado (R$/Wp).
    - Módulos padrão utilizados na simulação rápida (potência nominal em Watts).
- **Componente de Pré-Visualização e Recálculo no Atendimento (`SupportChatSolarSimCard.vue`):**
  - Card integrado ao chat de suporte (`resources/Vue/Sections/supportChat/`) que exibe em tempo real o cálculo realizado pelo bot.
  - Permite ao atendente humano alterar instantaneamente o valor da fatura ou o consumo e disparar um recálculo com nova pré-proposta via WhatsApp sem sair da tela.
- **Gráficos Dinâmicos de Economia:**
  - Utilização do componente `MaxChart` para renderizar o gráfico comparativo de gastos (Com Energia Solar vs. Sem Energia Solar ao longo de 25 anos) dentro do painel do operador.

### 4.2. Arquitetura Backend (Laravel 13 + PHP 8.5 + Horizon)
- **Serviço de Cálculo de Dimensionamento Fotovoltaico (`SolarEstimationService.php`):**
  - Algoritmo especializado baseado na radiação solarimétrica brasileira e regras da ANEEL:
    ```php
    public function calculatePreliminarySystem(SolarSimulationInputDTO $input): SolarSimulationResultDTO
    {
        // 1. Obtenção do HSP local e tarifa da distribuidora
        $hsp = $this->solarRadiationRepository->getHspByCityOrCep($input->cep, $input->concessionaria);
        $tarifaKwh = $this->tariffRepository->getCurrentTariff($input->concessionaria);
        
        // 2. Cálculo do consumo compensável (descontando custo de disponibilidade - Lei 14.300)
        $custoDisponibilidadeKwh = match($input->tipoLigacao) {
            'monofasico' => 30,
            'bifasico' => 50,
            'trifasico' => 100,
            default => 50
        };
        $consumoLiquido = max(0, $input->consumoMedioKwh - $custoDisponibilidadeKwh);
        
        // 3. Dimensionamento da potência do gerador (kWp)
        // Performance Ratio (PR) médio padrão = 0.78
        $potenciaKwp = $consumoLiquido / ($hsp * 30 * 0.78);
        $qtdModulos = (int) ceil(($potenciaKwp * 1000) / $input->potenciaModuloPadrao);
        $areaEstimadaM2 = $qtdModulos * 2.5; // Média de 2,5 m² por painel com espaçamento
        
        // 4. Economia e Payback
        $economiaMensalReais = ($consumoLiquido * $tarifaKwh * 0.90); // Estimativa conservadora com Fio B
        $investimentoEstimado = $potenciaKwp * 1000 * $input->custoMedioPorWp;
        $paybackAnos = $investimentoEstimado / ($economiaMensalReais * 12);
        
        return new SolarSimulationResultDTO(...);
    }
    ```
- **Job de Geração de Pré-Proposta em PDF (`GenerateSolarPreProposalPdfJob`):**
  - Executado em fila dedicada no Laravel Horizon para garantir resposta em menos de 3 segundos.
  - Renderiza template Blade com layout comercial, tabelas de economia e dados do integrador.
  - Armazena o PDF no Spatie MediaLibrary vinculado ao lead e gera URL assinada ou pública temporária.
- **Disparo de Mensagens Interativas no WhatsApp Cloud API:**
  - Envio de mensagem com template estruturado contendo os números da economia e botões de ação:
    - Botão 1: `📄 Baixar Pré-Proposta em PDF`
    - Botão 2: `💬 Falar com Especialista`
    - Botão 3: `🔄 Refazer com Outro Valor`

## 5. Componentes de UI Sugeridos

### 5.1. Componentes Existentes em `MaxComponentsUi`
- `MaxInputNumber`: Entrada formatada em moeda brasileira (R$) ou consumo numérico (kWh).
- `MaxInputCep`: Coleta e autocompletar de cidade e concessionária correspondente.
- `MaxInputSelect`: Seleção de distribuidora de energia e tipo de telhado (cerâmico, metálico, fibrocimento, laje ou solo).
- `MaxChart`: Renderização de gráficos de linha e barras comparando custo acumulado com concessionária vs. investimento em energia solar.
- `MaxStats`: Exibição de cards de métricas-chave (Potência kWp, Economia Anual em R$, Payback Estimado e Número de Placas).
- `MaxPdfView`: Visualizador instantâneo do PDF da pré-proposta dentro do painel do integrador.
- `MaxBadge`: Tags de qualificação do lead geradas pelo simulador ("Alta Rentabilidade", "Payback Excelente", "Consumo Baixo").

### 5.2. Novos Componentes Visuais Propostos
- `MaxSolarSimulationSummaryCard.vue`: Card visual de resumo da simulação fotovoltaica, contendo ilustração de telhado com painéis, potência do inversor e valores de economia destacados.
- `MaxSolarInteractiveWhatsAppBubble.vue`: Balão de simulação interativo para o preview do chat que espelha fielmente a mensagem interativa com botões nativos que o cliente receberá no aplicativo do WhatsApp.
- `MaxSolarPaybackGauge.vue`: Medidor visual tipo velocímetro/gauge indicando a atratividade do investimento solar (Verde: Payback < 3 anos; Amarelo: 3 a 5 anos; Laranja: > 5 anos).
