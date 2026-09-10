# Plano de Implementação — Issue #85

## Descrição e Causa Raiz

### Problema
Durante auditoria automatizada (2026-09-10, lente 10 — Regra de Negócio), foi identificada uma falha crítica de integridade de formulários e estados de permissão no componente [`MaxInputCheckbox`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue):

O componente define explicitamente `defineOptions({ inheritAttrs: false })` e repassa `$attrs` via `v-bind="$attrs"` exclusivamente para a `<div>` raiz externa (`max-input-checkbox max-check-box`). A tag interna nativa `<input type="checkbox">` não recebe `$attrs` nem declara em `defineProps` atributos fundamentais de controle de formulário como `disabled`, `name` ou `required`.

Consequentemente:
1. Ao declarar `<MaxInputCheckbox v-model="form.aceite" :disabled="true" />` ou `<MaxInputCheckbox v-model="form.aceite" disabled />`, o atributo `disabled` é aplicado apenas na `<div>` externa (um container `HTMLDivElement` que não possui semântica nativa de desabilitação em navegadores), deixando a tag `<input type="checkbox">` nativa completamente ativa, focável e interativa.
2. O usuário final consegue clicar diretamente no checkbox (ou acioná-lo via tecla de espaço ao focar, ou até mesmo clicar no `<label>` correspondente via `for="id"`), alternando o estado booleano do campo.
3. O componente dispara o watcher de `temp_value` e emite `update:modelValue` com o novo valor, violando diretamente bloqueios de edição, travas de telas somente leitura e regras de permissão em formulários desabilitados.
4. No SCSS do componente, não existem seletores de desabilitação (`:disabled`, `&.disabled` ou `&[disabled]`). O cursor permanece com `cursor: pointer` tanto no input quanto no label, os efeitos de `:hover` permanecem disparando alterações visuais de borda e nenhuma alteração de opacidade é aplicada, transmitindo ao usuário a percepção incorreta de que o controle está plenamente editável.

### Causa Raiz Comprovada
- **Localização Exata:**
  - [`src/components/MaxInputCheckbox.vue:2`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L2):
    ```vue
    <div :class="`max-input-checkbox max-check-box ${!label ? 'no-label' : ''}`" v-bind="$attrs">
    ```
    Aplica `$attrs` cegamente no wrapper `<div>`.
  - [`src/components/MaxInputCheckbox.vue:3-8`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L3-L8):
    ```vue
    <input
        :id="id"
        v-model="temp_value"
        type="checkbox"
        class="check-box"
    />
    ```
    O `<input>` não recebe nenhum binding de atributos (`v-bind="inputAttrs"`) nem vinculação com `:disabled`.
  - [`src/components/MaxInputCheckbox.vue:17`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L17):
    ```typescript
    defineOptions({ inheritAttrs: false });
    ```
    Desativa a herança padrão de atributos do Vue 3, exigindo controle explícito manual sobre o destino de cada atributo.
  - [`src/components/MaxInputCheckbox.vue:21-27`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L21-L27):
    ```typescript
    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            label?: string;
        }>(),
        { modelValue: false }
    );
    ```
    Não declara a prop `disabled?: boolean`, impedindo que o Vue capture `:disabled` na tabela de props do componente.
  - [`src/components/MaxInputCheckbox.vue:32`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L32):
    ```typescript
    watch(temp_value, (val) => emit('update:modelValue', val));
    ```
    Emite irrestritamente o evento de alteração mesmo que o componente esteja configurado como desabilitado.
  - [`src/components/MaxInputCheckbox.vue:37-106`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L37-L106):
    Bloco `<style lang="scss" scoped>` desprovido de regras visuais de desabilitação (`opacity`, `cursor: not-allowed`, supressão de hover).

- **Fluxo Causal e Rastreamento Reverso de Dados:**
  1. **UI (Camada de Apresentação):** Uma tela ou modal consumidor instancia `<MaxInputCheckbox v-model="form.concorda" :disabled="isBloqueado" label="Termos" />`.
  2. **Renderização do Componente:** O Vue avalia as props declaradas (`modelValue` e `label`). Como `disabled` não foi declarado como prop e `inheritAttrs: false`, `disabled: true` cai em `$attrs`. A linha 2 aplica `v-bind="$attrs"` no elemento `<div>`. O `<input>` interno é montado sem atributo `disabled` (`input.element.disabled === false`).
  3. **Interação do Usuário:** O usuário final clica no `<input>` ou no `<label>` (que possui `:for="id"`). O navegador reconhece o clique em um controle ativo e dispara o evento nativo `change`.
  4. **Reatividade Interna:** A diretiva `v-model="temp_value"` no `<input>` altera o valor de `temp_value.value`.
  5. **Disparo de Eventos e Stores:** O watcher `watch(temp_value, ...)` emite `emit('update:modelValue', true)`, mutando o estado reativo da view consumidora ou da Pinia Store correspondente.
  6. **Rotas e Backend (Persistência Indevida):** Ao submeter o formulário (ex.: via `apiPostRoute`), a mutação indevida de dados é transmitida ao controller/service no backend e persistida no banco de dados, quebrando a integridade transacional de formulários somente leitura.

---

## Arquivos Afetados

1. [`src/components/MaxInputCheckbox.vue`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue):
   - Adicionar a prop `disabled?: boolean` com valor padrão `false` na interface de `defineProps`.
   - Adicionar computed `isDisabled` que verifica tanto `props.disabled` quanto ocorrências legadas via `attrs.disabled` (para cobrir `:disabled="true"` e `<MaxInputCheckbox disabled />`).
   - Segregar atributos através de computeds:
     - `rootAttrs`: repassa para o wrapper `<div>` classes, estilos e atributos de layout (como `circle`).
     - `inputAttrs`: repassa para o `<input>` nativo atributos de formulário e acessibilidade (`name`, `required`, `tabindex`, `aria-*`, etc.).
   - Vincular `:disabled="isDisabled"` e `v-bind="inputAttrs"` diretamente no `<input type="checkbox">`.
   - Vincular `:disabled="isDisabled ? '' : undefined"` e a classe condicional `disabled` no wrapper `<div>`.
   - Adicionar guarda no watcher de `temp_value` para reverter e não emitir `update:modelValue` caso o componente esteja em estado desabilitado.
   - Adicionar estilização SCSS scoped aninhada respeitando a hierarquia do template para o estado desabilitado (`.max-check-box.disabled`, `.max-check-box[disabled]`, `.check-box:disabled`, `.label-checkbox`), aplicando `opacity: 0.6`, `cursor: not-allowed` e inibição de hover.

2. [`tests/components/MaxInputCheckbox.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/tests/components/MaxInputCheckbox.test.ts):
   - Adicionar testes de unidade para:
     - Repasse do atributo `disabled` para o `<input>` quando passado via prop `:disabled="true"`.
     - Repasse do atributo `disabled` quando passado como atributo boolean `disabled`.
     - Bloqueio de mutação e ausência de emissão de `update:modelValue` ao tentar interagir com o componente desabilitado.
     - Bloqueio de interação ao clicar na `<label>` associada quando desabilitado.
     - Repasse correto de atributos nativos de formulário (`name`, `required`) ao elemento `<input>`.
     - Preservação intacta do repasse do atributo `circle` ao wrapper raiz e comportamento das classes existentes.

3. [`COMPONENTS.md`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/COMPONENTS.md):
   - Atualizar a documentação do `MaxInputCheckbox` na tabela de props para documentar `disabled?: boolean` (padrão `false`).

---

## Execuções Propostas

### 1. Refatoração de `src/components/MaxInputCheckbox.vue`

O componente deve ser atualizado mantendo estritamente as convenções do projeto:
- SFC com ordem obrigatória: 1º `<template>`, 2º `<script setup lang="ts">`, 3º `<style lang="scss" scoped>`.
- Proibição absoluta de classes ou atributos utilitários no template.
- Estilos 100% semânticos em SCSS scoped aninhados espelhando a árvore DOM.
- 4 espaços de indentação e regras do `eslint.config.js`.

```vue
<template>
    <div
        :class="`max-input-checkbox max-check-box ${!label ? 'no-label' : ''} ${isDisabled ? 'disabled' : ''}`"
        :disabled="isDisabled ? '' : undefined"
        v-bind="rootAttrs"
    >
        <input
            :id="id"
            v-model="temp_value"
            type="checkbox"
            class="check-box"
            :disabled="isDisabled"
            v-bind="inputAttrs"
        />
        <label v-if="label" class="label-checkbox" :for="id">{{ label }}</label>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, computed, watch, useAttrs } from 'vue';

    defineOptions({ inheritAttrs: false });

    const attrs = useAttrs();
    const id = Random();

    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            label?: string;
            disabled?: boolean;
        }>(),
        { modelValue: false, disabled: false }
    );

    const isDisabled = computed(() => {
        return Boolean(props.disabled || (attrs.disabled !== undefined && attrs.disabled !== false && attrs.disabled !== 'false'));
    });

    const rootAttrs = computed(() => {
        const { name: _n, required: _r, disabled: _d, tabindex: _t, autofocus: _a, ...rest } = attrs;
        return rest;
    });

    const inputAttrs = computed(() => {
        const { circle: _c, class: _cl, style: _s, disabled: _d, ...rest } = attrs;
        return rest;
    });

    const temp_value = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);

    watch(temp_value, (val) => {
        if (isDisabled.value) {
            temp_value.value = props.modelValue;
            return;
        }
        emit('update:modelValue', val);
    });

    watch(() => props.modelValue, (val) => {
        temp_value.value = val;
    });
</script>

<style lang="scss" scoped>
    .max-check-box {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center start;
        gap: 0.5rem;

        &[circle] {
            .check-box {
                border-radius: 50%;
            }
        }

        &.no-label {
            gap: 0;
        }

        &[disabled],
        &.disabled {
            cursor: not-allowed;

            .label-checkbox {
                cursor: not-allowed;
                opacity: 0.6;
            }

            .check-box {
                cursor: not-allowed;
                opacity: 0.6;
                pointer-events: none;
            }
        }

        .label-checkbox {
            color: var(--primary-750);
            font-size: 0.955rem;
            font-weight: 400;
            text-align: left;
            cursor: pointer;
        }

        .check-box {
            appearance: none;
            width: 1.25rem;
            height: 1.25rem;
            margin: 0;
            border: 1px solid var(--background-400);
            border-radius: 4px;
            background: var(--background-200);
            cursor: pointer;
            display: grid;
            place-items: center;
            transition: background 0.15s, border-color 0.15s;

            &:hover:not(:disabled) {
                border-color: var(--background-500);
            }

            &:focus-visible {
                outline: none;
                box-shadow: 0 0 0 2px var(--blue-200);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.6;
                pointer-events: none;
            }

            &::after {
                content: '';
                width: 0.375rem;
                height: 0.625rem;
                border: solid var(--background-0);
                border-width: 0 2px 2px 0;
                transform: rotate(45deg) scale(0);
                transition: transform 0.1s;
                margin: 0 0 1px;
            }

            &:checked {
                background: var(--blue-750);
                border-color: var(--blue-750);
            }

            &:checked::after {
                transform: rotate(45deg) scale(1);
            }
        }
    }
</style>
```

### 2. Atualização de `tests/components/MaxInputCheckbox.test.ts`

Preservar integralmente os 7 testes existentes e adicionar novos testes de contrato:
1. `it('repassa atributo disabled para o input nativo quando desabilitado via prop')`
2. `it('repassa atributo disabled para o input nativo quando desabilitado via attrs')`
3. `it('impede emissao de update:modelValue quando interage com componente desabilitado')`
4. `it('repassa atributos de formulario (name, required) para o input nativo')`
5. `it('aplica classe disabled no wrapper quando desabilitado')`

### 3. Atualização da Documentação em `COMPONENTS.md`

Adicionar na tabela de props do componente `MaxInputCheckbox`:
```markdown
| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `modelValue` | `boolean` | `false` | Estado do checkbox (v-model) |
| `label` | `string` | — | Texto exibido ao lado do checkbox |
| `disabled` | `boolean` | `false` | Desabilita a interação com o checkbox |
```

---

## Especificação de Teste TDD (Red-Green)

### 1. Etapa Red (Comprovação da Falha antes da Modificação)
- **Teste de reprodução Red:**
  ```typescript
  it('aplica atributo disabled ao input e impede alteração quando desabilitado', async () => {
      const wrapper = mount(MaxInputCheckbox, {
          props: { modelValue: false, disabled: true }
      });
      const input = wrapper.find<HTMLInputElement>('input[type="checkbox"]');
      expect(input.attributes('disabled')).toBeDefined();
      expect(input.element.disabled).toBe(true);

      await input.trigger('click');
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
  ```
- **Comportamento Red observado:**
  - Na versão atual do arquivo [`src/components/MaxInputCheckbox.vue:3-8`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/src/components/MaxInputCheckbox.vue#L3-L8), o `<input>` não possui `:disabled`.
  - `input.attributes('disabled')` resulta em `undefined`.
  - `input.element.disabled` resulta em `false`.
  - O teste falha com: `AssertionError: expected undefined to be defined`.

### 2. Etapa Green (Validação Pós-Implementação)
- Após a correção cirúrgica:
  - O elemento nativo `<input>` recebe `:disabled="true"`.
  - `input.attributes('disabled')` é definido.
  - `input.element.disabled` é `true`.
  - Tentativas de acionamento não emitem `update:modelValue`.
  - O teste Red passa com status `PASSED`.

---

## Banco de dados

- **Nenhuma** migration necessária (biblioteca de componentes UI puramente front-end).

---

## Riscos de quebra e Não-Regressão

- **Compatibilidade Retroativa com Consumidores Existentes:**
  - Aplicações que passavam `disabled` ou `:disabled="true"` como atributo não declarado (que antes caía na `<div>`) continuarão funcionando sem quebra: a `<div>` continuará recebendo a classe `disabled` e o atributo `disabled`, enquanto o `<input>` nativo agora também será devidamente desabilitado.
  - O atributo `circle` continua sendo passado ao wrapper `<div>` (`rootAttrs`), garantindo total compatibilidade com o teste pré-existente (`wrapper.attributes('circle')`).
- **Suíte de Testes:**
  - Os 7 testes unitários existentes em [`tests/components/MaxInputCheckbox.test.ts`](file:///home/johnattas/GitHub/MaxComponentsUi/.max-code-worktrees/wt-implement-issue-85/tests/components/MaxInputCheckbox.test.ts) permanecerão verdes.
  - A suíte global da biblioteca (`npx vitest run`) não sofrerá nenhuma regressão.
- **Tipagem TypeScript e Linting:**
  - `npm run type-check` sem erros de tipo.
  - `npm run lint` sem violações de ESLint ou Stylelint.

---

## Validação

1. **Execução dos Testes Unitários de `MaxInputCheckbox`:**
   ```bash
   npx vitest run tests/components/MaxInputCheckbox.test.ts
   ```
2. **Execução da Suíte Completa de Testes:**
   ```bash
   npm run test
   ```
3. **Checagem de Tipagem TypeScript:**
   ```bash
   npm run type-check
   ```
4. **Validação Estática de Linters (ESLint e Stylelint):**
   ```bash
   npx eslint src/components/MaxInputCheckbox.vue tests/components/MaxInputCheckbox.test.ts
   npx stylelint src/components/MaxInputCheckbox.vue
   ```

---

## Skills Aplicáveis

- `vue-components`
- `vue-max-stack-frontend-best-practices`
- `vue-debugging-best-practices`
- `vue-vitest-testing-best-practices`
- `vue-eslint-stylelint-quality-standards`
- `test-driven-development`
- `code-review-and-quality`
- `superpowers`
