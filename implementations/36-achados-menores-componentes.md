# 36 — Achados menores em componentes (agrupado)

**Severidade:** Baixa
**Categoria:** Bugs menores / Limpeza

## MaxInputCep (`src/components/MaxInputCep.vue:2-3, 61-68`)
- Classe raiz `input-base-phone-mail-main-div` — copy-paste do PhoneMail, acopla o CEP ao CSS de outro componente.
- Máscara `'##.### - ###'` produz `12.345 - 678` (padrão correto: `12345-678`); o placeholder `00 . 000 - 000` nem bate com a máscara.
- `isDone`/`checkDone` escritos e nunca lidos — código morto.

## MaxInputSelect (`src/components/MaxInputSelect.vue:6, 33, 159-163`)
- `v-bind="{...props, ...attrs}"` repassa `modelValue`/`options`/`optionLabel` duplicados junto com o `v-model` — funciona só por ordem de declaração.
- Default aplicado via `watchDebounced` de 500ms: usuário que limpa o campo o vê "voltar sozinho" meio segundo depois.
- `option_selected` quebra se `loadOptions` retornar lista plana com `groupOptions` setado.
- `v-html` em labels de opção (ver achado 06).

## MaxInputSearch (`src/components/MaxInputSearch.vue:28-36`)
- Timer de debounce sem `clearTimeout` em `onUnmounted` (emit após desmontar).
- `search` só emitido com `length > 1` — limpar o campo nunca notifica o pai.
- `v-bind="attrs"` aplicado ao InputBase **e** ao InputText duplica atributos.

## Família credit-card (`MaxInputCreditCard.vue:63-68`, idem Cvv/Date)
- Watch de `props.modelValue` compara valor mascarado com desmascarado — eco do v-model reescreve o input e arrisca salto de cursor. Comparar `onlyNumbers(temp_value) !== onlyNumbers(modelValue)` (como `MaxInputCep:94-97`).

## MaxInputTextArea (`src/components/MaxInputTextArea.vue:84-90`)
- `minRows`/`minLines` (`string | number`) comparados com número sem normalizar — `min-rows="abc"` vira NaN silencioso. Normalizar com `Number()`.
- Dois `watch(temp_value)` separados que podiam ser um.

## MaxToast (`src/stores/useToast.Store.ts:96-104`)
- Barra de progresso usa `animationDuration` fixo; após pause/resume dessincroniza do `remaining` real (clampado em 500ms). Derivar do `remaining` ou documentar.

## MaxLogo (`src/components/MaxLogo.vue:19`)
- Default `src: 'get_file?file=logo.svg'` é URL relativa do backend do app consumidor — 404 por padrão numa lib genérica.
- Prop `rounded` declarada, mas o mixin SCSS nunca é incluído — sem efeito.

## MaxPopover/MaxPopoverConfirm (CSS)
- Ambos usam a classe global `.background-popover` com `z-index` diferentes (99 vs 3) em `<style>` não-scoped — o último carregado vence. Escopar/renomear.
