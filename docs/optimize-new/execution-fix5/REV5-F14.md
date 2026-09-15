# REV5-F14 — Refutação independente de E06-01 e E06-02

## Identidade

- Papel/agente: `REV5-F14` / `/root/rev5_f14_retry` (revalidação do mesmo papel).
- Início original: `2026-09-15T14:29:00-03:00`.
- Revalidação: `2026-09-15T16:19:35-03:00`.
- Fim da revalidação: `2026-09-15T16:19:37-03:00`.
- Worktree somente leitura: `/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-optimize-fix5`.
- Referência adversarial: `aac16bca`.
- HEAD adversarial original: `925b8bf1b74fc3e187f12664b784f974e0a402e1`.
- HEAD revalidado: `bac90d8c85e146fc206405014bba88ce08c6ef1e`.

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

## Revalidação obrigatória no Chromium real

No HEAD `bac90d8c`, o cenário agora existe em
`tests/browser/MaxBaseVirtualScroller.browser.ts` e usa o pacote oficial
`axe-core@4.11.0`, não um helper local. Ele monta `MaxBaseVirtualScroller`
como `role="listbox"`, com nome acessível, **10.000** opções e viewport de
200 px; executa as regras ARIA do axe, move o descendente ativo por teclado,
faz scroll para `scrollTop=4000` e confirma que o elemento ativo desmontado
some tanto do DOM quanto de `aria-activedescendant`.

Comando executado independentemente:

```text
npx vitest run --config vitest.browser.config.ts tests/browser/MaxBaseVirtualScroller.browser.ts
```

Saída integral relevante:

```text
RUN  v4.1.11 /home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-optimize-fix5

Test Files  1 passed (1)
Tests  1 passed (1)
Duration  1.49s (transform 0ms, setup 6ms, import 564ms, tests 95ms, environment 0ms)
```

O único aviso foi do próprio Vitest ao escolher outra porta porque `63315`
estava ocupada; não houve warning da aplicação, violação axe nem erro do
Chromium.

## Veredito

**ACEITO.** O caso adversarial original falha em `aac16bca`; no HEAD
`bac90d8c`, contrato runtime, listbox real em Chromium, `axe-core` oficial e
virtualização/`aria-activedescendant` durante scroll de 10 mil itens foram
executados e aprovados de forma independente.
