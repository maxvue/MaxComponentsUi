# 32 — Testes só de montagem: asserts que nunca falham

**Severidade:** Média
**Categoria:** Testes / Qualidade
**Arquivos:** `tests/components/MaxInputFile.test.ts`, `tests/components/MaxTableColumn.test.ts`, `tests/components/MaxTextInputFloatLabel.test.ts`, `tests/components/MaxInputFileUploadBig.test.ts`

## Problema

Vários arquivos têm um único `it` com apenas `expect(wrapper.exists()).toBe(true)` — assert praticamente impossível de falhar (mount que lança já falha o teste sozinho). `MaxTableColumn.test.ts` ainda stuba `Column: true` e mocka `@maxvue/max-use` inteiro — zero comportamento testado. 54 dos arquivos usam o padrão `exists()).toBe(true)` em algum grau.

## Correção sugerida

Substituir por asserts de props/emits/DOM (ex.: seleção de arquivo emite `update:modelValue`; coluna renderiza header/field). Regras práticas: todo teste de input deve exercitar o ciclo v-model; todo teste de exibição deve assertar conteúdo renderizado.
