# Plano 28 — `MaxInputDatePicker` (substitui `primevue/datepicker`)

| | |
|---|---|
| **id** | 28 |
| **Arquivo** | `src/components/MaxInputDatePicker.vue` |
| **Primitiva eliminada** | `DatePicker` |
| **Depende de** | 1 (`MaxBaseInput`), 2 (`MaxBaseOverlay`) |
| **Teste existente** | `tests/components/MaxInputDatePicker.test.ts` |

⚠️ **O item de maior esforço da migração.** O `DatePicker` do PrimeVue tem ~3000 linhas.
Reimplementá-lo por completo não é realista nem necessário — o objetivo é cobrir o que
este repositório e suas apps consumidoras realmente usam.

---

## 1. Levantamento obrigatório (faça ANTES de escrever código)

```bash
sed -n '1,60p' src/components/MaxInputDatePicker.vue     # como o DatePicker é usado
grep -rn "MaxInputDatePicker\|DatePicker" src/ playground/ tests/
ls src/locales/                                          # locale pt-BR existente
```

Responda em `notas`:
- usa `selectionMode` (`single` / `range` / `multiple`)?
- usa `showTime` / `timeOnly`?
- usa `view` (`date` / `month` / `year`)?
- usa `minDate` / `maxDate` / `disabledDates` / `disabledDays`?
- usa `showIcon` / `showButtonBar` / `inline`?
- qual `dateFormat`?

**Implemente o que for usado + o razoável.** Se ninguém usa `showTime`, não construa um
seletor de horas. Registre explicitamente o que ficou de fora — isso é escopo declarado,
não omissão.

---

## 2. API do `DatePicker` (referência)

### Props mais relevantes

| Prop | Tipo | Default |
|---|---|---|
| `modelValue` | `Date \| Date[] \| null` | — |
| `selectionMode` | `'single'\|'multiple'\|'range'` | `'single'` |
| `dateFormat` | `string` | do locale |
| `inline` | `boolean` | `false` |
| `showIcon` | `boolean` | `false` |
| `iconDisplay` | `'button'\|'input'` | `'button'` |
| `showTime` / `timeOnly` | `boolean` | `false` |
| `hourFormat` | `'12'\|'24'` | `'24'` |
| `minDate` / `maxDate` | `Date` | — |
| `disabledDates` | `Date[]` | — |
| `disabledDays` | `number[]` | — |
| `showButtonBar` | `boolean` | `false` |
| `numberOfMonths` | `number` | `1` |
| `view` | `'date'\|'month'\|'year'` | `'date'` |
| `manualInput` | `boolean` | `true` |
| `showOtherMonths` / `selectOtherMonths` | `boolean` | `true` / `false` |

### Eventos
`update:modelValue`, `date-select`, `month-change`, `year-change`, `show`, `hide`,
`today-click`, `clear-click`, `focus`, `blur`.

### Slots
`date`, `header`, `footer`, `dropdownicon`, `previousicon`, `nexticon`.

---

## 3. Implementação

### Estrutura

```vue
<template>
    <InputBase v-bind="props">
        <div ref="containerRef" class="p-datepicker p-component">
            <MaxBaseInput
                v-model="displayValue"
                class="p-datepicker-input"
                :readonly="!props.manualInput"
                :placeholder="props.placeholder"
                @click="open"
                @keydown="onInputKeydown"
                @blur="onManualInputBlur"
            />
            <button type="button" class="p-datepicker-dropdown" v-if="props.showIcon" aria-label="Abrir calendário" @click="toggle">
                <MaxIcon icon="mdi:calendar" />
            </button>
        </div>

        <MaxBaseOverlay v-model:visible="overlayVisible" :target="containerRef">
            <div class="p-datepicker-panel" role="dialog" aria-modal="false" :aria-label="panelLabel">
                <div class="p-datepicker-header">
                    <button type="button" aria-label="Mês anterior" @click="prevMonth"><MaxIcon icon="mdi:chevron-left" /></button>
                    <span aria-live="polite">{{ monthName }} {{ currentYear }}</span>
                    <button type="button" aria-label="Próximo mês" @click="nextMonth"><MaxIcon icon="mdi:chevron-right" /></button>
                </div>

                <table class="p-datepicker-calendar" role="grid">
                    <thead>
                        <tr><th v-for="d in weekDayNames" :key="d" :abbr="d.full" scope="col">{{ d.short }}</th></tr>
                    </thead>
                    <tbody>
                        <tr v-for="(week, wi) in weeks" :key="wi">
                            <td v-for="day in week" :key="day.key" role="gridcell" :aria-selected="day.selected">
                                <button
                                    type="button"
                                    :class="dayClass(day)"
                                    :disabled="day.disabled"
                                    :tabindex="day.isFocusTarget ? 0 : -1"
                                    :aria-label="day.fullLabel"
                                    :aria-current="day.isToday ? 'date' : undefined"
                                    @click="selectDate(day)"
                                >
                                    <slot name="date" :date="day">{{ day.day }}</slot>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="p-datepicker-buttonbar" v-if="props.showButtonBar">
                    <button type="button" @click="selectToday">Hoje</button>
                    <button type="button" @click="clear">Limpar</button>
                </div>
            </div>
        </MaxBaseOverlay>
    </InputBase>
</template>
```

### Geração da grade do mês

```ts
const weeks = computed(() => {
    const year = currentYear.value;
    const month = currentMonth.value;                 // 0-indexed
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (first.getDay() - firstDayOfWeek + 7) % 7;

    const cells: DayCell[] = [];
    // dias do mês anterior
    for (let i = startOffset; i > 0; i--) cells.push(makeCell(new Date(year, month, 1 - i), true));
    // dias do mês
    for (let d = 1; d <= daysInMonth; d++) cells.push(makeCell(new Date(year, month, d), false));
    // completa até múltiplo de 7
    while (cells.length % 7 !== 0) cells.push(makeCell(new Date(year, month + 1, cells.length % 7), true));

    return chunk(cells, 7);
});
```

### Armadilhas de data (leia com atenção)

1. **`new Date(ano, mês, dia)` usa mês 0-indexed.** Erro de um mês é o bug mais comum aqui.
2. **`new Date('2026-08-05')` é interpretado como UTC**, `new Date('2026/08/05')` como
   local. Isso desloca a data em um dia para fusos negativos (Brasil é UTC-3). **Sempre
   construa com o construtor numérico**, nunca com string ISO curta.
3. **Comparação de datas**: compare ano/mês/dia, não `getTime()` — duas datas do mesmo dia
   com horas diferentes não são iguais por timestamp.
4. **Horário de verão**: adicionar 24h em ms pode pular ou repetir um dia. Use
   `new Date(y, m, d + 1)`, que o motor normaliza corretamente.
5. **`minDate`/`maxDate`** devem comparar por dia, não por instante.

### Locale

Use `src/locales/` (pt-BR já existe no repositório) para nomes de meses e dias. Se o
locale só existir como config do PrimeVue, extraia os arrays para um módulo próprio —
e registre isso em `notas`, pois o [plano 37](37-install-plugin.md) remove a config do
PrimeVue que os carregava.

Alternativa: `Intl.DateTimeFormat('pt-BR', { month: 'long' })` e
`Intl.DateTimeFormat('pt-BR', { weekday: 'short' })` — menos código, sempre correto.

### Teclado (obrigatório num calendário)

| Tecla | Ação |
|---|---|
| `←` / `→` | dia anterior / seguinte |
| `↑` / `↓` | semana anterior / seguinte |
| `Home` / `End` | início / fim da semana |
| `PageUp` / `PageDown` | mês anterior / seguinte |
| `Shift+PageUp/Down` | ano anterior / seguinte |
| `Enter` / `Space` | seleciona |
| `Escape` | fecha e devolve o foco |

Use o padrão **roving tabindex**: só o dia focável tem `tabindex="0"`, os demais `-1`.

### ARIA

`role="grid"` na tabela, `role="gridcell"` nas células, `aria-selected` no dia
selecionado, `aria-current="date"` em hoje, `aria-label` completo em cada dia
("5 de agosto de 2026"), e `aria-live="polite"` no cabeçalho de mês/ano para anunciar a
navegação.

---

## 4. Teste

1. renderiza a grade do mês corrente com o número certo de dias;
2. **fevereiro de ano bissexto tem 29 dias** (2024) e não bissexto tem 28 (2023);
3. o offset do primeiro dia da semana está correto (verifique um mês conhecido);
4. clicar num dia emite `update:modelValue` com a `Date` correta **no fuso local**;
5. `date-select` é emitido;
6. navegação de mês anterior/seguinte funciona e **vira o ano** em dezembro→janeiro;
7. `minDate`/`maxDate` desabilitam os dias fora da faixa;
8. `disabledDates` e `disabledDays` desabilitam corretamente;
9. dia desabilitado não é selecionável ao clicar;
10. `selectionMode="range"` seleciona início e fim (se usado);
11. entrada manual com `dateFormat` correto atualiza o valor;
12. entrada manual inválida não emite data inválida;
13. `showButtonBar`: "Hoje" seleciona hoje, "Limpar" emite `null`;
14. teclado: setas movem o foco, `Enter` seleciona, `Escape` fecha;
15. `aria-current="date"` marca o dia de hoje;
16. **teste de fuso**: uma data selecionada não desloca em um dia (compare
    `getDate()`/`getMonth()`/`getFullYear()`, não a string ISO).

> Fixe a data atual nos testes com `vi.setSystemTime(new Date(2026, 7, 5))` — sem isso o
> teste passa hoje e falha mês que vem.

---

## 5. Checklist

- [ ] Levantamento da seção 1 registrado em `notas`, com escopo excluído declarado
- [ ] Sem PrimeVue
- [ ] Nenhuma data construída a partir de string ISO curta
- [ ] Ano bissexto correto (teste 2)
- [ ] Virada de ano correta (teste 6)
- [ ] Nenhum deslocamento de fuso (teste 16)
- [ ] Teclado completo com roving tabindex
- [ ] ARIA de grid completo
- [ ] `vi.setSystemTime` usado nos testes
- [ ] Validado manualmente no playground
- [ ] `type-check`, `lint`, `test` OK
