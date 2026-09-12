# Plano de implementação — estados assíncronos distinguíveis e recuperáveis

## Objetivo e resultado

Padronizar `idle/loading/success/empty/error` nos sete componentes, mostrar espera imediatamente, preservar contexto no erro e oferecer retry/cancelamento. Nenhuma rejeição deixa spinner infinito ou clique morto.

## Escopo e arquivos

- Criar tipo/helper compartilhado de estado em `src/types`/`src/composables` somente para transições comuns.
- Alterar `MaxInputAutoCompleteApi.vue`, `MaxInputSelect.vue`, `MaxInputIconPicker.vue`, `MaxPdfView.vue`, `MaxTopMenu.vue` e `MaxIconButton.vue`, com testes.
- Reusar padrão de `MaxListBox`.
- Não duplicar correções de corrida/fila; integrar seus resultados.

## Fora de escopo

Não unificar a UI visual dos componentes nem duplicar correções específicas de fila, corrida, virtualização ou upload; compartilha-se apenas o contrato de estado.

## Dependências e ordem

1. Definir contrato/slots/microcopy.
2. Select/autocomplete/icon picker.
3. PDF/reload.
4. IconButton.
5. Testes transversais com Promises controladas.

## Passos

1. Definir estado discriminado com erro, attempt id e contexto de retry; vazio só deriva de sucesso sem itens.
2. Abrir overlay e mostrar loading antes de aguardar `loadOptions`/fetch.
3. Autocomplete API deve aplicar `minLength`/`delay` ao contrato remoto ou remover/depreciar props enganosas; separar filtro de cache de busca.
4. IconPicker diferencia loading, empty e error; request atual controla estado.
5. PDF substitui textos provisórios, captura falha de carregamento/render e oferece tentar novamente/abrir arquivo.
6. TopMenu aguarda reload, bloqueia reentrada, informa sucesso/erro e sempre finaliza estado.
7. IconButton vincula `loading||executing` a disabled, spinner e nome/`aria-busy`; clicks nativos são bloqueados. Handler externo usa loading controlado.
8. Preservar consulta, seleção, arquivo ou ação relevante no retry; permitir dispensa sem perda indevida.
9. Usar regiões live moderadas e foco previsível no erro/retry.

## Migração e testes

Props/slots de estado são aditivos; defaults ganham feedback. Alteração de `delay/minLength` precisa nota de versão. Unitários usam promises diferidas para cada transição, reject/retry/cancel e resposta obsoleta; integração e acessibilidade testam teclado/leitor, regiões live e reentrada; benchmark limita renders de progresso/loading.

## Aceite

Loading aparece antes da Promise resolver; empty nunca representa erro; todo erro possui retry/dispensa e contexto; callbacks obsoletos não escrevem; botão loading bloqueia todas as entradas e é anunciado; zero unhandled rejection.

## Riscos e rollback

Abstração única pode apagar diferenças; compartilhar tipos, não UI forçada. Retry automático pode duplicar efeitos; somente explícito e idempotente. Rollback por componente preservando pelo menos error/finally.

## Validação final

Matriz de estados por componente, fake timers/promises, axe/leitor, suíte, type-check, lint, unhandled rejection gate e `git diff --check`.
