# Plano de implementação — isolar paste e reconciliar previews

## Objetivo e resultado

Fazer somente a instância ativa de `MaxInputFile` processar arquivos colados e revogar Object URLs assim que arquivos forem removidos externamente.

## Escopo e fora de escopo

- Escopar paste por foco/ativação da drop zone.
- Reconciliar `previewUrlMap` com `modelValue`.
- Cobrir múltiplas instâncias e cleanup idempotente.
- Não mudar drag-and-drop, formato do v-model ou política de tipos/tamanho de arquivo.

## Arquivos

- Alterar `src/components/MaxInputFile.vue` e `tests/components/MaxInputFile.test.ts`.
- Alterar documentação do componente se o comportamento de colagem for público.

## Dependências e ordem

1. Testes multi-instância/URL falhando.
2. Estado de ativação e listener local.
3. Reconciliação de URLs.
4. Regressões de drop/input/unmount.

## Passos

1. Tornar a zona focável e registrar quando foco/pointer torna a instância ativa; limpar no blur/unmount.
2. Preferir listener `paste` na própria zona. Se listener global for necessário, retornar sem efeitos quando target/foco não pertence à instância.
3. Chamar `preventDefault` apenas depois de encontrar arquivo e confirmar instância ativa.
4. No watcher de `modelValue`, criar o conjunto de arquivos mantidos e revogar/remover URLs apenas dos ausentes.
5. Preservar URLs de objetos mantidos por identidade e garantir revogação única em remoção local, externa e unmount.
6. Testar substituição total, lista parcial, mesmo File e duas instâncias.

## Migração e compatibilidade

V-model/emits permanecem. Colagem fora da zona deixa de ser capturada, correção intencional; documentar foco/clique prévio. A zona deve receber nome/foco visível para não degradar acessibilidade.

## Testes

- Unitários: duas instâncias, foco alternado, paste sem arquivo, `defaultPrevented`, remoção externa e revogação única.
- Integração/a11y: Tab/foco, colar na zona e em textarea alheio, drop/input preservados.
- Benchmark: teste leve de 100 ciclos replace/remove pode verificar mapa sem crescimento; tempo não é gate.

## Aceite

- Um paste emite em exatamente uma instância ativa.
- Paste alheio não é bloqueado.
- Remoção externa revoga cada URL exatamente uma vez.
- Após unmount não há listeners/URLs retidos.

## Riscos e rollback

Foco dentro de slots pode não ser reconhecido; usar `contains(document.activeElement)`. Comparação por nome revogaria arquivo errado; usar identidade. Rollback pode desabilitar paste global, preservando input/drop, até corrigir sem reter URLs.

## Validação final

Executar testes focados em jsdom, suíte, type-check, inspeção de listeners/URLs, lint e `git diff --check`.
