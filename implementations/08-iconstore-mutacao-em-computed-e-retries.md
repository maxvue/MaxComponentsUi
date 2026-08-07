# 08 — useIconStore: mutação de estado dentro de computed e contador de retries que nunca reseta

**Severidade:** Alta
**Categoria:** Bug / Reatividade
**Arquivos:** `src/stores/useIcon.Store.ts:12-17`, `src/components/MaxIcon.vue` (computed `svgContent`)

## Problema

1. `getIcon()` muta estado (`icons_data.value[icon_name] = 'waiting'`) e é chamado dentro de um `computed` do `MaxIcon` — efeito colateral em getter reativo. Isso dispara re-avaliação de todos os computeds que dependem de `icons_data` e, sob Vue estrito, gera warnings de "Maximum recursive updates".

2. Após 4 falhas de rede, `errors['fetch']` atinge `MAX_FETCH_RETRIES` e **nunca é resetado** (só reseta no `.then` de sucesso). Ícones novos pedidos depois disso ficam `'waiting'` para sempre na sessão — uma queda momentânea de rede desativa ícones até o reload.

## Correção sugerida

- Mover a marcação `'waiting'`/disparo de fetch para uma action chamada em `watchEffect`/`onMounted` do componente; o computed fica puro.
- Resetar `errors.fetch` com backoff temporal (ex.: `setTimeout` exponencial) em vez de contador permanente.
