# MaxCardList — restauração conflitante da busca global com múltiplas instâncias

## Localização

- Projeto: `@maxvue/max-components-ui`.
- Data: 15/10/2026.
- Worktree: `wt-d7c91bf0`.
- Arquivo: `src/components/MaxCardList.vue:303–313`.
- Store compartilhada: `src/stores/useSearchBar.Store.ts`, campo `is_visible`.

## Evidência por leitura

Cada lista guarda o valor anterior da visibilidade ao montar, escreve `true` na store e restaura incondicionalmente o valor guardado ao desmontar, quando `useGlobalSearch` está habilitado.

Sequência deduzida diretamente desse fluxo:

1. Busca inicialmente invisível; lista A monta, guarda `false` e ativa a busca.
2. Lista B monta, guarda `true` e mantém a busca ativa.
3. A desmonta antes de B e restaura `false`, apesar de B continuar montada.
4. B desmonta e restaura `true`, apesar de não restar lista solicitando a busca.

Não houve reprodução executável nesta sessão Plan. A evidência é o ciclo de montagem/desmontagem do código atual, não um resultado de teste.

## Impacto

Com duas listas simultâneas usando a busca global, a barra pode desaparecer enquanto ainda é necessária ou permanecer visível depois da última desmontagem, dependendo da ordem de descarte.

## Encaminhamento

Tratar em tarefa própria a propriedade compartilhada da visibilidade, preservando consumidores que também controlam a barra. Criar regressão para duas instâncias, desmontadas nas duas ordens, e para o estado inicialmente visível.

Não corrigir no lote de layout de MaxCardList. Nos testes exclusivamente geométricos desse lote, usar `useGlobalSearch=false` para não misturar responsabilidades. A notificação não autoriza alterações de store ou novos contratos.
