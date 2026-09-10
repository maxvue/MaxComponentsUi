# Versionamento de Documentos de Homologação

## 1. Visão Geral no Paperless-ngx
No **Paperless-ngx**, a rastreabilidade e a integridade de documentos ao longo do tempo são pilares fundamentais de sua arquitetura:
- **Separação Imutável entre Documento Original e Arquivado**: Ao ingerir um arquivo, o Paperless preserva o documento original exatamente como foi enviado (`document.original_file`). Quaisquer transformações posteriores (OCR, adição de assinaturas, remoção de páginas em branco, compressão em PDF/A) geram uma versão arquivística (`document.archive_file`), garantindo que o arquivo de origem nunca seja corrompido ou sobrescrito.
- **Rastreamento de Histórico e Logs de Auditoria**: O sistema mantém um registro histórico completo de todas as alterações sofridas pelo documento, incluindo quem alterou, quando alterou e quais metadados, títulos ou correspondentes foram modificados.
- **Relacionamentos e Documentos Vinculados (Custom Fields & Notes)**: Permite relacionar explicitamente documentos entre si (ex.: um aditamento contratual vinculado ao contrato original, ou uma retificação vinculada a um laudo inicial), com notas internas explicativas que contextualizam a evolução do documento.

## 2. Situação Atual no Engeapp
No ecossistema do **Engeapp**, voltado para a homologação de usinas solares fotovoltaicas perante distribuidoras de energia elétrica (concessionárias como Cemig, CPFL, Enel, Neoenergia, Equatorial), a gestão de revisões documentais é deficiente e vulnerável:
- **Sobrescrita Destrutiva ou Arquivos Duplicados Soltos**: O armazenamento documental (via `Spatie MediaLibrary`) frequentemente opera no modelo de substituição da mídia existente para um determinado slot de documento. Quando um engenheiro sobe uma nova versão corrigida de um *Diagrama Unifilar* ou *Memorial Descritivo*, a versão anterior é sobrescrita ou excluída, ou são criados múltiplos arquivos com nomes confusos (`unifilar_final.pdf`, `unifilar_final_v2_corrigido.pdf`, `unifilar_concessionaria_ajustado.pdf`).
- **Perda de Rastreabilidade Perante a Concessionária**: No processo de homologação solar perante as concessionárias (Normas ANEEL REN 1.000/2021 e 1.059/2023), é comum a distribuidora emitir uma **Nota de Exigência Técnica / Nota de Devolução** (ex.: ajuste na curva de disparo do disjuntor de entrada, dimensionamento do condutor CA ou readequação da chave seccionadora visível). Como o Engeapp não versiona formalmente as peças técnicas, perde-se a referência exata de qual arquivo foi submetido no protocolo original (Revisão R0), impossibilitando auditoria jurídica e técnica caso a concessionária indefira o projeto alegando divergência histórica.
- **Risco Operacional no Canteiro de Obras e Vistoria**: Sem controle rigoroso de versão ativa/vigente, instaladores de campo e equipes de vistoria correm o risco grave de executar ou inspecionar a usina solar baseando-se no diagrama R0 (antigo/reprovado), em vez da revisão R1 ou R2 aprovada pela distribuidora, resultando em reprovação na vistoria técnica da concessionária e atraso na troca do medidor bidirecional.
- **Ausência de Registro de Motivo de Alteração e Protocolo**: Não há um vínculo estruturado entre o documento anexado, o número de protocolo de solicitação de acesso no portal da concessionária e o parecer técnico do analista da distribuidora.

## 3. Valor Agregado para o Engeapp
A introdução de um sistema robusto de versionamento documental trará impactos diretos e mensuráveis para a operação técnica da empresa:
- **Governança e Rastreabilidade Completa de Engenharia**: Controle explícito de revisões padronizadas de projeto (R0 - Concepção Inicial, R1 - Adequação Concessionária, R2 - Retificação Pós-Vistoria, R-As-Built - Como Construído).
- **Compliance com Normas Regulatórias (CREA, CFT e ANEEL)**: Cada versão de Anotação de Responsabilidade Técnica (ART/TRT), memorial ou diagrama fica vinculada ao respectivo protocolo de submissão, conferindo segurança jurídica integral ao Responsável Técnico (RT).
- **Agilidade na Resolução de Pendências com Concessionárias**: O engenheiro consegue visualizar com clareza a evolução das revisões de cada peça técnica e correlacioná-las ponto a ponto com as exigências descritas na nota técnica da concessionária.
- **Garantia de "Fonte Única da Verdade" para o Time de Campo**: O sistema sinaliza com clareza cristalina para os instaladores e integradores qual é a revisão homologada e vigente, bloqueando o acesso acidental a arquivos obsoletos.

## 4. Especificação Técnica Proposta

### 4.1 Backend (Laravel 13 + Spatie MediaLibrary + Versioning Trait + Meilisearch)
- **Modelagem de Dados de Versionamento**:
  - Criação da entidade `ProjectDocumentRevision` vinculada a `ProjectDocument` e aos arquivos da `Spatie MediaLibrary`:
    ```php
    Schema::create('project_document_revisions', function (Blueprint $table) {
        $table->ulid('id')->primary();
        $table->foreignUlid('project_document_id')->constrained()->cascadeOnDelete();
        $table->foreignUlid('media_id')->constrained('media')->cascadeOnDelete();
        $table->string('revision_code', 10); // 'R00', 'R01', 'R02', 'AS-BUILT'
        $table->enum('status', [
            'draft',
            'pending_submission',
            'submitted_to_utility',
            'utility_approved',
            'utility_rejected',
            'superseded'
        ])->default('draft');
        $table->string('concessionaire_protocol')->nullable();
        $table->text('change_reason')->nullable(); // Motivo da revisão
        $table->text('utility_rejection_notes')->nullable(); // Texto da exigência da concessionária
        $table->string('checksum_sha256', 64);
        $table->foreignId('uploaded_by_user_id')->constrained('users');
        $table->timestamp('submitted_at')->nullable();
        $table->timestamp('evaluated_at')->nullable();
        $table->timestamps();
    });
    ```
- **Imutabilidade e Armazenamento**:
  - Toda nova versão enviada gera um novo registro de mídia com `checksum_sha256` calculado na ingestão.
  - As versões anteriores são marcadas automaticamente com o status `superseded` (substituída), mantendo os binários intactos no storage (NVMe com ZFS).
  - Bloqueio estrito de deleção física: documentos que já possuem protocolo de concessionária não podem ser excluídos, apenas arquivados ou superados.
- **Eventos e Notificações no Laravel**:
  - `DocumentRevisionCreatedEvent`: Notifica a equipe de engenharia e os integradores via websocket (**Laravel Reverb**).
  - Notificação automatizada via WhatsApp (usando a API Oficial WhatsApp Cloud do Engeapp) alertando o integrador: *"A revisão R01 do Diagrama Unifilar foi emitida para atender a exigência da CPFL"*.

### 4.2 Frontend (Vue 3 Composition API + Pinia + MaxComponentsUi)
- **Store Pinia (`useProjectDocumentVersionsStore`)**:
  - Gerencia o histórico de revisões por documento do projeto.
  - Fornece getters reativos para: `currentApprovedRevision`, `activeRevision`, `rejectionHistory`.
  - Ações para subir nova revisão (`uploadRevision`), marcar status da concessionária e restaurar visualização de versões passadas.
- **Visualização em Timeline e Seletor de Versões**:
  - Cada slot de documento na tela do projeto (ex.: Memorial, Unifilar, ART) exibe a badge da versão atual (ex.: `R02 - Aprovado`) e um botão de histórico.
  - Ao expandir, exibe uma linha do tempo vertical detalhando cada revisão com data, autor, motivo da modificação e botão para download ou visualização.

## 5. Componentes de UI Sugeridos

| Componente | Origem | Papel na Funcionalidade |
|---|---|---|
| `MaxDocumentVersionTimeline` | **Novo Componente** | Timeline vertical que renderiza graficamente cada revisão documental (R0, R1, R2), com ícones semânticos de status (Aguardando Concessionária, Reprovado com Exigência, Aprovado), protocolo e notas de modificação. |
| `MaxDocumentRevisionBadge` | **Novo Componente** | Tag compacta e intuitiva que exibe o código da revisão atual (`R00`, `R01`) com coloração semântica dependendo do parecer da concessionária (`success` para parecer de acesso deferido, `danger` para nota de devolução). |
| `MaxModal` | Existente (`src/components/MaxModal.vue`) | Modal de upload de nova revisão com campos para justificativa da alteração, anexo do parecer da concessionária e seleção do código da revisão. |
| `MaxTableFields` | Existente (`src/components/MaxTableFields.vue`) | Grade principal de documentos do projeto fotovoltaico, agora incluindo as colunas dinâmicas: "Revisão Vigente", "Status Concessionária", "Data do Protocolo" e "Ações de Histórico". |
| `MaxButtonConfirm` | Existente (`src/components/MaxButtonConfirm.vue`) | Ação de confirmação protegida para homologação manual de uma revisão ou para marcar um documento como obsoleto. |
