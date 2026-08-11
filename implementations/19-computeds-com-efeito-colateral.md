# 19 — Computeds com efeito colateral em CpfCnpj e PhoneMail

**Severidade:** Média
**Categoria:** Bug / Reatividade
**Arquivos:** `src/components/MaxInputCpfCnpj.vue:77-101`, `src/components/MaxInputPhoneMail.vue:90-126`

## Problema

- `MaxInputCpfCnpj`: o computed `maskValue` escreve em `type_mask.value`.
- `MaxInputPhoneMail`: o computed `maskValue` chama `maskMail()`/`maskPhone()`, que mutam `name_method`, `method` e **`temp_value` — o próprio source do computed** (auto-mutação da dependência).

Computeds devem ser puros; esse padrão gera re-renders em cascata e comportamento dependente do momento em que o computed é avaliado.

## Correção sugerida

Mover a detecção de tipo/limpeza para um `watch(temp_value)` e deixar os computeds puros.
