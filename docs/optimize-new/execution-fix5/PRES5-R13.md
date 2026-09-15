# Relatório de preservação — R13 / F20

- **Papel:** `PRES5-R13`
- **Agente:** `/root/pres5_r13`
- **Parent ID:** `/root`
- **Início:** `2026-09-15T17:49:00-03:00`
- **Término:** `2026-09-15T17:50:25-03:00`
- **HEAD auditado:** `f16437fd4f4ef74d05ca4c536c3aa359ee454fe3`
- **Modo:** somente leitura; não houve alteração em código de produção.
- **Veredito:** **ACEITO**

## Escopo exclusivo

Preservação de R13/F20: cabeçalhos de tabela semânticos com `scope="col"`, nome acessível estável inclusive para slots de cabeçalho vazios e ordenação por Enter/Espaço sem emissão duplicada, com ciclo correto de `aria-sort`.

## Evidência inspecionada

- `src/components/MaxTable.vue` mantém `scope="col"`, rótulos determinísticos (`header`, `field`, `Coluna` e `Ações`) e botão nativo `type="button"` para cabeçalhos ordenáveis.
- O clique residual após o teclado é bloqueado por `keyboardTriggerPending`; o botão interrompe a propagação para que o `<th>` não processe uma segunda ordenação.
- `src/components/MaxTableFields.vue` mantém `scope="col"` e nomes acessíveis com os mesmos fallbacks nas colunas e na coluna de ações.

## Execuções independentes

```bash
npm exec vitest run tests/components/MaxTable.test.ts tests/components/MaxTableFields.test.ts
```

Saída relevante:

```text
Test Files  2 passed (2)
     Tests  78 passed (78)
```

```bash
npx vitest run --config vitest.browser.config.ts tests/browser/MaxTableSortAccessibility.browser.ts
```

Saída relevante:

```text
Test Files  1 passed (1)
     Tests  2 passed (2)
```

O cenário Chromium cobre slots vazios, todos os `<th>`, foco no botão nativo, Enter, Espaço, ordenação visual, ciclo `none → ascending → descending → none` e clique sintético no mesmo tick, mantendo uma emissão por interação de teclado.

```bash
npm run type-check -- --pretty false
```

Saída: código de saída `0`.

## Conclusão

As verificações focais unitárias, de navegador real e de tipos preservam o comportamento aceito de R13/F20. Não foi encontrada regressão no HEAD auditado.
