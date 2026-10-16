# Lacunas de inputs especializados no catálogo

## Localização e evidência

O diretório público `src/components/` inspecionado nesta worktree não contém MaxInputPercent, MaxInputPower, MaxInputCurrent, MaxInputVoltage, MaxInputDistance, MaxInputDuration, MaxInputTokenLimit, MaxInputMonthDays, MaxInputWeekInterval ou MaxInputSocialPlatform.

Há inputs genéricos Number/Select/Text e o componente Discount, mas não os contratos especializados propostos. As evidências de necessidade nos três consumidores e as diferenças em relação aos componentes existentes estão em `docs/plans/wt-ef60677b/spec.md`, tabela de seleção.

## Impacto e encaminhamento

Unidades, listas e regras de edição ficam distribuídas pelas aplicações. Isso é uma oportunidade de biblioteca, não comprovação de erro em todas as telas. Planejar os dez componentes conforme spec/plan, sem implementar nesta sessão nem migrar consumidores implicitamente. Os dez nomes reservados à outra sessão estão excluídos.
