# REV5-F14 — Refutação independente de E06-01 e E06-02

## Identidade

- Papel/agente: `REV5-F14` / `/root/rev5_f14`.
- Início: `2026-09-15T14:29:00-03:00`.
- Fim: `2026-09-15T14:30:32-03:00`.
- Worktree somente leitura: `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-optimize-fix5`.
- Referência adversarial: `aac16bca`.
- HEAD auditado: `925b8bf1b74fc3e187f12664b784f974e0a402e1`.

## Caso adversarial independente

Foi extraído um checkout temporário de `aac16bca` com `git archive` e nele foi executada a suíte focal atual, sem alterar arquivo canônico. O caso monta o virtual scroller como `role: 'listbox'` sem nome, com pares incompatíveis (`listbox`/`listitem`), `itemRole` isolado e papel arbitrário `menu`. Esse caso é válido para separar a correção de E06-01 da mera tipagem estática: chamadas JavaScript/template dinâmico precisam falhar em runtime.

Comando:

```text
git archive aac16bca | tar -x -C /tmp/rev5-f14.t3Q9NJ
npx vitest run tests/adversarial/MaxBaseVirtualScroller.reference-adversarial.test.ts
```

Saída relevante da referência:

```text
Test Files  1 failed (1)
Tests  5 failed | 33 passed (38)
× rejeita listbox sem nome acessível como erro de contrato
  AssertionError: expected [Function] to throw an error
  [MaxBaseVirtualScroller] ... exige um nome acessível ... (console.warn)
× rejeita combinações incompatíveis de papel no container e nos itens
× rejeita itemRole sem um papel compatível no container
× rejeita papéis fora do contrato tipado em chamadas JavaScript
```

O quinto erro é uma asserção de leitura de arquivo, causada pela realocação deliberada da cópia adversarial para `tests/adversarial`; não faz parte do caso F14. Os quatro cenários de contrato acima falham de forma independente no commit de referência.

## Teste do HEAD atual

```text
$ npx vitest run tests/components/base/MaxBaseVirtualScroller.test.ts
Test Files  1 passed (1)
Tests  38 passed (38)
Duration  1.31s
```

Logo, a validação de runtime para nome ausente e combinações arbitrárias está efetivamente coberta pelo teste focal atual.

Porém, o contrato da Etapa 4 exige explicitamente **listbox real em Chromium, axe e virtualização/active-descendant durante scroll**. A tentativa de Chromium no HEAD falhou antes de executar qualquer teste:

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/MaxBaseVirtualScroller.browser.ts
Unhandled Error: browserType.launch: Executable doesn't exist at
.../.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
Test Files (1); Tests no tests; Errors 1 error
```

Além disso, a busca não encontrou integração de axe real nem a dependência:

```text
$ rg -n "axe-core|runAxe|axe\\(" package.json package-lock.json tests/browser tests/components/base/MaxBaseVirtualScroller.test.ts
(sem saída; código 1)
```

## Veredito

**REJEITADO.** A correção de contrato runtime refuta `aac16bca` e passa no unitário atual, mas F14 não pode receber aceite enquanto o cenário Chromium não executar e não houver auditoria `axe-core` real no listbox virtualizado. Isso é requisito expresso da Etapa 4, não uma lacuna cosmética de evidência.
