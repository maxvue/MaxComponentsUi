# 21 — MaxInputCpfCnpj: dois computeds de validação que podem divergir

**Severidade:** Média
**Categoria:** Bug / Divergência de regra de negócio
**Arquivos:** `src/components/MaxInputCpfCnpj.vue:65-72, 103-108`

## Problema

Existem dois computeds de validação:
- `isDone` — usa `cpfIsValid`/`cnpjIsValid`, alimenta o `:done` do template.
- `done` — usa `isCPF`/`isCNPJ`, alimenta `caution`, `complete` e o override `props.done`.

Se os pares de funções do max-use divergirem, o check verde e a mensagem de erro discordam. O override `props.done` só afeta um deles (`done`), então passar `:done="true"` não força o check visual.

## Correção sugerida

Consolidar num único computed, com um único par de validadores, e aplicar o override `props.done` nele.
