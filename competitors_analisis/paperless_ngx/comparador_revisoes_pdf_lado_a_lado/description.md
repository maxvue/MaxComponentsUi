# Comparador de Revisões de PDF Lado a Lado (Side-by-Side Diff)

## 1. Visão Geral no Paperless-ngx
O **Paperless-ngx** disponibiliza um ecossistema de visualização e comparação documental de alta performance baseado na biblioteca PDF.js da Mozilla:
- **Visualização de Alta Fidelidade com Camada Ativa**: Renderiza PDFs com resolução nítida, camadas ativas de anotações e camada de texto (`textLayer`) totalmente interativa, permitindo pesquisa instantânea, marcação e cópia de termos diretamente no documento.
- **Análise Comparativa entre Documentos**: Permite a inspeção lado a lado de documentos correlacionados, possibilitando alternar rapidamente entre a versão original submetida e a versão processada/arquivada, ou entre diferentes peças documentais de um mesmo processo.
- **Destaque Visual de Termos Pesquisados**: Termos de busca e metadados são destacados visualmente sobre as coordenadas exatas da página, facilitando a navegação rápida em arquivos volumosos com centenas de páginas.

## 2. Situação Atual no Engeapp
No sistema **Engeapp**, o manuseio e a inspeção visual de projetos de engenharia e memoriais é rudimentar:
- **Visualizador Básico e Isolado (`MaxPdfView.vue`)**: O componente de visualização atual renderiza apenas um único arquivo por vez em um modal fullscreen. Além disso, as propriedades essenciais `:textLayer="false"` e `:annotationLayer="false"` estão desativadas no `VuePdfEmbed`, impedindo qualquer seleção de texto, busca de palavras-chave ou interação com anotações.
- **Dificuldade Crítica na Revisão de Exigências de Concessionárias**:
  - Quando uma distribuidora de energia (Cemig, CPFL, Enel, etc.) devolve um projeto fotovoltaico com uma **Nota de Exigência Técnica** (ex.: *"Ajustar capacidade de interrupção do disjuntor de 50A para 63A e indicar chave seccionadora sob carga no Diagrama Unifilar"*), o projetista gera a revisão R1.
  - O engenheiro responsável precisa validar se a revisão R1 realmente corrigiu o disjuntor sem alterar acidentalmente o dimensionamento dos cabos ou o arranjo dos strings de módulos.
  - Atualmente, o engenheiro precisa abrir o PDF antigo (R0) e o novo (R1) em duas abas separadas do navegador ou em softwares pesados de terceiros (Adobe Acrobat, Bluebeam, Foxit), alternando janelas manualmente para tentar identificar as diferenças a olho nu.
- **Alto Risco de "Efeito Colateral" em Projetos Técnicos**: Em plantas elétricas e diagramas complexos, alterações pontuais frequentemente provocam erros em outros pontos do desenho. Sem um comparador visual e textual, erros passam despercebidos para a submissão seguinte, gerando uma segunda devolução pela concessionária e manchando a reputação da empresa.
- **Inexistência de Comparação Textual de Memoriais**: Memoriais descritivos possuem dezenas de páginas de especificações de equipamentos. Não há como comparar em tela o texto da versão anterior com a versão revisada.

## 3. Valor Agregado para o Engeapp
A criação de um visualizador e comparador de revisões de PDF lado a lado com diff visual e textual transforma a rotina do time de engenharia:
- **Redução Drástica do Tempo de Revisão Técnica**: Engenheiros seniores conseguem inspecionar e aprovar revisões de projetos em menos de 1 minuto, visualizando exatamente o que mudou entre a versão rejeitada pela concessionária e a versão corrigida.
- **Erradicação de Re-devoluções de Projetos**: Garantia absoluta de que todas as notas de devolução da concessionária foram sanadas na nova prancha antes de realizar o novo protocolo.
- **Recurso Diferencial para Vendas e Suporte aos Integradores**: Integradores solares parceiros podem abrir o comparador diretamente no Engeapp para demonstrar ao cliente final ou eletricista executor exatamente quais ajustes foram feitos na usina.
- **Colaboração Ágil e Redução de Atrito Interno**: O projetista e o engenheiro-chefe alinham alterações de projeto diretamente na plataforma, sem necessidade de troca de arquivos por WhatsApp ou email.

## 4. Especificação Técnica Proposta

### 4.1 Backend (Laravel 13 + Spatie MediaLibrary + pdftoppm / ImageMagick / Diff Engine)
- **Serviço de Diff Textual (`DocumentTextDiffService`)**:
  - Extrai o texto contido em cada página de ambas as revisões (R0 vs R1) utilizando `pdftotext` ou a camada OCR já indexada.
  - Executa o algoritmo de diff semântico (Myers Diff Algorithm), retornando um payload JSON estruturado com linhas adicionadas, removidas e inalteradas.
- **Geração de Diff Visual de Plantas Elétricas (`VisualPdfDiffJob`)**:
  - Para diagramas unifilares e plantas baixas, o backend pode renderizar as páginas correspondentes em bitmaps de alta resolução (png 300 DPI) via `pdftoppm`.
  - O utilitário `diff-pdf` ou `ImageMagick compare` gera uma imagem de sobreposição onde elementos idênticos ficam em cinza claro, elementos removidos em vermelho e elementos adicionados em verde/azul.
- **Endpoint de Entrega de Comparação**:
  - Rota protegida `/api/projects/{project}/documents/{document}/compare-revisions?base={r0_id}&target={r1_id}` que entrega as URLs de streaming dos arquivos e os metadados das diferenças.

### 4.2 Frontend (Vue 3 Composition API + Pinia + MaxComponentsUi)
- **Store Pinia (`usePdfDiffStore`)**:
  - Controla o estado de comparação: `baseRevisionFile`, `targetRevisionFile`, `activePage`, `zoomLevel`, `syncScrollEnabled`, `viewMode ('split' | 'onion' | 'diff')`.
- **Mecanismos de Visualização no Componente `MaxPdfDiffViewer`**:
  1. **Modo Split Screen (Lado a Lado Sincronizado)**:
     - Dois painéis de visualização renderizados com `vue-pdf-embed` / PDF.js lado a lado.
     - Eventos de scroll e zoom sincronizados bidirecionalmente via composables `@maxvue/max-use` (`useScroll`, `useEventListener`), mantendo as mesmas coordenadas de visualização em ambos os documentos.
  2. **Modo Onion-Skin (Sobreposição com Controle de Opacidade)**:
     - As duas páginas são sobrepostas pixel a pixel no mesmo container.
     - Um slider interativo varia a opacidade de 0% (visualiza apenas a Revisão A) a 100% (visualiza apenas a Revisão B), permitindo notar instantaneamente qualquer linha do circuito elétrico que tenha sido deslocada ou modificada.
  3. **Modo Diff Realçado**:
     - Sobrepõe a camada com o mapa de calor de diferenças gerado pelo backend.

## 5. Componentes de UI Sugeridos

| Componente | Origem | Papel na Funcionalidade |
|---|---|---|
| `MaxPdfDiffViewer` | **Novo Componente** | Componente visualizador duplo avançado com toolbar superior, suporte a sincronização de scroll, controle compartilhado de zoom (+/-), atalhos de teclado e alternância entre modos de exibição (Lado a Lado, Sobreposição e Diff). |
| `MaxPdfView` | Existente (`src/components/MaxPdfView.vue`) | Refatoração interna para ativar a camada de seleção de texto (`:textLayer="true"`), seleção de anotações e exportação de coordenadas de viewport. |
| `MaxInputSelect` | Existente (`src/components/MaxInputSelect.vue`) | Seletores no cabeçalho do comparador para escolher dinamicamente quais duas versões do histórico estão sendo comparadas (ex.: Base: `R00 - 15/08` vs Comparar: `R01 - 22/08`). |
| `MaxButton` | Existente (`src/components/MaxButton.vue`) | Botões de alternância de visualização (`Split Screen`, `Sobreposição`, `Sincronizar Scroll`). |
| `MaxBadge` | Existente (`src/components/MaxBadge.vue`) | Indicadores de versão no topo de cada viewport (`Versão R00 (Reprovada)` e `Versão R01 (Nova Submissão)`). |
| `MaxInputSlider` | Novo / Estendido | Slider para controle contínuo da transparência/opacidade no modo Onion-Skin. |
