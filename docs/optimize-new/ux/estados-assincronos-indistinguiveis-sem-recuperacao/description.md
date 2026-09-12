# Achado UX-10: estados assíncronos indistinguíveis e sem recuperação

## Resumo

Busca remota, seleção, ícones, PDF, recarga global e botões de ícone confundem espera, vazio e falha ou escondem o loading onde ele não pode ser visto. O usuário recebe spinner infinito, clique aparentemente morto ou nenhum feedback, e raramente uma ação de tentar novamente.

## Severidade e prioridade

- Severidade: alta. Prioridade: P1.

## Evidências

- `src/components/MaxInputAutoCompleteApi.vue:22,89-105,149-205`: `minLength`/`delay` não são usados, digitação só filtra cache e o overlay nem monta sem resultados; não há loading/erro/vazio.
- `src/components/MaxInputSelect.vue:82-85,486-504`: markup de loading fica no overlay, mas `toggle` aguarda `loadOptions` antes de abri-lo; rejeição não recebe mensagem.
- `src/components/MaxInputIconPicker.vue:57-67,283-295`: falha esvazia lista e o vazio volta a mostrar spinner, parecendo espera infinita.
- `src/components/MaxPdfView.vue:15-31,121-139`: usa textos “Loading”/“Custom ProgressSpinner” e não apresenta estado de erro/retry quando renderização falha.
- `src/components/MaxTopMenu.vue:158-168`: liga/desliga `reloading` sem aguardar o ciclo nem comunicar rejeição.
- `src/components/MaxIconButton.vue:47,82-100`: a trava `executing` protege somente a prop `action`; a prop pública `loading` não altera visual, disabled ou anúncio, e listeners `@click` externos ficam fora da trava.

## Componentes afetados

`MaxInputAutoCompleteApi`, `MaxInputSelect`, `MaxInputIconPicker`, `MaxPdfView`, `MaxTopMenu`, `MaxIconButton` e consumidores de APIs assíncronas.

## Causa-raiz

Não há modelo transversal explícito `idle/loading/success/empty/error`. Cada componente deduz estado a partir de lista vazia ou duração da Promise, e a apresentação é montada em ordem incompatível com a operação.

## Impacto

Usuário não distingue indisponibilidade de ausência de dados, repete ações, abandona fluxos ou espera indefinidamente. Falhas não oferecem diagnóstico nem recuperação.

## Reprodução e verificação

Use Promises lentas e rejeitadas em `loadOptions`/fetch, URL de PDF inválida e recarga assíncrona. Observe se a UI diferencia loading, vazio e erro e se oferece retry sem perder consulta/contexto.

## Direção de solução

Padronizar estado assíncrono discriminado e slots/microcopy para cada fase. Abrir feedback antes de aguardar, preservar consulta e seleção, permitir retry/cancelamento e anunciar mudanças.

## Critérios de aceite

- Espera é visível imediatamente e não parece clique morto.
- Vazio só aparece após sucesso sem itens; erro é distinto e acionável.
- Rejeições não deixam spinner infinito nem Promise sem tratamento.
- Retry preserva contexto relevante.
- Botão de ícone em loading apresenta estado perceptível e bloqueia reentrada por todas as vias públicas aplicáveis.
- Testes usam Promises controladas e cobrem pendência, rejeição e recuperação.

## Possíveis contraevidências

`MaxListBox`, tabelas e alguns loaders já possuem estados separados e podem servir de referência. Consumidores podem controlar certos estados externamente, mas props públicas ambíguas e defaults atuais continuam induzindo falhas.
