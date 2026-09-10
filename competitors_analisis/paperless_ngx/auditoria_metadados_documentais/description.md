# Auditoria e Extração Profunda de Metadados Documentais

## 1. Visão Geral no Paperless-ngx
O **Paperless-ngx** implementa um rigoroso subsistema de extração, auditoria e preservação de metadados para cada artefato documental ingerido:
- **Integridade Criptográfica (Checksum SHA-256 e MD5)**: No momento exato da ingestão, o sistema calcula o hash criptográfico do documento. Esse hash é persistido e verificado periodicamente para garantir que nenhum arquivo no storage tenha sido alterado, corrompido por falha de hardware (*bit rot*) ou adulterado externamente.
- **Extração Profunda de Metadados EXIF, IPTC e XMP**: O Paperless extrai detalhadamente os metadados embutidos em fotografias e PDFs: fabricante e modelo da câmera/smartphone, data e hora exata da captura original, configurações ópticas e **coordenadas de geolocalização por satélite (GPS Latitude, Longitude, Altitude)**.
- **Metadados Estruturais do PDF**: Identifica metadados intrínsecos de arquivos PDF, tais como versão do padrão (PDF 1.4 a 2.0, PDF/A), programa gerador (*Producer/Creator*, ex.: AutoCAD, Revit, LibreOffice, Adobe InDesign), número exato de páginas, orientação de folha e presença de assinaturas digitais embutidas.
- **Identificador Serial de Arquivo (ASN - Archive Serial Number)**: Atribui um número serial único e sequencial para rastreamento físico e lógico, facilitando inventários e correspondência entre arquivos digitais e pastas físicas.

## 2. Situação Atual no Engeapp
No ecossistema do **Engeapp**, focado na engenharia de homologação fotovoltaica e relacionamento com concessionárias de energia, os metadados dos arquivos são quase totalmente ignorados ou descartados:
- **Descarte de Metadados Críticos no Upload**: O upload realizado por componentes como `MaxInputFileProject` e `MaxInputFileUpload` descarta as tags EXIF/XMP das imagens ou armazena unicamente o nome original, tamanho em bytes e mime type fornecido pelo navegador.
- **Fotos de Vistoria e Padrão de Entrada sem Checagem de Geolocalização**:
  - Para homologação e solicitação de vistoria em concessionárias (como Cemig, CPFL, Enel, Neoenergia), é obrigatório apresentar fotos do padrão de entrada, caixa de medição, disjuntor geral, ramal de ligação e transformador da rede.
  - Integradores frequentemente enviam fotos tiradas em dias anteriores, fotos de outros projetos por engano ou fotos retiradas da internet.
  - O Engeapp possui as coordenadas geográficas do projeto no componente `MaxMaps`, mas não faz o cruzamento automatizado com o GPS embutido no EXIF das fotos da vistoria. Isso faz com que fotos erradas sejam enviadas à concessionária, gerando reprovação na vistoria técnica e multas por deslocamento improdutivo de viatura da concessionária.
- **Inexistência de Validação Prévia de Assinaturas Digitais (ICP-Brasil e Gov.br)**:
  - Documentos técnicos como ART (Anotação de Responsabilidade Técnica), TRT, Memorial Descritivo e Procuração do Cliente exigem assinatura digital qualificada (ICP-Brasil padrão PAdES ou Gov.br Prata/Ouro).
  - O Engeapp não audita se o PDF anexado possui assinatura digital válida ou se é um PDF "achatado" (flattened) que perdeu os certificados criptográficos durante a exportação. O documento inválido é submetido à concessionária, que o rejeita dias depois por "ausência de assinatura digital verificável".
- **Falta de Hash de Integridade para Segurança Jurídica**: Não há registro de hash SHA-256 para comprovar pericialmente qual documento exato foi emitido e assinado pelo engenheiro responsável caso ocorra algum sinistro na usina (ex.: curto-circuito ou incêndio na instalação).

## 3. Valor Agregado para o Engeapp
A incorporação de um módulo de auditoria profunda de metadados traz vantagens estratégicas e operacionais imediatas:
- **Validação Automática de Fotos de Vistoria por Georreferenciamento**: O sistema calcula a distância matemática (Fórmula de Haversine) entre as coordenadas do projeto cadastradas no `MaxMaps` e as coordenadas GPS extraídas do EXIF das fotos do padrão de entrada. Se a foto tiver sido tirada a mais de 50 metros do local do projeto ou há mais de 30 dias, um alerta em vermelho bloqueia o envio, prevenindo reprovações de vistoria.
- **Auditoria Preventiva de Assinaturas Digitais (Gov.br / ICP-Brasil)**: O Engeapp valida em segundos a cadeia de certificados do PDF antes da submissão à concessionária, confirmando se o CPF do engenheiro ou do titular bate com o titular da conta e garantindo que o documento será aceito de primeira.
- **Eliminação de Vistorias Reprovadas**: A precisão documental assegura que 100% dos relatórios fotográficos de vistoria estejam em conformidade com as normas técnicas das distribuidoras de energia.
- **Rastreabilidade e Cadeia de Custódia Pericial**: Cada documento ganha um ASN (Archive Serial Number) e um hash SHA-256 imutável, garantindo fé pública, auditoria contra fraudes e conformidade total com a LGPD e resoluções do CONFEA/CREA.

## 4. Especificação Técnica Proposta

### 4.1 Backend (Laravel 13 + ExifTool / Imagick + OpenSSL + Spatie MediaLibrary)
- **Job de Auditoria de Metadados (`AuditDocumentMetadataJob`)**:
  - Enfileirado no Laravel Horizon após a recepção de qualquer arquivo em coleções de vistoria (`inspection_photos`) ou projetos (`technical_documents`).
  - Utiliza `exiftool` ou funções nativas `exif_read_data()` e `Imagick` para extração do cabeçalho completo EXIF/XMP/IPTC.
  - Para arquivos PDF, utiliza ferramentas de inspeção (`pdfcpu` ou `qpdf`) e rotinas de validação de assinatura digital PAdES via OpenSSL e chaves públicas da cadeia ICP-Brasil e Gov.br.
- **Algoritmo de Conformidade de Geolocalização (Haversine)**:
  ```php
  // Cálculo da distância em metros entre o ponto do projeto e a foto
  $distanceMeters = GeoLocationHelper::haversineDistance(
      $project->latitude,
      $project->longitude,
      $exifData->gps_latitude,
      $exifData->gps_longitude
  );

  $isGeoCompliant = $distanceMeters <= 50.0; // Tolerância de 50 metros
  ```
- **Persistência de Metadados no Banco de Dados**:
  - Estruturação dos metadados nas `custom_properties` da mídia ou tabela `document_metadata_audits`:
    ```json
    {
        "checksum_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "mime_type": "image/jpeg",
        "file_size_bytes": 4829104,
        "camera_make": "Apple",
        "camera_model": "iPhone 15 Pro",
        "capture_timestamp": "2026-09-08T14:22:10-03:00",
        "gps": {
            "latitude": -19.9234125,
            "longitude": -43.9421098,
            "altitude_meters": 854.2,
            "distance_to_project_meters": 12.4,
            "is_valid_location": true
        },
        "digital_signatures": [
            {
                "signer_name": "CARLOS EDUARDO SILVA",
                "signer_cpf": "123.456.789-00",
                "authority": "Autoridade Certificadora Gov.br",
                "signed_at": "2026-09-09T10:15:00-03:00",
                "is_valid": true
            }
        ]
    }
    ```

### 4.2 Frontend (Vue 3 Composition API + Pinia + MaxComponentsUi)
- **Store Pinia (`useDocumentMetadataStore`)**:
  - Mantém o estado dos metadados auditados e das validações ativas de conformidade (GPS compatível, data recente, assinatura válida).
  - Emite alertas reativos caso uma foto ou documento viole as regras de conformidade da concessionária.
- **Painel de Inspeção Forense**:
  - Gaveta lateral (*Drawer*) acionável ao clicar no ícone de metadados/auditoria em qualquer documento ou foto.
  - Exibição de mapa integrado mostrando o marcador da usina solar e o marcador exato onde a foto foi tirada pelo eletricista.

## 5. Componentes de UI Sugeridos

| Componente | Origem | Papel na Funcionalidade |
|---|---|---|
| `MaxDocumentMetadataDrawer` | **Novo Componente** | Painel lateral deslizante (*slide-over drawer*) que exibe os metadados técnicos do arquivo: hash SHA-256, modelo do dispositivo, data original da foto, status da assinatura digital e conformidade técnica. |
| `MaxMaps` | Existente (`src/components/MaxMaps.vue`) | Integrado dentro da gaveta de metadados para renderizar mapa via satélite com dois marcadores: marcador azul (local do projeto) e marcador verde/vermelho (ponto EXIF da foto), com traçado visual de distância. |
| `MaxBadge` / `MaxStatus` | Existente (`src/components/MaxBadge.vue`) | Selo de validação de assinatura: `Assinatura Gov.br Válida` (verde), `ICP-Brasil Válida` (verde) ou `Sem Assinatura Digital` (laranja). |
| `MaxIconConfirm` | Existente (`src/components/MaxIconConfirm.vue`) | Modal de confirmação com aviso caso o engenheiro deseje ignorar a divergência de GPS (ex.: em usinas rurais com padrão distante da sede da fazenda). |
| `MaxIconButton` | Existente (`src/components/MaxIconButton.vue`) | Botão de atalho com ícone de lupa pericial (`material-symbols:policy` ou `material-symbols:info-outline`) presente em cada card de documento. |
