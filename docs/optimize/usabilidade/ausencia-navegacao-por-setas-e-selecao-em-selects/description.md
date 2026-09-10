# Ausência de Navegação por Setas e Seleção por Teclado em MaxInputSelect e MaxTagSelect

## Descrição e Causa Raiz

### Problema
Nos componentes de seleção dropdown `MaxInputSelect.vue` e `MaxTagSelect.vue`, o gatilho principal declara semântica de combobox:
```html
<!-- MaxInputSelect.vue:7-19 -->
<div
    ref="triggerEl"
    class="p-select"
    :class="{ 'p-disabled': props.disabled, 'p-focus': isOpen }"
    tabindex="0"
    role="combobox"
    :aria-expanded="isOpen"
    @click.stop="toggle"
    @keydown.enter.prevent="toggle"
    @keydown.space.prevent="toggle"
    @keydown.down.prevent="toggle"
    @keydown.up.prevent="toggle"
>
```

Ao inspecionar o comportamento das teclas direcionais:
1. **Comportamento Incorreto de ArrowDown e ArrowUp:**
   Ambas as teclas estão ligadas a `.prevent="toggle"`.
   - Quando o dropdown está fechado, pressionar seta para baixo abre o overlay.
   - Porém, quando o dropdown já está aberto, pressionar seta para baixo executa novamente `toggle()`, **fechando imediatamente o menu**!
2. **Impossibilidade de Navegar entre Opções (WCAG 2.1.1 e WAI-ARIA Combobox Pattern):**
   O padrão WAI-ARIA para `role="combobox"` / `role="listbox"` exige que as setas para baixo e para cima movimentem o foco ativo entre os itens (`role="option"`), utilizando ou roving tabindex (`tabindex="0"` no item focado e `-1` nos demais) ou o atributo `aria-activedescendant="id_opcao_focada"`.
   Como nenhum desses mecanismos está implementado, o usuário que depende de teclado fica completamente impossibilitado de percorrer as opções da lista e pressionar `Enter` para selecionar uma opção.
3. **Falta de Associação ARIA entre Combobox e Listbox:**
   O combobox não possui `aria-controls` ou `aria-haspopup="listbox"`, e o overlay `role="listbox"` não tem um ID único vinculado ao gatilho.
4. **Altura Reduzida de Itens para Touch/Mobile (WCAG 2.5.8):**
   A prop `listHeight` possui o valor padrão de `27px` ([`MaxInputSelect.vue:216`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L216)). Em smartphones e tablets, um item de 27px de altura em uma lista com scroll gera frequentes erros de toque acidental no item vizinho, violando as recomendações de 36px a 44px para alvos de toque móvel.

## Localização no Código
- [`src/components/MaxInputSelect.vue:7-19, 44-50, 80-88, 107-116, 216`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSelect.vue#L7-L19)
- [`src/components/MaxTagSelect.vue:7-19, 78-85`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxTagSelect.vue#L7-L19)

## Proposta de Solução
1. Implementar gerenciamento de índice ativo (`highlightedIndex`) ao abrir a lista:
   - Seta para baixo: incrementa `highlightedIndex`, sem fechar o dropdown.
   - Seta para cima: decrementa `highlightedIndex`.
   - Tecla `Enter`: confirma a opção destacada em `highlightedIndex`.
   - Tecla `Escape`: fecha o dropdown e devolve o foco ao gatilho.
2. Adicionar `aria-activedescendant` no combobox apontando para o id da opção destacada.
3. Aumentar o padrão de `listHeight` para no mínimo `36px` ou `40px` para garantir conformidade com alvos de toque mobile.
