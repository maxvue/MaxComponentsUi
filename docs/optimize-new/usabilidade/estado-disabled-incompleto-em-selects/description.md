# Selects desabilitados permanecem focáveis e semanticamente habilitados

## Resumo
`MaxInputSelect` e `MaxTagSelect` bloqueiam handlers quando disabled, mas conservam `tabindex=0` e não expõem `aria-disabled`.

## Severidade e prioridade
Alta — P1. WCAG 2.4.3 e 4.1.2.

## Evidências
- `src/components/MaxInputSelect.vue:7-18`: tabindex fixo, sem estado ARIA; guards apenas em `:499` e `:520`.
- `src/components/MaxTagSelect.vue:15-26`: mesmo contrato; guards apenas em `:410` e `:431`.

## Afetados
Todas as instâncias disabled de `MaxInputSelect` e `MaxTagSelect`.

## Causa-raiz
Disabled foi tratado como bloqueio lógico/visual, não como estado completo do controle customizado.

## Impacto e reprodução
Renderizar com `disabled` e usar Tab: o foco para no combobox, que é anunciado como disponível mas não responde.

## Direção de correção
Aplicar `tabindex=-1` e `aria-disabled=true` quando desabilitado, mantendo classe e guards.

## Critérios de aceite
Disabled sai da sequência, é anunciado e não abre por mouse/teclado; reabilitação restaura o comportamento.

## Contraevidências
`MaxInputSwitch.vue:18-23` já combina tabindex e `aria-disabled` corretamente.
