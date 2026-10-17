# Lacunas de componentes reutilizáveis sem inputs

- Data: 16/10/2026. Worktree: `wt-84453aaf`.
- Natureza: oportunidade de centralização do catálogo, não defeito funcional confirmado.
- Local: `src/components/`, `src/index.ts` e `src/components-manifest.json` da worktree ativa.

## Evidência

A busca em `src/**/*.{ts,vue,json}` pelos símbolos `MaxCopyButton`, `MaxCodeBlock`, `MaxDescriptionList`, `MaxSaveIndicator`, `MaxUsageMeter`, `MaxAttachmentList`, `MaxAudioPlayer`, `MaxChatMessage`, `MaxSocialPostPreview` e `MaxKanbanBoard` não retornou ocorrências. Existem primitivas próximas, mas não esses dez contratos compostos.

Padrões encontrados nos consumidores: cópia em `engeapp/resources/Vue/Sections/Checkout/CheckoutPix.vue`; áudio em `engeapp/resources/Vue/Components/Voip/CallAudioPlayer.vue`; bolha em `engeapp/resources/Vue/Components/Chatbot/ChatbotMessageBubble.vue`; quadro em `engeapp/resources/Vue/Sections/Dashboard/Sections/DataTable/TrelloList.vue`; detalhes/código/anexos em `MaxAiManager/resources/Vue/Components/Support/BugReportDetail.vue`; consumo e anexos em `AgenteDeBolso/resources/Vue/Sections/Transaction/AttachmentSection.vue`; estado de salvamento em `SocialMedia/resources/Vue/Sections/SocialMedia/EventTabBriefing.vue`; prévia social em `SocialMedia/resources/Vue/Components/InstagramSimulatePost.vue`. Caminhos relativos a `/home/johnattas/GitHub/`.

## Impacto e encaminhamento

Os apps mantêm apresentação e interações locais próprias. Centralização pode reduzir repetição e uniformizar acessibilidade/estados, sem pressupor migração imediata.

Não criar duplicatas de `MaxAlert`, `MaxQueryState`, `MaxProgressBar`, `MaxMarkdownViewer`, `MaxFilePreview` ou `MaxCalendar`. A proposta reutiliza essas primitivas onde cabível. Contratos, diferenças e aceite estão em `docs/plans/wt-84453aaf/spec.md` e `plan.md`.

Nenhuma correção/implementação executada. Este registro não autoriza alterações nos consumidores.
