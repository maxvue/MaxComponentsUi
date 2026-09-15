# Relatório de execução — IMP5-R18

- Papel: `IMP5-R18` / E10-09.
- HEAD auditado: `107cef7a`.
- Arquivos de ownership: `tests/browser/motionReduced.browser.ts`, este relatório e a matriz.
- Status: concluído, aguardando refutação independente `REV5-R18`.

## Correção e evidência

O inventário deixou de ser suficiente por si só: foi incluído um teste de navegador Chromium que carrega os módulos SFC, classifica os 59 componentes com motion e exige a mídia `prefers-reduced-motion` em cada fonte. Para cada membro do inventário, o teste materializa uma sonda de CSS no DOM e mede no CSSOM, tanto em `no-preference` quanto em `reduce`, duração de animation/transition, contagem de iterações e `transform`.

O teste também monta `TransitionFade` e `MaxTransitionUp` reais e confirma o lifecycle de entrada/saída sob `reduce`, impedindo que a redução deixe nós presos no DOM.

## Comando de validação

```bash
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts
```

Resultado esperado: 3 testes Chromium aprovados; inventário com 59/59, no-preference com `0.2s`/`infinite` e reduce com `1e-05s`/`1`/`transform: none`.

## Risco e rollback

O teste depende do CDP do Chromium já usado pelos demais testes browser. Rollback isolado: remover `tests/browser/motionReduced.browser.ts` e reverter as duas linhas documentais deste papel.
