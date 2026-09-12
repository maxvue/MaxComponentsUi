# Plano de implementação — carga coordenada de opções do select

## Objetivo e resultado esperado

Transformar `loadOptions` em uma operação versionada e cancelável: ativações repetidas compartilham a mesma carga, somente a geração vigente publica opções e fechar/desmontar invalida resultados pendentes.

## Escopo e fora de escopo

- Escopo: máquina `closed/loading/open` de `MaxInputSelect`, deduplicação, cancelamento cooperativo, erro e testes de concorrência.
- Fora: cache global, paginação, mudança do formato das opções, alteração visual ampla ou aplicação automática a outros componentes.

## Arquivos-alvo

- `src/components/MaxInputSelect.vue`.
- `tests/components/MaxInputSelect.test.ts`.
- `tests/components/MaxInputSelectOverlay.test.ts` para regressão de abertura/foco quando pertinente.

## Dependências e ordem

1. Fixar em testes o comportamento atual de abertura bem-sucedida e rejeição.
2. Introduzir estado/geração e deduplicação.
3. Acrescentar `AbortSignal` opcional sem quebrar callbacks sem argumentos.
4. Integrar fechamento, Escape e unmount à invalidação.
5. Validar teclado e overlay após os testes de corrida.

## Passos detalhados

1. Ampliar de forma compatível a assinatura para `loadOptions(context?: { signal: AbortSignal })`.
2. Manter `loadGeneration`, `AbortController`, promise em voo e intenção de abertura separados de `isOpen`.
3. Na primeira ativação fechada, marcar `loading`, emitir `before-show` uma vez e iniciar a carga. Ativações adicionais enquanto carrega retornam a mesma promise/não iniciam nova chamada.
4. Na resolução, publicar `optionsField` e abrir somente se geração e intenção ainda forem atuais; resposta antiga é descartada.
5. Em rejeição atual, limpar loading e manter fechado; abortos esperados não geram erro não tratado.
6. `hide`, Escape, desabilitação durante a carga e unmount devem abortar, incrementar geração e impedir publicação tardia.
7. No `finally`, uma geração antiga não pode limpar o `loading` de uma geração nova.
8. Preservar grupos, filtro, opção destacada e foco apenas quando a abertura efetivamente ocorrer.

## Migração e compatibilidade

- Callbacks atuais sem parâmetros continuam válidos; o argumento opcional apenas habilita cancelamento cooperativo.
- Props/eventos existentes permanecem; documentar que `before-show` representa uma tentativa aceita, não cada clique repetido.
- Providers que ignoram o signal continuam seguros pelo guard de geração.

## Testes pertinentes

- Duplo clique/dupla tecla antes da resolução chama `loadOptions` exatamente uma vez.
- Resolver duas gerações em ordem inversa mantém a mais recente.
- Fechar, desabilitar ou desmontar durante a carga impede abertura/publicação.
- Rejeição e abort deixam `loading=false` e permitem nova tentativa.
- Testar lista plana, grupos, foco e seleção após carga.
- A11y: `aria-expanded` só muda ao abrir; durante loading, refletir estado ocupado no gatilho sem criar anúncio duplicado.
- Benchmark determinístico com `k` ativações simultâneas: uma chamada e uma publicação; tempo de rede não bloqueia CI.

## Critérios de aceite

- Para qualquer `k >= 1` durante uma carga, há uma chamada ao provider.
- Resultado obsoleto, abortado ou pós-unmount produz zero mutações observáveis.
- Somente a geração vigente altera `loading`, opções e `isOpen`.
- Rejeição não gera unhandled rejection e uma segunda tentativa funciona.
- Testes focados, type-check, suíte e build passam.

## Riscos, rollback e validação final

- Riscos: segundo clique ser interpretado como fechamento, providers incompatíveis com signal e foco prematuro. Mitigar documentando semântica, argumento opcional e testes de teclado.
- Rollback: manter guard de geração mesmo se o `AbortSignal` precisar ser removido; restaurar a assinatura sem voltar a permitir publicação obsoleta.
- Validar cliques/Enter/Espaço rápidos, rejeição, resolução invertida, Escape, unmount, foco, type-check e build.
