# REV5-R08 — refutação independente de E04-05

## Identidade

- Papel: `REV5-R08` — refutação somente leitura de R08/E04-05.
- Agente: `/root/rev5_r08`; parent: `/root`.
- Início: `2026-09-15T14:48:11-03:00`; fim: `2026-09-15T14:49:54-03:00`.
- HEAD auditado: `8ee9e0bc25f3a7f82fd516ffd93b2777a1621eed`.
- Referência adversarial: `aac16bca`.
- Manifesto próprio: este relatório e a linha `REV5-R08` em `MATRIZ_ORQUESTRACAO.md`. Nenhum arquivo de produção ou teste rastreado foi alterado.

## Caso adversarial e reprodução na referência

Foi copiado apenas para uma worktree temporária descartada o cenário Chromium já presente no HEAD auditado; a referência ficou destacada em `aac16bca` e usou os mesmos `node_modules`. O cenário exige que `aria-labelledby` preserve, na ordem, IDREFs existentes cujo alvo esteja oculto por CSS ou dentro de ancestral `inert`, e executa `axe-core` real.

```text
$ ./node_modules/.bin/vitest run --config vitest.browser.config.ts tests/browser/useAccessibleName.browser.ts
RUN  v4.1.11 /tmp/rev5-r08-…
❯ |chromium| tests/browser/useAccessibleName.browser.ts (5 tests | 3 failed)
Expected: "el-css-display el-css-vis el-css-ok"
Received: "el-css-ok"
Expected: "title-inside-inert"
Received: undefined
aria-dialog-name: diálogo sem nome em aria-labelledby="undefined"
Test Files  1 failed (1)
Tests  3 failed | 2 passed (5)
```

Logo, o caso é detectável contra `aac16bca`: a versão antiga removia IDREFs existentes por CSS/ancestral inerte e acabava produzindo um diálogo sem nome para o motor axe-core.

## Verificação independente no HEAD

```text
$ npx vitest run --config vitest.browser.config.ts tests/browser/useAccessibleName.browser.ts
Test Files  1 passed (1)
Tests  5 passed (5)

$ npx vitest run --config vitest.browser.config.ts tests/browser/axeCore.axe.browser.ts
Test Files  1 passed (1)
Tests  1 passed (1)

$ git diff --check
exit 0
```

O primeiro cenário usa Chromium real, verifica múltiplos IDREFs, `display: none`, `visibility: hidden` e ancestral `inert`; o `page.getByRole('dialog', { name })` confirma o nome calculado pelo navegador. Ele invoca diretamente `axe.run(...)`, limitado às regras `aria-dialog-name` e `aria-valid-attr-value`, sem usar o helper local como substituto. A mutação remove `aria-label` de um botão no mesmo DOM e o mesmo `axe-core` detecta `button-name`. O gate separado também usa `axe.run` e confirma a mutação de texto de botão.

## Veredito

**ACEITO.** E04-05 atende à preservação de múltiplos IDREFs, CSS e ancestrais e possui execução comprovada de `axe-core` real no Chromium, inclusive com mutação detectável. Risco residual: esta evidência é focal; o gate transversal `GATE5-BROWSER-AXE` continua obrigatório para o aceite global.
