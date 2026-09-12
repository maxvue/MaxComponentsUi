# Timers sem identidade causam efeitos tardios e corridas de estado

## Resumo
Três famílias mantêm timers fire-and-forget. Nos uploads, timer antigo apaga erro/seleção recente; em `MaxTabItem`, callbacks selecionam aba desmontada; em `MaxMaps` e `MaxToast`, callbacks mutam refs após desmontagem.

## Severidade e prioridade
**Média / P2.** Intermitente, mas reproduzível em retry rápido, troca de rota e montagem dinâmica.

## Evidências
- `MaxInputFileUpload.vue:185-190`: cada erro agenda limpeza em 3 s e zera `files`, sem cancelar anterior.
- `MaxInputFileUploadBig.vue:83-86`: mesmo padrão.
- `MaxTabItem.vue:78-89`: timers 0/10 ms chamam `add_count_tabs`/`selectTab` sem cleanup.
- `MaxMaps.vue:90-95`: timer de 50 ms sem cancelamento.
- `MaxToast.vue:97-104`: feedback de cópia em 2 s sem handle.
- Não há teste de retry em 2,9 s ou unmount antes dos callbacks.

## Afetados
Esses cinco componentes e telas que os alternam rapidamente.

## Causa-raiz
Efeitos temporais não têm handle, geração ou teardown; eventos sobrepostos são tratados como sequência linear.

## Impacto
Erro novo desaparece quase imediatamente, arquivos novos são apagados por timeout velho e aba removida vira ativa. Callbacks também retêm instâncias até executar.

## Reprodução
Com fake timers: erro, +2.900 ms, novo erro, +100 ms; o segundo some. Desmontar aba antes de 10 ms e avançar timers; `selectTab` ainda é chamado.

## Direção de correção
Um handle por efeito, cancelamento antes de reagendar/no unmount e token de geração quando aplicável; usar `nextTick` para lifecycle Vue.

## Critérios de aceite
- Retry renova a janela completa.
- Nenhum callback age após unmount.
- Testes cobrem corrida e teardown.

## Contraevidências consideradas
`MaxModal`, `MaxPdfView`, `MaxLikeButton`, `MaxInputCodeToolbar`, `MaxTopToolbar`, `MaxListBox` e store de toast já rastreiam timers principais; foram excluídos.
