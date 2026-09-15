# Relatório de execução — IMP5-R18

- Papel: `IMP5-R18` / E10-09.
- HEAD auditado: `107cef7a`.
- Arquivos de ownership: `tests/browser/motionReduced.browser.ts`, este relatório e a matriz.
- Status: revalidação parcial concluída; permanece aberto após rejeição de `REV5-R18`.

## Correção e evidência

O inventário deixou de ser suficiente por si só: foi incluído um teste de navegador Chromium que classifica os 59 componentes com motion e exige a mídia `prefers-reduced-motion` em cada fonte. As métricas CSSOM são agora obtidas de SFCs reais representativos das três categorias (`MaxAiIcon`, `TransitionFade` e `MaxTransitionUp`), tanto em `no-preference` quanto em `reduce`, para duração, iteração e transform.

O teste também monta `TransitionFade` e `MaxTransitionUp` reais, espera o término de entrada/saída entregue pelo Chromium e confirma a remoção dos nós sob `reduce`.

## Limite identificado pela refutação

Este retry ainda não atende à condição de aceite integral: os 59 SFCs não são todos montados individualmente, e o commit de referência `aac16bca` já contém as mesmas regras de motion relevantes. Portanto não há caso comportamental honesto que falhe naquele baseline e passe neste HEAD sem introduzir uma mudança de produto não motivada pelo achado. O papel deve permanecer aberto até que a coordenação decida entre reclassificar R18 como preservação já existente no baseline ou autorizar uma nova correção concreta.

## Comando de validação

```bash
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts
```

Resultado observado: 3 testes Chromium aprovados; inventário com 59/59 e CSSOM reduced de `1e-05s`/`1` nos SFCs reais montados.

## Risco e rollback

O teste depende do CDP do Chromium já usado pelos demais testes browser. Rollback isolado: remover `tests/browser/motionReduced.browser.ts` e reverter as duas linhas documentais deste papel.
