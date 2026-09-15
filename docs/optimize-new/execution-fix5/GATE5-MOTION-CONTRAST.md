# GATE5-MOTION-CONTRAST — relatório de execução

- Papel: `GATE5-MOTION-CONTRAST` (somente leitura de código).
- Agente: `/root/gate5_motion_contrast`; parent: `/root`.
- Início: `2026-09-15T17:45:00-03:00`; fim: `2026-09-15T17:45:35-03:00`.
- HEAD auditado: `cabb5d710f452a8a27e34d92210a28261491f8ac` (`fixes/optimize-fix5`).
- Manifest: somente este relatório e a linha correspondente da matriz; nenhum arquivo de código alterado.

## Evidência executada

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts tests/browser/FocusVisibleInventory.browser.ts --reporter=verbose

Test Files  2 passed (2)
     Tests  9 passed (9)
Duration  2.93s
```

O Chromium real confirmou `prefers-reduced-motion` tanto em `reduce` quanto em
`no-preference`; os três alvos montados tiveram duração reduzida de `1e-05s`,
iteração `1`, transform computado aceitável e lifecycle de entrada/saída. O
segundo arquivo cobriu Tab em temas claro/escuro, zoom de 200%, contraste de
`MaxEmptyDiv` >= 4,5:1 e `forced-colors: active`.

```text
$ npx vitest run tests/themes/tokensMutationReal.test.ts tests/themes/textColorValidation.test.ts tests/components/MaxDarkModeContrast.test.ts --reporter=verbose

Test Files  3 passed (3)
     Tests  85 passed (85)
Duration  2.90s
```

O gate computado deriva pares do CSS compilado e cobre as variantes `solid`,
`outlined`, `text`, `link` e `dashed`, nove severidades, claro/escuro e os
estados default/hover/focus-visible/active/disabled. O teste de mutação em
memória alterou um token consumido e fez o mesmo gate falhar, portanto a
medição de contraste não é uma matriz morta.

## Lacuna impeditiva

Apesar de `motionReduced.browser.ts` inventariar 59 SFCs, ele monta apenas
três: `MaxAiIcon`, `TransitionFade` e `MaxTransitionUp`. Logo, não mede no
Chromium o estilo computado, transform, duração, iteração e lifecycle dos
outros 56 componentes classificados. Isso contraria a exigência da Etapa 10
de verificar todos os componentes classificados com `reduce` e
`no-preference`. O próprio bloco R18 permanece aberto/rejeitado na matriz;
não há evidência causal contra o baseline `aac16bca` para essa cobertura.

## Veredito

**REJEITADO.** O subgate de contraste é aceito, e a cobertura browser focal de
movimento passa, mas o gate combinado não pode aceitar R18 enquanto os 59 SFCs
não forem montados por fixtures reais (ou por famílias de fixtures que os
montem) e medidos no Chromium em ambas as preferências de movimento.
