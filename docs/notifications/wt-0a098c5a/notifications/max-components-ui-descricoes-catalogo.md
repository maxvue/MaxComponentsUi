# Descrições do catálogo não correspondem a alguns contratos atuais

- Data: 16/10/2026.
- Projeto: MaxComponentsUi, worktree `wt-0a098c5a`.
- Natureza: incoerência documental fora do escopo dos 15 novos inputs.

## Evidências

1. `playground/src/catalog.ts:90` descreve `MaxInputTextList` como lista dinâmica de entradas adicionáveis/removíveis. `src/components/MaxInputTextList.vue:20–32,86–97` implementa textarea com linhas e modelo convertido para string, não coleção de entradas.
2. `playground/src/catalog.ts:85` descreve `MaxInputNumber` com controles incrementais e limites. `src/components/MaxInputNumber.vue:11–23,41–83,102–111` mostra entrada textual decimal e não declara `min`, `max`, `step` nem botões incrementais no contrato inspecionado.

## Impacto e limite

As descrições podem induzir a assumir recursos que não estão implementados nesses contratos. Não foi executado teste de navegador nesta investigação. Componentes numéricos especializados existentes podem oferecer contratos diferentes; não extrapolar esta evidência para todos os inputs numéricos.

## Encaminhamento

Revisar textos e contratos em trabalho separado, ou corrigir funcionalidades somente com autorização específica e testes. O plano novo não depende de `MaxInputTextList` como editor de arrays nem de limites numéricos presumidos em `MaxInputNumber`.
