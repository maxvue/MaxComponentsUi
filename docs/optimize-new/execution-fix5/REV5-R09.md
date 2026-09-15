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

## Revalidação — HEAD `3ee209c5e8b9eee339616f9eeed1aeda3f67f65c`

Data: `2026-09-15T16:05:00-03:00`. Auditoria somente leitura da implementação e
execução das suítes focais.

### Correções agora comprovadas

- `src/themes/tokens.scss` publica `--safe-area-top/right/bottom/left` com
  `env(safe-area-inset-*, 0px)`, e `resolveSafeAreaInsets()` os consome.
- `MaxBaseOverlay` limita `minWidth` de `matchTargetWidth` à área útil. O cenário
  Chromium de 280 px usa gatilho de 400 px e mede painel de no máximo 264 px,
  margem, `overflow: auto`, scroll e `elementFromPoint` no painel real.
- `useActiveOverlayPosition` inclui `offsetLeft`/`offsetTop`; o unitário simula
  `VisualViewport` 280×200, offsets 40/300, escala 2 e safe-areas, comprovando o
  clamp matemático e os listeners de viewport.
- O cenário Chromium cobre `MaxBaseOverlay` em 280 px, `MaxPopover` em 280 px,
  `MaxPopoverConfirm` em landscape 568×320, além de hit-test e override de
  tokens. As execuções reais foram: 33/33 unitários e 6/6 browser aprovados.

### Refutação remanescente: zoom real de 200%

O teste chamado `preserva clamp e limites visuais sob zoom de 200%` não realiza
pinch/page zoom nem emulação CDP: define apenas `hostElement.style.zoom = '2'`.
Ele monta `MaxPopover` e afirma exclusivamente que seu `z-index` computado é
1200. Não mede margem, seta, scroll, hit-test ou `MaxBaseOverlay` nesse caso e
não afirma `window.visualViewport.scale === 2`. Portanto CSS `zoom` local e o
mock unitário não constituem evidência de zoom visual real no Chromium.

Também houve avisos reais de diretiva `tooltip` não resolvida durante a suíte
browser; eles não invalidam os seis asserts focais, mas impedem classificá-la
como gate browser limpo.

### Veredito de revalidação

**REJEITADO.** Safe-area, `matchTargetWidth`, offsets, margem, scroll e hit-test
agora têm evidência suficiente nos escopos acima. O aceite integral de R09 ainda
exige uma execução Chromium com zoom real de 200% (por CDP/emulação de dispositivo
ou equivalente), registrando `VisualViewport.scale === 2` e as métricas de
margem, seta, scroll e hit-test para o overlay real.

## Revalidação final — HEAD `8ac50943`

Data: `2026-09-15T16:18:05-03:00`. Auditoria independente, somente leitura da
implementação; relatório e matriz são os únicos artefatos atualizados.

```text
$ npx vitest run tests/integration/r09VisualViewportZoom.test.ts
Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.84s
```

O teste inicia um Chromium headless por Playwright, aplica
`Emulation.setDeviceMetricsOverride` em 280×320 e
`Emulation.setPageScaleFactor({ pageScaleFactor: 2 })` por uma sessão CDP. A
prova espera explicitamente `window.visualViewport.scale` igual a 2 antes das
medições — não há `style.zoom` como substituto. A fixture monta os componentes
de produção `MaxBaseOverlay` e `MaxPopover`, e o teste verifica em ambos a
margem de pelo menos 7 px em cada borda da `VisualViewport`, `scrollTop = 40` e
`elementFromPoint` contido no painel real. Para o `MaxPopover`, também verifica
a seta computada real (`::before`, 14×14 px, transformação matricial).

### Veredito final

**ACEITO.** A lacuna de zoom real apontada na refutação anterior foi coberta por
CDP e `VisualViewport.scale === 2`, com margem, seta, scroll e hit-test dos
overlays de produção no mesmo cenário.
