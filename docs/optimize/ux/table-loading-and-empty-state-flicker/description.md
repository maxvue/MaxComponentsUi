# Ausência de Estado de Loading e Falso Empty State em Tabelas (`MaxTable`, `MaxTableFields`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxTable.vue`, `MaxTableFields.vue`.
- **Categoria:** Tabelas e dados / Estados de feedback (loading, empty state).
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #1 (Visibilidade do Status do Sistema) e Nielsen #4 (Consistência e Padrões).

---

## Descrição do Problema

Tabelas de dados corporativas lidam predominantemente com requisições assíncronas (paginação, filtros, busca e carregamento de listas). No entanto, nem [`MaxTable.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue) nem [`MaxTableFields.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue) possuem suporte nativo à prop `loading`:

1. **Falso Empty State (Flicker) em `MaxTableFields`:**
   Nas linhas 84-90 de `MaxTableFields.vue`, quando a prop `list` inicia vazia (enquanto a requisição HTTP está em voo), o componente renderiza imediatamente o bloco de lista vazia:
   ```html
   <tr v-else class="max-table-fields-row max-table-fields-empty">
       <td :colspan="totalColspan" class="max-table-fields-td max-table-fields-empty-cell">
           <slot name="empty">
               {{ emptyMessage }}
           </slot>
       </td>
   </tr>
   ```
   O usuário visualiza a mensagem `"Nenhum registro encontrado"` durante 1 a 2 segundos até os dados chegarem, quando a mensagem é abruptamente substituída pelas linhas.

2. **Ausência Total de Empty State em `MaxTable`:**
   Em `MaxTable.vue`, não há prop `loading` nem bloco de fallback para lista vazia. Se não houver dados, o `<tbody>` fica completamente vazio, com o cabeçalho azul flutuando sobre uma caixa em branco, sem nenhuma indicação se os dados estão carregando ou se a tabela realmente está vazia.

---

## Evidência no Código

1. Em [`MaxTableFields.vue:113-137`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTableFields.vue#L113-L137), as props declaradas são: `list`, `columns`, `headerButton`, `id`, `dataKey`, `emptyMessage`, `buttonsWidth`, `buttons`. **Não há prop `loading`**.
2. Em [`MaxTable.vue:35-57`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTable.vue#L35-L57), nenhuma prop de dados ou loading é definida; a tabela depende puramente de slots.
3. Não há skeleton loader, spinner overlay ou mensagem de "Carregando dados..." nas tabelas.

---

## Impacto na Experiência do Usuário (UX)

1. **Desinformação e Ações Erradas:** O usuário vê "Nenhum registro encontrado", assume prematuramente que a busca não retornou resultados e clica em "Limpar filtros" ou fecha a tela antes que os dados terminem de chegar.
2. **Layout Shift e Tremor Visual:** A transição instantânea de um texto centralizado de lista vazia para 20 linhas de tabela causa um salto visual desconfortável (Cumulative Layout Shift - CLS).
3. **Falta de Feedback em Ações de Tabela:** Durante ordenação ou paginação de registros, a tabela não fornece nenhuma resposta tátil ou visual de que o próximo lote de dados foi solicitado.

---

## Recomendações de Solução

1. **Adicionar prop `loading?: boolean`:**
   - Em `MaxTableFields` e `MaxTable`, receber `:loading="isLoading"`.
2. **Exibir Esqueleto (Skeleton Rows) ou Overlay Semântico:**
   - Quando `loading === true`, substituir as linhas por 3 a 5 linhas de Skeleton (barras pulsantes simulando o formato dos dados) ou renderizar uma linha com spinner centralizado e texto `"Carregando registros..."`.
   - **Nunca exibir o empty state enquanto `loading` estiver ativo.**
3. **Empty State Completo em `MaxTable`:**
   - Padronizar em `MaxTable` um slot `#empty` com mensagem e ícone ilustrativo (`MaxEmptyDiv`), evitando tabelas "ocas" sem feedback.
