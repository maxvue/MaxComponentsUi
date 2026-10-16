# Seletores de Domínio Especializados — Max Components UI

Guia técnico de referência dos dez inputs de domínio especializados introduzidos na versão 1.1.12 da biblioteca `@maxvue/max-components-ui`.

---

## 1. Visão Geral e Filosofia Arquitetural

Os inputs de domínio especializados fornecem seletores pré-configurados com catálogos canônicos, tipagem estrita no TypeScript e acessibilidade completa (WAI-ARIA combobox, navegação por teclado e anéis de foco do ecossistema Max).

Todos os componentes são construídos por composição sobre o adaptador interno `MaxDomainSelect`, que encapsula o `MaxInputSelect` sem expor detalhes de infraestrutura ou mutar arrays compartilhados.

### Princípios Gerais
- **Catálogos Imutáveis:** As listas de opções são estáticas e congeladas (`Object.freeze`), impedindo mutações acidentais de estado compartilhado.
- **Sem Ecos de Eventos:** O adaptador interno previne ciclos de reemissão de eventos quando o valor é atualizado a partir do componente pai.
- **Tratamento de Vazios e Desconhecidos:** Valores vazios (`''`, `null`, `undefined`) não disparam erro automático por si sós (`required` preserva o contrato visual/ARIA). Caso um valor arbitrário não existente no catálogo seja fornecido externamente, ele é preservado sem coerção silenciosa, exibido de forma segura no slot de valor e sinalizado com erro local, a menos que o consumidor especifique um feedback explícito via prop `error`.
- **Precedência do Consumidor:** A prop `error` fornecida pela aplicação tem precedência estrita sobre validações locais de valor desconhecido.

---

## 2. Matriz Geral dos Dez Componentes

| ID | Componente | Rótulo Padrão | Tipo do Valor (`T`) | Valores Aceitos | Busca Padrão (`filter`) |
|---|---|---|---|---|---|
| D01 | `MaxInputPhase` | Número de fases | `PhaseValue` (`number`) | `1, 2, 3` | `false` |
| D02 | `MaxInputWireSize` | Seção do condutor | `WireSizeValue` (`number`) | `0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630, 800, 1000` | `true` |
| D03 | `MaxInputWireType` | Material e isolamento | `WireTypeValue` (`string`) | `'copper-70', 'copper-90', 'aluminum-70', 'aluminum-90'` | `false` |
| D04 | `MaxInputAiExecutionType` | Tipo de execução | `AiExecutionTypeValue` (`string`) | `'cloud', 'local'` | `false` |
| D05 | `MaxInputAiBillingMode` | Forma de cobrança | `AiBillingModeValue` (`string`) | `'dollar', 'bonus', 'free', 'local'` | `false` |
| D06 | `MaxInputAiBillingUnit` | Unidade de cobrança | `AiBillingUnitValue` (`string`) | `'m_tokens', 'tokens', 'unity', 'characters', 'second', 'minute', 'hour'` | `false` |
| D07 | `MaxInputPaymentMethod` | Método de pagamento | `PaymentMethodValue` (`string`) | `'pix', 'credit_card'` | `false` |
| D08 | `MaxInputScheduleType` | Tipo de agendamento | `ScheduleTypeValue` (`string`) | `'specific_dates', 'weekly', 'monthly_days', 'monthly_nth_weekday'` | `false` |
| D09 | `MaxInputMonthOccurrence` | Ocorrência no mês | `MonthOccurrenceValue` (`number`) | `1, 2, 3, 4, 5` | `false` |
| D10 | `MaxInputContentType` | Tipo de conteúdo base | `ContentTypeValue` (`string`) | `'image', 'pdf', 'audio', 'text', 'url'` | `false` |

---

## 3. Contrato de Props, Eventos e Slots

### 3.1. Props Comuns

Todas as props são opcionais:

```typescript
interface BaseDomainInputProps<T> {
    /** Valor selecionado (v-model). Aceita T, '' ou null. Padrão: null */
    modelValue?: T | '' | null;
    /** Rótulo exibido no cabeçalho do campo. Sobrescreve o rótulo padrão do componente */
    label?: string;
    /** Texto placeholder quando nenhum item estiver selecionado */
    placeholder?: string;
    /** Habilita campo de filtro/pesquisa textual no dropdown */
    filter?: boolean;
    /** Desabilita o componente e interações de teclado */
    disabled?: boolean;
    /** Marca o campo como obrigatório (visual e acessibilidade WAI-ARIA) */
    required?: boolean;
    /** Exibe o botão de limpeza rápida da seleção */
    clearable?: boolean;
    /** Alias para clearable */
    showClear?: boolean;
    /** Estado de sucesso/concluído */
    done?: boolean;
    /** Mensagem de erro ou booleano para indicar estado inválido. Tem precedência sobre erros locais */
    error?: string | boolean | null;
    /** Mensagem ou booleano de estado de alerta/atenção */
    caution?: string | boolean | null;
    /** Oculta as mensagens de ajuda/erro abaixo do campo */
    noMessage?: boolean;
}
```

### 3.2. Eventos (Emits)

- `update:modelValue(value: T | null)`: Disparado ao selecionar uma opção ou limpar o campo.
- `change(value: T | null)`: Disparado quando a seleção é confirmada pelo usuário.
- `clear()`: Disparado ao acionar o botão de limpeza.

### 3.3. Slots

- `#value="{ value, option }"`: Customiza a renderização do gatilho quando um valor está selecionado. Caso não fornecido, o rótulo padrão da opção é renderizado.
- `#option="{ option }"`: Customiza o item de lista renderizado no menu dropdown.

---

## 4. Detalhes Específicos por Domínio

### 4.1. Domínio Elétrico (D01 – D03)
- **`MaxInputPhase`:** Model numérico estrito (`1`, `2` ou `3`). Rótulos: *Monofásico*, *Bifásico*, *Trifásico*. Não confundir com tensão ou corrente.
- **`MaxInputWireSize`:** Seção transversal em mm², com 24 bitolas normalizadas de `0,5 mm²` até `1000 mm²`. O model permanece como `number` (ex: `2.5`). A busca (`filter`) vem habilitada como `true` por padrão para agilizar a seleção.
- **`MaxInputWireType`:** Combina material do condutor com a temperatura de isolamento (*Cobre — PVC 70 °C*, *Cobre — EPR/XLPE 90 °C*, *Alumínio — PVC 70 °C*, *Alumínio — EPR/XLPE 90 °C*).

### 4.2. Domínio Inteligência Artificial (D04 – D06)
- **`MaxInputAiExecutionType`:** Nuvem (`cloud`) vs Local (`local`). Não efetua chamadas à rede nem altera filas de execução.
- **`MaxInputAiBillingMode`:** Categoria de tarifação do modelo (`dollar`, `bonus`, `free`, `local`). Separação conceitual entre gratuidade (`free`) e infraestrutura local com custo zero (`local`).
- **`MaxInputAiBillingUnit`:** Unidade de tarifação de consumo (`m_tokens`, `tokens`, `unity`, `characters`, `second`, `minute`, `hour`). Rótulos claros diferenciam "Por 1 milhão de tokens" de "Por token".

### 4.3. Domínio Pagamentos (D07)
- **`MaxInputPaymentMethod`:** Catálogo estritamente delimitado a PIX (`pix`) e Cartão de crédito (`credit_card`). Não realiza cobranças ou processamento de cartões.

### 4.4. Domínio Editorial e Agendamento (D08 – D10)
- **`MaxInputScheduleType`:** Escolha da estratégia de publicação (`specific_dates`, `weekly`, `monthly_days`, `monthly_nth_weekday`).
- **`MaxInputMonthOccurrence`:** Ocorrências ordinais numéricas de 1 a 5 (`1ª ocorrência` a `5ª ocorrência`).
  > [!IMPORTANT]
  > O valor `5` representa estritamente a *5ª ocorrência* no mês quando esta existir no calendário real. Não representa e nunca deve ser interpretado como "Última ocorrência". O cálculo de calendário e validação de existência pertence ao backend ou serviço de regras.
- **`MaxInputContentType`:** Formato do conteúdo base (`image`, `pdf`, `audio`, `text`, `url`). Não realiza uploads nem valida sintaxe de URLs.

---

## 5. Exemplos de Uso

```html
<template>
    <div class="form-container">
        <!-- D01: Fases Elétricas -->
        <MaxInputPhase v-model="form.phase" required clearable />

        <!-- D02: Bitola do Condutor (Busca ativa por padrão) -->
        <MaxInputWireSize v-model="form.wireSize" clearable />

        <!-- D03: Material e Isolamento -->
        <MaxInputWireType v-model="form.wireType" />

        <!-- D07: Pagamento -->
        <MaxInputPaymentMethod v-model="form.paymentMethod" required />

        <!-- D09: Ocorrência Mensal -->
        <MaxInputMonthOccurrence v-model="form.occurrence" />
    </div>
</template>

<script setup lang="ts">
    import { reactive } from 'vue';
    import {
        MaxInputPhase,
        MaxInputWireSize,
        MaxInputWireType,
        MaxInputPaymentMethod,
        MaxInputMonthOccurrence,
        type PhaseValue,
        type WireSizeValue,
        type WireTypeValue,
        type PaymentMethodValue,
        type MonthOccurrenceValue
    } from '@maxvue/max-components-ui';

    const form = reactive({
        phase: 1 as PhaseValue | null,
        wireSize: 2.5 as WireSizeValue | null,
        wireType: 'copper-70' as WireTypeValue | null,
        paymentMethod: 'pix' as PaymentMethodValue | null,
        occurrence: 1 as MonthOccurrenceValue | null
    });
</script>
```
