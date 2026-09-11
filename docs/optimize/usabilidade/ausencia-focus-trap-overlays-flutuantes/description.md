# Ausência de Focus Trap, Rastreamento e Restauração de Foco em Overlays Flutuantes e Seletores Descentralizados

## Severidade: Alta

## Componentes Impactados
- `src/components/MaxInputDatePicker.vue`
- `src/components/MaxInputSelect.vue`
- `src/components/MaxTagSelect.vue`
- `src/components/MaxInputIconPicker.vue`
- `src/components/MaxColorPicker.vue`
- `src/components/MaxInputAutoComplete.vue`
- `src/components/MaxInputAutoCompleteApi.vue`

---

## Sintoma Observado vs Causa Raiz Profunda

### Sintoma Observado
1. **Calendário Inacessível por Teclado (`MaxInputDatePicker`)**: Ao clicar ou focar no campo de data, o painel do calendário abre (teleportado para o final do `<body>`). Contudo, o cursor de foco do teclado permanece no `<input>` de texto. Se o usuário pressiona `Tab`, o foco avança para o próximo elemento do formulário atrás do calendário, ignorando totalmente os botões de navegação de mês/ano e a grade de seleção de dias. Usuários que dependem de teclado nunca conseguem navegar pela grade nem selecionar uma data pelo calendário.
2. **Vazamento de Tabulação (Falta de Focus Containment)**: Nos overlays de `MaxInputIconPicker`, `MaxInputSelect` e `MaxTagSelect`, a tabulação não fica restrita ao painel aberto. Ao pressionar `Tab` repetidamente, o foco sai do overlay flutuante e navega por links e botões ocultos sob o backdrop da página.
3. **Perda de Foco na Desmontagem**: Ao fechar o overlay via tecla `Escape` ou clique externo, o foco do navegador é transferido para o elemento raiz do documento (`<body>`), forçando o usuário que navega por teclado a reiniciar toda a tabulação da página do zero.

### Causa Raiz Profunda
Existe uma fragmentação de arquitetura no gerenciamento de overlays dentro da biblioteca:
- Enquanto componentes de diálogo de primeiro nível (`MaxModal.vue`, `MaxDrawer.vue`, `MaxPopoverConfirm.vue`, `MaxPdfView.vue`) integram o utilitário `useFocusTrap(el)` (que memoriza `previous = document.activeElement` e aprisiona a tecla `Tab`), **nenhum dos componentes de entrada de dados com popup/overlay teleportado para o `<body>` utiliza `useFocusTrap`**.
- No `MaxInputDatePicker.vue`:
  - O popup é montado no `<body>` via `<Teleport to="body" v-if="isOpen">`.
  - Existe uma função completa de navegação de grade por setas (`onGridKeydown`), porém o foco programático **nunca é transferido para a grade ou para o botão do dia selecionado**.
  - O watcher de `isOpen` apenas define `focusedCellIndex.value`, mas nunca invoca `.focus()` em nenhum elemento do DOM teleportado.
  - Não há manipulação de tecla de atalho no `<input>` (ex.: `Alt + ArrowDown` ou `ArrowDown`) para transferir intencionalmente o foco do campo de texto para o calendário.
- No `MaxInputIconPicker.vue`:
  - O drawer inferior teleportado para `body` (`max-icon-picker-drawer`) não possui `role="dialog"`, não tem `aria-modal="true"` e não confina a tecla `Tab`.

---

## Evidência Técnica com Trechos e Caminhos de Arquivo

### 1. `src/components/MaxInputDatePicker.vue` (Linhas 10–34 e 776–788)
O input abre o painel ao focar, mas a abertura não move o foco:

```vue
<!-- Trecho de src/components/MaxInputDatePicker.vue -->
<div ref="triggerEl" class="max-datepicker-wrapper">
    <input
        ref="inputElement"
        type="text"
        class="max-datepicker-input"
        :value="displayValue"
        v-maska="maskValue"
        :placeholder="props.placeholder ?? 'dd/mm/aaaa'"
        :disabled="props.disabled"
        @focus="open"
        @click="open"
        @blur="onBlur"
        @input="onInput"
        @change="onInputChange"
    />
</div>

<Teleport to="body" v-if="isOpen">
    <div class="max-datepicker-backdrop" @click="hide">
        <div
            ref="overlayEl"
            class="max-datepicker-panel"
            :style="{ top: position.top + 'px', left: position.left + 'px' }"
            @click.stop
        >
```

No script, o watcher do `isOpen` apenas calcula um índice interno, sem chamar `.focus()`:

```typescript
// Trecho de src/components/MaxInputDatePicker.vue
watch(isOpen, (open) => {
    if (typeof window !== 'undefined') if (open) window.addEventListener('keydown', onGlobalKeydown);
    else window.removeEventListener('keydown', onGlobalKeydown);

    if (open) {
        currentView.value = 'date';
        dayButtonRefs.value = [];
        nextTick(() => {
            const selectedIdx = calendarDays.value.findIndex((c) => isSelectedDate(c.date));
            if (selectedIdx >= 0) focusedCellIndex.value = selectedIdx;
            else {
                const firstDayIdx = calendarDays.value.findIndex((c) => c.isCurrentMonth && c.day === 1);
                focusedCellIndex.value = firstDayIdx >= 0 ? firstDayIdx : 0;
            }
            // FALHA: falta dayButtonRefs.value[focusedCellIndex.value]?.focus();
        });
    }
});
```

### 2. `src/components/MaxInputIconPicker.vue` (Linhas 32–47)
Drawer modal teleportado sem semântica ARIA de diálogo e sem focus trapping:

```vue
<!-- Trecho de src/components/MaxInputIconPicker.vue -->
<Teleport to="body" v-if="visible">
    <div class="max-icon-picker-drawer-backdrop" @click="visible = false">
        <!-- Falta role="dialog", aria-modal="true", trap.onKeydown -->
        <div class="max-icon-picker-drawer p-drawer-bottom" @click.stop>
            <div class="p-drawer-header">
                <span class="p-drawer-title">Escolha um ícone</span>
                <button
                    type="button"
                    class="p-drawer-close-button"
                    aria-label="Fechar seletor de ícones"
                    @click="visible = false"
                >
                    <MaxIcon i="mdi:close" size="1.2" />
                </button>
            </div>
```

---

## Impacto na Usabilidade e Conformidade com WCAG

| Critério WCAG | Nível | Descrição do Impacto |
|---|---|---|
| **2.1.1 Keyboard** | A | Falha: o calendário e painéis auxiliares não são totalmente operáveis por interface de teclado; elementos interativos teleportados tornam-se inalcançáveis na ordem de tabulação natural. |
| **2.1.2 No Keyboard Trap** | A | Risco: ausência de contenção estruturada e comportamento errático ao tentar sair de popups flutuantes. |
| **2.4.3 Focus Order** | A | Falha grave: a ordem de foco é rompida quando componentes teleportados no DOM não recebem nem devolvem o foco sequencialmente em relação ao gatilho original. |
| **4.1.2 Name, Role, Value** | A | Falha: painéis flutuantes que funcionam como diálogos não declaram `role="dialog"` ou `aria-modal="true"`. |

### Recomendações de Correção
1. Generalizar o uso do composable `useFocusTrap` ou de um `useOverlayFocusManager` para gerenciar todos os popups acoplados a inputs (`MaxInputDatePicker`, `MaxInputSelect`, `MaxTagSelect`, `MaxInputIconPicker`).
2. No `MaxInputDatePicker`:
   - Adicionar listener no input para `ArrowDown` ou `Enter` com foco explícito no primeiro dia navegável da grade.
   - Garantir que ao pressionar `Escape` ou selecionar um dia, o foco retorne imediatamente para o `<input>`.
3. No `MaxInputIconPicker`:
   - Adicionar `role="dialog"`, `aria-modal="true"` e foco inicial no input de pesquisa (`.picker-search-input`).
