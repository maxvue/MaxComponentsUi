# Componentes PrimeVue Re-exportados

O módulo `@maxvue/max-components-ui/prime` re-exporta componentes do PrimeVue 4 para que possam ser usados sem instalar o PrimeVue diretamente.

```typescript
import { DataTable, Column, Card, Dialog } from '@maxvue/max-components-ui/prime'
```

> **Nota:** Estes são componentes PrimeVue puros, sem customizações adicionais.
> Para componentes Max com estilo personalizado, use `@maxvue/max-components-ui`.

---

## Componentes Disponíveis

### Formulário

| Componente | PrimeVue Original |
|------------|------------------|
| `AutoComplete` | `primevue/autocomplete` |
| `CascadeSelect` | `primevue/cascadeselect` |
| `Checkbox` | `primevue/checkbox` |
| `CheckboxGroup` | `primevue/checkboxgroup` |
| `ColorPicker` | `primevue/colorpicker` |
| `DatePicker` | `primevue/datepicker` |
| `InputOtp` | `primevue/inputotp` |
| `Knob` | `primevue/knob` |
| `Listbox` | `primevue/listbox` |
| `MultiSelect` | `primevue/multiselect` |
| `Password` | `primevue/password` |
| `Rating` | `primevue/rating` |
| `Select` | `primevue/select` |
| `SelectButton` | `primevue/selectbutton` |
| `Slider` | `primevue/slider` |
| `Textarea` | `primevue/textarea` |
| `ToggleButton` | `primevue/togglebutton` |
| `ToggleSwitch` | `primevue/toggleswitch` |
| `TreeSelect` | `primevue/treeselect` |
| `RadioButton` | `primevue/radiobutton` |

### Botões

| Componente | PrimeVue Original |
|------------|------------------|
| `SpeedDial` | `primevue/speeddial` |
| `SplitButton` | `primevue/splitbutton` |

### Dados

| Componente | PrimeVue Original |
|------------|------------------|
| `DataTable` | `primevue/datatable` |
| `Column` | `primevue/column` |
| `ColumnGroup` | `primevue/columngroup` |
| `Row` | `primevue/row` |
| `DataView` | `primevue/dataview` |
| `OrderList` | `primevue/orderlist` |
| `OrganizationChart` | `primevue/organizationchart` |
| `Paginator` | `primevue/paginator` |
| `PickList` | `primevue/picklist` |
| `Timeline` | `primevue/timeline` |
| `Tree` | `primevue/tree` |
| `TreeTable` | `primevue/treetable` |
| `VirtualScroller` | `primevue/virtualscroller` |

### Painéis

| Componente | PrimeVue Original |
|------------|------------------|
| `Accordion` | `primevue/accordion` |
| `AccordionPanel` | `primevue/accordionpanel` |
| `AccordionHeader` | `primevue/accordionheader` |
| `AccordionContent` | `primevue/accordioncontent` |
| `Card` | `primevue/card` |
| `Divider` | `primevue/divider` |
| `Fieldset` | `primevue/fieldset` |
| `Panel` | `primevue/panel` |
| `ScrollPanel` | `primevue/scrollpanel` |
| `Splitter` | `primevue/splitter` |
| `SplitterPanel` | `primevue/splitterpanel` |
| `Stepper` | `primevue/stepper` |
| `StepList` | `primevue/steplist` |
| `StepPanels` | `primevue/steppanels` |
| `StepItem` | `primevue/stepitem` |
| `Step` | `primevue/step` |
| `StepPanel` | `primevue/steppanel` |
| `Tabs` | `primevue/tabs` |
| `TabList` | `primevue/tablist` |
| `Tab` | `primevue/tab` |
| `TabPanels` | `primevue/tabpanels` |
| `TabPanel` | `primevue/tabpanel` |
| `Toolbar` | `primevue/toolbar` |
| `Editor` | `primevue/editor` |

### Overlays

| Componente | PrimeVue Original |
|------------|------------------|
| `ConfirmDialog` | `primevue/confirmdialog` |
| `ConfirmPopup` | `primevue/confirmpopup` |
| `Dialog` | `primevue/dialog` |
| `Drawer` | `primevue/drawer` |
| `DynamicDialog` | `primevue/dynamicdialog` |
| `Popover` | `primevue/popover` |

### Menus

| Componente | PrimeVue Original |
|------------|------------------|
| `Breadcrumb` | `primevue/breadcrumb` |
| `ContextMenu` | `primevue/contextmenu` |
| `Dock` | `primevue/dock` |
| `Menu` | `primevue/menu` |
| `Menubar` | `primevue/menubar` |
| `MegaMenu` | `primevue/megamenu` |
| `PanelMenu` | `primevue/panelmenu` |
| `TieredMenu` | `primevue/tieredmenu` |

### Outros

| Componente | PrimeVue Original |
|------------|------------------|
| `Badge` | `primevue/badge` |
| `Message` | `primevue/message` |
| `Carousel` | `primevue/carousel` |
| `Galleria` | `primevue/galleria` |
| `Image` | `primevue/image` |
| `ImageCompare` | `primevue/imagecompare` |
| `Avatar` | `primevue/avatar` |
| `AvatarGroup` | `primevue/avatargroup` |
| `OverlayBadge` | `primevue/overlaybadge` |
| `BlockUI` | `primevue/blockui` |
| `Chip` | `primevue/chip` |
| `Chips` | `primevue/chips` |
| `MeterGroup` | `primevue/metergroup` |
| `ProgressBar` | `primevue/progressbar` |
| `ProgressSpinner` | `primevue/progressspinner` |
| `ScrollTop` | `primevue/scrolltop` |
| `Skeleton` | `primevue/skeleton` |
| `Tag` | `primevue/tag` |
| `Terminal` | `primevue/terminal` |

---

## Por que re-exportar?

A re-exportação resolve dois problemas:

1. **Centralização** — O projeto consumidor não precisa instalar o PrimeVue como dependência direta
2. **Compatibilidade com auto-import** — O `MaxComponentsUiResolver` resolve automaticamente esses componentes via `@maxvue/max-components-ui/prime`, evitando conflitos de importação
