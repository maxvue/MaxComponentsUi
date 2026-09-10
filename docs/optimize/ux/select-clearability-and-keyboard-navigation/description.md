# Impossibilidade de Limpar Seleção e Falta de Navegação por Teclado no Select (`MaxInputSelect`)

## Contexto e Componentes Afetados
- **Componentes:** `MaxInputSelect.vue`.
- **Categoria:** Inputs e formulários / Affordance e usabilidade.
- **Severidade:** Alta.
- **Heurística Violada:** Nielsen #3 (Controle e Liberdade do Usuário) e Nielsen #7 (Flexibilidade e Eficiência de Uso).

---

## Descrição do Problema

O componente [`MaxInputSelect.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue) é amplamente utilizado em filtros de pesquisa e preenchimento de dados de formulários. Dois problemas críticos de usabilidade foram constatados:

1. **Impossibilidade de Limpar / Desfazer a Seleção:**
   Após o usuário selecionar qualquer opção na lista suspensa, **não existe nenhum mecanismo para desmarcar ou limpar o valor** (como um botão "X" de limpar / prop `showClear` / `clearable`).
   Em filtros de consulta (ex.: "Filtrar por Status", "Filtrar por Categoria"), uma vez que o usuário aplica um filtro, ele fica permanentemente preso a uma das opções, sendo incapaz de retornar ao estado de "Todos" ou `null`, a menos que o desenvolvedor tenha manualmente inserido uma opção artificial `{ label: 'Nenhum', value: null }` no array de opções.

2. **Ausência de Navegação por Setas no Menu Aberto:**
   Embora o gatilho possua listeners `@keydown.down.prevent="toggle"` para abrir o dropdown, uma vez que o painel flutuante está aberto:
   - As teclas `ArrowDown` e `ArrowUp` **não navegam** entre os itens da lista.
   - O item focado não recebe destaque visual de foco.
   - Pressionar `Enter` não seleciona o item destacado.
   O único listener global ativo no `onKeydown` é a tecla `Escape` (para fechar o painel). Usuários que dependem do teclado para navegar em formulários ficam bloqueados de selecionar opções sem o mouse.

---

## Evidência no Código

1. [`MaxInputSelect.vue:37-40`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L37-L40):
   ```html
   <div class="p-select-dropdown" aria-hidden="true">
       <MaxIcon icon="lucide:chevron-down" size="1" />
   </div>
   ```
   Apenas o ícone de chevron para baixo é renderizado. Não há renderização condicional de ícone de limpeza (`times`/`close`) quando há valor selecionado.
2. [`MaxInputSelect.vue:397-408`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L397-L408):
   ```ts
   const onKeydown = (event: KeyboardEvent) => {
       if (event.key === 'Escape' && isOpen.value) hide();
   };
   ```
   O listener de teclado trata apenas `Escape`, ignorando a navegação por itens (`ArrowDown`, `ArrowUp`, `Enter`, `Home`, `End`).

---

## Impacto na Experiência do Usuário (UX)

1. **Aprisionamento em Filtros:** Usuários em telas de busca e listagem são obrigados a recarregar a página (F5) para conseguir desfazer um filtro aplicado por engano.
2. **Inconsistência Operacional:** Quase todos os Design Systems modernos (PrimeVue, Vuetify, Element Plus) oferecem o botão de "limpar seleção" como recurso essencial em caixas de seleção opcionais.
3. **Quebra de Acessibilidade de Teclado:** A impossibilidade de descer e subir na lista com as setas do teclado viola os requisitos básicos de acessibilidade W3C Combobox.

---

## Recomendações de Solução

1. **Adicionar Suporte a `showClear` / `clearable`:**
   - Adicionar a prop `clearable?: boolean` ou `showClear?: boolean` (default `true` para campos não obrigatórios).
   - Quando houver valor selecionado (`hasSelectedOption`) e o campo estiver em hover ou focado, exibir um ícone de "X" antes ou no lugar do chevron. Ao clicar no "X", definir `temp_value.value = null` e emitir evento de limpeza.
2. **Navegação por Teclado na Lista:**
   - Implementar um índice reativo de item focado (`focusedIndex`).
   - No evento `ArrowDown`, incrementar `focusedIndex` e aplicar `scrollIntoView({ block: 'nearest' })` no elemento da lista correspondente.
   - No evento `Enter`, executar `selectOption(filteredOptions[focusedIndex])`.
