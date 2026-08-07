# 37 — Checkbox/Radio/Toggle violam a convenção do InputBase

**Severidade:** Baixa
**Categoria:** Divergência de convenção
**Arquivos:** `src/components/MaxInputCheckbox.vue`, `src/components/MaxInputRadio.vue`, `src/components/MaxInputToggle.vue`

## Problema

CLAUDE.md exige `<InputBase>` como elemento mais externo de todo input; esses três usam `<div>` cru — sem linha de mensagem, sem estados done/error/caution, sem `required`. `MaxInputSwitch` (comparável) usa InputBase, evidenciando a divergência entre controles binários similares.

`Switch` e `Toggle` também têm APIs de props redundantes entre si (`labelLeft`/`leftLabel`/`falseLabel`/`labelFalse`...).

## Correção sugerida

Envolver em InputBase (ou registrar exceção documentada no CLAUDE.md para controles booleanos) e unificar as APIs de Switch/Toggle.
