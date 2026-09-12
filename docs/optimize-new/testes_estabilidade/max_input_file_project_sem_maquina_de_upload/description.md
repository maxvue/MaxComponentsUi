# MaxInputFileProject descarta drops e reenvia arquivos em operações concorrentes

## Resumo
O componente anuncia drag-and-drop, mas seu callback não faz nada. No caminho de file dialog, o auto-upload reenvia todo arquivo ainda marcado `!in_server`, sem estado in-flight/sucesso/cancelamento, e muta objetos recebidos em props.

## Severidade e prioridade
**Alta / P1.** Uma interação principal é inoperante e o caminho alternativo pode duplicar uploads.

## Evidências
- `MaxInputFileProject.vue:112-116,193-195`: `useDropZone` aponta para `onDrop` vazio.
- `:45,57-60,67-90`: `temp_files` referencia `props.files` e `convertItem` grava `id`, `blob`, URLs e flags nos objetos do pai.
- `:63-64,129-132`: watcher envia todo conjunto `!in_server` a cada mudança da contagem.
- `:135-185`: request não marca arquivos in-flight/sucesso, não retorna Promise pública nem cancela no unmount; falha só vai a `console.error`.
- `tests/components/MaxInputFileProject.test.ts:14-25` substitui `useDropZone` sem capturar/executar `onDrop`; testes cobrem apenas dialog e `sendFile` isolado.

## Afetados
`MaxInputFileProject`, APIs de upload, objetos `DBFile` pertencentes ao consumidor e usuários de drag-and-drop.

## Causa-raiz
Não existe uma máquina de estados por identidade de arquivo nem uma função única de ingestão. Seleção, drop, conversão e envio seguiram caminhos independentes/incompletos.

## Impacto
Drop válido é perdido. Selecionar A inicia POST[A]; adicionar B antes da conclusão inicia POST[A,B]. Props são alteradas fora do fluxo Vue e requests continuam após navegação.

## Reprodução
Capturar `onDrop` no mock e invocá-lo com um File: lista não muda. Com `auto=true`, adicionar A e depois B antes da resolução do Axios: observar dois POSTs contendo A.

## Direção de correção
Criar ingestão comum e estado por arquivo (`queued/in-flight/succeeded/failed`), operar em cópias, deduplicar requests, expor erro/retry e cancelar via AbortController/sinal Axios no unmount.

## Critérios de aceite
- Drop e dialog produzem o mesmo fluxo/eventos.
- Cada arquivo é enviado uma vez por tentativa.
- Props originais permanecem imutáveis.
- Erro, retry, sucesso e unmount têm testes concorrenciais.

## Contraevidências consideradas
`auto=false` com chamada manual isolada funciona; limpeza de URLs no unmount também existe. Nenhum dos dois cobre drop nem concorrência automática.
