# Lacuna de catálogo — dez inputs de domínio

Data: 16/10/2026. Worktree: `wt-9a811fd4`.

## Localização e evidência

Na worktree ativa, o inventário de `src/components/`, `src/index.ts` e o catálogo do playground não apresentam `MaxInputPhase`, `MaxInputWireSize`, `MaxInputWireType`, `MaxInputAiExecutionType`, `MaxInputAiBillingMode`, `MaxInputAiBillingUnit`, `MaxInputPaymentMethod`, `MaxInputScheduleType`, `MaxInputMonthOccurrence` ou `MaxInputContentType`. Busca nominal em `src` não retornou esses nomes.

Existem `MaxInputSelect`, `MaxInputUF` e `MaxInputTypeAddress`, mas não os dez catálogos especializados. A tabela D01–D10 em `docs/plans/wt-9a811fd4/spec.md` identifica as listas e telas correspondentes no engeapp, MaxAiManager e SocialMedia.

## Impacto e encaminhamento

Os consumidores repetem listas e contratos usando seletores genéricos. A lacuna motiva a proposta de dez componentes da spec/plano, sem implicar defeito no select genérico. Os vinte componentes reservados pelo usuário não fazem parte da proposta. Nenhuma implementação ou alteração dos consumidores foi realizada.
