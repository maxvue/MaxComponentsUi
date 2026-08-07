# 26 — useConfirmStore: singleton com estado vazando entre instâncias e toggle incorreto

**Severidade:** Média
**Categoria:** Bug / Inconsistência de API
**Arquivos:** `src/stores/useConfirm.Store.ts`, `src/components/MaxButtonConfirm.vue:85-92`, `src/components/MaxIconConfirm.vue`, `src/components/MaxTogglePopover.vue`

## Problema

Três componentes escrevem no mesmo singleton `useConfirmStore` de formas divergentes:

- `MaxButtonConfirm` seta `messageIcon`; `MaxTogglePopover` **não seta** — fica o valor do confirm anterior (estado vaza entre instâncias).
- O toggle usa `show = !show`: clicar no botão A com o confirm do botão B aberto **fecha** o popover em vez de reabrir no A, mas ainda sobrescreve message/props.
- `count_loadeds` é exportado e nunca usado.
- `MaxTogglePopover` envolve tudo num `<MaxPopover>` sem usá-lo de fato (só pelos slots), herdando comportamento de clique duplicado.
- `MaxButtonConfirm`: props `acceptLabel`, `acceptIcon`, `cancelIcon` declaradas e nunca usadas; `v-bind="props"` vaza props de confirmação como atributos HTML para o botão; há um `;` espúrio em `<script setup lang="ts">;` (linha 5).

## Correção sugerida

Centralizar a abertura numa action `confirm(payload)` que reseta todos os campos (incl. `messageIcon`) e sempre abre no alvo clicado. Remover `count_loadeds` e as props mortas; limpar o `;`.
