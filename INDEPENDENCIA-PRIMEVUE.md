# Independência do PrimeVue — Mapa de Componentes

> Contexto: a partir do PrimeVue 5, a lib deixará de ser open source. Este documento
> mapeia todos os componentes Vue da `@maxvue/max-components-ui`, suas dependências
> do PrimeVue e a dificuldade estimada de torná-los independentes.

## Resumo da estratégia

A peça central é o **`InputBase`**, que envolve quase todos os inputs e depende de 4
componentes PrimeVue (`FloatLabel`, `IconField`, `InputIcon`, `Message`). **Tornar o
`InputBase` independente primeiro destrava ~19 componentes de uma vez.** Depois disso, a
maioria dos inputs só precisa trocar o `InputText`/`Textarea` por um `<input>`/`<textarea>`
nativo estilizado.

Os bloqueadores reais são os widgets complexos: `DataTable`, `DatePicker`, `Select`,
`AutoComplete`, `VirtualScroller`.

Legenda de dificuldade: 🟢 Nenhuma/Baixa · 🟡 Média · 🟠 Alta · 🔴 Muito Alta

## Tabela de componentes

| Componente | Depende de (PrimeVue / interno) | Dificuldade de independência |
|---|---|---|
| **InputBase.vue** | FloatLabel, IconField, InputIcon, Message | 🟠 **Alta** — é o núcleo; FloatLabel/IconField são só layout (fácil), mas é crítico e muitos dependem dele |
| MaxInputText.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputCep.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputCpfCnpj.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputCoordinateDecimalLat.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputCoordinateDecimalLng.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputPhoneMail.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputSearch.vue | InputText · InputBase | 🟢 Baixa |
| MaxInputTextArea.vue | Textarea · InputBase | 🟢 Baixa |
| MaxInputTextList.vue | InputBase | 🟢 Baixa |
| MaxColorPicker.vue | InputText, **ColorPicker** · InputBase | 🟡 Média — o seletor de cor precisa de reimplementação |
| MaxInputCheckbox.vue | Checkbox | 🟢 Baixa — `<input type=checkbox>` estilizado |
| MaxInputRadio.vue | RadioButton (global) | 🟢 Baixa — `<input type=radio>` estilizado |
| MaxInputSwitch.vue | ToggleSwitch · InputBase | 🟢 Baixa — toggle CSS |
| MaxInputToggle.vue | ToggleSwitch | 🟢 Baixa |
| MaxInputNumber.vue | **InputNumber** · InputBase | 🟡 Média — formatação numérica/locale/spinners |
| MaxInputFileUpload.vue | FileUpload, ProgressSpinner | 🟡 Média — drag&drop + progress |
| MaxBadgeComponent.vue | Badge, OverlayBadge | 🟢 Baixa — `<span>` estilizado |
| MaxUserAvatar.vue | Avatar | 🟢 Baixa |
| MaxButton.vue | Button | 🟢 Baixa — `<button>` + tipos próprios |
| MaxPdfView.vue | ProgressSpinner | 🟢 Baixa (spinner trivial) |
| MaxPopoverMenu.vue | **Menu** | 🟡 Média — navegação por teclado/submenus |
| MaxInputSelect.vue | **Select** · InputBase | 🔴 Alta — dropdown com busca, teclado, opções agrupadas |
| MaxTagSelect.vue | **Select** · InputBase | 🔴 Alta |
| MaxPhoneField.vue | **Select**, InputText · InputBase | 🔴 Alta |
| MaxInputAutoComplete.vue | **AutoComplete** · InputBase | 🔴 Alta — sugestões assíncronas, teclado |
| MaxInputAutoCompleteApi.vue | **AutoComplete** · InputBase | 🔴 Alta |
| MaxInputIconPicker.vue | InputText, **Drawer**, **VirtualScroller** · InputBase | 🔴 Alta — drawer + scroll virtualizado |
| MaxInputDatePicker.vue | **DatePicker** · InputBase | 🔴 **Muito Alta** — widget de calendário completo |
| MaxTable.vue | **DataTable**, **Column** | 🔴 **Muito Alta** — ordenação, paginação, seleção, scroll |
| MaxTableColumn.vue | **Column** | 🔴 Muito Alta (acoplado ao DataTable) |
| MaxTableFields.vue | MaxTableColumn (interno) | 🟡 Média — depende do MaxTable |
| MaxInputTypeAddress.vue | MaxInputSelect (interno) | 🟢 Baixa — herda do Select |
| MaxInputMarkdown.vue | *Nenhum PrimeVue* (editor externo/tiptap) | 🟢 Nenhuma |
| MaxInputMarkdownToolbar.vue | Nenhum | 🟢 Nenhuma |
| MaxInputFile.vue | Nenhum | 🟢 Nenhuma |
| MaxInputFileProject.vue | Nenhum (@maxvue/max-use) | 🟢 Nenhuma |
| MaxInputFileUploadBig.vue | Nenhum (@maxvue/max-use) | 🟢 Nenhuma |
| MaxInputFileUploadButton.vue | Nenhum | 🟢 Nenhuma |
| MaxModal.vue | Nenhum (Max internos + store) | 🟢 Nenhuma |
| MaxPopover.vue | Nenhum (@maxvue/max-use) | 🟢 Nenhuma |
| MaxPopoverConfirm.vue | Nenhum (store) | 🟢 Nenhuma |
| MaxTogglePopover.vue | Nenhum (store) | 🟢 Nenhuma |
| MaxIconConfirm.vue | Nenhum (store) | 🟢 Nenhuma |
| MaxToast.vue | Nenhum (store próprio) | 🟢 Nenhuma |
| MaxIcon.vue | Nenhum (Iconify store) | 🟢 Nenhuma |
| MaxIconButton.vue | Nenhum | 🟢 Nenhuma |
| MaxAiIcon.vue | Nenhum | 🟢 Nenhuma |
| MaxDoneIcon.vue / MaxErrorIcon.vue / MaxWaitIcon.vue | Nenhum | 🟢 Nenhuma |
| MaxLoader.vue / MaxLoaderAi.vue / MaxLoaderIcon.vue | Nenhum | 🟢 Nenhuma |
| MaxGrid.vue / MaxGridCols.vue | Nenhum | 🟢 Nenhuma |
| MaxTitle1.vue / MaxTitle2.vue | Nenhum | 🟢 Nenhuma |
| MaxLink.vue / MaxLogo.vue | Nenhum | 🟢 Nenhuma |
| MaxMaps.vue | Nenhum (@maxvue/max-use) | 🟢 Nenhuma |
| MaxTagsList.vue | Nenhum (@maxvue/max-use) | 🟢 Nenhuma |
| MaxAuthCard.vue / MaxEmptyDiv.vue / MaxMsgLabels.vue | Nenhum | 🟢 Nenhuma |
| MaxAnimateFade.vue / MaxTransitionUp.vue / MaxTransitionFadeLight.vue / TransitionFade.vue | Nenhum | 🟢 Nenhuma |
| MaxTextInputFloatLabel.vue | Nenhum | 🟢 Nenhuma |

## Conclusões para o plano de independência

**Já estão livres (≈35 componentes / ~50%):** ícones, loaders, grids, títulos, transições,
popovers/modais (usam stores próprias) e os componentes de markdown/arquivo. Nenhum esforço
necessário.

**Ordem recomendada de migração:**

1. **`InputBase`** primeiro (núcleo) — destrava ~19 inputs de baixa complexidade.
2. **Wrappers simples de `InputText`/`Textarea`** (🟢) — substituição direta por elementos nativos.
3. **Form controls** (Checkbox, Radio, Switch, Badge, Button, Avatar) — CSS puro.
4. **Médios** (Select, AutoComplete, InputNumber, Menu, ColorPicker, FileUpload) — exigem
   reimplementação de comportamento (teclado, busca).
5. **Por último os bloqueadores** 🔴: `DataTable`/`Column` e `DatePicker` — candidatos a usar
   bibliotecas headless (ex.: TanStack Table, VueUse, headless date pickers) em vez de
   reimplementar do zero.
