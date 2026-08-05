# Plano 21 — `MaxInputNumber` (substitui `primevue/inputnumber`)

| | |
|---|---|
| **id** | 21 |
| **Arquivo** | `src/components/MaxInputNumber.vue` |
| **Primitiva eliminada** | `InputNumber` |
| **Depende de** | 1 (`MaxBaseInput`) |
| **Teste existente** | `tests/components/MaxInputNumber.test.ts` |

⚠️ **O item mais delicado da Fase 2.** O `InputNumber` do PrimeVue é enganosamente
complexo: ele formata via `Intl.NumberFormat`, faz parsing reverso da string formatada,
e preserva a posição do cursor durante a digitação. Formatação numérica é a categoria de
bug mais chata de descobrir tarde (valores errados em formulários financeiros).

---

## 1. O `InputNumber` do PrimeVue 4

### Props principais

| Prop | Tipo | Default | Efeito |
|---|---|---|---|
| `modelValue` | `number \| null` | — | valor numérico |
| `mode` | `'decimal' \| 'currency'` | `'decimal'` | modo de formatação |
| `locale` | `string` | do navegador | locale do `Intl` |
| `currency` | `string` | — | código ISO (ex.: `'BRL'`) |
| `currencyDisplay` | `'symbol'\|'code'\|'name'` | `'symbol'` | exibição da moeda |
| `useGrouping` | `boolean` | `true` | separador de milhar |
| `minFractionDigits` | `number` | — | casas decimais mínimas |
| `maxFractionDigits` | `number` | — | casas decimais máximas |
| `min` / `max` | `number` | — | limites |
| `step` | `number` | `1` | incremento dos botões/setas |
| `prefix` / `suffix` | `string` | — | texto fixo antes/depois |
| `showButtons` | `boolean` | `false` | botões de + / − |
| `buttonLayout` | `'stacked'\|'horizontal'\|'vertical'` | `'stacked'` | disposição dos botões |
| `allowEmpty` | `boolean` | `true` | permite valor vazio |
| `readonly`, `disabled`, `invalid`, `fluid`, `inputId` | | | |

### Eventos
`update:modelValue`, `input`, `focus`, `blur`.

### Comportamento essencial

1. **Exibe formatado, emite número.** O usuário vê `1.234,56`; o `v-model` recebe `1234.56`.
2. **Parsing reverso**: remove separador de milhar, converte separador decimal, tira
   prefixo/sufixo/símbolo de moeda, e faz `Number()`.
3. **Setas ↑/↓** incrementam/decrementam por `step`, respeitando `min`/`max`.
4. **Clamp** em `min`/`max` no blur.
5. **Preservação do cursor**: ao reformatar durante a digitação, o cursor não pode pular
   para o fim.

---

## 2. Antes de implementar: descubra o uso real

```bash
grep -rn "MaxInputNumber" src/ playground/ tests/
```

Registre em `notas`: quais props são realmente usadas? Se o projeto só usa
`mode="currency"` com BRL, ou só decimal com 2 casas, o escopo cai drasticamente.

**Implemente a superfície que o repositório usa + o que é razoável para apps
consumidoras** (mode, locale, currency, min, max, minFractionDigits,
maxFractionDigits, useGrouping, prefix, suffix, allowEmpty, showButtons).

Não é obrigatório reimplementar `buttonLayout` em três variantes se ninguém usa —
registre a decisão.

---

## 3. Implementação

🔒 **`InputBase` permanece o elemento mais externo, intocado.** Toda a implementação
abaixo vive **dentro** dele:

```vue
<InputBase v-bind="props" :done="..." :error="..." :caution="...">   <!-- NÃO MUDA -->
    <MaxBaseInput ... />                    <!-- o campo formatado -->
    <div class="p-inputnumber-button-group" v-if="props.showButtons"> ... </div>
</InputBase>
```

`src/components/InputBase.vue` não é alterado por este item.

### Formatação

```ts
const formatter = computed(() => new Intl.NumberFormat(props.locale ?? 'pt-BR', {
    style: props.mode === 'currency' ? 'currency' : 'decimal',
    currency: props.mode === 'currency' ? props.currency : undefined,
    currencyDisplay: props.currencyDisplay,
    useGrouping: props.useGrouping,
    minimumFractionDigits: props.minFractionDigits,
    maximumFractionDigits: props.maxFractionDigits
}));

const formatValue = (value: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(value)) return '';
    return `${props.prefix ?? ''}${formatter.value.format(value)}${props.suffix ?? ''}`;
};
```

### Parsing — derive os separadores do locale, não os assuma

```ts
// NUNCA hardcode ',' e '.' — em pt-BR são invertidos vs en-US
const separators = computed(() => {
    const parts = new Intl.NumberFormat(props.locale ?? 'pt-BR').formatToParts(12345.6);
    return {
        group: parts.find((p) => p.type === 'group')?.value ?? '.',
        decimal: parts.find((p) => p.type === 'decimal')?.value ?? ','
    };
});

const parseValue = (text: string): number | null => {
    if (!text) return null;

    let clean = text;
    if (props.prefix) clean = clean.replace(props.prefix, '');
    if (props.suffix) clean = clean.replace(props.suffix, '');

    // remove tudo que não for dígito, sinal ou separador decimal
    clean = clean
        .split(separators.value.group).join('')
        .split(separators.value.decimal).join('.')
        .replace(/[^\d.-]/g, '');           // tira símbolo de moeda e espaços (inclusive NBSP)

    const parsed = Number(clean);
    return Number.isNaN(parsed) ? null : parsed;
};
```

> **Cuidado com o espaço não separável (NBSP, ` `).** O `Intl` em pt-BR insere NBSP
> entre `R$` e o número. Um `replace(/\s/g, '')` comum **não** remove NBSP em todos os
> ambientes — a classe `[^\d.-]` acima resolve por eliminação.

### Clamp

```ts
const clamp = (value: number | null): number | null => {
    if (value === null) return null;
    if (props.min !== undefined && value < props.min) return props.min;
    if (props.max !== undefined && value > props.max) return props.max;
    return value;
};
```

### Estratégia de digitação (a parte sutil)

**Não reformate a cada tecla.** Isso é o que faz o cursor pular. Padrão recomendado:

- **enquanto focado**: mostre o valor "cru" editável (sem separador de milhar);
- **no blur**: parse → clamp → emit → exiba formatado.

Isso é mais simples que a preservação de cursor do PrimeVue e produz uma UX igual ou
melhor. **Registre essa decisão em `notas`** — é uma divergência intencional de
comportamento interno (a API pública não muda).

### Teclado

- `ArrowUp` / `ArrowDown`: ±`step`, com clamp;
- `Enter`: confirma (dispara o blur logic);
- botões de incremento (se `showButtons`) precisam de `aria-label` ("Incrementar",
  "Decrementar") e `type="button"` para não submeter formulários.

### ARIA

`role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` no input.

---

## 4. Teste

1. formata decimal em pt-BR: `1234.56` → exibe `"1.234,56"`;
2. formata moeda: `1234.56` com `mode="currency" currency="BRL"` → contém `"R$"` e `"1.234,56"`;
3. **round-trip**: digitar `"1.234,56"` emite `1234.56` (número, não string);
4. `useGrouping: false` remove separador de milhar;
5. `minFractionDigits`/`maxFractionDigits` respeitados;
6. `prefix`/`suffix` aparecem na exibição e **não** contaminam o valor emitido;
7. `min` faz clamp para cima; `max` faz clamp para baixo;
8. `ArrowUp` incrementa por `step`; `ArrowDown` decrementa;
9. seta respeita `min`/`max`;
10. `allowEmpty: true` → campo vazio emite `null`;
11. `allowEmpty: false` → campo vazio cai para `min ?? 0`;
12. entrada não numérica não emite `NaN`;
13. `role="spinbutton"` com `aria-valuenow` correto;
14. `disabled`/`readonly` bloqueiam alteração.

> **Teste 3 e 12 são os mais importantes.** Um `NaN` vazando para o `v-model` corrompe
> dados silenciosamente.

---

## 5. Checklist

- [ ] Uso real levantado e registrado em `notas` antes de implementar
- [ ] 🔒 `<InputBase>` continua sendo o elemento mais externo, com as mesmas props
- [ ] 🔒 `git diff --stat src/components/InputBase.vue` → vazio (arquivo intocado)
- [ ] Separadores derivados do locale, **não** hardcoded
- [ ] NBSP tratado no parsing
- [ ] Nunca emite `NaN`
- [ ] Estratégia de digitação (foco/blur) documentada em `notas`
- [ ] `role="spinbutton"` + `aria-value*`
- [ ] 14 asserções passam
- [ ] Validado manualmente no playground com moeda BRL
- [ ] `type-check`, `lint`, `test` OK
