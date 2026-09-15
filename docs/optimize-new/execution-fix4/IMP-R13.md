# Relatório de Implementação — Bloco R13 / F20

- **Subagente:** `IMP-R13` (Grupo A de Implementação)
- **ID da Plataforma:** `fc0ec652-0885-46b7-b32e-2a9f8badfbff`
- **Parent ID:** `97db74f2-d994-4291-b55b-2b4eff908ba2`
- **Início:** 2026-09-15T10:54:24-03:00
- **Término:** 2026-09-15T11:22:00-03:00
- **Status:** CONCLUÍDO COM SUCESSO

---

## 1. Escopo e Objetivos

O bloco **R13 / F20** (tabela sem escopo/nome e sem teclado browser) exige:
1. Impor rigorosamente `scope="col"` em todos os elementos de cabeçalho `<th>` de `MaxTable` (incluindo colunas normais, sortable e coluna de botões de ação `#buttons`).
2. Garantir nome acessível estável mesmo quando o `header` slot estiver vazio, aplicando fallback estável da propriedade `header`/`field` ou rótulo contextual.
3. Acionamento de ordenação por teclado: exatamente uma ordenação e uma emissão do evento `@sort` por evento real de Enter ou Espaço, sem disparos duplicados (mesmo diante de clique residual sintético despachado pelo navegador).
4. Exposição precisa dos atributos de acessibilidade: `aria-sort="ascending"` / `aria-sort="descending"` / `aria-sort="none"` no elemento `<th>`.
5. Testes automatizados rigorosos no Vitest e no Chromium real com eventos de teclado e DOM reais.

---

## 2. Arquivos Modificados e Criados

| Arquivo | Ação | Descrição |
|---|---|---|
| `src/components/MaxTable.vue` | Modificado | Inclusão de `scope="col"` e `:aria-label="getHeaderAriaLabel(col)"` em todos os `<th>`; suporte a `keydown.enter` e `keydown.space` com `.prevent.stop` e flag `keyboardTriggerPending` anti-duplicação temporal; fallback robusto de rótulo para botões e slots vazios. |
| `src/components/MaxTableFields.vue` | Modificado | Adicionado `scope="col"` e `:aria-label` nas células de cabeçalho `<th>` normais e na coluna de ações. |
| `tests/components/MaxTable.test.ts` | Modificado | Adicionados 3 novos testes unitários focais cobrindo: `scope="col"` universal, estabilidade de nome acessível com slots vazios e ordenação por Enter/Espaço reais com ciclo `aria-sort` e prevenção de disparo duplo. |
| `tests/browser/MaxTableSortAccessibility.browser.ts` | Criado | Suíte de testes no Chromium real testando `scope="col"`, fallback de accessible name e acionamento real por Enter/Espaço no DOM com verificação de reordenação visual. |

---

## 3. Diffs Essenciais

### `src/components/MaxTable.vue`
```diff
@@ -67,7 +67,10 @@
                                     ]"
                                     :style="getColumnStyle(col)"
                                     :aria-sort="getAriaSort(col)"
+                                    :aria-label="getHeaderAriaLabel(col)"
                                     @click="onThClick(col, $event)"
+                                    @keydown.enter.prevent.stop="onThKeydown(col, $event)"
+                                    @keydown.space.prevent.stop="onThKeydown(col, $event)"
                                     scope="col"
                                 >
                                     <button
                                         v-if="col.sortable"
                                         type="button"
                                         class="max-table-header-button"
-                                        @click="onHeaderClick(col)"
-                                        :aria-label="col.header || col.field || 'Ordenar coluna'"
+                                        @click.stop="onHeaderClick(col, $event)"
+                                        @keydown.enter.prevent.stop="onHeaderKeydown(col, $event)"
+                                        @keydown.space.prevent.stop="onHeaderKeydown(col, $event)"
+                                        :aria-label="getSortButtonAriaLabel(col)"
                                     >
@@ -104,7 +104,13 @@
                                         </div>
                                     </div>
                                 </th>
-                                <th v-if="slots.buttons" class="max-table-th max-table-th-buttons max-table-column p-column" :style="buttonsColumnStyle">
+                                <th
+                                    v-if="slots.buttons"
+                                    class="max-table-th max-table-th-buttons max-table-column p-column"
+                                    :style="buttonsColumnStyle"
+                                    scope="col"
+                                    :aria-label="props.headerButton?.trim() || 'Ações'"
+                                >
```

```diff
@@ -576,8 +576,46 @@
     watch(() => props.sortField, (v) => { sortField.value = v ?? null; });
     watch(() => props.sortOrder, (v) => { sortOrder.value = v ?? 1; });

+    let keyboardTriggerPending = false;
+
+    function getHeaderAriaLabel(col: ResolvedColumn): string {
+        return col.header?.trim() || col.field?.trim() || 'Coluna';
+    }
+
+    function getSortButtonAriaLabel(col: ResolvedColumn): string {
+        const name = col.header?.trim() || col.field?.trim();
+        return name || 'Ordenar coluna';
+    }
+
+    function onHeaderKeydown(col: ResolvedColumn, event: KeyboardEvent) {
+        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
+            keyboardTriggerPending = true;
+            onHeaderClick(col);
+            setTimeout(() => {
+                keyboardTriggerPending = false;
+            }, 0);
+        }
+    }
+
+    function onThKeydown(col: ResolvedColumn, event: KeyboardEvent) {
+        if ((event.target as HTMLElement)?.closest?.('.max-table-header-button')) return;
+        if (event.key === 'Enter' || event.key === ' ' || event.code === 'Space') {
+            keyboardTriggerPending = true;
+            onHeaderClick(col);
+            setTimeout(() => {
+                keyboardTriggerPending = false;
+            }, 0);
+        }
+    }
+
+    function onThClick(col: ResolvedColumn, event: MouseEvent) {
+        if ((event.target as HTMLElement)?.closest?.('.max-table-header-button')) return;
+        if (keyboardTriggerPending) return;
+        onHeaderClick(col, event);
+    }
+
-    function onHeaderClick(col: ResolvedColumn) {
+    function onHeaderClick(col: ResolvedColumn, event?: MouseEvent) {
         if (!col.sortable || !col.field) return;
+        if (keyboardTriggerPending && event) return;
```

---

## 4. Evidências de Testes e Validação

### 4.1 Vitest Unitário (`tests/components/MaxTable.test.ts`)
Comando: `npx vitest run tests/components/MaxTable.test.ts`
Resultado:
```
✓ tests/components/MaxTable.test.ts (42 tests) 229ms
  ✓ MaxTable (42)
    ✓ Modo Data-Driven com MaxTableColumn (14)
      ✓ ordena registros client-side ao clicar no cabeçalho sortable
      ✓ cabeçalho sortable insere botão nativo .max-table-header-button, aria-sort no th, ícone aria-hidden e responde a ativação nativa por clique/teclado (F20 / E08-05)
      ✓ garante exatamente uma ordenação por interação no cabeçalho sortable sem duplicação de ativação (F20 / E08-05)
      ✓ impõe rigorosamente scope="col" e aria-label estável em todos os elementos th (incluindo botões e slots)
      ✓ garante nome acessível estável mesmo quando o header slot estiver vazio
      ✓ aciona ordenação por teclado via Enter e Espaço reais com exatamente uma emissão e ciclo aria-sort (F20 / R13)
      ✓ emite evento @sort em modo lazy sem ordenar localmente
      ...
Test Files  1 passed (1)
     Tests  42 passed (42)
```

### 4.2 Chromium Real (`tests/browser/MaxTableSortAccessibility.browser.ts`)
Comando: `npm run test:browser -- tests/browser/MaxTableSortAccessibility.browser.ts`
Resultado:
```
✓ |chromium| tests/browser/MaxTableSortAccessibility.browser.ts (2 tests) 194ms
  ✓ MaxTable no Chromium real — Acessibilidade e Ordenação por Teclado (R13 / F20) (2)
    ✓ impõe scope="col" e aria-label em todos os th e garante nome estável mesmo com slot de header vazio 28ms
    ✓ ordena por teclado com Enter e Espaço reais no Chromium, validando aria-sort e ordenação visual do DOM 164ms

Test Files  1 passed (1)
     Tests  2 passed (2)
```

### 4.3 Type-check e Linters
- `npm run type-check`: 0 erros (vue-tsc --noEmit passou limpo).
- `npx eslint src/components/MaxTable.vue src/components/MaxTableFields.vue tests/components/MaxTable.test.ts tests/browser/MaxTableSortAccessibility.browser.ts`: 0 erros e 0 warnings.
- `npx stylelint "src/components/MaxTable.vue" "src/components/MaxTableFields.vue"`: 0 erros.

---

## 5. Riscos e Rollback
- **Risco:** Incompatibilidade com personalizações externas de slots de cabeçalho.
- **Mitigação:** Preservado o comportamento padrão de renderização de slots de cabeçalho com fallback não-invasivo de acessibilidade (`aria-label`) e isolamento de eventos via `.stop` e flags transientes.
- **Rollback:** Reverter alterações de `src/components/MaxTable.vue` e `src/components/MaxTableFields.vue` via `git restore`.
