# REV5-R09 — refutação independente

- Papel: `REV5-R09`.
- Agente: `/root/rev5_r09`.
- Parent ID: `/root`.
- Início: `2026-09-15T15:58:00-03:00`.
- Fim: `2026-09-15T16:00:00-03:00`.
- Referência adversarial: `aac16bca`.
- HEAD auditado: `4f9e79ab399423d1599679389ad807c80fa8d8df`.
- Modo: somente leitura, exceto por este relatório e a matriz de orquestração.

## Escopo e caso adversarial

E04-06/E04-07 exigem que `BaseOverlay` e o composable usem
`visualViewport.offsetLeft/offsetTop`, safe-area e tokens, além de provar margem,
seta, scroll e hit-testing em 280/320 px, landscape e zoom de 200%.

O commit de referência `aac16bca` não incluía os offsets na geometria: os limites
começavam em zero. O HEAD introduz offsets no cálculo de
`MaxBaseOverlay` e `useActiveOverlayPosition`; portanto o caso de offsets é
realmente distinguível da referência e os testes unitários conseguem observá-lo.

## Evidências executadas

```text
$ npm test -- --run tests/composables/useActiveOverlayPosition.test.ts tests/components/base/MaxBaseOverlay.test.ts
Test Files  2 passed (2)
Tests  32 passed (32)

$ npm run test:browser -- tests/browser/layersMobileClamp.browser.ts
Test Files  1 passed (1)
Tests  6 passed (6)
```

O teste Chromium emite avisos de diretiva `tooltip` não resolvida; eles não foram
tratados como sucesso limpo de gate.

## Refutação

1. `resolveSafeAreaInsets()` lê apenas `--safe-area-top/right/bottom/left`, porém
   uma busca no tema e nos SCSS de produção não encontra definição desses quatro
   tokens. Há somente o próprio leitor; os usos existentes de
   `--safe-area-bottom` usam fallback local `env(safe-area-inset-bottom, 0px)`.
   Assim, em um dispositivo com inset real, o overlay continua recebendo zero e
   não satisfaz o requisito de safe-area/tokens.
2. Em `MaxBaseOverlay`, `maxWidth` é limitado à área útil, mas
   `minWidth: t.width` continua aplicado quando `matchTargetWidth=true`. Se o
   gatilho medir, por exemplo, 400 px em uma viewport de 280 px, CSS resolve o
   conflito a favor de `min-width`, fazendo o painel exceder `maxWidth`; o
   hit-test e a margem solicitados deixam de ser garantidos. Não há cenário
   Chromium que cubra esse contrato.
3. O suposto zoom de 200% em browser usa `hostElement.style.zoom = '2'` e só
   verifica z-index de `MaxPopover`; não produz `VisualViewport.scale=2`, não
   exerce `MaxBaseOverlay` nem mede margem, seta, scroll ou hit-test sob zoom.

## Veredito

**REJEITADO.** Há progresso verificável contra `aac16bca` para offsets, porém as
duas invariantes de produto acima e a matriz real de 280/320, landscape e zoom
200% não estão provadas. O implementador deve publicar tokens safe-area com
fallback `env()`, limitar também `minWidth`/largura efetiva e adicionar cenários
Chromium que alterem `VisualViewport` de verdade e cubram as métricas requeridas.
