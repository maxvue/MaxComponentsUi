# Plano de Implementação — Issue #86

## Descrição e Causa Raiz

### Problema
No componente `src/components/MaxCreditCard.vue` (linha 127), o cálculo do número do cartão exibido no cartão visual SVG é hardcoded para 16 dígitos:
```typescript
const code = computed(() => onlyNumbers(String(props.number ?? '')).padEnd(16, '0').slice(0, 16));
```
Em seguida, esse valor é particionado rigidamente em 4 blocos de 4 dígitos:
```typescript
const t1 = computed(() => code.value.slice(0, 4));
const t2 = computed(() => code.value.slice(4, 8));
const t3 = computed(() => code.value.slice(8, 12));
const t4 = computed(() => code.value.slice(12, 16));
```
E renderizado no template SVG (linha 19):
```html
<text ... class="credit-card-number" ...>{{ t1 }} {{ t2 }} {{ t3 }} {{ t4 }}</text>
```

Para bandeiras cuja numeração canônica possui um total de dígitos diferente de 16:
1. **American Express (Amex):** Possui 15 dígitos no padrão canônico `4-6-5` (ex.: `3782 822463 10005`). A função `padEnd(16, '0')` adiciona um zero falso no final e o template renderiza `3782 8224 6310 0050`. O zero fictício adicionado adultera o número do cliente e desloca os dígitos entre os blocos.
2. **Diners Club:** Tradicionalmente possui 14 dígitos no padrão canônico `4-6-4` (ex.: `3056 930902 5904`). A função `padEnd(16, '0')` adiciona dois zeros falsos no final e o template renderiza `3056 9309 0259 0400`.

### Agravantes e Impacto
1. **Adulteração de Dados Sensíveis de Pagamento:** O componente gráfico insere dígitos inexistentes (`0`) ao número do cartão do usuário, violando a regra de integridade de representação visual de dados financeiros (skill `vue-inputs-masks-validation-best-practices`, Seção 7).
2. **Distorção de Agrupamento Canônico:** Usuários de cartões Amex e Diners estão acostumados a conferir seus cartões nos formatos `4-6-5` e `4-6-4`. O agrupamento forçado em `4-4-4-4` causa desorientação e falsa sensação de erro no preenchimento.
3. **Reconhecimento Incompleto no Próprio Código:** O comentário no próprio arquivo `MaxCreditCard.vue:188` já citava explicitamente `(ex.: Amex 4-6-5)`, e o teste `tests/components/MaxCreditCard.test.ts:97` possuía o título revelador `cabe o número Amex de 15 dígitos (agrupamento 4-6-5 truncado para os 4 grupos fixos existentes)`, comprovando que o agrupamento correto estava documentado mas não havia sido implementado na lógica reativa.

### Causa Raiz Comprovada
- **Localização Exata:** `src/components/MaxCreditCard.vue:127-134` e `src/components/MaxCreditCard.vue:19`
- **Código Defeituoso:**
  ```typescript
  127: const code = computed(() => onlyNumbers(String(props.number ?? '')).padEnd(16, '0').slice(0, 16));
  128: const cvv = computed(() => onlyNumbers(String(props.cvv ?? '')).padEnd(3, '0').slice(0, 4));
  129: 
  130: const t1 = computed(() => code.value.slice(0, 4));
  131: const t2 = computed(() => code.value.slice(4, 8));
  132: const t3 = computed(() => code.value.slice(8, 12));
  133: const t4 = computed(() => code.value.slice(12, 16));
  ```
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. Prop `number` do componente recebe a string do cartão (ex.: `'378282246310005'`).
  2. `onlyNumbers` sanitiza e retorna os 15 dígitos numéricos `'378282246310005'`.
  3. `code = computed(...)` executa incondicionalmente `.padEnd(16, '0')`, transformando a string em `'3782822463100050'` (16 caracteres, com o 16º sendo `'0'`).
  4. `t1` a `t4` fatiam a string distorcida em blocos de 4: `'3782'`, `'8224'`, `'6310'`, `'0050'`.
  5. O template SVG concatena com espaços simples: `{{ t1 }} {{ t2 }} {{ t3 }} {{ t4 }}`.
  6. Resultado renderizado na tela do usuário: `3782 8224 6310 0050` em vez de `3782 822463 10005`.

---

## Arquivos Afetados

1. `src/components/MaxCreditCard.vue`:
   - Implementação de modelo de formatação dinâmico por bandeira (`cardFormat` com `length` e `groups`).
   - Ajuste do preenchimento (`padEnd`) para respeitar o total de dígitos da bandeira identificada (15 para Amex, 14 para Diners, 16 para padrão).
   - Agrupamento dinâmico dos dígitos (`numberGroups` e `formattedNumber`).
   - Atualização do template SVG para renderizar `{{ formattedNumber }}`.
   - Manutenção de compatibilidade com `t1`, `t2`, `t3`, `t4` derivados dos grupos.
   - Atualização do `watch` para monitorar `formattedNumber`.

2. `tests/components/MaxCreditCard.test.ts`:
   - Atualização do teste existente da linha 97 para verificar a formatação real 4-6-5 de Amex sem truncamento ou dígitos falsos.
   - Inclusão de testes unitários para o número Diners Club (14 dígitos, 4-6-4).
   - Inclusão de testes unitários para placeholders vazios por bandeira (`cardType="amex"` gerando `0000 000000 00000`, `cardType="diners"` gerando `0000 000000 0000`).
   - Validação de não-regressão de cartões padrão de 16 dígitos (Visa/Mastercard) e placeholders padrão (`0000 0000 0000 0000`).

---

## Execuções Propostas

### 1. Modelagem da Formatação Dinâmica por Bandeira em `src/components/MaxCreditCard.vue`
Substituir o preenchimento e particionamento estático de 16 dígitos por uma estrutura reativa baseada na bandeira deduzida (`detected_type`) ou informada (`props.cardType`):

```typescript
/** Identifica se o cartão é American Express (15 dígitos, 4-6-5). */
const isAmex = computed(() => card_type.value === 'amex' || card_type.value === 'american-express');

/** Identifica se o cartão é Diners Club de 14 dígitos (4-6-4). */
const isDiners = computed(() => {
    const isDinersType = card_type.value === 'diners' || card_type.value === 'diners-club';
    if (!isDinersType) return false;
    const digits = onlyNumbers(String(props.number ?? ''));
    // Se não tiver dígitos ou tiver até 14 dígitos, segue padrão Diners 14 dígitos (4-6-4)
    return digits.length <= 14;
});

/** Formato do cartão com comprimento total e agrupamentos de dígitos. */
const cardFormat = computed<{ length: number; groups: number[] }>(() => {
    if (isAmex.value) {
        return { length: 15, groups: [4, 6, 5] };
    }
    if (isDiners.value) {
        return { length: 14, groups: [4, 6, 4] };
    }
    return { length: 16, groups: [4, 4, 4, 4] };
});
```

### 2. Formatação Reativa do Número do Cartão
Ajustar o cálculo de `code` para preencher com zeros (`padEnd`) e limitar (`slice`) estritamente de acordo com `cardFormat.value.length`:

```typescript
const code = computed(() => {
    const digits = onlyNumbers(String(props.number ?? ''));
    return digits.padEnd(cardFormat.value.length, '0').slice(0, cardFormat.value.length);
});

/** Fatiamento dinâmico do número do cartão conforme os blocos da bandeira. */
const numberGroups = computed<string[]>(() => {
    const val = code.value;
    const groups: string[] = [];
    let start = 0;
    for (const len of cardFormat.value.groups) {
        groups.push(val.slice(start, start + len));
        start += len;
    }
    return groups;
});

/** Número completo formatado com espaços entre os grupos da bandeira. */
const formattedNumber = computed(() => numberGroups.value.join(' '));

/** Mantém t1-t4 para retrocompatibilidade com eventuais leituras internas. */
const t1 = computed(() => numberGroups.value[0] ?? '');
const t2 = computed(() => numberGroups.value[1] ?? '');
const t3 = computed(() => numberGroups.value[2] ?? '');
const t4 = computed(() => numberGroups.value[3] ?? '');
```

### 3. Atualização do Template SVG e Watchers em `src/components/MaxCreditCard.vue`
- **Template (linha 19):**
  Alterar de:
  ```html
  >{{ t1 }} {{ t2 }} {{ t3 }} {{ t4 }}</text>
  ```
  Para:
  ```html
  >{{ formattedNumber }}</text>
  ```
- **Watcher (linha 214):**
  Substituir o array de dependências para observar `formattedNumber`:
  ```typescript
  watch([formattedNumber, () => props.name, date, cvv], async () => {
      await nextTick();
      updateAllTextLengths();
  });
  ```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha Atual)
Executar os novos testes antes de alterar o código de `src/components/MaxCreditCard.vue`:

```typescript
it('renderiza cartão Amex com 15 dígitos sem zeros adicionais e no formato 4-6-5', async () => {
    const wrapper = mountCard({ number: '378282246310005' });
    await nextTick();
    await nextTick();

    const numberText = wrapper.find('.credit-card-number');
    expect(numberText.text()).toBe('3782 822463 10005');
});

it('renderiza cartão Diners com 14 dígitos sem zeros adicionais e no formato 4-6-4', async () => {
    const wrapper = mountCard({ number: '30569309025904' });
    await nextTick();
    await nextTick();

    const numberText = wrapper.find('.credit-card-number');
    expect(numberText.text()).toBe('3056 930902 5904');
});

it('renderiza placeholder de Amex com 15 zeros no formato 4-6-5 quando cardType é amex', async () => {
    const wrapper = mountCard({ cardType: 'amex' });
    await nextTick();
    await nextTick();

    const numberText = wrapper.find('.credit-card-number');
    expect(numberText.text()).toBe('0000 000000 00000');
});
```

**Comportamento Red observado no código atual:**
- Teste Amex falha com:
  `Expected: "3782 822463 10005"`
  `Received: "3782 8224 6310 0050"` (zero adicional inexistente e formato 4-4-4-4).
- Teste Diners falha com:
  `Expected: "3056 930902 5904"`
  `Received: "3056 9309 0259 0400"` (dois zeros adicionais inexistentes e formato 4-4-4-4).
- Teste Placeholder Amex falha com:
  `Expected: "0000 000000 00000"`
  `Received: "0000 0000 0000 0000"`.

### 2. Etapa Green (Aprovação Pós-Implementação)
Após aplicar a lógica proposta:
- Todos os testes Red passam com sucesso absoluto.
- O teste de contenção de largura `cabe o número Amex de 15 dígitos` continua aprovado.
- Os testes de detecção de bandeira (`detected_type`), nomes, CVV, data e imagens SVG continuam 100% aprovados.

---

## Banco de dados

- **Nenhuma** migration necessária (alteração exclusiva de lógica de apresentação em componente Vue).

---

## Riscos de quebra e Não-Regressão

1. **Impacto no Clamping de Largura SVG (`textLength`):**
   - Cartões Amex (17 caracteres incluindo 2 espaços) e Diners (16 caracteres incluindo 2 espaços) geram uma largura natural inferior à de cartões padrão de 16 dígitos com 3 espaços (19 caracteres).
   - Sob fallback monospace (glifo `0.75em`, fonte `42px`), Amex ocupa `17 * 42 * 0.75 = 535.5px <= 560px` (`NUMBER_MAX_WIDTH`). Portanto, cabe confortavelmente sem overflow.
2. **Compatibilidade com Props:**
   - A prop `cardType` continua aceitando `'amex'`, `'american-express'`, `'diners'`, `'diners-club'`, bem como dedução automática por `detected_type`.
3. **Não-Regressão de Cartões Padrão:**
   - Visa, Mastercard, Elo, Hipercard, Discover e cartões genéricos sem bandeira mantêm integralmente o formato `4-4-4-4` e placeholder de 16 zeros.

---

## Validação

- **Execução dos Testes Unitários de `MaxCreditCard`:**
  ```bash
  npx vitest run tests/components/MaxCreditCard.test.ts
  ```
- **Execução do Linter (ESLint e Stylelint):**
  ```bash
  npm run lint
  ```
- **Execução da Suíte Completa de Testes:**
  ```bash
  npm test
  ```

---

## Skills Aplicáveis

- `vue-inputs-masks-validation-best-practices`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `test-driven-development`
- `superpowers`
- `code-review-and-quality`
