# Lacuna — dez inputs semânticos independentes

- Data: 2026-10-16. Escopo: biblioteca MaxComponentsUi, worktree `wt-609c633c`.
- Localização: `src/components/`, `src/index.ts`, `src/components-manifest.json`.
- Evidência: não existem arquivos, exports ou registros canônicos `MaxInputEntity`, `MaxInputGender`, `MaxInputEmail`, `MaxInputUrl`, `MaxInputPassword`, `MaxInputTime`, `MaxInputWeekday`, `MaxInputMonth`, `MaxInputYear` ou `MaxInputSlug`.
- Impacto: consumidores mantêm listas e regras em inputs genéricos; não é ausência de primitivas. `MaxInputPhoneMail`, `MaxInputBirthday`, `MaxInputText` e `MaxInputSelect` já cobrem partes da composição, mas não os dez contratos independentes.
- Fontes: Engeapp `resources/Vue/Sections/Project/ProjectData/SubSections/ClientProjectData.vue`; MaxAiManager `resources/Vue/Pages/ResetPasswordPage.vue`, `resources/Vue/Pages/ProjectsPage.vue`; SocialMedia `resources/Vue/Sections/SocialMedia/ThemeScheduleBuilder.vue`, `TabCalendar.vue`, `ThemeContentList.vue`.
- Encaminhamento: proposta detalhada em `docs/plans/wt-609c633c/spec.md` e `plan.md`. Nenhum componente foi criado nesta sessão e nenhuma migração de consumidor está autorizada.
