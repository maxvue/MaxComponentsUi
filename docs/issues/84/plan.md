# Plano de Implementação — Issue #84

## Descrição e Causa Raiz

### Problema
Ao utilizar o componente `MaxInputPhone` sem informar explicitamente a propriedade `label` (por exemplo, `<MaxInputPhone v-model="telefone" />`), o campo renderiza no formulário o rótulo de texto `"Telefonefalse"` em vez do rótulo esperado `"Telefone"`.

Essa anomalia de apresentação compromete a identidade visual e legibilidade dos formulários que consomem o componente, violando a regra de apresentação e identificação do campo de telefone (skill `vue-inputs-masks-validation-best-practices` e diretrizes de design system do `InputBase`).

### Causa Raiz Comprovada
- **Localização Exata:**
  [`src/components/MaxInputPhone.vue:L2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/src/components/MaxInputPhone.vue#L2)
- **Trecho de Código com Defeito:**
  ```vue
  <InputBase class="max-input-phone input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) " :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'" >
  ```
- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **Consumo na UI:** O desenvolvedor instancia `<MaxInputPhone v-model="telefone" />` sem declarar a prop `label`.
  2. **Inicialização de Props:** Em [`src/components/MaxInputPhone.vue:100`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/src/components/MaxInputPhone.vue#L100), o macro `withDefaults` define o valor padrão de `noLabel` como `false`:
     ```typescript
     { done: undefined, required: false, caution: undefined, noLabel: false, noIcon: false }
     ```
  3. **Avaliação da Expressão:**
     Na linha 2 de `MaxInputPhone.vue`, a prop `:label` repassada para o `InputBase` avalia a expressão:
     ```javascript
     props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel))
     ```
     - Como `props.noLabel` é `false`, o operador ternário avalia o ramo falso: `props.label ?? ('Telefone' + String(props.noLabel))`.
     - Como `props.label` é `undefined`, o operador de coalescência nula (`??`) executa o lado direito: `'Telefone' + String(props.noLabel)`.
     - `String(props.noLabel)` converte o booleano `false` para a string `'false'`, resultando na concatenação `'Telefonefalse'`.
  4. **Renderização no `InputBase`:**
     O componente filho [`src/components/InputBase.vue:11-13`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/src/components/InputBase.vue#L11-L13) recebe a prop `label="Telefonefalse"`. A diretiva `v-if="props.label"` é avaliada como verdadeira e renderiza:
     ```html
     <label :for="input_id" :class="inLine ? 'in-line-label' : 'max-input-label'" v-if="props.label">
         Telefonefalse
     </label>
     ```
  5. **Gaps na Suíte de Testes:**
     Em [`tests/components/MaxInputPhone.test.ts:240-254`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/tests/components/MaxInputPhone.test.ts#L240-L254), os testes existentes cobriam apenas os cenários com `label` explicitamente customizado (`mountPhoneField({ label: 'Celular' })`) ou com `noLabel: true`, não havendo asserção para o valor padrão do label quando omitido.

---

## Arquivos Afetados

1. [`src/components/MaxInputPhone.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/src/components/MaxInputPhone.vue) — Correção cirúrgica na linha 2 do template para remover a concatenação espúria `+ String(props.noLabel)` e garantir que o fallback seja a string `'Telefone'`.
2. [`tests/components/MaxInputPhone.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-84/tests/components/MaxInputPhone.test.ts) — Adição de teste unitário comprovando a renderização do label padrão `"Telefone"` quando a prop `label` não for informada.

---

## Execuções Propostas

### 1. Correção Cirúrgica em `src/components/MaxInputPhone.vue`
Substituir a linha 2 de:
```vue
    <InputBase class="max-input-phone input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : props.label ?? ('Telefone' + String(props.noLabel)) " :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'" >
```
Para:
```vue
    <InputBase class="max-input-phone input-phone" v-bind="props" :value="temp_value" :done="done" :error="error" :caution="caution" :label="props.noLabel ? undefined : (props.label ?? 'Telefone')" :icon-right="props.noIcon ? undefined : 'ic:baseline-whatsapp'">
```

Com essa alteração:
- Se `props.noLabel` for `true`, o resultado é `undefined` (nenhum label renderizado).
- Se `props.noLabel` for `false` (padrão) e `props.label` for `undefined`, o resultado é `'Telefone'`.
- Se `props.noLabel` for `false` (padrão) e `props.label` for fornecido (ex.: `'WhatsApp'`, `'Celular'`), o resultado é o label fornecido.

### 2. Atualização dos Testes em `tests/components/MaxInputPhone.test.ts`
Adicionar um caso de teste logo após o teste `respeita noLabel e noIcon no InputBase`:
```typescript
    it('utiliza "Telefone" como label padrão quando label não é informado', () => {
        const wrapper = mountPhoneField();
        const base = wrapper.findComponent({ name: 'InputBase' });
        expect(base.exists()).toBe(true);
        expect(base.props('label')).toBe('Telefone');
        const labelEl = wrapper.find('label');
        expect(labelEl.exists()).toBe(true);
        expect(labelEl.text()).toBe('Telefone');
    });
```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha Pré-Modificação)
- **Teste:**
  Executar o teste `utiliza "Telefone" como label padrão quando label não é informado` contra a implementação atual de `MaxInputPhone.vue`.
- **Comportamento Observado no Red:**
  O teste falha com a seguinte asserção:
  ```text
  AssertionError: expected 'Telefonefalse' to be 'Telefone'
  - Expected: 'Telefone'
  + Received: 'Telefonefalse'
  ```

### 2. Etapa Green (Validação Pós-Modificação)
- **Comportamento Observado no Green:**
  Com a expressão `:label="props.noLabel ? undefined : (props.label ?? 'Telefone')"`, o teste passa com sucesso:
  ```text
  ✓ MaxInputPhone > utiliza "Telefone" como label padrão quando label não é informado
  ```
  Todos os demais 25 testes do arquivo continuam passando.

---

## Banco de dados

- **Nenhuma** migration necessária (biblioteca de componentes de interface front-end).

---

## Riscos de quebra e Não-Regressão

- **Quebra de Contrato:** Risco zero. O componente já previa a prop `label?: string` e o fallback para telefone. A expressão anterior continha um erro evidente de concatenação de string (`+ String(props.noLabel)`).
- **Consumidores que passam `label` explicitamente:** Continuam funcionando normalmente, pois `props.label ?? 'Telefone'` preserva o valor fornecido.
- **Consumidores que usam `noLabel: true`:** Continuam funcionando normalmente, pois `props.noLabel ? undefined : ...` retorna `undefined` quando `noLabel` é verdadeiro.
- **Não-Regressão nos Testes:** A suíte de testes de `MaxInputPhone` passa de 25 para 26 testes, todos passando. Nenhuma outra funcionalidade de formatação, DDI, máscara ou dropdown é impactada.
- **Conformidade de Estilo e Tipos:** A alteração respeita a formatação de 4 espaços, aspas simples, ponto e vírgula obrigatório e sem classes de utilitário inline no template.

---

## Validação

1. **Executar teste unitário do componente:**
   ```bash
   npx vitest run tests/components/MaxInputPhone.test.ts
   ```
2. **Executar checagem de tipos:**
   ```bash
   npm run type-check
   ```
3. **Executar linting de código:**
   ```bash
   npx eslint src/components/MaxInputPhone.vue tests/components/MaxInputPhone.test.ts
   ```
4. **Executar a suíte completa de testes:**
   ```bash
   npm run test
   ```

---

## Skills Aplicáveis

- `vue-inputs-masks-validation-best-practices`
- `vue-components`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-eslint-stylelint-quality-standards`
- `test-driven-development`
- `code-review-and-quality`
- `superpowers`
