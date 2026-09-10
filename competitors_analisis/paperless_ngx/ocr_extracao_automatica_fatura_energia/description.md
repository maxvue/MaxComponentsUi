# OCR e Extração Automática de Faturas de Energia

## 1. Visão Geral no Paperless-ngx
O **Paperless-ngx** é uma referência de mercado em processamento documental automatizado, possuindo um pipeline de ingestão e reconhecimento óptico de caracteres (OCR) maduro e altamente desacoplado:
- **Motor Assíncrono de OCR**: Utiliza ferramentas robustas como `Tesseract OCR` e `OCRmyPDF`. Documentos escaneados, fotos ou PDFs rasterizados passam por um pré-processamento de imagem (deskewing, limpeza de ruído, rotação automática de orientação) antes do OCR.
- **Camada de Texto Pesquisável (Sandwich PDF / PDF/A)**: O Paperless-ngx gera um arquivo PDF/A com uma camada de texto invisível sobreposta à imagem original (`hOCR`), preservando as coordenadas espaciais de cada caractere sem alterar a aparência do documento original.
- **Extração por Correspondente e Tipo de Documento**: Oferece mecanismos nativos de *Matching Algorithms* (None, Any, All, Exact, Regular Expression, Fuzzy Match e Auto-Classifier com scikit-learn). Quando um documento é atribuído a uma empresa emissora (ex.: distribuidora de energia), regras de extração customizadas ou parsers especializados podem capturar datas, valores e números de conta.
- **Indexação Full-Text em Tempo Real**: O texto extraído é imediatamente indexado no motor de busca (Whoosh/Tika/Meilisearch), permitindo pesquisa textual instantânea com snippets destacados.

## 2. Situação Atual no Engeapp
No sistema **Engeapp**, o processamento e gestão de faturas de energia apresenta diversas limitações e gargalos manuais:
- **Upload Passivo e Estático**: O componente de upload de arquivos (`MaxInputFileProject.vue`) apenas recebe os arquivos brutos (PDFs ou fotos JPG/PNG) via multipart e envia para o backend via Axios, sem realizar qualquer leitura ou interpretação prévia do conteúdo.
- **Classificação Baseada em Heurística Frágil de Nome de Arquivo**: A classificação documental baseia-se apenas no nome do arquivo (ex.: checando se o nome contém `cnh`, `identidade`, `rg`), falhando totalmente com faturas de energia que chegam com nomes genéricos como `documento_12345.pdf`, `scan001.jpg` ou `WhatsApp_Image_2026.jpeg`.
- **Preenchimento 100% Manual de Dados Críticos**: O engenheiro ou integrador precisa abrir o PDF da fatura em outra janela, localizar visualmente e digitar manualmente campo a campo:
  1. Número da Unidade Consumidora (UC) / Código da Instalação;
  2. Concessionária de energia (ex.: Cemig, CPFL, Enel, Neoenergia, Equatorial);
  3. Grupo tarifário (B1 - Residencial, B2 - Rural, B3 - Comercial, Grupo A - Alta Tensão);
  4. Tipo de ligação (Monofásico, Bifásico, Trifásico);
  5. Demanda contratada e faturada (kW);
  6. Histórico de consumo dos últimos 12 meses (kWh);
  7. Valor da Contribuição de Iluminação Pública (CIP/COSIP) e alíquotas de ICMS/PIS/COFINS.
- **Alto Índice de Erro Humano**: Erros de digitação de um único dígito no número da UC acarretam a rejeição imediata do pedido de acesso/homologação no portal da concessionária, gerando atrasos de 15 a 30 dias úteis e retrabalho para o time de engenharia.
- **Inexistência de Camada de Busca por Conteúdo**: Não é possível buscar um projeto ou cliente digitando o número da instalação ou medidor no buscador global, pois o PDF é salvo como um blob opaco sem indexação de seu texto.

## 3. Valor Agregado para o Engeapp
A implementação de uma esteira inteligente de OCR inspirada no Paperless-ngx agregará valor significativo ao ecossistema Engeapp:
- **Redução Drástica no Tempo de Entrada de Projetos**: O cadastro de um novo projeto fotovoltaico tem seu tempo reduzido de ~15 minutos para menos de 45 segundos. Ao arrastar a fatura, todos os dados técnicos e financeiros são auto-preenchidos.
- **Dimensionamento Fotovoltaico Automático e Preciso**: A extração automática do histórico de consumo de 12 meses alimenta instantaneamente os cálculos de engenharia da plataforma:
  - Consumo médio mensal e sazonalidade;
  - Potência recomendada de pico do gerador solar ($kW_p$);
  - Quantidade sugerida de módulos fotovoltaicos e dimensionamento do inversor;
  - Estimativa de geração e economia mensal considerando a tarifa local da concessionária.
- **Eliminação de Reprovações em Concessionárias**: O código da instalação/UC e os dados do titular são validados antes da submissão aos portais das distribuidoras, erradicando reprovações por divergência de cadastro.
- **Pesquisa Instantânea Global**: Engenheiros e atendentes podem localizar projetos no Engeapp digitando o número da UC, o código do medidor ou a conta contrato no Meilisearch, localizando o cliente em milissegundos.

## 4. Especificação Técnica Proposta

### 4.1 Backend (Laravel 13 + Horizon + Spatie MediaLibrary + Meilisearch + OCR Pipeline)
- **Job Assíncrono no Horizon**:
  - `ProcessEnergyBillOcrJob`: Disparado imediatamente após o upload do documento na coleção `energy_bills` da `Spatie MediaLibrary`.
  - Execução gerenciada em fila isolada de alta prioridade (`ocr-processing`) no Laravel Horizon com Redis.
- **Pipeline de Pré-processamento e OCR**:
  - Uso de utilitários de sistema via wrapper PHP: `pdf2image` / `imagick` para rasterização de alta resolução (300 DPI) se for imagem/scan.
  - Execução de `ocrmypdf --deskew --clean-final --language por` para gerar o PDF/A pesquisável.
  - Extração da camada de texto e dados estruturados hOCR (com bounding boxes para destaque visual no frontend).
- **Mecanismo Híbrido de Extração (Regex Especializado + LLM Vision Fallback)**:
  - **Camada 1 (Regras Especializadas por Distribuidora)**: Parsers dedicados em PHP para as principais concessionárias do Brasil (`CemigBillParser`, `CpflBillParser`, `EnelBillParser`, `EquatorialBillParser`). Regex otimizado para extração de tabelas de consumo de 12 meses e códigos de barras.
  - **Camada 2 (Fallback via Gemini 2.5 Flash / IA Vision)**: Se a confiança da extração por regex for inferior a 90% ou o layout não for reconhecido, o PDF/imagem é enviado para a API de IA com esquema JSON estrito (`EnergyBillExtractionSchema`) para extração semântica.
- **DTO Estruturado e Persistência**:
  - Criação do Spatie Data DTO `EnergyBillData`:
    ```typescript
    interface EnergyBillData {
        concessionaire_id: number;
        uc_number: string;
        meter_number: string | null;
        customer_name: string;
        customer_document: string | null; // CPF/CNPJ
        voltage_type: 'monofasico' | 'bifasico' | 'trifasico';
        tariff_subgroup: 'B1' | 'B2' | 'B3' | 'A4';
        average_consumption_kwh: number;
        consumption_history: Array<{ month: string; year: number; kwh: number }>;
        cip_value: number;
        contracted_demand_kw?: number;
        confidence_score: number;
    }
    ```
  - Atualização dos metadados customizados na mídia da `Spatie MediaLibrary` (`custom_properties->ocr_extracted_data`).
  - Indexação dos campos e do texto integral da fatura no `Meilisearch`.
  - Notificação de conclusão via **Laravel Reverb** (Websocket) enviando o evento `EnergyBillOcrCompletedEvent`.

### 4.2 Frontend (Vue 3 Composition API + Pinia + MaxComponentsUi)
- **Store Pinia (`useEnergyBillOcrStore`)**:
  - Gerencia o estado reativo do processamento: `isProcessing`, `progress`, `extractedData`, `confidenceScore`.
  - Escuta o canal privado de websockets via Laravel Reverb / Echo para atualizar a tela em tempo real sem polling.
- **Fluxo de Revisão e Confirmação Humana (Human-in-the-Loop)**:
  - Após a extração, o sistema abre uma interface de conferência onde o usuário visualiza o PDF e os campos preenchidos lado a lado.
  - Cada campo possui um indicador visual de confiança (verde > 95%, amarelo 80-95%, vermelho < 80%).
  - Ao clicar em um campo preenchido, o visualizador de PDF foca e destaca com bounding box a região da fatura de onde aquele dado foi extraído.

## 5. Componentes de UI Sugeridos

| Componente | Origem | Papel na Funcionalidade |
|---|---|---|
| `MaxInputFileProject` | Existente (`src/components/MaxInputFileProject.vue`) | Evoluir para suportar estados visuais ricos de OCR: badge de progresso de processamento, spinner do OCR e preview em miniatura com status de extração. |
| `MaxPdfView` | Existente (`src/components/MaxPdfView.vue`) | Atualizar para ativar a camada de texto (`:textLayer="true"` no `VuePdfEmbed`), permitindo seleção de texto e sobreposição de bounding boxes destacando UC, cliente e tabela de consumo. |
| `MaxEnergyBillReviewModal` | **Novo Componente** | Modal responsivo dividido em duas colunas (Split View): à esquerda, o visualizador do PDF da fatura com zoom sincronizado; à direita, formulário declarativo com os dados extraídos para rápida conferência do projetista. |
| `MaxTableFields` | Existente (`src/components/MaxTableFields.vue`) | Exibição e edição interativa da tabela com os 12 meses de consumo histórico extraídos automaticamente da fatura. |
| `MaxBadge` / `MaxStatus` | Existente (`src/components/MaxBadge.vue`) | Badges semânticos de nível de confiança da extração (`Confiança: 99% - Alta`, `Revisão Necessária`). |
| `MaxButton` | Existente (`src/components/MaxButton.vue`) | Ações de confirmação ("Aceitar e Preencher Projeto", "Reprocessar via IA", "Corrigir Manualmente"). |
