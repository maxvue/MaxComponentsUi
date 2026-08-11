# 39 — Props duplicadas em massa e props declaradas sem efeito

**Severidade:** Baixa (melhoria estrutural)
**Categoria:** Manutenibilidade
**Arquivos:** múltiplos (`MaxPopover`, `MaxModal`, `MaxButtonConfirm`, `MaxIconConfirm`, `MaxTogglePopover`, `MaxInputText`, `MaxInputNumber`, `MaxInputSelect`, `MaxInputSwitch`...)

## Problema

1. **Popover/Modal/Confirms**: ~25 props idênticas repetidas em 5 componentes, várias com docstrings erradas (ex.: `route` documentado como "Rotação do ícone"). `withDefaults` com chave inexistente em MaxPopover e MaxModal (`message: 'Deseja continuar?'` sem a prop `message` declarada) — erro de tipo silencioso.
2. **Inputs**: `targetValue`, `required`, `iconMessage`, `float` etc. copiadas em todas as interfaces mas sem efeito em vários componentes (ex.: `required` no Select não valida nada). `MaxInputNumber` faz `v-bind="props"` no `<InputNumber>` repassando props alheias (`msg`, `iconMessage`, `done`...) que caem como atributos DOM.

## Correção sugerida

Extrair tipos compartilhados em `src/types` (`ConfirmProps`, `InputBaseProps` — como já existe `MaxButtonsType`), repassar ao PrimeVue apenas o subconjunto pertinente, e corrigir as docstrings junto.
