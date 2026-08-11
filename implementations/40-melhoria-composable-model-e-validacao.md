# 40 — Melhoria estrutural: composable único para v-model espelhado e validação

**Severidade:** Sugestão (alto retorno)
**Categoria:** Melhoria / Arquitetura
**Arquivos:** ~15 componentes de input

## Problema

O padrão `temp_value` + par de watches (espelhar `props.modelValue` → ref local → emitir de volta) é reimplementado à mão em ~15 componentes, cada um com pequenas divergências: com/sem guard de igualdade, com/sem `immediate`, emitindo mascarado vs. numérico vs. só dígitos. A maioria dos bugs de sincronização dos achados 10, 12, 19, 20 e 36 nasce dessas divergências. O mesmo vale para a lógica done/error/caution triplicada (achado 22).

## Sugestão

Criar dois composables em `src/helpers/` (ou max-use):

1. `useMirroredModel(props, emit, { transform, compare })` — ou migrar para `defineModel` (já usado no MaxColorPicker), eliminando o padrão inteiro.
2. `useInputValidation({ required, targetValue, caution, done, validator })` — retorno `{ done, error, caution, onBlur }` consumido pelo InputBase.

Fazer isso **antes** de migrar os inputs restantes do PrimeVue: cada migração já adotaria o composable, evitando reimplementar as divergências. É a melhoria de maior retorno estrutural do projeto.
