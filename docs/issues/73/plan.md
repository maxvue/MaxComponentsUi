# Plano de Implementação — Issue #73

## Descrição e Causa Raiz

### Problema
No arquivo de teste `tests/components/MaxCreditCard.test.ts` (linhas 143 a 154), o teste unitário intitulado `'validade cabe na caixa reservada'` apresenta um falso positivo assintomático decorrente de uma asserção aninhada sob uma instrução condicional `if (textLengthAttr !== null)`.

O trecho do teste atualmente é:
```typescript
it('validade cabe na caixa reservada', async () => {
    const wrapper = mountCard({ date: '1230' });
    await nextTick();
    await nextTick();

    const texts = wrapper.findAll('svg text');
    const dateText = texts[2].element as unknown as SVGTextElement;
    const textLengthAttr = dateText.getAttribute('textLength');

    if (textLengthAttr !== null) expect(Number(textLengthAttr)).toBeLessThanOrEqual(DATE_MAX_WIDTH);
});
```

### Agravantes e Impacto
1. **Zero Asserções Executadas (Falso Positivo):** O bloco `describe('com fallback monospace genérico (...)')` configura um spy de métricas via `mockMonospaceFallbackMetrics()`, atribuindo uma largura relativa de glifo de `0.75em`. Para a prop `date: '1230'`, formatada internamente como `'12/30'` (5 caracteres), com tamanho de fonte `28px` declarado no `<text>` SVG, a largura natural calculada é `5 * 28 * 0.75 = 105px`. Como `DATE_MAX_WIDTH` é definido como `150px`, a condição `naturalWidth > maxWidth` em `clampTextLength` (`MaxCreditCard.vue:195`) resulta em `false`. Consequentemente, `dateTextLength.value` permanece `undefined` e o atributo SVG `textLength` não é renderizado no elemento (`textLengthAttr === null`). Assim, a condição `if (textLengthAttr !== null)` avalia como `false`, pulando o `expect(...)`. O teste termina com 0 asserções executadas, passando com sucesso sem validar absolutamente nada.
2. **Mascaramento de Regressões:** Se a lógica de medição de validade em `src/components/MaxCreditCard.vue` (`clampTextLength(dateTextEl.value, DATE_MAX_WIDTH, dateTextLength)`) for alterada, quebrada ou acidentalmente removida, esse teste continua passando com status `PASSED` (falso positivo).
3. **Ausência de Teste para o Comportamento de Clamping Real:** O componente possui a regra de clamp para quando o texto da data ultrapassar `DATE_MAX_WIDTH`. No entanto, não há nenhum teste que force o overflow determinístico da data (com fontes largas) para validar se o atributo `textLength` é de fato atribuído com o valor de `DATE_MAX_WIDTH` e `lengthAdjust="spacingAndGlyphs"`.
4. **Fragilidade Estrutural de Testes com `if`:** Asserções sob condicionais em testes unitários representam um anti-padrão grave, pois se a pré-condição não for atendida, o teste passa silenciosamente sem acusar falha.

### Causa Raiz Comprovada
- **Localização Exata:** `tests/components/MaxCreditCard.test.ts:143-154`
- **Trecho de Código Defeituoso:**
  ```typescript
  143:         it('validade cabe na caixa reservada', async () => {
  144:             const wrapper = mountCard({ date: '1230' });
  145:             await nextTick();
  146:             await nextTick();
  147: 
  148:             const texts = wrapper.findAll('svg text');
  149:             const dateText = texts[2].element as unknown as SVGTextElement;
  150:             const textLengthAttr = dateText.getAttribute('textLength');
  151: 
  152:             if (textLengthAttr !== null) expect(Number(textLengthAttr)).toBeLessThanOrEqual(DATE_MAX_WIDTH);
  153: 
  154:         });
  ```
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  `Test Runner (Vitest)` ➔ `beforeEach` ativa `mockMonospaceFallbackMetrics()` (`glyphWidthEm = 0.75`) ➔ `mountCard({ date: '1230' })` monta `MaxCreditCard.vue` ➔ `computed: date` gera `'12/30'` (5 caracteres) ➔ `onMounted` dispara `updateAllTextLengths()` ➔ `clampTextLength(dateTextEl.value, DATE_MAX_WIDTH, dateTextLength)` calcula `naturalWidth = 5 * 28 * 0.75 = 105px` ➔ Compara `105 > 150` (`DATE_MAX_WIDTH`), resultando em `false` ➔ `dateTextLength.value` torna-se `undefined` ➔ Template SVG renderiza sem o atributo `textLength` ➔ No teste, `dateText.getAttribute('textLength')` retorna `null` ➔ `if (textLengthAttr !== null)` avalia para `false` ➔ Bloco `expect(...)` é completamente ignorado ➔ Vitest reporta teste aprovado com zero asserções executadas.

---

## Arquivos Afetados

1. `tests/components/MaxCreditCard.test.ts` — Refatoração do teste `'validade cabe na caixa reservada'` para asserções incondicionais e determinísticas, e inclusão de teste complementar para validação do clamping de validade sob overflow de fonte.

---

## Execuções Propostas

### 1. Refatoração do Teste `'validade cabe na caixa reservada'` em `tests/components/MaxCreditCard.test.ts`
- Eliminar a condicional `if (textLengthAttr !== null)`.
- Adicionar asserções incondicionais e verificáveis:
  1. Validar o conteúdo textual renderizado: `expect(dateText.textContent).toBe('12/30');`.
  2. Validar que a largura natural calculada cabe na caixa:
     ```typescript
     const naturalWidth = dateText.getComputedTextLength();
     expect(naturalWidth).toBeLessThanOrEqual(DATE_MAX_WIDTH);
     ```
  3. Validar a regra de negócio do componente: quando o texto já cabe naturalmente (105px <= 150px), `textLength` NÃO deve ser aplicado para evitar deformação ou esticamento artificial (comportamento idêntico ao já validado para o nome em `nome curto não recebe textLength quando já cabe`):
     ```typescript
     expect(textLengthAttr).toBeNull();
     ```
  4. Validar que a largura efetiva respeita o limite:
     ```typescript
     const effectiveWidth = textLengthAttr !== null ? Number(textLengthAttr) : naturalWidth;
     expect(effectiveWidth).toBeLessThanOrEqual(DATE_MAX_WIDTH);
     ```

### 2. Adição de Teste Determinístico para Clamping de Validade sob Overflow
- Adicionar um novo teste no mesmo bloco `com fallback monospace genérico`:
  ```typescript
  it('validade com fonte muito larga é clampada à caixa reservada', async () => {
      // Glifo largo para garantir overflow determinístico na validade (5 * 28 * 1.2 = 168 > 150).
      mockTextMetrics(1.2);

      const wrapper = mountCard({ date: '1230' });
      await nextTick();
      await nextTick();

      const texts = wrapper.findAll('svg text');
      const dateText = texts[2].element as unknown as SVGTextElement;
      const textLengthAttr = dateText.getAttribute('textLength');

      expect(textLengthAttr).not.toBeNull();
      expect(Number(textLengthAttr)).toBe(DATE_MAX_WIDTH);
      expect(dateText.getAttribute('lengthAdjust')).toBe('spacingAndGlyphs');
  });
  ```
- Essa inclusão equipara a cobertura da validade à que já existe para o CVV (`CVV de 4 dígitos com fonte muito larga é clampado à caixa reservada`, L174-187), garantindo que tanto a ausência de clamp em textos curtos quanto a presença de clamp sob overflow sejam testadas de forma incondicional.

### 3. Conformidade de Código e Estilo
- Seguir o padrão de indentação de 4 espaços do projeto e regras do `eslint.config.js`.

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha / Falso Positivo)
- **Cenário 1 — Verificação de ausência de asserções:**
  Inserir `expect.hasAssertions()` no início do teste original `'validade cabe na caixa reservada'`:
  ```typescript
  it('validade cabe na caixa reservada', async () => {
      expect.hasAssertions();
      const wrapper = mountCard({ date: '1230' });
      await nextTick();
      await nextTick();

      const texts = wrapper.findAll('svg text');
      const dateText = texts[2].element as unknown as SVGTextElement;
      const textLengthAttr = dateText.getAttribute('textLength');

      if (textLengthAttr !== null) expect(Number(textLengthAttr)).toBeLessThanOrEqual(DATE_MAX_WIDTH);
  });
  ```
  Ao executar `npx vitest run tests/components/MaxCreditCard.test.ts`, o teste falhará com erro indicando que nenhuma asserção foi invocada (`expected at least one assertion, but none was called`).
- **Cenário 2 — Sensibilidade a quebras no componente:**
  Caso a medição de data em `src/components/MaxCreditCard.vue:201` seja comentada (`// clampTextLength(dateTextEl.value, DATE_MAX_WIDTH, dateTextLength)`), o teste com overflow (`mockTextMetrics(1.2)`) falhará imediatamente acusando que `textLength` esperado não foi atribuído.

### 2. Etapa Green (Validação Pós-Refatoração)
- Com o teste refatorado (asserções incondicionais) e o teste de overflow adicionado:
  - O teste `'validade cabe na caixa reservada'` executa asserções determinísticas sobre o valor do texto, a largura natural, a ausência de `textLength` desnecessário e a conformidade da largura efetiva.
  - O teste `'validade com fonte muito larga é clampada à caixa reservada'` valida o comportamento de contenção e o atributo `lengthAdjust="spacingAndGlyphs"`.
  - Ambos passam com status `PASSED` de forma sólida e sem condicionais.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração exclusiva na suíte de testes de componentes frontend).

---

## Riscos de Quebra e Não-Regressão

- **Contrato de Componente:** Nenhum. Nenhuma alteração é efetuada no componente de produção `MaxCreditCard.vue`.
- **Integridade da Suíte de Testes:** Assegura que regressões no layout do SVG e no cálculo de medição de validade do cartão de crédito sejam detectadas automaticamente pela suíte de CI/CD.
- **Não-Regressão:** Todos os outros 24 testes existentes em `tests/components/MaxCreditCard.test.ts` continuarão sendo executados e validados.

---

## Validação

- **Execução dos Testes Unitários de MaxCreditCard:**
  ```bash
  npx vitest run tests/components/MaxCreditCard.test.ts
  ```
- **Execução da Suíte Completa de Testes:**
  ```bash
  npm test
  ```
- **Checagem Estática de Tipos TypeScript:**
  ```bash
  npm run type-check
  ```
- **Validação de Estilo e Linter:**
  ```bash
  npm run lint
  ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices`
- `planning-with-files`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `tdd`
- `superpowers`
- `code-review`
- `production-code-audit`
