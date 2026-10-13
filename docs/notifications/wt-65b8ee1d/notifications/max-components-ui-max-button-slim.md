# MaxComponentsUi — capacidade `slim` ausente no MaxButton

- Data: 13/10/2026.
- Worktree: `wt-65b8ee1d`.
- Natureza: lacuna da API solicitada; não é falha de teste observada.

## Localização e evidência

- `src/types/index.ts:66–145`: `MaxButtonsType` não declara `slim`.
- `src/components/MaxButton.vue:43–51,80–88`: defaults e classes não incluem essa opção.
- `src/components/MaxButton.vue:111–401`: não há seletor de compactação `slim`.
- `COMPONENTS.md:77–92`: tabela pública do botão não lista a prop.

## Impacto

Consumidores não têm uma prop dedicada a reduzir somente a altura por espaçamento vertical. `size="small"` também muda fonte e padding horizontal. O atributo `slim` do InputBase não implementa essa capacidade no MaxButton.

## Encaminhamento

Coberto pela especificação e plano em `docs/plans/wt-65b8ee1d/`. Proposta: prop boolean false por padrão e padding vertical compacto, preservando link e fallback somente ícone. Nenhuma correção foi implementada nesta sessão.
