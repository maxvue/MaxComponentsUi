# Ausência de Rótulos Acessíveis e Navegação em MaxInputDatePicker e MaxInputSearch

## Descrição e Causa Raiz

### Problema

#### 1. MaxInputDatePicker.vue ([`src/components/MaxInputDatePicker.vue:35-71`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L35-L71))
Ao inspecionar o popup do calendário de `MaxInputDatePicker.vue`:
```html
<div class="max-datepicker-header">
    <button type="button" class="max-datepicker-nav-btn" @click.stop="prevMonth">
        <MaxIcon icon="lucide:chevron-left" size="1.1" />
    </button>
    <div class="max-datepicker-title">
        {{ monthNames[currentMonth] }} {{ currentYear }}
    </div>
    <button type="button" class="max-datepicker-nav-btn" @click.stop="nextMonth">
        <MaxIcon icon="lucide:chevron-right" size="1.1" />
    </button>
</div>

<div class="max-datepicker-grid">
    <div class="max-datepicker-weekdays">...</div>
    <div class="max-datepicker-days">
        <button
            v-for="(cell, cIdx) in calendarDays"
            :key="cIdx"
            type="button"
            class="max-datepicker-day"
            ...
            @click.stop="selectDate(cell)"
        >
            {{ cell.day }}
        </button>
    </div>
</div>
```
- **Botões de Navegação sem Nome Acessível (WCAG 4.1.2):** Os botões de mês anterior e próximo mês contêm apenas um ícone SVG e não possuem atributo `aria-label="Mês anterior"` ou `aria-label="Próximo mês"`. O leitor de tela anuncia apenas "Botão".
- **Dias do Calendário sem Rótulo Completo:** Cada botão de dia renderiza apenas o número bruto `{{ cell.day }}`. Para dias de meses adjacentes (`is-other-month`), um leitor de tela lê apenas "30" ou "1", sem qualquer informação do mês ou ano a que pertence.
- **Ausência do Padrão WAI-ARIA Datepicker Grid:** A grade não possui `role="grid"` nem `role="gridcell"`, e os botões de dia não respondem às teclas de seta (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown` para navegar entre dias e semanas), exigindo dezenas de pressões de `Tab` para alcançar uma data desejada.

#### 2. MaxInputSearch.vue ([`src/components/MaxInputSearch.vue:1-5`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L1-L5))
```html
<template>
    <InputBase class="max-input-search input-search-main-div" :iconRight="isLoading === true ? 'line-md:loading-twotone-loop' : 'material-symbols:search-rounded'">
        <input type="text" class="p-inputtext" v-bind="attrs" :value="temp_value" @input="onInput" />
    </InputBase>
</template>
```
- **Semântica e Rótulo Ausentes:** O campo usa `type="text"` genérico em vez de `type="search"`, não declara `aria-label="Pesquisar"` ou `placeholder="Pesquisar..."` por padrão.
- **Feedback de Carregamento Assíncrono Invisível para Dispositivos Assistivos (WCAG 4.1.3 - Mensagens de Status):** Quando `isLoading: true`, o ícone muda para um spinner visual no `InputBase`, mas o input não recebe `:aria-busy="isLoading"` nem há uma região `aria-live="polite"` notificando que uma busca assíncrona está em processamento.

## Localização no Código
- [`src/components/MaxInputDatePicker.vue:35-71`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputDatePicker.vue#L35-L71)
- [`src/components/MaxInputSearch.vue:1-5, 13-19`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-653aa895/src/components/MaxInputSearch.vue#L1-L5)

## Proposta de Solução
1. Em `MaxInputDatePicker.vue`:
   - Adicionar `aria-label="Mês anterior"` e `aria-label="Próximo mês"` nos botões do cabeçalho.
   - Adicionar `:aria-label="formatDateAria(cell.date)"` (ex.: "15 de Outubro de 2026") nos botões de dia.
   - Adicionar `role="grid"`, `role="row"` e `role="gridcell"` na estrutura do calendário e permitir navegação de datas com as setas do teclado.
2. Em `MaxInputSearch.vue`:
   - Alterar para `type="search"` (ou prop configurável).
   - Adicionar `aria-label="Pesquisar"` caso nenhum label seja fornecido.
   - Adicionar `:aria-busy="isLoading ? 'true' : undefined"` no campo nativo.
