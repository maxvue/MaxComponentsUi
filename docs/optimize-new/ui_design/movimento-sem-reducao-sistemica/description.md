# Movimento não essencial sem tratamento sistêmico de preferência reduzida

## Resumo

Dos 56 SFCs que declaram `transition` ou `animation`, somente 4 contêm regra `prefers-reduced-motion`. Permanecem movimentos de grande deslocamento, flip, zoom, pulse, shake, entrada/saída e barras animadas sem alternativa reduzida.

## Severidade e prioridade

- Severidade: alta
- Prioridade: P1

## Evidências

- Contagem reproduzível: `rg -l 'transition:|animation:' src/components -g '*.vue'` retorna 56 arquivos; `rg -l 'prefers-reduced-motion' ...` retorna somente `MaxAccordionItem.vue`, `MaxDrawer.vue`, `MaxTab.vue` e `base/MaxBaseSpinner.vue`.
- `src/components/MaxTransitionUp.vue:13-45`: desloca conteúdo 150 px na entrada e saída, sem redução.
- `src/components/MaxCreditCard.vue:282-353`: flip 3D de 0,6 s, sem redução.
- `src/components/MaxAiIcon.vue:164-168`: pulsação infinita.
- `src/components/MaxModal.vue:430-438` e `src/components/MaxModal.vue:527`: fade e shake do modal.
- `src/components/MaxToast.vue:294-333`: barra temporal, transições com transform/scale e movimento de lista.
- `src/components/MaxTransitionFadeLight.vue:9-17` e `src/components/TransitionFade.vue:14-22`: primitivas públicas de transição também não respeitam a preferência.

## Componentes e consumidores afetados

52 arquivos, incluindo transições públicas, crédito, toast, modal, imagem, menus, loaders, toolbars, uploads, selects, tabs e componentes de feedback.

## Causa-raiz

A linguagem de motion foi implementada localmente e só recebeu correções pontuais. Não existe mixin, token ou teste arquitetural que obrigue cada declaração de movimento não essencial a ter comportamento reduzido equivalente.

## Impacto visual e funcional

O sistema perde coerência de movimento e ignora uma preferência do sistema operacional ligada a desconforto vestibular. Deslocamentos de 150 px, flip 3D e shake são os casos de maior risco.

## Reprodução e verificação

Ativar “reduzir movimento” no sistema ou em DevTools (`prefers-reduced-motion: reduce`) e operar flip do cartão, transições, modal, toast e menus. As animações permanecem inalteradas.

## Direção recomendada

Definir política central para movimento funcional versus decorativo. Em redução, eliminar transforms/deslocamentos e pulsos, preservar apenas feedback necessário e permitir que duração de progresso temporal continue semanticamente correta sem animação vestibular.

## Critérios de aceite

- Todo movimento não essencial possui comportamento sob `prefers-reduced-motion: reduce`.
- Primitivas de transição públicas propagam o padrão para consumidores.
- Um teste arquitetural falha quando `animation`/`transition` relevante é adicionado sem tratamento ou justificativa.

## Contraevidências consideradas

- Transições curtas apenas de cor têm risco menor; elas entram no inventário, mas podem receber exceção documentada.
- `MaxBaseSpinner` reduz velocidade em vez de remover o loading, escolha funcional válida; não é necessário apagar feedback de atividade.
