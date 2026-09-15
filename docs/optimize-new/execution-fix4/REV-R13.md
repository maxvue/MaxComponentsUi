# Relatório de Refutação Adversária Independente — Bloco R13 / F20

- **Subagente:** `REV-R13` (Grupo B de Refutação Independente)
- **ID da Plataforma:** `01339f4e-e511-463c-b779-decf85b785ab`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início:** 2026-09-15T11:24:00-03:00
- **Término:** 2026-09-15T11:35:00-03:00
- **Veredito:** **ACEITO**

---

## 1. Escopo Auditado e Requisitos

A auditoria adversária foi conduzida estritamente dentro da worktree isolada:
`/home/johnattas/GitHub/MaxComponentsUi/.worktrees/wt-fix4`

Requisitos auditados para o Bloco **R13 / F20** (conforme `docs/optimize-new/instructions_to_implementation_fix4.md`, `IMP-R13.md` e achado de usabilidade):
1. Imposição irrestrita e explícita de `scope="col"` em **todos** os elementos `<th>` de `MaxTable` e `MaxTableFields` (incluindo colunas sem campo, cabeçalho de botões `#buttons` e cabeçalhos customizados).
2. Estabilidade de nome acessível via `aria-label` mesmo quando o `#header` slot estiver completamente vazio (não pode colapsar para string vazia ou quebrar a árvore de acessibilidade).
3. Acionamento de ordenação por teclado: disparar sucessivos Enter e Espaço reais com emissão estritamente única por evento físico, provando resiliência contra cliques sintéticos residuais despachados pelo browser (`keyboardTriggerPending` e `.stop.prevent`).
4. Ciclo completo de ordenação e acessibilidade: transição determinística entre `aria-sort="none"`, `aria-sort="ascending"` e `aria-sort="descending"`, com persistência correta e emissão compatível com `@sort`.

---

## 2. Inspeção Detalhada do Código e Diff

### 2.1 `src/components/MaxTable.vue`
- **`scope="col"` e `aria-label`**:
  - No modo Data-Driven, cada `<th>` gerado para colunas declarativas contém explicitamente `scope="col"`, `:aria-sort="getAriaSort(col)"` e `:aria-label="getHeaderAriaLabel(col)"`.
  - A coluna de ações `th.max-table-th-buttons` possui explicitamente `scope="col"` e `:aria-label="props.headerButton?.trim() || 'Ações'"`.
  - O helper `getHeaderAriaLabel(col)` garante fallback determinístico `col.header?.trim() || col.field?.trim() || 'Coluna'`.
  - O helper `getSortButtonAriaLabel(col)` para o botão de ordenação interno garante fallback não vazio: `col.header?.trim() || col.field?.trim() || 'Ordenar coluna'`.
- **Prevenção de Duplicação e Teclado Nativo**:
  - Manipuladores `@keydown.enter.prevent.stop="onHeaderKeydown(col, $event)"` e `@keydown.space.prevent.stop="onHeaderKeydown(col, $event)"` no botão e no próprio `th`.
  - Implementação da flag transiente `keyboardTriggerPending`: ao processar um evento de teclado físico (Enter/Espaço), a flag é setada e limpa assincronamente via `setTimeout(..., 0)`.
  - Em `onThClick` e `onHeaderClick`, se `keyboardTriggerPending` for verdadeiro, o clique residual gerado pelo navegador após `keydown` é descartado, evitando dupla emissão e reversão inadvertida da ordenação.

### 2.2 `src/components/MaxTableFields.vue`
- Células `<th>` regulares recebem `scope="col"` e `:aria-label="col.header?.trim() || col.field?.trim() || 'Coluna'"`.
- Célula `<th>` de ações recebe `scope="col"` e `:aria-label="props.headerButton?.trim() || 'Ações'"`.
- Botões de incremento/decremento receberam rótulos acessíveis explícitos (`aria-label`).

---

## 3. Testes Adversariais e Evidências

### 3.1 Verificação de `scope="col"` e Nome Acessível com Slots Vazios
- **Cenário Adversarial:** Montagem de `MaxTable` com combinações hostis:
  - Header slot retornando array vazio `[]` ou `null`.
  - Coluna sem prop `header` e sem prop `field`.
  - Colunas com strings contendo apenas whitespace (`header="  "`, `headerButton="   "`).
- **Resultado:**
  - Em todos os casos, 100% dos `<th>` renderizaram com `scope="col"`.
  - Nenhum elemento `<th>` ou botão de ordenação permaneceu sem nome acessível ou com string em branco; todos resolveram para os fallbacks canônicos (`'Nome'`, `'role'`, `'Coluna'`, `'Ações'`, `'Ordenar coluna'`).

### 3.2 Verificação de Acionamento por Teclado e Bloqueio de Clique Residual
- **Cenário Adversarial:** No Chromium real e no Vitest:
  - Disparo de `keydown` com `key: 'Enter'`, imediatamente seguido do despacho de `MouseEvent('click')` (comportamento nativo do agente de usuário ao acionar botões).
  - Disparo de `keydown` com `key: ' '` (Espaço), imediatamente seguido de `click`.
- **Resultado:**
  - Cada evento de teclado disparou exatamente **uma** alteração de ordenação e emitiu **uma** vez o evento `@sort`.
  - O clique residual foi devidamente neutralizado pelo guard `keyboardTriggerPending`, impedindo inversão ou pulo de estado.

### 3.3 Ciclo Completo de `aria-sort`
- **Ciclo:**
  1. Estado inicial: `aria-sort="none"` (sem emissão).
  2. 1º acionamento (Enter): `aria-sort="ascending"`, `sortOrder: 1` (1 emissão, dados ordenados A-Z).
  3. 2º acionamento (Espaço): `aria-sort="descending"`, `sortOrder: -1` (2ª emissão, dados invertidos Z-A).
  4. 3º acionamento (Enter): `aria-sort="none"`, `sortOrder: 0`, `sortField: ''` (3ª emissão, ordenação limpa).

---

## 4. Execução dos Gates Oficiais

### 4.1 Vitest Unitário (`tests/components/MaxTable.test.ts`)
```bash
npx vitest run tests/components/MaxTable.test.ts
```
**Resultado:**
```
✓ tests/components/MaxTable.test.ts (42 tests) 214ms
Test Files  1 passed (1)
     Tests  42 passed (42)
```

### 4.2 Vitest Chromium Browser (`tests/browser/MaxTableSortAccessibility.browser.ts`)
```bash
npx vitest run --config vitest.browser.config.ts tests/browser/MaxTableSortAccessibility.browser.ts
```
**Resultado:**
```
✓ |chromium| tests/browser/MaxTableSortAccessibility.browser.ts (2 tests) 189ms
Test Files  1 passed (1)
     Tests  2 passed (2)
```

### 4.3 Type-check
```bash
npm run type-check
```
**Resultado:**
```
vue-tsc --noEmit (0 erros, código de saída 0)
```

### 4.4 Linters e Regressão Lateral
- `npx eslint src/components/MaxTable.vue src/components/MaxTableFields.vue tests/components/MaxTable.test.ts tests/browser/MaxTableSortAccessibility.browser.ts`: 0 erros e 0 avisos.
- `npx vitest run tests/components/MaxTableFields.test.ts`: 36 passed (36).
- `npx vitest run tests/architecture/tableAnatomyConsistency.test.ts`: 14 passed (14).

---

## 5. Conclusão da Refutação

A implementação realizada por `IMP-R13` é sólida, robusta contra anomalias de acessibilidade e resistente a duplicidade de disparos de teclado no Chromium real.
Nenhuma das hipóteses de refutação adversária encontrou falhas.

**Veredito:** **ACEITO**
