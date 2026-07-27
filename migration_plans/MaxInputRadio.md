# Plano de Migração — MaxInputRadio

> Plano autossuficiente para tornar `MaxInputRadio` independente do PrimeVue.
> Uma IA futura deve conseguir executar esta migração lendo **apenas** este arquivo
> e o código-fonte referenciado. **Não** alterar a API pública, os estilos nem o comportamento.

---

## 1. Componente

- **Nome:** `MaxInputRadio`
- **Arquivo:** `src/components/MaxInputRadio.vue`
- **Export:** `src/index.ts:66` → `export { default as MaxInputRadio } from './components/MaxInputRadio.vue';`
- **Aliases (auto-import):** `src/components-manifest.json` já contém
  `MaxInputRadio`, `max_input_radio`, `max-input-radio`, `InputRadio`, `input_radio`, `input-radio`.
  **Não** é necessário regenerar o resolver — o arquivo continua com o mesmo nome e a mesma API.
- **Nível de dificuldade:** `baixa`

### Código-fonte atual (referência integral)

```vue
<template>
    <div class="radio-button-input-main-div" @click="onClick">
        <RadioButton v-bind="attrs" :inputId="id" :name="name ?? 'radio-group'" ref="button" v-model="temp_value" :value="value" />
        <div v-if="attrs.label">{{ attrs.label }}</div>
        <Icon v-if="attrs.icon" :icon="attrs.icon" />
    </div>
</template>

<script setup lang="ts">
    import { Random } from '@maxvue/max-use';
    import { ref, watch, useAttrs } from 'vue';

    const attrs = useAttrs();

    const props = withDefaults(
        defineProps<{
            modelValue: any;
            value?: any;
            name?: string;
        }>(),
        { modelValue: null, value: null }
    );

    const emit = defineEmits(['update:modelValue']);
    const temp_value = ref(props.modelValue);

    watch(temp_value, (val) => emit('update:modelValue', val));

    watch(() => props.modelValue,(val) => temp_value.value = val);

    const id = Random();
    const button = ref();

    const onClick = (e: Event) => {
        if(e && (e.target as HTMLElement).tagName === 'INPUT') return;
        if(button.value && button.value.$el) {
            const input = button.value.$el.querySelector('input');
            if(input) input.click();
        }
    };
</script>

<style lang="scss">
    .radio-button-input-main-div {
        display: grid;
        gap: 10px;
        grid-template-columns: auto 1fr;
        cursor: pointer;
        place-items: center start;
    }
</style>
```

---

## 2. Dependências do PrimeVue (trechos reais — inclui registro global)

Este componente usa PrimeVue **exclusivamente através de registro global** — **não há import
de PrimeVue no `<script setup>`**. O componente `RadioButton` aparece no template sem import local:

```vue
<RadioButton v-bind="attrs" :inputId="id" :name="name ?? 'radio-group'" ref="button" v-model="temp_value" :value="value" />
```

### Como `RadioButton` chega ao template (registro global)

- `MaxInputRadio.vue` **não** importa `RadioButton`. Ele é resolvido em tempo de execução como
  **componente global**.
- O `install()` da lib (`src/index.ts:120-136`) registra o plugin PrimeVue:

  ```ts
  export const install = (app: any, options: any = {}) => {
      app.use(PrimeVue, {
          locale: options.locale || ptBR,
          theme: { preset: MaxStyle, options: { darkModeSelector: '.dark', prefix: 'max', ...options.theme?.options }, ...options.theme },
          ripple: true,
          ...options
      });
      app.directive('tooltip', Tooltip);
  };
  ```

  O `install()` **não** faz `app.component('RadioButton', RadioButton)` explicitamente. O registro
  global de `RadioButton` vem do **app consumidor** (via unplugin/`@primevue/auto-import-resolver`
  ou registro manual) e, nos testes, via a configuração global de PrimeVue em `tests/setup.ts`.
- `RadioButton` também é re-exportado como componente "cru" em `src/prime/index.ts:27`:
  `export { default as RadioButton } from 'primevue/radiobutton';` — esta linha **pode permanecer**
  (é a entrada `./prime`), mas deixa de ser usada por `MaxInputRadio` após a migração.

### Contrato do PrimeVue `RadioButton` que precisa ser reproduzido

Props/atributos efetivamente usados no template e no comportamento:

| Prop PrimeVue | Uso atual | Semântica |
|---|---|---|
| `inputId` | `:inputId="id"` | id aplicado ao `<input type="radio">` interno (para `<label for>`). |
| `name` | `:name="name ?? 'radio-group'"` | agrupa os radios; default `'radio-group'`. |
| `value` | `:value="value"` | valor que este radio representa. |
| `v-model` | `v-model="temp_value"` | valor selecionado do grupo. |
| `v-bind="attrs"` | atributos extras repassados | ex.: `label`, `icon`, `disabled`, classes, `data-*`. |
| `ref="button"` | acesso ao `$el` para `querySelector('input')` | usado em `onClick` para clicar o input interno. |

**Detalhe crítico do `v-model` do PrimeVue RadioButton:** ele só emite o `value` quando é
**selecionado**; radios de um mesmo grupo compartilham o mesmo `v-model` e cada um passa um `value`
distinto. O `<input type="radio">` nativo se comporta de forma equivalente (só o radio marcado
determina o valor do grupo).

---

## 3. Dependências internas

- **`@maxvue/max-use` → `Random`**
  - Import: `import { Random } from '@maxvue/max-use';`
  - Fonte: `../MaxUse/src/Helpers/Strings/random.ts` (função `Random(arg1 = 20, arg2 = 'letter lower')`,
    retorna string aleatória; chamada como `Random()` gera 20 caracteres minúsculos).
  - Uso: `const id = Random();` — gera um id único para ligar `<input id>` ↔ `<label for>`.
  - **Preservar** — continua sendo usado para o `inputId`/`for`.

- **`Icon` (componente global, `@iconify/vue`)**
  - Usado como `<Icon v-if="attrs.icon" :icon="attrs.icon" />`, sem import local (componente global
    registrado pelo app consumidor via `@iconify/vue`).
  - **Preservar** — a migração **não** remove PrimeVue de `Icon` (não é PrimeVue). Manter a tag
    `<Icon>` exatamente como está. Se necessário import explícito para robustez, ver Passo 4.6.

- **`InputBase`**
  - **NÃO** é usado por este componente (confirmado: não há `<InputBase>` no template nem import).
    Portanto **não** há dependência da migração do `InputBase`.

- **Pinia stores / helpers do projeto:** nenhum é usado por este componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Preservar exatamente:

### Props
- `modelValue: any` (default `null`) — valor selecionado do grupo (via `v-model`).
- `value?: any` (default `null`) — valor deste radio específico.
- `name?: string` — nome do grupo; default efetivo `'radio-group'` quando ausente.

### Emits
- `update:modelValue` — emitido quando `temp_value` muda (ou seja, quando este radio é marcado).
  Deve continuar existindo com o **mesmo nome** e a **mesma carga** (o `value` selecionado).

### v-model
- `v-model` mapeado para `modelValue` / `update:modelValue`. Comportamento bidirecional:
  - mudança externa de `modelValue` reflete no estado interno (`watch(() => props.modelValue, ...)`);
  - seleção interna emite `update:modelValue`.

### Slots / atributos repassados (`v-bind="attrs"`)
- Atributos extras devem continuar sendo repassados ao elemento de input (fallthrough).
  Casos usados no template: `attrs.label` (renderiza `<div>{{ attrs.label }}</div>`) e
  `attrs.icon` (renderiza `<Icon :icon="attrs.icon" />`). **Manter ambos.**
- Outros atributos comuns esperados via `attrs`: `disabled`, `class`, `style`, `data-*`, `aria-*`.
  Após a migração, garantir que `disabled` de fato desabilite o `<input type="radio">`.

### Comportamento observável
- **Clique em qualquer parte da linha** (a `div.radio-button-input-main-div`, incluindo o label e o
  ícone) seleciona o radio — comportamento implementado hoje por `onClick` (dispara `input.click()`).
  **Preservar.** A guarda `if (tagName === 'INPUT') return;` evita duplo clique quando o próprio
  input é clicado.
- Layout em grid `auto 1fr` com o controle à esquerda e label/ícone à direita.
- `inputId` único por instância (para acessibilidade e associação label↔input).

---

## 5. Estratégia de substituição

Substituir o `RadioButton` do PrimeVue por um **`<input type="radio">` nativo estilizado**
(sem biblioteca headless — desnecessária para radio). Reproduzir a aparência via CSS
(variáveis do tema Max), preservando `inputId`, `name`, `value` e `v-model`.

**Decisões:**

1. **`<input type="radio">` nativo** com `:id`, `:name`, `:value` e binding de `checked`/`change`
   para reproduzir o `v-model`. Não usar `v-model` diretamente no input nativo porque precisamos
   preservar o fluxo `temp_value` + `emit('update:modelValue')` existente (para não mudar a ordem
   de emissão nem quebrar `attrs` fallthrough). Usar `:checked` + `@change`.
2. **Fallthrough de `attrs`:** continuar usando `useAttrs()` e aplicar `v-bind="attrs"` no `<input>`
   (assim `disabled`, `data-*`, `aria-*` chegam ao controle real). Como `label` e `icon` também
   estão em `attrs`, eles vazariam como atributos do input; para evitar isso e manter o
   comportamento atual (que hoje o PrimeVue absorve), **filtrar `label` e `icon`** de `attrs` antes
   do `v-bind` no input. Ver Passo 4.3.
3. **Clique na linha inteira:** simplificar o `onClick` para acionar o input via `ref` local
   (`inputRef.value?.click()`), mantendo a guarda para não reprocessar cliques no próprio input.
   Alternativa mais limpa (recomendada): envolver tudo num `<label :for="id">`, que nativamente
   propaga o clique ao input — porém isso muda a estrutura DOM (de `div` para `label`) e pode
   afetar seletores/estilos existentes. **Manter a `div` + `onClick` via ref** para máxima
   fidelidade (menor risco). Ver Passo 4.4.
4. **Aparência do radio:** o `<input type="radio">` nativo precisa ser estilizado para parecer o
   RadioButton do tema Max (círculo com borda e ponto interno na cor primária quando marcado).
   Usar `appearance: none` + pseudo-estado `:checked`. Ver seção 7 (Estilos).

**Nada exige biblioteca headless.** Complexidade real: baixa.

---

## 6. Passos de implementação

Ordem executável. Preservar convenções: `<script setup lang="ts">`, indentação de 4 espaços,
aspas simples, ponto e vírgula, sem trailing comma, ordem Template → Script → Style.

**4.1 — Remover a dependência global do PrimeVue no template.**
Trocar a tag `<RadioButton ... />` por um `<input type="radio">` nativo:

```vue
<template>
    <div class="radio-button-input-main-div" @click="onClick">
        <input
            ref="inputRef"
            type="radio"
            class="max-radio-native"
            :id="id"
            :name="name ?? 'radio-group'"
            :value="value"
            :checked="isChecked"
            v-bind="inputAttrs"
            @change="onChange"
        />
        <div v-if="attrs.label">{{ attrs.label }}</div>
        <Icon v-if="attrs.icon" :icon="attrs.icon" />
    </div>
</template>
```

**4.2 — Manter props/emits/`Random` inalterados.**
Não mudar `defineProps`, `withDefaults`, `defineEmits(['update:modelValue'])`, nem `const id = Random();`.

**4.3 — Filtrar `label` e `icon` do fallthrough para o input.**
`label` e `icon` são consumidos pelo template (não são atributos válidos de `<input>`). Criar um
computed que remove essas chaves antes do `v-bind`:

```ts
import { ref, watch, computed, useAttrs } from 'vue';
// ...
const inputAttrs = computed(() => {
    const { label, icon, ...rest } = attrs as Record<string, unknown>;
    return rest;
});
```

**4.4 — Reproduzir o `v-model` sem `v-model` nativo.**
Manter `temp_value` como fonte da verdade interna e derivar `isChecked`:

```ts
const temp_value = ref(props.modelValue);

const isChecked = computed(() => temp_value.value === props.value);

const onChange = () => {
    temp_value.value = props.value;
};

watch(temp_value, (val) => emit('update:modelValue', val));
watch(() => props.modelValue, (val) => temp_value.value = val);
```

- `onChange` só dispara quando o input passa a estar marcado (evento nativo `change` de radio só
  ocorre na seleção), então basta setar `temp_value = props.value`, reproduzindo o comportamento do
  PrimeVue (o radio marcado define o valor do grupo).
- `isChecked` compara com `===` (mesma semântica de igualdade do PrimeVue para valores primitivos;
  ver Riscos para objetos).

**4.5 — Atualizar o `onClick` da linha para usar o ref local.**
Substituir a lógica que acessava `button.value.$el.querySelector('input')` (API do componente
PrimeVue) por um ref direto ao input nativo:

```ts
const inputRef = ref<HTMLInputElement | null>(null);

const onClick = (e: Event) => {
    if (e && (e.target as HTMLElement).tagName === 'INPUT') return;
    inputRef.value?.click();
};
```

Remover o antigo `const button = ref();` (não é mais necessário).

**4.6 — (Opcional, robustez) Import explícito de `Icon`.**
`Icon` hoje é global. Se o objetivo for reduzir dependência de registro global também para o
`Icon`, adicionar `import { Icon } from '@iconify/vue';` no `<script setup>` (o pacote já está em
`package.json`: `@iconify/vue ^5.0.1`). **Não obrigatório** para a independência do PrimeVue;
manter o comportamento atual (global) é aceitável e de menor risco. Decidir conforme padrão adotado
nos demais planos.

**4.7 — Adicionar estilo do radio nativo** (ver seção 7). Manter o bloco `.radio-button-input-main-div`
existente **sem alterações** e acrescentar a regra `.max-radio-native`.

**4.8 — Não tocar em `src/index.ts` nem no manifest.**
O export e os aliases permanecem idênticos. `src/prime/index.ts:27` (re-export cru de `RadioButton`)
pode permanecer — não é usado por este componente após a migração.

**4.9 — Rodar verificação** (seção 8): `npm run type-check`, `npm run lint`, testes.

---

## 7. Estilos

O bloco existente **deve ser preservado** e apenas complementado:

```scss
.radio-button-input-main-div {
    display: grid;
    gap: 10px;
    grid-template-columns: auto 1fr;
    cursor: pointer;
    place-items: center start;
}
```

Adicionar a estilização do `<input type="radio">` nativo para reproduzir o visual do RadioButton do
tema Max (círculo vazado + ponto na cor primária quando marcado). Usar variáveis CSS do tema Max
(`var(--max-primary-500)`, `var(--background-*)`, etc.) — o mesmo padrão usado nos demais componentes
Max. Exemplo de regra a acrescentar no mesmo bloco `<style lang="scss">`:

```scss
.max-radio-native {
    appearance: none;
    -webkit-appearance: none;
    margin: 0;
    width: 20px;
    height: 20px;
    border: 2px solid var(--background-400);
    border-radius: 50%;
    display: grid;
    place-content: center;
    cursor: pointer;
    background: var(--background-0);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::before {
        content: '';
        width: 10px;
        height: 10px;
        border-radius: 50%;
        transform: scale(0);
        transition: transform 0.15s ease;
        background: var(--max-primary-500);
    }

    &:checked {
        border-color: var(--max-primary-500);

        &::before {
            transform: scale(1);
        }
    }

    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--max-primary-500) 25%, transparent);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
    }
}
```

**Fidelidade visual:** confirmar as dimensões (20px), a espessura da borda e as cores exatas contra
o RadioButton renderizado pelo `MaxStyle`. O preset PrimeVue do tema está em `src/styles/style.ts`
(`MaxStyle = definePreset(...)`) e os tokens de cor em `src/themes/`. Não há bloco `radiobutton`
customizado explícito no preset (usa os defaults do tema), então basear-se no valor visual
renderizado (usar o playground para comparar — `npm run dev:playground`). Ajustar tamanhos/cores
para casar pixel-a-pixel com o estado atual.

Regras UnoCSS não são estritamente necessárias aqui (o SCSS scoped cobre tudo), mas podem ser usadas
se preferir (`bg-background-0`, `border-primary-500` etc., conforme `src/presetMaxUno.ts`).

---

## 8. Testes / verificação

Não existe teste dedicado hoje (`tests/components/MaxInputRadio.test.ts` **não** existe — confirmado).
Recomenda-se **criar** um, seguindo o padrão de `tests/` (Vitest + `@vue/test-utils` + `happy-dom`,
setup global em `tests/setup.ts`).

### Checklist de comportamento a validar (casos de borda)
1. **Renderização:** monta um `<input type="radio">` com `id` gerado por `Random()`, `name` default
   `'radio-group'` quando `name` não é passado, e o `name` fornecido quando passado.
2. **`value` e `checked`:** com `modelValue === value`, o input está `checked`; caso contrário, não.
3. **Emissão de `v-model`:** disparar `change` no input emite `update:modelValue` com o `value` do
   radio. Verificar payload exato.
4. **Atualização externa:** mudar a prop `modelValue` para o `value` deste radio marca o input
   (reatividade via `watch(() => props.modelValue, ...)`).
5. **Clique na linha:** clicar na `div` (não no input, ex.: no label) seleciona o radio
   (`onClick` → `inputRef.click()` → `change`). Clicar diretamente no input **não** duplica a ação
   (guarda `tagName === 'INPUT'`).
6. **Slot label/ícone:** passar `label` renderiza `<div>{{ label }}</div>`; passar `icon` renderiza
   `<Icon>`. Confirmar que `label`/`icon` **não** vazam como atributos do `<input>` (via `inputAttrs`).
7. **`disabled`:** passar `disabled` via attrs desabilita o input e impede seleção.
8. **Grupo:** dois `MaxInputRadio` com o mesmo `name` e `v-model` compartilhado — selecionar um
   desmarca o outro (comportamento nativo de radios com mesmo `name`).

### Comandos de verificação
```bash
npm run type-check
npm run lint
npx vitest run tests/components/MaxInputRadio.test.ts   # se o teste for criado
npm run test                                            # suíte completa
npm run dev:playground                                  # comparação visual manual
```

### Verificação de que o PrimeVue foi removido
```bash
grep -n "RadioButton" src/components/MaxInputRadio.vue   # deve retornar vazio
```

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills` (apenas as pertinentes a este componente):

- **`.claude/skills/vue-max-components-ui-development-best-practices`** — convenções da própria lib
  (estrutura de componente, exports em `src/index.ts`, manifest/resolver, padrão `<script setup>`).
- **`.claude/skills/vue-inputs-masks-validation-best-practices`** — este é um componente de input
  com `v-model`; cobre padrões de props/emits/`update:modelValue` e comportamento de formulário.
- **`.claude/skills/vue-max-use-development-best-practices`** — uso correto do helper `Random` de
  `@maxvue/max-use` (geração do `inputId`).
- **`.claude/skills/vue-unocss-styling-best-practices`** — variáveis CSS do tema Max e classes
  utilitárias para reproduzir a aparência do radio.
- **`.claude/skills/frontend-design-best-practices`** — fidelidade visual do `<input type="radio">`
  estilizado em relação ao RadioButton do tema.
- **`.claude/skills/vue-typescript-best-practices`** — tipagem correta de `defineProps`/`useAttrs`/
  refs (`HTMLInputElement`) em `<script setup lang="ts">`.
- **`.claude/skills/vue-eslint-stylelint-quality-standards`** — padrões de lint/estilo do projeto
  (indentação 4 espaços, aspas simples, sem trailing comma).
- **`.claude/skills/vue-vitest-testing-best-practices`** — criação do teste do componente com
  Vitest + `@vue/test-utils` conforme `tests/setup.ts`.

---

## 10. Riscos e pontos de atenção

- **`InputBase`:** este componente **NÃO** depende de `InputBase` — pode ser migrado a qualquer
  momento, independentemente da migração do `InputBase`.
- **Registro global de `RadioButton`:** o componente nunca importou `RadioButton`; ele dependia do
  registro global fornecido pelo app consumidor / setup de teste. Após a migração o template não
  usa mais componente global algum de PrimeVue — isso **remove** uma dependência implícita e
  frágil. Bom sinal; garantir que nenhum app consumidor dependia de props exóticas do PrimeVue
  RadioButton que não estejam cobertas por `attrs` fallthrough.
- **`Icon` continua global:** `Icon` (`@iconify/vue`) **não** é PrimeVue; mantê-lo como está.
  Se o registro global de `Icon` deixar de existir no futuro, considerar o import explícito do
  Passo 4.6.
- **Fallthrough de `label`/`icon`:** sem o filtro (`inputAttrs`), `label` e `icon` vazariam como
  atributos inválidos no `<input>`. O PrimeVue absorvia essas props; o input nativo não. **Aplicar
  o filtro** (Passo 4.3), senão aparecem atributos espúrios no DOM (regressão de acessibilidade/HTML).
- **Igualdade por `===` para `value`/`modelValue`:** o `isChecked` usa `===`. Se algum consumidor
  passar **objetos** como `value`, a comparação por referência pode divergir do comportamento do
  PrimeVue (que também compara por referência/`equalityKey`). Manter `===` preserva o
  comportamento padrão; se surgir necessidade de `dataKey`, tratar como escopo separado (não faz
  parte da API atual).
- **`v-model` via `:checked` + `@change`:** o evento `change` de radio nativo só dispara na
  seleção (nunca na desmarcação), exatamente como o RadioButton do PrimeVue. Não usar `@input`.
- **Clique na linha:** manter a guarda `tagName === 'INPUT'` para não gerar duplo `change` quando o
  usuário clica diretamente no controle. Testar clique no label vs. clique no input.
- **Fidelidade visual:** o maior risco de regressão é estético (tamanho/cor do círculo e do ponto).
  Comparar no `dev:playground` contra o build atual antes de finalizar; ajustar dimensões/cores em
  `.max-radio-native` para casar com o tema Max.
- **Acessibilidade:** manter `:id="id"` no input; se optar por não usar `<label for>`, garantir que
  o clique na linha (via `onClick`) continue funcionando para teclado/leitores de tela — considerar
  adicionar `aria-label` quando `label` estiver presente (melhoria opcional, não obrigatória para
  paridade).
- **Sem regeneração de resolver:** nome do arquivo e exports inalterados → **não** rodar
  `generateResolver.ts` e **não** editar `src/components-manifest.json`.
