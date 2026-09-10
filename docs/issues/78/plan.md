# Plano de Implementação — Issue #78

## Descrição e Causa Raiz

### Problema
Durante a auditoria automatizada de código (lente 9: Testes — ausência, falha e incorreção), foi identificado que quatro testes unitários no arquivo `tests/components/MaxInputCoordinates.test.ts` passam como **falsos positivos incondicionais**.

Os quatro testes em questão destinam-se a validar que coordenadas geográficas situadas fora dos limites territoriais do Brasil invalidam os campos:
- Linha 42: `it('invalida latitude fora do Brasil (positiva alta: 10.0)')`
- Linha 48: `it('invalida latitude fora do Brasil (negativa extrema: -40.0)')`
- Linha 86: `it('invalida longitude fora do Brasil (-80.0)')`
- Linha 92: `it('invalida longitude positiva (fora do Brasil)')`

#### Agravantes Detectados
1. **Falso Positivo Universal com Coordenadas Válidas:** Se qualquer uma das coordenadas nesses quatro testes for alterada para um valor válido dentro do Brasil (por exemplo, latitude `-23.550520` ou longitude `-46.633309`), o teste continua passando em verde (*green*). O teste passa não porque a coordenada foi invalidada, mas sim porque o estado inicial de `isDone` é `null`.
2. **Cegueira a Regressões Lógicas:** Se a regra de validação geográfica em `MaxInputCoordinateDecimalLat.vue:56` ou `MaxInputCoordinateDecimalLng.vue:56` for corrompida (por exemplo, forçada a `return true`), os quatro testes continuam passando. O ciclo de validação e emissão de status nunca é exercido.
3. **Asserção Excessivamente Permissiva (`.not.toBe(true)`):** O teste utiliza `expect(ib.props('done')).not.toBe(true)`. Como `null !== true` é avaliado como verdadeiro em JavaScript, a asserção é satisfeita antes mesmo de qualquer interação ou validação ocorrer.
4. **Ausência do Disparo de Evento de Interação (`blur`):** Diferente dos testes de sucesso (linhas 24-40 e 77-84), onde `await input.trigger('blur')` é acionado para disparar a função `checkDone()`, os quatro testes de rejeição são síncronos e não disparam o evento de blur no elemento `<input>`.

---

### Causa Raiz Comprovada

#### 1. Arquivos e Linhas Exatos
- **Componente Latitude:** [`src/components/MaxInputCoordinateDecimalLat.vue:48-57`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-78/src/components/MaxInputCoordinateDecimalLat.vue#L48-L57)
- **Componente Longitude:** [`src/components/MaxInputCoordinateDecimalLng.vue:48-57`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-78/src/components/MaxInputCoordinateDecimalLng.vue#L48-L57)
- **Arquivo de Teste:** [`tests/components/MaxInputCoordinates.test.ts:42-52`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-78/tests/components/MaxInputCoordinates.test.ts#L42-L52) e [`tests/components/MaxInputCoordinates.test.ts:86-96`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-78/tests/components/MaxInputCoordinates.test.ts#L86-L96)

#### 2. Código dos Componentes Envolvidos
Nos dois componentes (`MaxInputCoordinateDecimalLat.vue` e `MaxInputCoordinateDecimalLng.vue`), o estado `isDone` e a rotina de validação são implementados da seguinte forma:

```vue
<!-- MaxInputCoordinateDecimalLat.vue / MaxInputCoordinateDecimalLng.vue -->
<template>
    <InputBase v-bind="props" :error="error" :caution="caution" :done="isDone">
        <input
            type="text"
            class="p-inputtext p-component"
            v-model="temp_value"
            v-maska="maskValue"
            @blur="checkDone()"
            placeholder="00,000000"
            :disabled="props.disabled"
        />
    </InputBase>
</template>

<script setup lang="ts">
    // ...
    const isDone: Ref = ref(props.done ?? null);

    const checkDone = () => {
        isDone.value = done.value;
    };

    const done = computed(() => {
        if (props.done !== undefined) return props.done;
        // Validação territorial brasileira de latitude ou longitude
        return !(/* condições de limite */);
    });
</script>
```

#### 3. Fluxo Causal e Rastreamento Reverso de Dados
1. **Montagem do Componente nos Testes (`tests/components/MaxInputCoordinates.test.ts:43, 49, 87, 93`):**
   - A função auxiliar `mountCoord(component, { modelValue })` monta o componente com `props.done = undefined`.
   - Na inicialização do setup, `const isDone: Ref = ref(props.done ?? null)` inicializa a referência reativa `isDone.value` como `null`.
2. **Propagação ao InputBase (`InputBase.vue:2, 34-49`):**
   - O template passa `:done="isDone"` diretamente para o componente `<InputBase>`.
   - Portanto, a prop `done` de `InputBase` recebe `null`.
3. **Ausência da Interação `@blur`:**
   - O gatilho que atualiza `isDone.value` com o resultado do `computed done` reside exclusivamente no evento `@blur` do elemento nativo `<input>` (`@blur="checkDone()"`).
   - Nos quatro testes citados, nenhum evento de `blur` é despachado, nem a função `checkDone()` é chamada.
   - Consequentemente, `isDone.value` permanece `null` durante todo o ciclo de vida do teste.
4. **Execução da Asserção (`expect(ib.props('done')).not.toBe(true)`):**
   - A asserção inspeciona a prop `done` repassada a `InputBase`.
   - O valor retornado é `null`.
   - A verificação `expect(null).not.toBe(true)` resulta em sucesso (*pass*).
   - O teste conclui em verde sem jamais ter executado o validador nem demonstrado que uma coordenada externa ao Brasil foi invalidada pelo componente.

---

## Arquivos Afetados

1. `tests/components/MaxInputCoordinates.test.ts`
   - Tornar assíncronas as funções de teste das linhas 42, 48, 86 e 92 (`async () => { ... }`).
   - Localizar o elemento `<input>` (`wrapper.find('input')`).
   - Disparar o evento de perda de foco (`await input.trigger('blur')`).
   - Substituir a asserção fraca `expect(ib.props('done')).not.toBe(true)` pela asserção estrita `expect(ib.props('done')).toBe(false)`.
   - Ajustar as descrições dos testes para manter consistência com os testes de validação positiva (`após blur`).

---

## Execuções Propostas

### 1. Refatoração dos Testes de Latitude em `tests/components/MaxInputCoordinates.test.ts`

Substituir o bloco das linhas 42 a 52:
```typescript
    it('invalida latitude fora do Brasil (positiva alta: 10.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 10.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('invalida latitude fora do Brasil (negativa extrema: -40.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: -40.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });
```

Pela implementação rigorosa com acionamento do evento de `blur` e asserção estrita de falsidade:
```typescript
    it('invalida latitude fora do Brasil (positiva alta: 10.0) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 10.0 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('invalida latitude fora do Brasil (negativa extrema: -40.0) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: -40.0 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });
```

---

### 2. Refatoração dos Testes de Longitude em `tests/components/MaxInputCoordinates.test.ts`

Substituir o bloco das linhas 86 a 96:
```typescript
    it('invalida longitude fora do Brasil (-80.0)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: -80.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });

    it('invalida longitude positiva (fora do Brasil)', () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: 10.0 });
        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).not.toBe(true);
    });
```

Pela implementação rigorosa com acionamento do evento de `blur` e asserção estrita de falsidade:
```typescript
    it('invalida longitude fora do Brasil (-80.0) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: -80.0 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });

    it('invalida longitude positiva (fora do Brasil) após blur', async () => {
        const wrapper = mountCoord(MaxInputCoordinateDecimalLng, { modelValue: 10.0 });
        const input = wrapper.find('input');
        await input.trigger('blur');

        const ib = wrapper.findComponent(InputBase);
        expect(ib.props('done')).toBe(false);
    });
```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha e Eliminação do Falso Positivo)
Para demonstrar que o teste atual é um falso positivo incondicional e falha em validar o comportamento do componente:
1. **Cenário de Falha 1 (Asserção Estrita sem Blur):**
   Alterar a asserção atual para a asserção estrita correta sem acionar o blur:
   ```typescript
   it('invalida latitude fora do Brasil (positiva alta: 10.0)', () => {
       const wrapper = mountCoord(MaxInputCoordinateDecimalLat, { modelValue: 10.0 });
       const ib = wrapper.findComponent(InputBase);
       expect(ib.props('done')).toBe(false);
   });
   ```
   - **Resultado Red:** O teste falha com `AssertionError: expected null to be false // Object.is equality`.
   - **Evidência:** Prova cabal de que, sem o `blur`, `ib.props('done')` é `null` e a invalidação nunca foi executada.
2. **Cenário de Falha 2 (Coordenada Válida mascarada como Inválida):**
   No teste atual sem blur, substituir o valor `10.0` por `-23.550520` (São Paulo, coordenada válida no Brasil).
   - **Resultado:** O teste atual passa (`expect(ib.props('done')).not.toBe(true)` passa com `null`). Isso comprova que qualquer coordenada passa no teste atual.

### 2. Etapa Green (Validação Conclusiva Pós-Correção)
Ao aplicar as execuções propostas:
1. `mountCoord` monta o componente com a coordenada fora do limite territorial (ex.: latitude `10.0`, `-40.0`; longitude `-80.0`, `10.0`).
2. O evento `@blur` é despachado através de `await input.trigger('blur')`.
3. `checkDone()` é chamado pelo handler do componente e executa `isDone.value = done.value`.
4. O `computed done` calcula que o valor está fora da faixa territorial brasileira e retorna `false`.
5. `isDone.value` torna-se `false` e é repassado via prop `:done` ao `<InputBase>`.
6. A asserção `expect(ib.props('done')).toBe(false)` valida com sucesso que o componente efetivamente rejeitou a coordenada geográfica e sinalizou ao `InputBase`.

---

## Banco de Dados

- **Nenhuma** migration necessária (alteração restrita a testes unitários de componentes frontend Vue 3).

---

## Riscos de Quebra e Não-Regressão

- **Risco de Quebra em Produção:** **Zero.** Nenhum arquivo de produção (`src/**`) ou contrato de API/componente é modificado. Apenas o arquivo de teste `tests/components/MaxInputCoordinates.test.ts` é atualizado.
- **Risco de Quebra de Contrato:** Nenhum. Os componentes `MaxInputCoordinateDecimalLat.vue` e `MaxInputCoordinateDecimalLng.vue` já suportam nativamente a rotina `checkDone()` vinculada ao evento `@blur`, como já é utilizado com sucesso nos testes positivos das linhas 24-40 e 77-84.
- **Garantia de Não-Regressão da Suíte de Testes:**
  - Os 13 testes do arquivo `tests/components/MaxInputCoordinates.test.ts` devem executar e passar com 100% de sucesso.
  - As suítes individuais dedicadas dos dois componentes (`tests/components/MaxInputCoordinateDecimalLat.test.ts` e `tests/components/MaxInputCoordinateDecimalLng.test.ts`) devem continuar passando integralmente.
  - O linter e verificador de tipos devem passar sem apontamentos (`npm run lint` e `npm run type-check`).

---

## Validação

1. **Execução dos Testes Corrigidos de Coordenadas:**
   ```bash
   npx vitest run tests/components/MaxInputCoordinates.test.ts
   ```
2. **Execução das Suítes Complementares de Coordenadas:**
   ```bash
   npx vitest run tests/components/MaxInputCoordinateDecimalLat.test.ts tests/components/MaxInputCoordinateDecimalLng.test.ts
   ```
3. **Checagem de Tipagem TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Checagem de Linter e Estilo de Código:**
   ```bash
   npm run lint
   ```

---

## Skills Aplicáveis

- `systematic-debugging-best-practices` — Diagnóstico rigoroso de causa raiz de testes flaky / falsos positivos através de análise do ciclo de reatividade do Vue.
- `vue-vitest-testing-best-practices` — Padrões estabelecidos para asserções e simulação de eventos em componentes Vue com Vue Test Utils e Vitest (`await input.trigger('blur')`).
- `test-driven-development` — Metodologia Red-Green para comprovação do falso positivo pré-correção e validação do comportamento correto pós-correção.
- `vue-debugging-best-practices` — Análise do estado reativo inicial de refs (`isDone: ref(props.done ?? null)`) versus propriedades computadas (`done: computed(...)`).
- `code-review-and-quality` — Verificação de conformidade com regras de qualidade, contratos de props e garantia de não-regressão.
