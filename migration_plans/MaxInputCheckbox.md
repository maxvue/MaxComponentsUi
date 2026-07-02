# Plano de Migração — MaxInputCheckbox

> Plano autossuficiente para uma IA futura executar a remoção da dependência do PrimeVue no
> componente `MaxInputCheckbox`, preservando API pública, estilos e comportamento.
> **Não** foi feita nenhuma alteração de código na geração deste plano.

---

## 1. Componente

- **Nome:** `MaxInputCheckbox`
- **Arquivo:** `src/components/MaxInputCheckbox.vue`
- **Export:** `src/index.ts` linha 53 — `export { default as MaxInputCheckbox } from './components/MaxInputCheckbox.vue';`
- **Aliases (auto-import):** definidos em `src/components-manifest.json` — `MaxInputCheckbox`,
  `max_input_checkbox`, `max-input-checkbox`, `InputCheckbox`, `input_checkbox`, `input-checkbox`.
  **Não regenerar o manifest** (nenhum arquivo `.vue` novo é criado nesta migração).
- **Nível de dificuldade:** `baixa`

### Código-fonte atual (referência integral)

```vue
<template>
    <div :class="`max-check-box ${!label ? 'no-label' : ''}`" >
        <Checkbox v-bind="props" v-model="temp_value" :inputId="id" binary class="check-box" />
        <div class="label-checkbox" v-if="label">{{ label }}</div>
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, watch } from 'vue';
    import Checkbox from 'primevue/checkbox';

    const id = Random();

    const props = withDefaults(
        defineProps<{
            modelValue: boolean;
            label?: string;
        }>(),
        { modelValue: false }
    );

    const temp_value = ref(props.modelValue);
    const emit = defineEmits(['update:modelValue']);

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch( () => props.modelValue, (val) => temp_value.value = val);
</script>

<style lang="scss">
    .max-check-box {
        display: grid;
        grid-template-columns: auto 1fr;
        place-items: center start;
        gap: 0.5rem;

        &[circle] {
            .p-checkbox-box {
                border-radius: 50%;
            }
        }

        &.no-label {
            gap: 0;
        }

        .label-checkbox {
            color: var(--primary-750);
            font-size: 0.955rem;
            font-weight: 400;
            text-align: left;
        }
    }
</style>
```

---

## 2. Dependências do PrimeVue (trechos reais)

Única dependência PrimeVue:

- **Import:** `import Checkbox from 'primevue/checkbox';` (script, linha 11)
- **Uso no template:**

  ```vue
  <Checkbox v-bind="props" v-model="temp_value" :inputId="id" binary class="check-box" />
  ```

  - `v-bind="props"` — repassa `modelValue` e `label` ao componente PrimeVue (na prática só
    `modelValue` é consumido pelo Checkbox; `label` é ignorado por ele mas exibido pela `<div>`).
  - `v-model="temp_value"` — binding bidirecional via `modelValue`/`update:modelValue` do Checkbox.
  - `:inputId="id"` — aplica o `id` gerado ao `<input type="checkbox">` interno do PrimeVue.
  - `binary` — modo booleano (`true`/`false`), em vez de modo array/grupo.
  - `class="check-box"` — classe aplicada ao wrapper do PrimeVue.

- **Dependência de estilo PrimeVue:** o SCSS usa o seletor interno `.p-checkbox-box` (para o
  modificador `[circle]`, que arredonda a caixa). Esse seletor **deixa de existir** após a
  migração e deve ser substituído por um seletor da nova marcação.
- **Tema:** a aparência visual (borda, cor de fundo quando marcado, ícone de "check") vem do preset
  `MaxStyle` (`src/styles/style.ts`) aplicado ao componente `checkbox` do PrimeVue. **Não há
  override customizado de checkbox** em `src/styles/style.ts` — a aparência é a do tema PrimeVue
  usando os tokens `--primary-*`. A nova implementação precisa recriar esse visual manualmente
  (ver seção 7).

---

## 3. Dependências internas

- **`@maxvue/max-use` → `Random`**
  - Import: `import { Random } from '@maxvue/max-use';`
  - Fonte real: `../MaxUse/src/Helpers/Strings/random.ts` (função `Random`, linha 17).
  - Uso: `const id = Random();` — chamada sem argumentos ⇒ gera string de **20 caracteres
    minúsculos** (`arg1 = 20`, `arg2 = 'letter lower'`). Usada para o `id` do `<input>` e para
    associar o `<label for="...">`.
  - **PRESERVAR** exatamente: continuar usando `Random()` sem argumentos. Não trocar por
    `crypto.randomUUID()`, `useId()` do Vue nem outra fonte de id.
- **Vue:** `ref`, `watch` (já usados; permanecem).
- **Sem `InputBase`:** este componente **NÃO** usa `src/components/InputBase.vue`. Portanto **não
  depende** da migração do `InputBase` e pode ser migrado de forma independente/antecipada.
- **Sem stores** (`useIconStore`, `usePopoverStore`, `useToastStore`) e **sem** outros componentes Max.
- **Consumidores internos a não quebrar:**
  - `src/components/MaxTableFields.vue` (linha 55) usa
    `<MaxInputCheckbox :modelValue=... @update:modelValue=... w-full />`.
    ⇒ O contrato `modelValue` + `update:modelValue` **precisa** ser mantido, e atributos utilitários
    como `w-full` devem continuar caindo no elemento raiz (herança de atributos — ver seção 10).

---

## 4. API pública a preservar

Contrato observável que **NÃO** pode mudar (migração transparente para quem consome a lib):

| Item | Assinatura atual | Observações |
|------|------------------|-------------|
| Prop `modelValue` | `modelValue: boolean` (default `false`) | v-model. |
| Prop `label` | `label?: string` | Quando ausente/falsy, aplica classe `no-label` (remove o gap) e **não** renderiza a `<div class="label-checkbox">`. |
| Emit | `update:modelValue` (payload `boolean`) | Emitido quando o valor interno muda. |
| v-model | `v-model` padrão (`modelValue` / `update:modelValue`) | Deve continuar funcionando bidirecionalmente. |
| Sincronização externa | `watch(() => props.modelValue, ...)` | Alteração externa de `modelValue` reflete no estado interno. |
| Slots | Nenhum | Não introduzir slots novos. |
| Atributo `circle` | Modificador CSS `[circle]` no wrapper | Passar `circle` no componente arredonda a caixa (era `.p-checkbox-box`). Manter esse comportamento visual. |
| Classes/atributos herdados | `w-full`, `class`, etc. caem no elemento raiz | Ver seção 10 sobre `inheritAttrs`. |
| Estrutura de classes CSS externas | `.max-check-box`, `.no-label`, `.label-checkbox`, `.check-box` | São classes públicas usáveis por apps consumidoras — **manter os mesmos nomes**. |

Estado interno atual (manter comportamento equivalente):
- `temp_value` = cópia local inicializada com `props.modelValue`.
- `watch(temp_value)` → emite `update:modelValue`.
- `watch(props.modelValue)` → atualiza `temp_value`.

> Nota sobre nome de export: a lib expõe também o alias `InputCheckbox`. Não alterar exports/aliases.

---

## 5. Estratégia de substituição

Substituição **100% nativa** (sem biblioteca headless). O `<Checkbox binary>` do PrimeVue é
equivalente a um `<input type="checkbox">` HTML controlado por booleano.

- Trocar `import Checkbox from 'primevue/checkbox'` + `<Checkbox .../>` por um
  `<input type="checkbox">` nativo estilizado via CSS.
- Ligar o estado ao `<input>`:
  - `:checked="temp_value"` + `@change="onChange"` **ou** `v-model="temp_value"` diretamente no
    `<input type="checkbox">` (o `v-model` nativo do Vue em checkbox binário usa `checked`/`change`
    e funciona com boolean). Recomenda-se **`v-model="temp_value"`** para manter a lógica de
    `watch` idêntica ao código atual (o watcher em `temp_value` já cuida do emit).
- `:inputId="id"` → aplicar `:id="id"` no `<input>` e associar a `<div class="label-checkbox">`
  substituindo-a por `<label class="label-checkbox" :for="id">` (melhora acessibilidade e mantém o
  clique no texto marcando a caixa — comportamento que o PrimeVue já oferecia via `inputId`).
- `binary` → não precisa de equivalente; `<input type="checkbox">` com boolean já é binário.
- `v-bind="props"` → **remover**. Ele existia só para repassar `modelValue`; agora o `v-model`
  local resolve isso. Não repassar `label` ao input (não faz sentido como atributo do input).
- O modificador `[circle]` (antes atacava `.p-checkbox-box`) passa a atacar o novo elemento visual
  da caixa (ver seção 7).

Nenhuma dependência headless é necessária. Nível `baixa` confirmado.

---

## 6. Passos de implementação

Executar editando **apenas** `src/components/MaxInputCheckbox.vue`. Manter convenções: indentação
de 4 espaços, aspas simples, ponto e vírgula, sem trailing commas, ordem Template → Script → Style.

1. **Remover o import do PrimeVue:** apagar `import Checkbox from 'primevue/checkbox';`.
2. **Script — manter a lógica de estado** intacta (`Random`, `props`, `temp_value`, os dois
   `watch`, o `emit`). Nenhuma mudança de tipos é necessária.
3. **Adicionar `defineOptions({ inheritAttrs: false })`** (ver seção 10) e vincular `v-bind="$attrs"`
   explicitamente ao elemento raiz `<div class="max-check-box">`, para preservar o comportamento de
   atributos utilitários (`w-full`, `class`, `circle`) caírem no wrapper como acontece hoje.
   - Atenção: `circle` deve continuar chegando ao **wrapper** (o seletor SCSS é `.max-check-box[circle]`).
     Com `inheritAttrs: false` + `v-bind="$attrs"` no wrapper, isso é garantido.
4. **Template — substituir o `<Checkbox>`** por um checkbox nativo. Estrutura sugerida (recria a
   caixa visual via elemento próprio para poder estilizar o "check" e o modo `circle`):

   ```vue
   <template>
       <div :class="`max-check-box ${!label ? 'no-label' : ''}`" v-bind="$attrs">
           <input
               :id="id"
               v-model="temp_value"
               type="checkbox"
               class="check-box"
           />
           <label v-if="label" class="label-checkbox" :for="id">{{ label }}</label>
       </div>
   </template>
   ```

   - Manter a classe `check-box` no input e a classe `max-check-box`/`no-label` no wrapper.
   - Trocar a `<div class="label-checkbox">` por `<label class="label-checkbox" :for="id">` para
     associar clique↔input (melhoria de acessibilidade que o PrimeVue já dava). Se preferir risco
     zero de regressão visual/estrutural, pode manter `<div>` — porém `<label :for>` é recomendado.
5. **Estilos — recriar a aparência da caixa** (seção 7). Remover a regra que referencia
   `.p-checkbox-box` e substituí-la por regra sobre `.check-box` (o `<input>`), usando
   `appearance: none` e pseudo-elemento/estados para desenhar borda, preenchimento marcado e o
   "check".
6. **Verificar tipos:** `npm run type-check`.
7. **Lint/estilo:** `npm run lint` (ESLint + Stylelint com auto-fix).
8. **Testes:** rodar a suíte (`npm run test`) e, idealmente, criar o teste dedicado da seção 8.
9. **Confirmar** que nenhum `import` de `primevue` restou no arquivo:
   `grep -n "primevue" src/components/MaxInputCheckbox.vue` deve retornar vazio.

---

## 7. Estilos

Objetivo: reproduzir o checkbox atual (borda arredondada leve, cor primária quando marcado, ícone
de check branco) usando tokens do tema Max, já que a aparência vinha do preset PrimeVue e **não** de
override próprio.

### Regras a preservar do SCSS atual (sem alteração de intenção)

```scss
.max-check-box {
    display: grid;
    grid-template-columns: auto 1fr;
    place-items: center start;
    gap: 0.5rem;

    &.no-label { gap: 0; }

    .label-checkbox {
        color: var(--primary-750);
        font-size: 0.955rem;
        font-weight: 400;
        text-align: left;
    }
}
```

### Substituir o bloco `[circle] .p-checkbox-box`

Antes:

```scss
&[circle] {
    .p-checkbox-box { border-radius: 50%; }
}
```

Depois (ataca o novo input estilizado):

```scss
&[circle] {
    .check-box { border-radius: 50%; }
}
```

### Nova estilização do `<input class="check-box">`

Adicionar (dimensões/tokens aproximados do tema PrimeVue padrão — ajustar visualmente até bater com
o antes/depois; usar variáveis do tema Max `--primary-*`, `--background-*`):

```scss
.check-box {
    appearance: none;
    -webkit-appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    margin: 0;
    border: 1px solid var(--primary-300);
    border-radius: 4px;
    background: var(--background-0);
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: background 0.15s, border-color 0.15s;

    &:hover { border-color: var(--primary-400); }

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--primary-200);
    }

    &::after {
        content: '';
        width: 0.375rem;
        height: 0.625rem;
        border: solid var(--background-0);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg) scale(0);
        transition: transform 0.1s;
    }

    &:checked {
        background: var(--primary-500);
        border-color: var(--primary-500);
    }

    &:checked::after { transform: rotate(45deg) scale(1); }
}
```

Notas:
- **Não** hardcodar cores hex — usar as CSS variables do tema Max (`var(--primary-500)`,
  `var(--primary-300)`, `var(--background-0)`, etc.), conforme convenção do projeto (CLAUDE.md → Styling).
- Consultar `src/styles/style.ts` (preset `MaxStyle`) e a skill `frontend-design-best-practices`
  para casar cor/tamanho/raio com o visual PrimeVue original. Fazer comparação visual lado a lado.
- O bloco `<style lang="scss">` **não** é `scoped` no original — manter sem `scoped` para não mudar
  o alcance das classes públicas.
- UnoCSS: o atributo `w-full` (usado por `MaxTableFields`) é uma regra utilitária do preset Max;
  ele continua funcionando ao cair no wrapper via `v-bind="$attrs"`.

---

## 8. Testes / verificação

**Não existe** teste dedicado hoje (`tests/components/MaxInputCheckbox.test.ts` ausente). Setup
global em `tests/setup.ts` fornece PrimeVue + Pinia, mocka `fetch`, `localStorage`,
`getComputedStyle`, `virtual:uno.css`, e stub de diretivas. Vitest + `@vue/test-utils` + `happy-dom`.

Criar `tests/components/MaxInputCheckbox.test.ts` cobrindo o contrato preservado:

1. **Renderização com label:** `label: 'Aceito'` → existe `.label-checkbox` com o texto; wrapper
   **não** tem classe `no-label`.
2. **Renderização sem label:** sem `label` → **não** existe `.label-checkbox`; wrapper tem classe
   `no-label`.
3. **`modelValue` inicial:** `modelValue: true` → o `<input type="checkbox">` está `checked`.
4. **v-model / emit:** simular `input.setChecked(true)` (ou disparar `change`) → componente emite
   `update:modelValue` com `true`; depois `false` emite `false`.
5. **Reatividade externa:** `wrapper.setProps({ modelValue: true })` → `input.element.checked === true`.
6. **`id` gerado:** o `<input>` possui um `id` não vazio e a `<label>` (se usada) tem `for` igual ao
   `id` do input.
7. **Modificador `circle`:** montar com atributo `circle` → o atributo cai no wrapper `.max-check-box`
   (assert `wrapper.attributes('circle')` presente) — garante que o seletor `[circle]` continua válido.
8. **Sem PrimeVue:** (opcional/estático) garantir que o componente não importa `primevue/checkbox`.

Verificações de linha de comando:
- `npx vitest run tests/components/MaxInputCheckbox.test.ts`
- `npm run type-check`
- `npm run lint`
- `grep -n "primevue" src/components/MaxInputCheckbox.vue` → vazio.

Checklist manual (playground — `npm run dev:playground`):
- Clicar na caixa e no texto do label alterna o valor.
- Estado marcado mostra fundo primário + check branco; foco via teclado mostra anel de foco.
- Com atributo `circle`, a caixa fica redonda.
- Em `MaxTableFields` com `col.input === 'checkbox'`, a coluna continua funcional e `w-full` aplica largura total no wrapper.

---

## 9. Skills necessárias

Selecionadas em `.claude/skills` (prefixo `vue-` priorizado, conforme `migration_plan.md`):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (estrutura de `.vue`, exports/aliases, padrões de componentes Max); base obrigatória.
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `Random` e demais
  utilitários de `@maxvue/max-use` que devem ser preservados.
- `.claude/skills/vue-inputs-masks-validation-best-practices` — padrões de componentes de input
  (v-model, `update:modelValue`, associação label/id) — núcleo desta migração.
- `.claude/skills/vue-unocss-styling-best-practices` — classes utilitárias/UnoCSS do tema Max
  (ex.: `w-full`) e tokens; garante que os utilitários continuem funcionando no wrapper.
- `.claude/skills/frontend-design-best-practices` — fidelidade visual ao recriar a caixa/check com
  CSS puro, casando com a aparência PrimeVue original.
- `.claude/skills/vue-typescript-best-practices` — tipagem em `<script setup lang="ts">`
  (`defineProps`/`defineEmits`, `defineOptions`).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — padrões de lint/estilo (indentação 4
  espaços, aspas simples, SCSS) exigidos pelo `npm run lint`.
- `.claude/skills/vue-vitest-testing-best-practices` — escrever/rodar o teste dedicado com Vitest +
  `@vue/test-utils` + `happy-dom`.

Não relevantes para este componente (excluídas deliberadamente): virtual scroller, dayjs, uppy,
floating-vue/popovers, keyboard-navigation, pinia, dynamic-components, pdf — nenhuma se aplica a um
checkbox binário simples.

---

## 10. Riscos e pontos de atenção

- **Herança de atributos (`inheritAttrs`) — risco principal:** hoje `MaxTableFields` passa `w-full`
  e o modificador `circle` é usado no wrapper. Sem `defineOptions({ inheritAttrs: false })` +
  `v-bind="$attrs"` no `<div>` raiz, atributos poderiam cair no `<input>` (novo "único elemento
  raiz herdeiro") em vez do wrapper, quebrando `w-full`, `class` extra e o seletor
  `.max-check-box[circle]`. **Sempre** ancorar `$attrs` explicitamente no wrapper.
- **Seletor `.p-checkbox-box` deixa de existir:** qualquer app consumidora que dependa desse seletor
  interno do PrimeVue para customizar a caixa vai parar de funcionar. Isso é inerente à saída do
  PrimeVue; documentar como breaking cosmético se necessário. O `[circle]` interno já é remapeado
  para `.check-box`.
- **Aparência vinha do tema, não do componente:** como não há override de checkbox em
  `src/styles/style.ts`, é preciso **recriar** o visual manualmente. Fazer comparação lado a lado
  (antes PrimeVue × depois nativo) para tamanho, raio, cor marcada e ícone de check.
- **`v-model` nativo em checkbox:** garantir uso de `type="checkbox"` com boolean; `v-model` nativo
  do Vue usa `checked`/`change` — comportamento correto para binário. Não usar `:value`/array.
- **Preservar `Random()` sem argumentos:** id de 20 chars minúsculos. Não substituir por outra fonte
  de id (mudaria o comportamento e potencialmente snapshots/expectativas).
- **Bloco `<style>` não-scoped:** manter sem `scoped`; as classes são públicas.
- **Ordem/dependências:** este componente **não** depende de `InputBase` nem de stores — pode ser
  migrado independentemente e antes dos inputs baseados em `InputBase`. Não bloqueia nem é bloqueado.
- **Consumidor `MaxTableFields.vue`:** revalidar a coluna de checkbox após a migração (contrato
  `modelValue`/`update:modelValue` + `w-full`).
```