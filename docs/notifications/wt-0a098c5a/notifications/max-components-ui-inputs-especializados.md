# Lacunas identificadas — inputs de propósito específico

- Data: 16/10/2026.
- Local da análise: `src/components`, `src/index.ts`, catálogos de `src/constants` e formulários dos três consumidores.
- Natureza: oportunidade de reutilização dentro do pedido; não falha de runtime comprovada.

## Evidência e impacto

Os seguintes propósitos aparecem como selects/textos genéricos ou composições locais, sem componente dedicado correspondente no catálogo observado:

1. Ocupação de financiamento — `engeapp/resources/Vue/Components/SolarFinancing/ModalSolarFinancingSubmit.vue:119,242–249`.
2. Prazo de financiamento — mesmo arquivo, `:26,224–233`.
3. Carência de financiamento — mesmo arquivo, `:27,235–240`.
4. Unidade de preço de serviço — `engeapp/resources/Vue/Components/Services/ServiceConfigModal.vue:43,162–167`.
5. Público de preço de serviço — mesmo arquivo, `:46,169–173`.
6. Tecnologia de inversor — `engeapp/resources/Vue/Sections/Settings/Equipments/SettingsEquipments.vue:58`.
7. Tipo de autenticação de monitoramento — `engeapp/resources/Vue/Sections/Settings/Monitoring/SettingsMonitoring.vue:318–323`.
8. Fluxo de obtenção de credencial — mesmo arquivo, `:325–328`.
9. Identificador de unidade consumidora — `engeapp/resources/Vue/Pages/SolarCompanyProjectCreatePage.vue:102`.
10. Situação de modelo IA — `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModalAiModel.vue:271–275`.
11. Modalidade de regra de preço IA — `MaxAiManager/resources/Vue/Sections/Settings/Ai/ModelPriceRulesEditor.vue:256–267`.
12. Operação de cache IA — mesmo arquivo, `:280–283`.
13. Tipo de fonte RAG — `MaxAiManager/resources/Vue/Sections/Rag/ModalRag.vue:153–179,675`.
14. Paleta de cor com detalhes por item — `SocialMedia/resources/Vue/Sections/SocialMedia/TabBrandPositioning.vue:87–101`.
15. Coleção de regras editoriais — `SocialMedia/resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue:14–52`.

A ausência exige catálogos/manipuladores locais e amplia o risco de divergência de códigos e comportamento. Inputs genéricos existentes continuam úteis; a lacuna é de propósito especializado, não ausência total de capacidade de renderizar campos.

## Encaminhamento

Propostas, contratos, preservação e validações em `docs/plans/wt-0a098c5a/spec.md` e `plan.md`. `MaxInputEntity` e `MaxInputGender` já existem e não devem ser recriados. Nenhuma implementação feita neste registro. Nenhuma falta de helper genérico MaxUse ou defeito MaxPinia foi comprovado como impedimento para o escopo proposto.
