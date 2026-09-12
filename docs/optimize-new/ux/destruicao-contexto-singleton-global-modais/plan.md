# Plano de implementação

## Objetivo e resultado esperado

Substituir o singleton destrutivo por coordenação em pilha e unificar todas as solicitações de fechamento em contrato cancelável/adiável. Abrir um modal secundário deve preservar o pai; fechá-lo deve restaurar camada e foco anteriores.

## Escopo e fora de escopo

- Em escopo: store de modais, visibilidade/camadas, foco, scroll, transições, `v-model` e pré-fechamento de `MaxModal`.
- Fora de escopo: redesign visual, Drawer/Popover e estado de formulário que o consumidor já eleva externamente.

## Arquivos a alterar/criar

- `src/stores/useModal.Store.ts`
- `src/components/MaxModal.vue`
- `tests/stores/useModal.Store.test.ts` (novo, se ainda ausente)
- `tests/components/MaxModal.test.ts`

## Dependências e ordem

1. Especificar pilha e compatibilidade de `show_id`.
2. Centralizar `requestClose` e transições.
3. Integrar foco/scroll por camada.
4. Cobrir concorrência, aninhamento e cancelamento.

## Passos de implementação

1. Fazer a store registrar uma pilha ordenada de IDs com `push`, `remove`, `top` e consulta `contains`; manter `show_id` como computed/deprecated alias do topo durante a migração.
2. Renderizar todo modal registrado, mantendo camadas inferiores montadas e visualmente inativas; somente o topo recebe `aria-modal`, trap de foco e eventos de Escape/backdrop.
3. Atribuir z-index pela posição da pilha e marcar camadas inferiores `aria-hidden`/`inert`, restaurando os valores ao reassumirem o topo.
4. Ao fechar/remover o topo, revelar o pai preservado e devolver foco ao último elemento focado nele; ao fechar a última camada, devolver foco ao gatilho externo.
5. Substituir timers encadeados de intenção por hooks reais da transição e token/cancelamento de operação, impedindo fechamento tardio após reabertura.
6. Encaminhar botão, Escape, backdrop, API e `v-model=false` a um único `requestClose(reason)`.
7. Definir contexto cancelável com `preventDefault`/`waitUntil` (ou contrato Promise equivalente) usado tanto pela prop quanto pelo evento; adaptar o callback legado `done` com aviso de depreciação e nunca fechar incondicionalmente após emiti-lo.
8. Evitar loops: mudança interna emite `update:modelValue` uma vez; atualização refletida não reempilha/remove novamente.

## Migração e compatibilidade

Preservar métodos expostos, `show_id`, props/emits e callback `done` por uma versão de transição. Documentar precedência e política de empilhamento. Consumidores antigos de uma camada continuam vendo o mesmo comportamento.

## Testes

- Store: push idempotente, ordem, remoção intermediária/topo e alias `show_id`.
- Integração: dois modais com estado local, fechamento restaura pai/foco, apenas topo interativo e scroll lock balanceado.
- Contrato: prop e evento cancelam, aguardam e autorizam todas as razões; reabertura durante saída; `v-model` sem ciclo.
- Acessibilidade: um único dialog modal ativo na árvore acessível.

## Critérios de aceite mensuráveis

- Abrir B sobre A não desmonta A nem perde seu estado local.
- Fechar B restaura A e o foco anterior em A; fechar A restaura o gatilho externo.
- Toda via de fechamento passa por um único guard e pode ser cancelada/adiada.
- Não há timers pendentes, locks negativos nem emissões duplicadas após sequências rápidas.

## Riscos e rollback

Pilha muda uma premissa global e `inert` exige restauração cuidadosa. Entregar atrás de modo compatível, manter alias e testar múltiplas instâncias. Rollback troca a estratégia da store para camada única sem desfazer o contrato unificado de fechamento.

## Validação final

Executar suítes da store/modal com fake timers, lint/typecheck e jornada manual A→B→fechar B→fechar A usando clique, Escape, backdrop, API e confirmação assíncrona.
