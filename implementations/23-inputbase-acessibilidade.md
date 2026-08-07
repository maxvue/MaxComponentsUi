# 23 — InputBase: sem associação label/input nem atributos ARIA

**Severidade:** Média
**Categoria:** Acessibilidade
**Arquivos:** `src/components/InputBase.vue:4-6, 20-31, 35-38`

## Problema

- O label é um `<div>` sem `<label for>`/`id` — leitores de tela não associam rótulo ao input do slot.
- Estados done/error/caution são apenas ícones/cores: sem `aria-invalid`, sem `role="alert"`/`aria-live` na mensagem, sem `aria-describedby`.
- O asterisco de required é visual apenas (`aria-required` ausente).
- Só `MaxBaseInput` seta `aria-invalid`, e nenhum wrapper repassa `invalid` para ele.

Como o InputBase é o wrapper central de todos os inputs, corrigir aqui propaga para ~20 componentes.

## Correção sugerida

Gerar `id` no InputBase (`useId()` do Vue 3.5), expor via provide/slot props para o input, usar `<label :for>`, `aria-describedby` apontando para `.input-message` e `aria-live="polite"` na linha de mensagem.
