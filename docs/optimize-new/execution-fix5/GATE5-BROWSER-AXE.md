# GATE5-BROWSER-AXE — relatório de execução

## Correção do bootstrap e revalidação final — 2026-09-15

- Papel: `GATE5-BROWSER-AXE` (correção e revalidação).
- Agente: `/root/rev5_r04_chrome151`; parent: `/root`.
- Início: `2026-09-15T18:31:00-03:00`; fim: `2026-09-15T18:34:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com alterações locais
  pendentes desta correção e de outros papéis.

### Causa raiz e correção

Cada cenário Chromium usa `createApp`, que cria uma instância Vue isolada. Sete
harnesses não instalavam o plugin público da biblioteca antes de `mount`; por
isso `v-tooltip` não existia nas árvores de MaxPopover, MaxTableFields e seus
descendentes. Remover imports locais dos SFCs revelou corretamente esse erro
de bootstrap.

Foi criado `tests/browser/bootstrap.ts`, que chama `app.use(MaxComponentsUi)`
usando o plugin público de `src/index.ts`. Os sete harnesses sem registro
passaram a chamá-lo antes de `mount`: layers/mobile clamp, tabela de campos,
virtual scroller, cartão, lista de texto, tabela acessível e TagSelect
adversarial. Não há novo import de Tooltip em componente; consumidores
continuam podendo substituir a diretiva no seu próprio `app` normalmente,
pois o registro continua sendo por instância Vue.

### Evidência reproduzida

```text
$ npm run type-check -- --pretty false
exit 0

$ npx vitest run --config vitest.browser.config.ts [7 harnesses afetados] --reporter=verbose
Test Files  7 passed (7)
Tests  26 passed (26)

$ npm run test:browser
Test Files  19 passed (19)
Tests  72 passed (72)
Duration  16.87s

$ npm run test:axe
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.09s

$ git diff --check
exit 0
```

A saída integral da execução browser foi inspecionada: não contém `Failed to
resolve directive: tooltip`, `Duplicate extension names`, `tiptap warn`,
`AbortError` ou `Failed to load animation data`.

### Veredito da revalidação

**ACEITO.** O plugin é instalado no bootstrap de cada aplicação de teste que
faltava, preservando a configuração global de consumidores e deixando Browser
e axe livres dos warnings auditados.

## Revalidação após remoção dos imports locais de Tooltip — 2026-09-15

- Papel: `GATE5-BROWSER-AXE` (somente leitura de código).
- Agente de revalidação: `/root/rev5_r04_chrome151`; parent: `/root`.
- Início: `2026-09-15T18:30:00-03:00`; fim: `2026-09-15T18:31:00-03:00`.
- HEAD auditado: `d12d4571799e97ca286f86fa716ce29b80709aaf`, com alterações locais
  pendentes na diretiva Tooltip e em outros papéis.

### Evidência reproduzida

```text
$ npm run type-check -- --pretty false
exit 0

$ npm run test:browser
Test Files  19 passed (19)
Tests  72 passed (72)
Duration  16.78s

$ npm run test:axe
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.11s

$ git diff --check
exit 0
```

Apesar dos códigos de saída verdes, a saída Chromium contém novamente muitas
ocorrências de `[Vue warn]: Failed to resolve directive: tooltip`, incluindo
`MaxPopover`, `MaxIcon` dentro de `MaxIconButton`, `MaxPopoverConfirm` e
`MaxTableFields`. Isso é diretamente reproduzível no bootstrap isolado do
Vitest e coincide com a remoção dos registros locais da diretiva. Não foi
encontrado warning `Duplicate extension names`/`tiptap warn`, nem `AbortError`
ou `Failed to load animation data` de Lottie nesta execução.

### Veredito da revalidação

**REJEITADO.** A funcionalidade e o axe-core passam, mas o requisito de
browser livre de avisos Vue/tooltip voltou a falhar. É preciso restabelecer um
registro real de Tooltip que cubra as aplicações Vue isoladas do browser ou
ajustar legitimamente seu bootstrap, seguido de nova revalidação.

- Papel: `GATE5-BROWSER-AXE` (somente leitura de código).
- Agente: `/root/gate5_browser_axe`; parent: `/root`.
- Início: `2026-09-15T16:42:30-03:00`; fim: `2026-09-15T16:44:00-03:00`.
- HEAD auditado: `dca2b145` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Evidências executadas

1. `npm run test:browser` — **PASSOU** na primeira execução: 19 arquivos e 68 testes Chromium aprovados (código 0; 20,17 s).
2. `npm run test:axe` — **PASSOU**: 1 arquivo e 1 teste (código 0; 1,01 s). O teste executa `axe-core@4.11.0` no Chromium contra um diálogo nomeado e comprova que a mutação que remove o nome do botão produz a violação `button-name`.
3. Reexecução integral para contabilizar a saída — **FALHOU**: 18 arquivos/67 testes aprovados e uma falha transitória em `MaxCreditCard.browser.ts`, cujo `href` do SVG ficou vazio. Três execuções focais subsequentes desse arquivo passaram (6/6 cada), portanto a ocorrência é flutuação adicional a corrigir, e não evidência de regressão reproduzível no componente.

## Avisos e erros da aplicação capturados

- 32 ocorrências de `[Vue warn]: Failed to resolve directive: tooltip`, originadas principalmente em `MaxTableFields`/`MaxIconButton`, `MaxPopover` e `MaxPopoverConfirm` sob o bootstrap browser.
- 1 ocorrência de `[tiptap warn]: Duplicate extension names found: ['link', 'underline']`.
- 3 ocorrências de `Failed to load animation data ... AbortError: signal is aborted without reason` para uma animação remota Lottie.

Os avisos não foram suprimidos: a execução inteira devolveu código zero porque a configuração atual do Vitest não os transforma em falha. A instrução de finalização, porém, exige explicitamente Browser/axe sem warnings de tooltip e uma política explícita para avisos inesperados.

## Veredito

**REJEITADO.** A cobertura browser e o `axe-core` real passam funcionalmente, mas o gate não satisfaz a condição obrigatória de ausência de warnings de `tooltip`. Há ainda o warning de extensões duplicadas do Tiptap, três erros AbortError de Lottie e uma falha integral intermitente de `MaxCreditCard` a estabilizar. Nenhuma correção foi aplicada por este papel de gate somente leitura.

---

## Reexecução independente após a correção Tiptap

- Papel: `GATE5-BROWSER-AXE` (revalidação somente leitura).
- Agente: `/root/gate5_browser_axe_rerun`; parent: `/root`.
- Início: `2026-09-15T17:57:11-03:00`; fim: `2026-09-15T17:57:42-03:00`.
- HEAD auditado: `d12d4571` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

### Evidências executadas

1. `npm run test:browser` — **PASSOU**: 19 arquivos e 68 testes Chromium aprovados (código 0; 18,28 s).
2. `npm run test:axe` — **PASSOU**: 1 arquivo e 1 teste (código 0; 1,12 s). Mantém execução de `axe-core@4.11.0` no Chromium e a mutação que remove o nome do botão gera a violação `button-name`.
3. A saída integral da execução browser foi pesquisada por `Failed to resolve directive: tooltip`, `Duplicate extension names`, `tiptap warn`, `AbortError` e `Failed to load animation data`.

### Avisos e erros capturados

- Persistem **32** warnings `[Vue warn]: Failed to resolve directive: tooltip`, associados a `MaxPopover`, `MaxPopoverConfirm` e `MaxTableFields`/`MaxIconButton` sob o bootstrap browser.
- **0** warnings Tiptap de extensões duplicadas: a correção do commit `847202ef` está efetiva nesta execução.
- **0** ocorrências de `AbortError` ou `Failed to load animation data` de Lottie.
- Nenhuma falha de `MaxCreditCard` ocorreu nesta rodada.

### Veredito da reexecução

**REJEITADO.** Browser e `axe-core` continuam aprovados, e Tiptap/Lottie não emitiram avisos nesta rodada. Contudo, os 32 warnings de diretiva `tooltip` ainda violam explicitamente o requisito de Browser/axe sem warnings de tooltip. A correção deve registrar a diretiva no bootstrap dos testes browser (ou remover o uso indevido), seguida de nova revalidação.

---

## Revalidação após registro local da diretiva real

- Correção: `/root/fix5_tooltip_directive`; sem commit.
- Início: `2026-09-15T18:00:00-03:00`; fim: `2026-09-15T18:00:49-03:00`.
- HEAD de partida: `d12d4571` (`fixes/optimize-fix5`), com alterações de trabalho pendentes de outros papéis preservadas.

### Causa e correção

Os SFCs que usam `v-tooltip` dependiam exclusivamente de um registro global da aplicação. Os cenários Chromium criam aplicações Vue isoladas, portanto a resolução de diretiva ocorria no contexto dessas aplicações e falhava antes de montar `MaxPopover`, consumidores de `MaxIconButton` e tabelas. A diretiva real `Tooltip` passou a ser registrada localmente, como `vTooltip`, nos 14 SFCs que a utilizam. Não há mock, diretiva vazia, interceptação ou supressão de console.

O tipo do binding também foi ampliado para os valores efetivamente usados pelos templates (`null`, `undefined` e booleanos), e o parser agora os trata como tooltip sem conteúdo. Isso preserva `v-tooltip="null"` como uma ligação real e inativa, sem listeners ou balão visível.

### Evidências executadas

1. `npm run type-check -- --pretty false` — **PASSOU** sem diagnósticos.
2. `npm run test:browser` — **PASSOU**: 19 arquivos e 68 testes Chromium (código 0; 16,88 s), sem `Failed to resolve directive: tooltip`, warnings Tiptap, `AbortError` ou avisos Vue.
3. `npm run test:axe` — **PASSOU**: 1 arquivo e 1 teste com `axe-core` real no Chromium (código 0; 1,07 s).
4. `git diff --check` — **PASSOU**.

### Veredito da revalidação

**ACEITO.** Browser e axe-core executaram com a diretiva concreta em todos os componentes consumidores, e a saída não contém warnings de resolução de `tooltip`.
