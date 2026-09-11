# Plano de Implementação: Programação Defensiva e Resiliência em Props contra Quebras em Tempo de Execução

## 1. Objetivo da Refatoração

Eliminar completamente as vulnerabilidades de quebra catastrófica em tempo de execução (*White Screen of Death* / *Uncaught TypeError*) causadas pela invocação direta de métodos de protótipo (`.filter()`, `.map()`, `.split()`, `.trim()`) sobre valores de props nulos, indefinidos, numéricos ou malformados originados de respostas assíncronas de APIs externas. O objetivo é:
1. Implementar checagens defensivas obrigatórias (`Array.isArray()`, `typeof === 'string'`) em todos os componentes identificados.
2. Contornar a limitação nativa do Vue 3 onde `withDefaults(defineProps<...>(), { ... })` não substitui valores explicitamente passados como `null` (ex.: `:items="null"` ou `:columns="null"` durante estados de loading de dados).
3. Garantir degradação graciosa (*graceful degradation*) e estabilidade de renderização no ecossistema sem lançar exceções não tratadas no runtime da aplicação consumidora.

---

## 2. Arquivos Afetados

### Componentes Vue:
- [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue) — Checagem de tipo string antes de `.split()` no watcher de `street`.
- [`src/components/MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserAvatar.vue) — Checagem de `typeof === 'string'` antes de `.trim()` e `.split()` nas iniciais do usuário.
- [`src/components/MaxBadgeButtonsGroup.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBadgeButtonsGroup.vue) — Normalização defensiva de `props.items` com fallback para array vazio antes de `.filter()`.
- [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue) — Validação com `Array.isArray()` para `columns` e `rawData`.
- [`src/components/MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue) — Normalização de colunas e lista com validação defensiva.
- [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue) — Validação de array em `modelValue` e tipagem de entrada em strings processadas.

### Arquivos de Teste Unitário:
- [`tests/components/MaxBadgeButtonsGroup.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxBadgeButtonsGroup.test.ts)
- [`tests/components/MaxUserAvatar.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxUserAvatar.test.ts)
- [`tests/components/MaxTable.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxTable.test.ts)
- [`tests/components/MaxChips.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/tests/components/MaxChips.test.ts)

---

## 3. Passo a Passo Detalhado da Implementação

### Passo 1: Blindagem de `MaxBadgeButtonsGroup.vue` contra Itens Nulos
1. Em [`src/components/MaxBadgeButtonsGroup.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxBadgeButtonsGroup.vue):
   - Criar propriedade computada defensiva para itens:
     ```typescript
     const safeItems = computed<MaxBadgeButtonsGroupItem[]>(() => {
         if (Array.isArray(props.items)) return props.items;
         return [];
     });
     ```
   - No template, substituir a iteração direta por `safeItems`:
     ```html
     <MaxBadgeButton
         v-for="item in safeItems"
         :key="item.value ?? item.label"
         ...
     />
     ```
   - Na função `handleItemClick`:
     Substituir `props.items.filter(...)` por:
     ```typescript
     const currentItems = safeItems.value.filter((it) => isItemSelected(it));
     ```
   - No hook `onMounted`:
     Substituir `props.items.filter(...)` por:
     ```typescript
     const initialItems = safeItems.value.filter((it) => {
         const itemVal = getItemValue(it);
         return defaults.some((d) => (typeof d === 'object' && d !== null ? (d.value ?? d) === it.value : d === itemVal || d === it.value));
     });
     ```

### Passo 2: Blindagem de String em `MaxInputTypeAddress.vue`
1. Em [`src/components/MaxInputTypeAddress.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxInputTypeAddress.vue):
   - Atualizar a função auxiliar `toSearchable`:
     ```typescript
     const toSearchable = (str: unknown): string => {
         if (typeof str !== 'string' || !str) return '';
         return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
     };
     ```
   - No watcher de `street`:
     ```typescript
     watch(street, () => {
         if (typeof street.value === 'string' && street.value.trim().length > 0) {
             const cleanStreet = street.value.trim();
             const parts = cleanStreet.split(/\s+/);
             const first_word = toSearchable(parts[0]);
             for (let item of listTypeAddress) {
                 if (item.values.includes(first_word)) {
                     if (inputValue.value !== item.value) {
                         inputValue.value = item.value;
                         emit('update:modelValue', item.value);
                     }
                     break;
                 }
             }
         }
     }, { immediate: true, deep: true });
     ```

### Passo 3: Blindagem de Tipos Mistos em `MaxUserAvatar.vue`
1. Em [`src/components/MaxUserAvatar.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxUserAvatar.vue):
   - Refatorar a computada `userInitials`:
     ```typescript
     const userInitials = computed(() => {
         if (typeof props.name !== 'string' || !props.name.trim()) return '';
         const cleanName = props.name.trim();
         const parts = cleanName.split(/\s+/);
         if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();

         return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
     });
     ```
   - Garantir que se `props.name` for um número ou objeto inesperado passado pelo consumidor, o componente retorne string vazia sem lançar exceção.

### Passo 4: Validação Rigorosa de Array em `MaxTable.vue`
1. Em [`src/components/MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTable.vue):
   - Em `resolvedColumns`:
     ```typescript
     const resolvedColumns = computed<ResolvedColumn[]>(() => {
         if (Array.isArray(props.columns) && props.columns.length > 0) {
             return props.columns.map((col) => ({
                 ...col,
                 sortable: col.sortable !== undefined && col.sortable !== false,
                 bodySlot: (slots as any)[col.slot ?? col.field ?? '']
             }));
         }

         if (!slots.default) return [];
         return extractColumnsFromVNodes(slots.default());
     });
     ```
   - Em `rawData`:
     ```typescript
     const rawData = computed<any[]>(() => {
         const list = props.value ?? props.data ?? attrs.value;
         if (Array.isArray(list)) return list;
         return [];
     });
     ```

### Passo 5: Normalização Defensiva em `MaxTableFields.vue`
1. Em [`src/components/MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxTableFields.vue):
   - Em `safeColumns`:
     ```typescript
     const safeColumns = computed<MaxTableColumn[]>(() => {
         if (Array.isArray(props.columns)) return props.columns;
         return [];
     });
     ```
   - Em `normalizedList`:
     ```typescript
     const normalizedList = computed<any[]>(() => {
         if (!props.list) return [];
         if (Array.isArray(props.list)) return props.list;
         if (typeof props.list === 'object' && props.list !== null) {
             return Object.entries(props.list).map(([key, val]) => {
                 if (typeof val === 'object' && val !== null && !val.id && !val.uuid && !val.ulid) {
                     return { ...val, _recordKey: key };
                 }
                 return val;
             });
         }
         return [];
     });
     ```

### Passo 6: Defensividade em Múltiplos Chips em `MaxChips.vue`
1. Em [`src/components/MaxChips.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-01204f01/src/components/MaxChips.vue):
   - Em `addMultipleChips`:
     ```typescript
     function addMultipleChips(texts: string[]) {
         if (!Array.isArray(texts)) return;
         let currentList = [...itemsList.value];
         for (const raw of texts) {
             if (typeof raw !== 'string') continue;
             const text = raw.trim();
             if (!text) continue;
             ...
         }
     }
     ```
   - Em `addChip`:
     ```typescript
     function addChip(rawText?: string) {
         const rawCandidate = rawText !== undefined ? rawText : (inputValue.value || inputRef.value?.value || '');
         const textToProcess = typeof rawCandidate === 'string' ? rawCandidate : String(rawCandidate ?? '');
         const text = textToProcess.trim();
         ...
     }
     ```

---

## 4. Padrões de Estabilidade e Convenções do GEMINI.md

1. **Princípio da Falha Graciosa (*Graceful Degradation*)**: Componentes do design system nunca devem colapsar toda a árvore DOM por inconsistências de payload de entrada.
2. **Imutabilidade e Tipagem**: Preservar a assinatura TypeScript original enquanto se adicionam guardas de tipo (*type narrowing*) no corpo do `<script setup>`.
3. **Formatação Canônica**: Indentação de 4 espaços, aspas simples, ponto e vírgula obrigatório.

---

## 5. Critérios de Aceite e Verificação Técnica

1. **Testes de Estresse com Dados Inválidos (*Edge Cases*)**:
   - `MaxBadgeButtonsGroup`:
     - Montar com `:items="null"` e `:default="'ativo'"` -> deve renderizar container vazio sem lançar `TypeError: Cannot read properties of null`.
     - Montar com `:items="undefined"` -> não lança erro.
   - `MaxUserAvatar`:
     - Montar com `:name="null"` -> renderiza sem iniciais e sem erro.
     - Montar com `:name="12345"` (número) -> não lança erro.
     - Montar com `:name="{ id: 1 }"` (objeto) -> não lança erro.
   - `MaxInputTypeAddress`:
     - Montar com `:street="123"` ou `attrs.street = null` -> watcher executa sem disparar `split is not a function`.
   - `MaxTable`:
     - Montar com `:columns="null"` e `:value="null"` -> exibe estado vazio/corpo da tabela sem erro.
2. **Execução de Testes e Checagens**:
   ```bash
   npx vitest run tests/components/MaxBadgeButtonsGroup.test.ts tests/components/MaxUserAvatar.test.ts tests/components/MaxTable.test.ts tests/components/MaxChips.test.ts
   npm test
   npm run type-check
   npm run lint
   ```
   Todos devem passar com 100% de aprovação.

---

## 6. Mitigação de Riscos de Regressão

1. **Sem Alteração para Cenários Válidos**:
   - Arrays legítimos continuam sendo filtrados, mapeados e manipulados da mesma forma; as verificações apenas atuam como filtro de segurança quando o dado recebido for anômalo.
2. **Transparência de API**:
   - Nenhuma prop foi renomeada ou removida, mantendo compatibilidade retroativa total com todos os formulários e telas do ecossistema Max.
