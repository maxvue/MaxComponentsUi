# MaxInputFile captura colagem global e retém previews removidos externamente

## Resumo
Cada instância ouve `paste` em `window` sem checar foco/target; um mesmo arquivo colado atualiza todas as instâncias. Além disso, a remoção controlada pelo pai não revoga Object URLs até o unmount.

## Severidade e prioridade
**Alta / P1** para isolamento; **média** para retenção de memória.

## Evidências
- `MaxInputFile.vue:187-215`: handler global aceita arquivos, chama `preventDefault` e `addFiles` sem escopo local.
- `MaxInputFile.vue:104-145`: URLs ficam em `Map<File,string>`.
- `MaxInputFile.vue:151-157`: watcher externo só copia `modelValue`, sem comparar/remover URLs.
- Cleanup existe apenas em remoção local (`169-173`) e unmount (`147-149`).
- Testes cobrem uma instância e atualização externa com PDFs, não duas instâncias/preview de imagem removido pelo pai.

## Afetados
Todas as instâncias montadas, formulários com clipboard e sessões longas com lista controlada.

## Causa-raiz
Capacidade local foi registrada no escopo global e o cache de previews não é reconciliado com a fonte controlada.

## Impacto
Colar em outra área pode sequestrar o evento e duplicar arquivo em múltiplos inputs. Blobs de imagens removidas externamente permanecem retidos.

## Reprodução
Montar dois componentes e despachar um `paste` com arquivo em `window`: ambos emitem. Criar preview, fazer `setProps({modelValue: []})` e observar que `URL.revokeObjectURL` só ocorre no unmount.

## Direção de correção
Ativar paste apenas quando zona estiver focada/explicitamente armada e reconciliar o mapa no watcher por identidade de arquivo.

## Critérios de aceite
- Somente a instância ativa processa paste e não bloqueia colagem alheia.
- Remoção externa revoga URL uma vez.
- Testes multi-instância e de cleanup controlado passam.

## Contraevidências consideradas
`useEventListener` limpa o listener ao desmontar e remoção pelo botão revoga corretamente; nenhuma resolve o período em que várias instâncias estão montadas ou remoção pelo pai.
