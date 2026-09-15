# Relatório de refutação — REV5-R18

- Papel: `REV5-R18` / E10-09.
- Natureza: somente leitura; nenhum arquivo de produto ou teste foi alterado.
- Referência adversarial: `aac16bca`.
- HEAD auditado: `348711ada24edd62699d99e54b1ff8646f6db3dd`.
- Data: `2026-09-15`.

## Veredito

**REJEITADO.** O novo teste Chromium passa, mas não prova o aceite de E10-09: ele mede uma sonda sintética comum, e não o CSS computado nem o lifecycle de cada um dos 59 SFCs classificados.

## Evidências reproduzíveis

Comando executado no HEAD:

```text
npx vitest run --config vitest.browser.config.ts tests/browser/motionReduced.browser.ts

Test Files  1 passed (1)
Tests  3 passed (3)
Duration  1.39s
```

O Chromium é real e a emulação CDP de `reduce`/`no-preference` funciona, mas a cobertura é insuficiente:

1. `mountMotionProbes()` cria 59 `div.r18-probe` idênticas, com a regra artificial `animation: r18-spin 200ms linear infinite; transition: transform 200ms linear; transform: translateX(12px)`. Nenhuma instância dos 59 componentes é importada ou montada; `data-component` é somente metadado.
2. As métricas computadas passam porque a regra global de `_motion.scss` atinge a sonda artificial (`* { animation-duration: 0.01ms !important; ... }`) e porque as classes artificiais `motion-aggressive`/`slide-up-enter-active` provocam a neutralização de transform. Logo, não demonstram que a declaração real de cada SFC, seus seletores, estados ou exceções é aplicada.
3. O teste de lifecycle monta apenas `TransitionFade` e `MaxTransitionUp`. Dos 59 classificados, 57 não têm entrada/saída, desmontagem, listener ou timer exercitados. Além disso, a saída não entrega `transitionend`/`animationend`: desmonta a aplicação enquanto os nós ainda estão em `leave-active`, portanto não comprova o término do lifecycle.
4. A checagem de cobertura da primeira prova continua sendo regex de fonte (`/prefers-reduced-motion/i`), exatamente a evidência que a instrução exclui como suficiente.
5. A referência `aac16bca` não contém `tests/browser/motionReduced.browser.ts` (saída de `git show aac16bca:tests/browser/motionReduced.browser.ts`: código 128). O teste novo, por si, não fornece um caso adversarial que falhe no baseline e passe no HEAD. `_motion.scss` também é idêntico no baseline para as regras globais medidas.

Contagens observadas:

```text
rg -l '@keyframes|transition\\s*:|animation\\s*:' src/components -g '*.vue' | wc -l  => 59
rg -l 'prefers-reduced-motion' src/components -g '*.vue' | wc -l              => 59
```

Elas confirmam inventário textual, não comportamento computado dos SFCs.

## Condição para aceitar

Montar cada componente classificado (ou uma fixture real por classe/estado que importe seu CSS efetivo), alternar CDP entre as duas preferências e registrar `transform`, durações e iteração calculadas em seus elementos animados reais. Para todos com lifecycle de transição/animação, disparar o fim nativo e afirmar remoção/estado final sem listeners ou timers pendentes. O teste deve conter ao menos um cenário que revele a falha em `aac16bca`.
