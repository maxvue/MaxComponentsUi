# Lacunas de componentes públicos reutilizáveis

- Data: 16/10/2026.
- Escopo: análise dos frontends engeapp, MaxAiManager, AgenteDeBolso e SocialMedia.
- Localização: `src/components/`, `src/components-manifest.json` e `src/index.ts` da worktree `wt-e923d8b6`.
- Evidência: inventário de SFCs e busca dos dez nomes/aliases abaixo no manifesto não encontraram componentes públicos equivalentes completos. Componentes próximos foram inspecionados para evitar duplicação.

| Lacuna sugerida | Implementação local que fundamenta a sugestão | Reuso existente a preservar |
|---|---|---|
| MaxAlert | AgenteDeBolso `resources/Vue/Components/AsyncFeedback.vue` | MaxToast/MaxMsgLabels não têm o mesmo papel |
| MaxQueryState | AgenteDeBolso `resources/Vue/Components/QueryStatePanel.vue` | MaxEmptyDiv, MaxLoader e MaxAlert proposto |
| MaxFormValidationSummary | MaxAiManager `resources/Vue/Components/FormValidationSummary.vue` | InputBase e validação de cada campo |
| MaxSegmentedControl | MaxAiManager `resources/Vue/Components/SelectionButtonGroup.vue` | MaxButton; não alterar grupo de badges com model array |
| MaxPeriodNavigator | AgenteDeBolso `resources/Vue/Components/TopMenuPeriodSelector.vue` | MaxIconButton e helpers MaxUse |
| MaxProgressBar | AgenteDeBolso `resources/Vue/Sections/Budget/BudgetBar.vue`; MaxAiManager `resources/Vue/Pages/BoardPage.vue` | MaxStats/MaxChart continuam distintos |
| MaxFilterBar | AgenteDeBolso `resources/Vue/Sections/Extract/ExtractFilters.vue`; MaxAiManager `resources/Vue/Pages/LogsPage.vue` | MaxGrid, campos e slot filters de MaxCardList |
| MaxFilePreview | engeapp `resources/Vue/Sections/supportChat/FileUploadPreview.vue` | MaxImage, MaxPdfView, uploads existentes |
| MaxMarkdownViewer | engeapp `resources/Vue/Components/MarkdownContent.vue`; SocialMedia `resources/Vue/Sections/SocialMedia/EventTabScript.vue` | Editor MaxInputMarkdown permanece editor |
| MaxCalendar | AgenteDeBolso `resources/Vue/Sections/Calendar/MonthGridSection.vue`; SocialMedia `resources/Vue/Sections/SocialMedia/TabCalendar.vue` | MaxInputDatePicker permanece campo, não agenda |

**Impacto:** repetição de apresentação/interação e manutenção distribuída. A ausência é oportunidade de centralização, não falha de runtime comprovada. Nem toda sugestão já tem uso literal em todos os projetos.

**Encaminhamento:** revisar `docs/plans/wt-e923d8b6/spec.md` e `plan.md`. Nenhum componente foi implementado ou consumidor migrado. Não foi comprovada falta de helper MaxUse ou defeito no MaxPinia.
