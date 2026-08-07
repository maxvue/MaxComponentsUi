# 17 — Migração PrimeVue: componentes novos fora do rastreio (YAML/fila)

**Severidade:** Alta
**Categoria:** Divergência de processo / Migração
**Arquivos:** `status-primevue.migration.yaml`, `migration_executor.md`, `src/components/MaxUserSection.vue:46`, `src/components/MaxButtonConfirm.vue`, `src/components/MaxIconConfirm.vue`

## Problema

1. **MaxUserSection** (commit `a1c68c4b`, posterior à geração do YAML) importa **diretamente** `TieredMenu from 'primevue/tieredmenu'`, mas não consta no YAML nem na fila do executor. Ao concluir os 33 itens, a lib ainda dependerá do PrimeVue.

2. **MaxButtonConfirm / MaxIconConfirm** (commit `8746a182`) dependem **transitivamente**: usam `MaxButton` (que importa `primevue/button`) e a diretiva `v-tooltip` (registrada via PrimeVue). O cabeçalho do YAML afirma cobrir dependências "diretas ou transitivas" (é o critério que incluiu MaxInputTextList, MaxInputTypeAddress e MaxTableFields).

## Verificações positivas (sem divergência)

- Os 4 componentes `done` (InputBase, MaxInputText, MaxInputTextArea, MaxInputSwitch) realmente não contêm `primevue`/`@primeuix` (verificado por grep).
- YAML ↔ fila do executor: sincronizados (33/33, mesmos statuses).

## Correção sugerida

- Adicionar `MaxUserSection` ao YAML e à fila (nível provável: media — menu tipo TieredMenu) e gerar o plano correspondente.
- Adicionar `MaxButtonConfirm`/`MaxIconConfirm` como transitivos (resolvidos quando `MaxButton` for `done`; `v-tooltip` precisa de substituto).
