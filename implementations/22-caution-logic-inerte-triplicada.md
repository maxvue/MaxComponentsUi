# 22 — Lógica de caution inerte copiada em 3 componentes

**Severidade:** Média
**Categoria:** Bug / Duplicação
**Arquivos:** `src/components/MaxInputText.vue:73-89`, `src/components/MaxInputNumber.vue:73-89`, `src/components/MaxColorPicker.vue:98-114`

## Problema

Bloco idêntico copiado 3x com dois defeitos:

1. `caution = props.caution !== undefined ? props.caution && isDone.value === false : ...` — quando o pai passa uma string de caution explícita, ela é **suprimida** até haver blur inválido (AND com `isDone === false`), invertendo a intenção do override.
2. `testIsDone()` retorna `null` quando não há `targetValue`/`required`/`caution` — em uso comum, `caution` nunca ativa e `error_msg` é código morto. No ColorPicker nem existe blur ligado.

## Correção sugerida

Extrair um composable compartilhado `useInputValidation()` (ver achado 40); caution explícito do pai deve passar direto, sem AND com estado interno.
