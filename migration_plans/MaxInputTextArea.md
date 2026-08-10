# Plano de Migração — MaxInputTextArea

> Plano autossuficiente para remover a dependência do PrimeVue do componente
> `MaxInputTextArea`, preservando API pública, estilos e comportamento. Uma IA futura deve
> conseguir executar esta migração lendo apenas este arquivo + o código-fonte referenciado.

---

## 1. Componente

- **Nome:** `MaxInputTextArea`
- **Caminho:** `src/components/MaxInputTextArea.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** Substituir o `Textarea` do PrimeVue por um elemento `<textarea>`
  nativo, mantendo o redimensionamento automático (auto-resize) e a integração com `InputBase`.
- **Aliases exportados** (não podem quebrar):
  - `src/index.ts` linha 74: `export { default as MaxInputTextArea } from './components/MaxInputTextArea.vue';`
  - `src/components-manifest.json`: `MaxInputTextArea`, `max_input_text_area`,
    `max-input-text-area`, `InputTextArea`, `input_text_area`, `input-text-area`.
  - Como o nome do arquivo e as exportações **não mudam**, o manifest/resolver não precisa ser
    regenerado. Não rodar `generateResolver.ts`.

---

## 2. Dependências do PrimeVue (trechos reais)

O componente possui **uma única dependência direta** do PrimeVue: `primevue/textarea`.

**Import (linha 14):**
```ts
import Textarea from 'primevue/textarea';
```

**Uso no template (linhas 2–4):**
```html
<InputBase v-bind="{...props}" class="input-text-area-main-div">
    <Textarea v-bind="{...props, ...attrs}" :autoResize="props.autoResize" v-model="temp_value" @blur="checkDone()" :rows="lines" :minLines="props.minLines ?? props.minRows ?? 1" />
</InputBase>
```

Notas sobre o comportamento do `Textarea` do PrimeVue 4 relevantes para replicar:
- `autoResize` (boolean): quando `true`, a altura do `<textarea>` cresce automaticamente conforme o
  conteúdo (o PrimeVue ajusta `style.height` via `scrollHeight` no input) e desabilita o resize
  manual do usuário (`resize: none`). No componente, o default efetivo é `true`.
- `rows` (number): número de linhas visíveis; aqui é passado o valor computado `lines`.
- `:minLines` **não é uma prop nativa do PrimeVue** — é repassada via `v-bind` e acaba virando um
  atributo/prop desconhecido. Na prática só o `:rows` controla a altura mínima. Ao migrar, mapear
  `minLines`/`minRows` para o cálculo de `rows` (já feito por `lines`) e **não** propagar `minLines`
  como atributo bruto para o DOM.
- `v-bind="{...props, ...attrs}"` espalha TODAS as props do componente + todos os atributos herdados
  para dentro do `<textarea>`. Várias dessas props (ex.: `icon`, `done`, `error`, `label`, `msg`)
  são props do `InputBase` e **não** são atributos válidos de `<textarea>`. O PrimeVue as absorve
  como props desconhecidas. Ao usar `<textarea>` nativo, é preciso **filtrar** esse espalhamento
  para não poluir o DOM com atributos inválidos (ver Estratégia).
- O PrimeVue aplica classes internas (`.p-inputtext`, `.p-inputtextarea`, `.p-component`) e um
  wrapper de estilos. O SCSS atual do componente já neutraliza a maior parte disso
  (`box-shadow: none`, `background: transparent`, `resize: none`) — ver seção Estilos.

---

## 3. Dependências internas (preservar)

- **`InputBase`** — `src/components/InputBase.vue` (import linha 13). É o wrapper obrigatório de
  layout/label/mensagens/ícones/estado (`done`/`error`/`caution`/`required`). O `<textarea>` é
  passado como `<slot>` default do `InputBase`.
  - **ORDEM:** `InputBase` **deve ser migrado ANTES** deste componente (ver seção 10).
- **`vue`** — `ref`, `computed`, `watch`, `useAttrs` (import linha 12). Todos nativos do Vue;
  permanecem.
- **`@maxvue/max-use`** — **não é usado diretamente** por `MaxInputTextArea` (apenas
  transitivamente por `InputBase`, que importa `hasContent`). Nada a fazer aqui.
- **Stores / helpers do projeto** — nenhum é usado por este componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para quem consome a lib. Preservar exatamente:

### Props (com defaults atuais — linhas 18–43)
```ts
{
    modelValue: any;          // default ''  (v-model)
    icon?: string;
    i?: string;
    disabled?: boolean;
    float?: boolean;
    msg?: string;
    message?: string;
    iconMessage?: string;
    label?: string;
    done?: boolean;           // default undefined
    error?: string | boolean;
    targetValue?: string;
    caution?: string | boolean;
    required?: boolean;
    autoResize?: boolean;     // default true
    rows?: string | number;
    minRows?: number | string;// default 1
    minLines?: string | number;
    autofocus?: boolean;
    maxRows?: number;         // default 10
    wrap?: string;
}
```
Defaults efetivos (linha 42): `{ modelValue: '', autoResize: true, maxRows: 10, minRows: 1, done: undefined }`.

> Manter a assinatura/tipos idênticos, incluindo props hoje declaradas mas não plenamente usadas
> (`targetValue`, `autofocus`, `maxRows`, `wrap`, `disabled`, `float`, ícones/mensagens). Elas fazem
> parte do contrato público e/ou são consumidas pelo `InputBase`.

### Emits
- `update:modelValue` (linha 51) — emitido via `watch(temp_value, ...)` (com `immediate: true`).

### v-model
- `v-model` sobre `modelValue`. Comportamento: `temp_value` espelha `modelValue`; digitação
  atualiza `temp_value`; `watch` emite `update:modelValue`; mudanças externas de `modelValue`
  sincronizam `temp_value` (com fallback `?? ''`, linha 61).

### Slots
- Nenhum slot próprio exposto (o `<textarea>` ocupa o slot default do `InputBase`).

### Estado interno observável (usado nos testes)
- `isDone` (`ref`, linha 45) — inicializado com `props.done ?? null`.
- `checkDone()` (linha 47) — no `@blur`, define `isDone = props.done ?? null`.
  O teste `valida done=true no blur via checkDone()` acessa `wrapper.vm.isDone` e espera `true`.
  Portanto `isDone` e `checkDone` **devem continuar existindo e expostos** no `<script setup>`
  (no Vue, refs/funções de `<script setup>` são acessíveis em testes via `wrapper.vm`).

### Comportamento observável a manter
- Digitar dispara `update:modelValue` (teste linha 25).
- `computedLines` = número de quebras de linha do valor (linha 55).
- `lines` = `props.rows` se fornecido; senão o maior entre `computedLines` e `minLines ?? minRows`
  (linha 57). Esse valor alimenta o atributo `rows`.
- Classe `input-text-area-main-div` no elemento raiz (`InputBase`) — necessária para o SCSS scoped.

---

## 5. Estratégia de substituição

**Trocar `Textarea` (PrimeVue) por `<textarea>` nativo.** Não é necessária nenhuma biblioteca
headless — auto-resize é trivialmente reimplementável com `scrollHeight`.

### Pontos-chave da estratégia

1. **Elemento nativo:** usar `<textarea>` como filho direto do `InputBase` (slot default),
   mantendo `class="input-text-area-main-div"` no `InputBase`.

2. **v-model manual:** `<textarea>` nativo com `:value="temp_value"` +
   `@input="temp_value = ($event.target as HTMLTextAreaElement).value"`. (Não usar `v-model` direto
   se for necessário controlar o auto-resize no mesmo handler — ver ponto 4.) O `watch(temp_value)`
   existente continua emitindo `update:modelValue`, então **manter esse watch inalterado**.

3. **Filtrar o `v-bind` bruto:** NÃO espalhar `{...props}` no `<textarea>`. Em vez disso, ligar
   apenas atributos válidos de `<textarea>` explicitamente e repassar `attrs` (que já contém
   atributos DOM legítimos herdados como `placeholder`, `name`, `id`, `maxlength`, etc.). Isso evita
   `icon`, `done`, `error`, `label`, `msg`, `minLines`, etc. vazarem como atributos inválidos no DOM.
   - Ligar explicitamente: `:rows="lines"`, `:disabled="props.disabled"`, `:wrap="props.wrap"`,
     `:autofocus="props.autofocus"` (opcionais conforme presença).
   - `v-bind="attrs"` para o restante dos atributos DOM herdados.

4. **Auto-resize nativo:** implementar uma função `resize(el: HTMLTextAreaElement)` que:
   - só age quando `props.autoResize` é `true`;
   - reseta `el.style.height = 'auto'` e define `el.style.height = el.scrollHeight + 'px'`;
   - respeita `maxRows` (opcional): limitar a altura a `maxRows` linhas — calcular a altura de uma
     linha via `getComputedStyle(el).lineHeight` (ou `scrollHeight` inicial) e aplicar
     `overflow-y: auto` quando exceder. Se `maxRows` não estava sendo respeitado antes de forma
     visível (o PrimeVue apenas crescia), pode-se manter o comportamento simples de crescer, mas o
     ideal é limitar por `maxRows` já que a prop existe. **Escolher a opção conservadora que mais se
     aproxima do comportamento atual do PrimeVue autoResize** (crescer sem limite rígido) e, se
     quiser, aplicar `maxRows` como teto suave.
   - Chamar `resize` no `@input`, e uma vez `onMounted`/`nextTick` (via ref do textarea) para o
     valor inicial.
   - Quando `autoResize` é `false`, não mexer em `style.height` e deixar o atributo `rows` mandar.

5. **Manter `checkDone`/`isDone`/`@blur`** exatamente como estão.

6. **Manter `computedLines`/`lines`** exatamente como estão — `lines` continua alimentando `:rows`.
   Observação: com auto-resize por `scrollHeight`, o `rows` importa principalmente para o estado
   inicial e para o caso `autoResize=false`. Mantê-lo preserva o comportamento e os testes.

### Resumo do que troca vs. o que fica

| Item | Ação |
|------|------|
| `import Textarea from 'primevue/textarea'` | **Remover** |
| `<Textarea .../>` | **Trocar** por `<textarea .../>` nativo |
| `:autoResize` prop | Reimplementar via handler `resize()` + `scrollHeight` |
| `v-bind="{...props, ...attrs}"` | Trocar por bindings explícitos + `v-bind="attrs"` filtrado |
| `:minLines`, `:rows="lines"` | `minLines` some do DOM; `rows` continua via `lines` |
| `checkDone`/`isDone`/`computedLines`/`lines`/watches | **Manter idênticos** |
| `InputBase` wrapper + classe | **Manter** |
| Bloco `<style scss>` | **Ajustar** seletores PrimeVue (ver Estilos) |

---

## 6. Passos de implementação

Executar na ordem:

1. **Pré-requisito:** confirmar que `InputBase` já foi migrado (independente do PrimeVue). Se ainda
   depender de `FloatLabel/IconField/InputIcon/Message` do PrimeVue, migrar `InputBase` primeiro
   (plano próprio). Este componente só depende de `InputBase` como slot host, então pode ser feito
   logo após.

2. **Remover o import do PrimeVue** (linha 14): apagar `import Textarea from 'primevue/textarea';`.

3. **Adicionar `ref` do textarea e helper de resize** no `<script setup>`:
   - Criar `const textAreaEl = ref<HTMLTextAreaElement | null>(null);`.
   - Criar função `resize()` que, se `props.autoResize` e `textAreaEl.value`, faz
     `el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px';` (com teto opcional por
     `maxRows`).
   - Importar `onMounted, nextTick` de `vue` (somar aos imports existentes) e chamar `resize()` em
     `onMounted(() => nextTick(resize))` para o estado inicial.

4. **Substituir o template do slot** por um `<textarea>` nativo:
   ```html
   <template>
       <InputBase v-bind="{ ...props }" class="input-text-area-main-div">
           <textarea
               ref="textAreaEl"
               class="max-textarea"
               :value="temp_value"
               :rows="lines"
               :disabled="props.disabled"
               :autofocus="props.autofocus"
               :wrap="props.wrap"
               v-bind="attrs"
               @input="onInput"
               @blur="checkDone()"
           ></textarea>
       </InputBase>
   </template>
   ```
   - `onInput(e)`: `temp_value.value = (e.target as HTMLTextAreaElement).value; resize();`.
   - Se `disabled`/`autofocus`/`wrap` forem `undefined`, o Vue não renderiza o atributo — ok.
   - **Não** espalhar `{...props}` no `<textarea>` (evita atributos inválidos como `icon`, `done`,
     `minLines`, etc.). Manter `v-bind="{ ...props }"` **apenas** no `InputBase` (ele consome essas
     props).

5. **Manter intactos:** `isDone`, `checkDone`, `temp_value`, `computedLines`, `lines`, os dois
   `watch` e `useAttrs()`.

6. **Ajustar o bloco `<style>`** conforme seção Estilos (remover dependência de classes `.p-*`,
   garantir estilo no `.max-textarea`/`textarea`).

7. **Verificar convenções** (CLAUDE.md): `<script setup lang="ts">`, indentação de 4 espaços, aspas
   simples, ponto e vírgula, sem trailing commas, ordem Template → Script → Style.

8. **Rodar lint e testes** (ver seção 8). NÃO regenerar o resolver (nome/arquivo inalterados).

---

## 7. Estilos

O SCSS atual (linhas 64–78) já foi escrito para neutralizar o visual do PrimeVue e é quase
independente. Ele mira `.input-text-area-main-div textarea`, o que **continua válido** para o
`<textarea>` nativo (mesmo seletor de elemento). Preservar:

```scss
.input-text-area-main-div {
    textarea {
        box-shadow: none !important;
        width: 100%;
        background: transparent;
        outline: none;
        resize: none;

        &[no-border] {
            border: none !important;
        }
    }
}
```

Ajustes/atenções:
- **Manter o seletor `textarea`** (funciona igual para elemento nativo). Opcionalmente adicionar a
  classe `.max-textarea` para especificidade explícita, mas não é obrigatório.
- `resize: none;` já reproduz o comportamento do `autoResize` do PrimeVue (usuário não redimensiona
  manualmente). Se `autoResize=false` e quiser permitir resize manual, isso seria uma mudança de
  comportamento — **não** introduzir; manter `resize: none` para não alterar o observável.
- As classes de estado (`error`, `caution`, `done`, label flutuante) vêm do `InputBase` e do SCSS
  global dele. **Não** duplicar aqui. Se o `InputBase` migrado deixar de usar `.p-inputtext`, o
  padding/altura do textarea pode precisar de ajuste fino — validar visualmente no playground.
- Herança de aparência (fonte, cor, padding) do input: o PrimeVue aplicava `.p-inputtext` ao
  textarea. Ao remover isso, garantir que o `<textarea>` herde a tipografia do tema. Se necessário,
  adicionar ao bloco: `font: inherit; color: inherit; border: 1px solid var(--background-300);
  border-radius: var(--...); padding: 8px 10px;` usando variáveis do tema Max
  (`var(--background-300)`, etc.) para casar com os demais inputs. **Comparar lado a lado com o
  visual anterior no `npm run dev:playground`** antes de finalizar.
- Não é necessário UnoCSS aqui; o componente usa apenas SCSS scoped.

---

## 8. Testes / verificação

### Arquivo de teste existente
`tests/components/MaxInputTextArea.test.ts` — **deve continuar passando sem alterações**. Casos:
1. Renderiza e contém `InputBase`.
2. `update:modelValue` ao digitar (`textarea.setValue(...)`).
3. Sincroniza `modelValue` → `temp_value` (`setProps`).
4. Calcula linhas por conteúdo (`\n`).
5. Respeita `minRows`.
6. `autoResize=true` por padrão.
7. Aceita `rows` (altura fixa).
8. `done=true` no blur via `checkDone()` — acessa `wrapper.vm.isDone === true`.
   → **Garantir que `isDone` e `checkDone` continuem no `<script setup>` e expostos**.

### Comandos
```bash
npx vitest run tests/components/MaxInputTextArea.test.ts   # foco
npm run test                                               # suíte completa (regressão)
npm run type-check                                         # vue-tsc
npm run lint                                               # ESLint + Stylelint
```

### Ambiente de teste (setup)
`tests/setup.ts` mocka `getComputedStyle` com valores de CSS var. Como o auto-resize usará
`scrollHeight`/`getComputedStyle`, verificar que em `happy-dom` `scrollHeight` retorna 0 (comum). O
handler `resize()` **deve ser tolerante** a `scrollHeight === 0` / `null` e nunca lançar erro — os
testes não verificam a altura final, apenas a existência do componente e do evento. Proteger com
`if (!textAreaEl.value) return;`.

### Checklist manual (playground)
- `npm run dev:playground` e comparar `MaxInputTextArea` antes/depois:
  - [ ] Digitar múltiplas linhas cresce a altura (autoResize).
  - [ ] Sem barra de resize manual no canto (`resize: none`).
  - [ ] `autoResize=false` respeita `rows` fixo e não cresce.
  - [ ] `label`, `msg`/`message`, `error`, `caution`, `done`, `required` renderizam via `InputBase`.
  - [ ] `disabled` desabilita o textarea.
  - [ ] `placeholder`/`name`/`id` herdados via `attrs` aparecem no DOM.
  - [ ] Nenhum atributo inválido (`icon`, `done`, `minLines`, ...) no `<textarea>` (inspecionar DOM).
  - [ ] Tipografia/borda/padding visualmente idênticos aos demais inputs.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (apenas as pertinentes a este componente `baixa`):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib
  (estrutura de componente, `InputBase`, exports/aliases, SCSS com variáveis do tema Max).
- `.claude/skills/vue-inputs-masks-validation-best-practices` — padrões de componentes de input
  Max (v-model, `temp_value`, estados `done`/`error`, integração com `InputBase`).
- `.claude/skills/vue-typescript-best-practices` — tipagem correta em `<script setup lang="ts">`
  (`defineProps`/`withDefaults`/`defineEmits`, cast de `EventTarget` para `HTMLTextAreaElement`).
- `.claude/skills/vue-unocss-styling-best-practices` — regras de estilo/variáveis do tema para
  reproduzir a aparência do textarea sem as classes `.p-*` do PrimeVue.
- `.claude/skills/vue-vitest-testing-best-practices` — manter/validar
  `tests/components/MaxInputTextArea.test.ts` (mount, `setValue`, `emitted`, `wrapper.vm`).
- `.claude/skills/vue-eslint-stylelint-quality-standards` — garantir 4 espaços, aspas simples,
  ponto e vírgula, sem trailing commas, ordem Template→Script→Style.

Skills consideradas e **descartadas**: `vue-virtual-scroller`, `vue-dayjs`, `vue-floating-vue`,
`vue-keyboard-shortcuts`, `vue-uppy`, `vue-pinia` — nenhuma aplicável a um `<textarea>` simples.

---

## 10. Riscos e pontos de atenção

1. **Ordem de dependência — `InputBase` primeiro.** ~19 inputs dependem do `InputBase`. Este
   componente o usa como wrapper host do slot. Migrar/estabilizar o `InputBase` (removendo
   `FloatLabel`/`IconField`/`InputIcon`/`Message` do PrimeVue) **antes** de dar por concluído este
   plano. Se `InputBase` ainda depende do PrimeVue, `MaxInputTextArea` não estará realmente
   independente.

2. **Vazamento de atributos inválidos no DOM.** O código atual faz
   `v-bind="{...props, ...attrs}"` no `Textarea`. O PrimeVue absorvia props desconhecidas; um
   `<textarea>` nativo **não** — `icon`, `done`, `error`, `label`, `msg`, `minLines`, `caution`,
   `required`, etc. apareceriam como atributos inválidos. **Obrigatório filtrar**: bindar só
   atributos válidos + `v-bind="attrs"`. Não espalhar `props` no elemento nativo.

3. **`minLines` não é atributo nativo.** Hoje é passado como `:minLines` e ignorado no visual. Ao
   migrar, garantir que `minLines`/`minRows` só influenciem o cálculo de `lines` (já feito) e nunca
   virem atributo DOM.

4. **Auto-resize em ambiente de teste (`happy-dom`).** `scrollHeight` costuma ser 0; a função
   `resize()` deve ser defensiva (`if (!textAreaEl.value) return;`) e nunca lançar. Os testes não
   assertam altura, então não há risco de quebra desde que não haja exceção.

5. **`isDone` / `checkDone` são parte do contrato de teste.** O teste acessa `wrapper.vm.isDone`.
   Não renomear nem remover; manter no `<script setup>` para exposição via `wrapper.vm`.

6. **`watch` com `immediate: true`.** O `watch(temp_value, ..., { immediate: true })` emite
   `update:modelValue` já na montagem. Preservar para não alterar o comportamento observável (o
   teste de sync depende de `emitted` existir).

7. **Fidelidade visual.** Ao remover `.p-inputtext`/`.p-inputtextarea`, a tipografia/borda/padding
   podem mudar. Validar no playground e, se preciso, replicar com variáveis do tema Max no SCSS
   scoped. Não introduzir mudanças de comportamento (ex.: permitir resize manual) — manter
   `resize: none`.

8. **`maxRows`.** Prop existe (default 10) mas o PrimeVue autoResize não a respeitava rigidamente.
   Escolher a interpretação mais conservadora (crescer como antes) e, opcionalmente, aplicar
   `maxRows` como teto suave via `overflow-y: auto`. Documentar a decisão no PR para não surpreender
   consumidores.

9. **Não regenerar resolver.** Nome do arquivo, exportações e aliases permanecem — não rodar
   `generateResolver.ts` nem alterar `components-manifest.json`.
