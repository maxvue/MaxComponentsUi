# Relatório Técnico Fotográfico Automático

## 1. Visão Geral no Odoo

No **Odoo Field Service**, a geração de documentação de encerramento e laudos de atendimento é automatizada através do motor de **Field Service Reports (Relatórios de Serviços de Campo)**:

- **Compilação Instantânea em PDF**: Assim que o checklist ou a ordem de serviço é concluída, o Odoo compila automaticamente todas as respostas, medições, fotos anexadas e a assinatura digital em um documento PDF diagramado com a identidade visual da empresa.
- **Formatação Padronizada de Mídia e Legendas**: As fotos tiradas em campo são organizadas em grade padronizada (2 por linha ou 4 por página), acompanhadas de títulos, descrições informadas pelo técnico e metadados de captura (data, hora e localização).
- **Disponibilização Imediata no Portal do Cliente e E-mail**: O relatório gerado fica imediatamente acessível no portal do cliente e pode ser enviado por e-mail automaticamente com link de download rastreável.
- **Templates Customizáveis via QWeb/Studio**: Os relatórios podem ter layouts alterados visualmente, incluindo cabeçalhos institucionais, rodapés com dados cadastrais, declarações de conformidade técnica e termos de responsabilidade.

---

## 2. Situação Atual no Engeapp

No **Engeapp**, a criação de relatórios fotográficos de vistoria e laudos técnicos de viabilidade solar enfrenta gargalos operacionais relevantes:

- **Montagem Manual e Fragmentada**: Para montar o laudo fotográfico exigido pelas distribuidoras de energia (ex.: Cemig, Equatorial, CPFL, Enel) e pelos bancos financiadores, muitos integradores e engenheiros ainda baixam as fotos do sistema e montam arquivos manualmente em editores externos (Word, Canva, PowerPoint) ou geram PDFs através de ferramentas terceiras desintegradas.
- **Falta de Padronização Visual e Metadados nas Fotos**: Quando as fotos são anexadas no sistema, elas nem sempre recebem carimbo automático de coordenadas GPS, data/hora e identificação do projeto, o que pode suscitar questionamentos por parte dos analistas das concessionárias durante a análise de acesso.
- **Dificuldade na Categorização das Imagens**: As fotos costumam ficar misturadas em uma galeria geral de arquivos, em vez de serem agrupadas de forma lógica e normativa:
  - Fachada do imóvel e vista geral;
  - Padrão de entrada e caixa de medição (externa e interna);
  - Disjuntor geral e bitola dos condutores de entrada;
  - Aterramento e haste/malha;
  - Telhado, madeiramento/terças e orientação solar;
  - Local planejado para o inversor e quadro de proteção CA/CC.
- **Ausência de Pré-visualização e Edição de Legendas em Tempo Real**: Falta uma tela onde o usuário possa revisar as fotos, ajustar a legenda de cada imagem, reorganizar a ordem de exibição e pré-visualizar o PDF final antes de emitir a versão definitiva.

---

## 3. Valor Agregado para o Engeapp

A automação da geração do Relatório Técnico Fotográfico proporciona ganhos operacionais imediatos:

- **Economia de até 45 Minutos por Projeto**: O engenheiro ou projetista não perde tempo diagramando relatórios manualmente. Um único clique compila os dados da vistoria técnica mobile em um PDF técnico profissional pronto para submissão à concessionária.
- **Padrão Homologatório à Prova de Recusa**: Concessionárias de energia exigem evidências claras das instalações existentes. Fotos organizadas por categoria, com carimbo de coordenadas geográficas e legendas técnicas claras, reduzem drasticamente as notas de devolução de projetos.
- **Apresentação de Alto Impacto para o Cliente e Integrador**: O relatório serve tanto como dossiê para a concessionária quanto como laudo de vistoria preliminar para o cliente final, aumentando a percepção de rigor técnico e profissionalismo da empresa.
- **Integração Nativa com o Fluxo de Homologação**: O PDF gerado já é automaticamente anexado à pasta de documentos do projeto no Engeapp e associado ao card do Kanban de Homologação, pronto para envio ao portal da concessionária ou via API oficial do WhatsApp.

---

## 4. Especificação Técnica Proposta

### Arquitetura Frontend (Vue 3 + Pinia + MaxPdfView)

- **Store Especializada (`useTechnicalReportStore`)**:
  - Estado reativo com a lista de fotos categorizadas, legendas editáveis e opções de configuração do relatório (incluir capa, incluir dados do disjuntor, incluir termo de responsabilidade técnica).
  - Reordenação de fotos via drag-and-drop com reatividade imediata.
- **Visualizador Integrado do PDF**:
  - Uso do componente `MaxPdfView` para renderização em tempo real do PDF gerado pelo backend em stream binário (Blob URL).
  - Modal de edição rápida de legendas e tags de identificação técnica para cada foto antes da exportação final.
- **Compartilhamento em Um Clique**:
  - Botões para download do PDF, envio por e-mail e disparo direto pelo canal de WhatsApp via API oficial do Engeapp.

### Backend (Laravel 13 + Spatie Browsershot / DomPDF + Meilisearch)

- **Motor de Renderização de PDF em Alta Definição**:
  - Template Blade altamente responsivo e otimizado para impressão A4 (`@media print`), renderizado via Puppeteer/Chromium (`spatie/browsershot`) para suportar diagramação moderna com Flexbox/Grid e alta resolução tipográfica.
- **Serviço de Processamento de Imagens**:
  - Inserção de marca d'água e carimbo textual nos cantos da foto com dados imutáveis: `Latitude`, `Longitude`, `Data/Hora UTC`, `ID do Projeto`, `Código da UC`.
- **Fila em Background com Laravel Horizon**:
  - Para vistorias com grande volume de fotos em alta resolução (30+ imagens), o PDF é compilado de forma assíncrona com notificação via WebSocket (Laravel Reverb) ao concluir o processamento.
- **Armazenamento e Versionamento**:
  - Persistência no armazenamento S3/Local via Spatie MediaLibrary com controle de versões (v1, v2 após revisão).

---

## 5. Componentes de UI Sugeridos

### Componentes Existentes em `MaxComponentsUi`:
- `MaxPdfView`: Visualizador nativo de documentos PDF integrado na interface do Engeapp com zoom e paginação.
- `MaxPageLayout` / `MaxPageContent`: Casca da tela de revisão e geração do relatório técnico.
- `MaxInputText`: Campo para edição de títulos e legendas descritivas de cada fotografia.
- `MaxInputTextArea`: Área para parecer técnico do engenheiro e recomendações executivas.
- `MaxInputSwitch`: Toggles para ativar/desativar seções do relatório (ex.: "Exibir coordenadas GPS?", "Incluir página de assinaturas?").
- `MaxButton` / `MaxIconButton`: Ações de "Gerar Relatório", "Baixar PDF", "Enviar via WhatsApp" e "Regenerar Prévia".
- `MaxModal`: Modal de visualização de foto em alta definição e edição detalhada de anotações.
- `MaxToast`: Alertas de sucesso ao finalizar a compilação do relatório.

### Novos Componentes a Serem Desenvolvidos:
- `MaxPhotoGalleryGrid`: Grade interativa para organização de fotos por categoria temática com suporte a reordenação (drag-and-drop), rotação e exclusão.
- `MaxWatermarkPreview`: Componente de exibição da foto com a pré-visualização dos carimbos normativos de geolocalização e data antes da compilação do PDF.
- `MaxReportExportToolbar`: Barra de ferramentas dedicada com botões de exportação múltipla (PDF Alta Resolução, PDF Comprimido para Portal Concessionária, Zip de Fotos Originais).
