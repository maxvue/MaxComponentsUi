# Plano de Migração — MaxInputAutoCompleteApi (independência do PrimeVue)

> **Objetivo:** remover a dependência do componente `primevue/autocomplete` de
> `src/components/MaxInputAutoCompleteApi.vue`, reimplementando o autocomplete de
> forma *headless* (nativa), com **debounce**, **estados de loading**, **busca
> assíncrona via API** e **cache IndexedDB**, **preservando integralmente a API
> pública, o comportamento e os estilos**.
>
> **Este documento é um plano.** NÃO modifique código-fonte ao lê-lo antes da
> execução. O único artefato a ser produzido na execução é a nova versão de
> `src/components/MaxInputAutoCompleteApi.vue` (mais, se aplicável, seu par
> compartilhado — ver seção 10).
>
> **Nível:** alta.

---

## 1. Componente

- **Nome:** `MaxInputAutoCompleteApi`
- **Arquivo:** `src/components/MaxInputAutoCompleteApi.vue`
- **Exportado em:** `src/index.ts` (linha 51):
  ```ts
  export { default as MaxInputAutoCompleteApi } from './components/MaxInputAutoCompleteApi.vue';
  ```
- **Aliases no resolver** (`src/components-manifest.json`): `MaxInputAutoCompleteApi`,
  `max_input_auto_complete_api`, e demais gerados por `generateResolver.ts`.
  Não altere o manifest — o nome do componente não muda.
- **Descrição funcional:** input de autocomplete que busca sugestões numa API do
  backend Max via `getCachedApiIDB` (cache em IndexedDB), filtra localmente as
  sugestões conforme o texto digitado e as apresenta numa lista com `label` +
  `sub_label`. Sempre embrulhado por `InputBase`.
- **Componente irmão compartilhado:** `src/components/MaxInputAutoComplete.vue`
  (mesma estrutura, porém com `options` estáticas em vez de busca por API). A
  estratégia recomendada é extrair um *primitivo headless de autocomplete*
  reutilizado por ambos (ver seções 5 e 10).

---

## 2. Dependências do PrimeVue (trechos reais)

O componente usa **`primevue/autocomplete`** como campo principal. Trechos reais
do arquivo atual:

**Import e tipos (linhas 25-26):**
```ts
import AutoComplete from 'primevue/autocomplete';
import type { AutoCompleteProps } from 'primevue/autocomplete';
```

**Interface estende os props do PrimeVue (linha 28):**
```ts
interface props extends AutoCompleteProps {
    route: string;
    ...
}
```

**Uso no template (linhas 3-11):**
```html
<AutoComplete optionLabel="label" :suggestions="filtered_values" @complete="search"
    :virtualScrollerOptions="{ itemSize: 40 }" v-model="temp_value"
    :placeholder="props.placeholder ?? 'SELECIONE'" @blur="isDone = testIsDone()" >
    <template #option="slotProps">
        <div class="autocomplete-item-select">
            <div class="autocomplete-item-select-label">{{ slotProps.option.model }}</div>
            <div class="autocomplete-item-select-sub-label">{{ slotProps.option.sub_label }}</div>
        </div>
    </template>
    <template #content></template>
</AutoComplete>
```

**Defaults herdados de props do PrimeVue AutoComplete** (linhas 44-57): `dropdownMode: 'blank'`,
`multiple: false`, `variant: null`, `minLength: 1`, `delay: 300`, `forceSelection: false`.

### Recursos do PrimeVue que precisam ser reimplementados
| Recurso PrimeVue | O que faz hoje | Substituição headless |
|---|---|---|
| `v-model="temp_value"` | two-way binding no input | `<input>` nativo + `ref` + eventos |
| `:suggestions` | array a exibir no overlay | render de `filtered_values` em `<ul>` |
| `@complete="search"` | dispara ao digitar (com `delay`) | listener `input` + **debounce próprio** |
| `#option` slot | template de cada item | `v-for` render dos itens |
| `:virtualScrollerOptions={ itemSize: 40 }` | virtual scroll do overlay | ver seção 5 (opcional `RecycleScroller`) |
| `:placeholder` | placeholder do input | atributo `placeholder` nativo |
| `@blur` | recalcula `isDone` | `@blur` no `<input>` |
| `AutoCompleteProps` (tipo) | herdado pela interface `props` | substituir por props explícitos (seção 4/6) |
| overlay/posicionamento | dropdown flutuante do PrimeVue | dropdown headless (ver seção 5) |

> **Observação:** `InputBase.vue` também importa componentes PrimeVue
> (`FloatLabel`, `IconField`, `InputIcon`, `Message`). **Este plano NÃO migra
> `InputBase`** — ele é mantido como está e continua sendo o elemento mais
> externo. A migração de `InputBase` é um trabalho separado (ver seção 10, ordem).

---

## 3. Dependências internas (cache IDB, debounce, helpers)

Todas de `@maxvue/max-use` (source em `../MaxUse`). **Devem ser preservadas.**

### 3.1 `getCachedApiIDB` — busca com cache IndexedDB
Arquivo real: `../MaxUse/src/Routes/getCachedApiIDB.ts`.
```ts
export async function getCachedApiIDB(
    routeName: RefStringOrNull,
    dataToRequest: MayBeRefData = null,
    keyCache: RefStringOrNull = null,
    ttl?: number
): Promise<any>
```
- Abre/gera o DB `max_cache`, store `api_cache` (keyPath `key`).
- Chave padrão: `routeName + '_' + JSON.stringify(dataToRequest)`.
- Se houver cache válido (respeitando `ttl`, se passado), retorna sem requisição.
- Caso contrário: `axios.get(resolveRoute(routeName, data))` com
  `withCredentials = true`, salva no IDB e retorna `response.data`.
- Retorna `null` se `routeName` for vazio.
- **No componente é chamado assim (linha 72):**
  ```ts
  getCachedApiIDB(props.route, { ...(props.data ?? {}), input_value: data_sent })
  ```

### 3.2 `keyExists` — verificação de chaves
Arquivo real: `../MaxUse/src/Helpers/Objects/keyExists.ts`.
```ts
export function keyExists(keys, item, mode: 'some' | 'every' = 'some'): boolean
```
Usado (linhas 66-67) para detectar se `temp_value` contém `files`/`file` e zerá-los
antes de enviar ao backend (evita mandar binários grandes no `input_value`).

### 3.3 Outros helpers usados (linha 21)
- `hasContent(value)` — verdadeiro se o valor tem conteúdo.
- `toSearchableString(value)` — normaliza (remove acentos/símbolos, minúsculas) para
  busca. Ex.: `'Café com Leite' -> 'cafecomleite'`.
- `isBlank(value)` — verdadeiro se vazio/nulo.
- `size(value)` — tamanho de coleção.
- `isEqual(a, b)` — igualdade profunda.

### 3.4 Debounce (a INTRODUZIR)
Hoje o *debounce* era provido internamente pelo PrimeVue AutoComplete via a prop
`delay: 300`. Ao remover o PrimeVue **é obrigatório** reimplementar o debounce.
Duas opções (escolher UMA na execução):
- **(A) Implementação local** com `setTimeout`/`clearTimeout` num `ref` de timer
  (sem dependências novas — **preferida** para manter o bundle leve).
- **(B)** Se `@maxvue/max-use` exportar utilitário de debounce/`useDebounceFn`
  (VueUse é dependência transitiva do max-use), pode ser usado. **Verificar antes**
  com: `grep -rn "debounce" ../MaxUse/src` e só usar se exportado publicamente.
Valor padrão do delay: **300ms** (o mesmo default atual).

---

## 4. API pública a preservar

**Contrato que consumidores dependem — NÃO pode mudar.**

### 4.1 Props
| Prop | Tipo | Default | Observações |
|---|---|---|---|
| `route` | `string` | (obrigatória) | rota da API para `getCachedApiIDB` |
| `i` | `string \| undefined` | — | alias de ícone (repassado ao InputBase) |
| `data` | `any` | `{}` | payload extra da requisição; observado com `deep` |
| `icon` | `string \| undefined` | — | ícone (repassado ao InputBase) |
| `msg` | `string \| undefined` | — | mensagem |
| `message` | `string \| undefined` | — | mensagem |
| `iconMessage` | `string \| undefined` | — | ícone da mensagem |
| `done` | `string \| boolean \| null \| undefined` | `undefined` | estado "preenchido" |
| `error` | `string \| boolean \| null \| undefined` | — | estado de erro |
| `caution` | `string \| boolean \| null \| undefined` | `undefined` | estado de atenção |
| `required` | `boolean \| null \| undefined` | `false` | obrigatório |
| `optionValue` | `string \| undefined` | — | campo de valor |
| `optionLabel` | `string \| undefined` | `'label'` | campo de label |
| `modelValue` | `any` | `''` | v-model |
| `placeholder` | `string` | `'SELECIONE'` | (vinha de AutoCompleteProps) |
| `dropdownMode` | — | `'blank'` | vinha de AutoCompleteProps* |
| `multiple` | `boolean` | `false` | vinha de AutoCompleteProps* |
| `variant` | — | `null` | vinha de AutoCompleteProps* |
| `minLength` | `number` | `1` | vinha de AutoCompleteProps* |
| `delay` | `number` | `300` | vinha de AutoCompleteProps* — **agora alimenta o debounce local** |
| `forceSelection` | `boolean` | `false` | vinha de AutoCompleteProps* |

\* Como `AutoCompleteProps` deixa de existir, esses props passam a ser **declarados
explicitamente** na interface (com os mesmos nomes/defaults) para não quebrar
consumidores que os passem. Ver seção 6, passo 2. Props sem efeito visível após a
migração (`variant`, `dropdownMode`, `multiple`) devem ao menos **existir e ser
aceitos** (evita erro de tipo em quem os passa). `minLength` e `delay` passam a ter
efeito real na nova implementação.

### 4.2 Eventos
- `update:modelValue` — emitido **somente quando `temp_value` é objeto** (não string).
  Trecho real (linha 101):
  ```ts
  if (temp_value.value && typeof temp_value.value !== 'string') emit('update:modelValue', temp_value.value);
  ```

### 4.3 Comportamentos observáveis (todos preservar)
1. `temp_value` inicia com `props.modelValue`.
2. `watch(() => props.data, ...)` com `{ deep: true, immediate: true }`:
   - Retorna cedo se `data` está em branco **ou** não mudou (`isEqual`).
   - Zera `files`/`file` de `temp_value` antes de enviar (via `keyExists`).
   - Chama `getCachedApiIDB(route, { ...data, input_value: data_sent })` e, se a
     resposta tiver conteúdo (`!isBlank && size !== 0`), atribui a `list`.
3. `temp_value_string` (computed): string do valor, extraída na ordem
   `value → label → id → [optionValue] → ''` para objetos; a própria string se for
   string; `''` caso contrário.
4. `isDone` = `ref(props.done ?? null)`; recalculado no `blur` e no `watch(temp_value)`
   por `testIsDone()`:
   - se `props.done !== undefined` → `props.done`;
   - senão se `required` → `hasContent(temp_value_string)`;
   - senão se `props.caution !== undefined` → `!props.caution`;
   - senão `null`.
5. `watch(temp_value)`: chama `search()`, recalcula `isDone`, emite `update:modelValue`
   (só objeto).
6. `search()`: filtra `list` por `toSearchableString(campos).includes(toSearchableString(temp_value_string))`
   sobre os campos `value + label + sub_label + name + [optionValue]`.
7. **`list`, `temp_value`, `temp_value_string`, `filtered_values`, `isDone`,
   `testIsDone` são acessados diretamente pelos testes** (`wrapper.vm as any`). Devem
   permanecer expostos no `<script setup>` com os **mesmos nomes** (o Vue expõe
   bindings de `<script setup>` ao test-utils). Ver seção 8.

---

## 5. Estratégia de substituição

**Princípio: reutilizar um dropdown headless comum ao `MaxInputAutoComplete`,
adicionando a camada de busca assíncrona/loading só neste componente.**

### 5.1 Reaproveitar o primitivo headless do autocomplete
`MaxInputAutoComplete.vue` e `MaxInputAutoCompleteApi.vue` compartilham hoje quase
toda a lógica de exibição (input + overlay + slot de item + filtro por
`toSearchableString`). A diferença é a **origem dos dados**:
- `MaxInputAutoComplete`: `options` estáticas (`list = computed(() => props.options)`).
- `MaxInputAutoCompleteApi`: `list` populada via `getCachedApiIDB`.

**Recomendação:** extrair um componente headless interno — sugestão de nome
`MaxAutoCompleteCore.vue` (não exportado publicamente, sem prefixo obrigatório no
resolver) — que recebe:
- `modelValue`, `optionLabel`, `optionValue`, `placeholder`, `minLength`, `delay`;
- uma prop `suggestions` (a lista já filtrada) **ou** um callback de busca;
- emite `update:modelValue`, `complete` (texto digitado, com debounce), `blur`.
- expõe slot `option` para o template de item.

Assim `MaxInputAutoCompleteApi` fica responsável apenas por: buscar dados
(`getCachedApiIDB`), manter `list`, filtrar (`search()`) e passar `filtered_values`
ao core; e `MaxInputAutoComplete` idem com `options`.

> **Alternativa mais conservadora (menor risco):** NÃO extrair o core agora;
> reimplementar o dropdown headless **inline** dentro de `MaxInputAutoCompleteApi.vue`
> (input nativo + `<ul>` + itens), mantendo `MaxInputAutoComplete.vue` intacto por
> enquanto. Isso reduz o acoplamento entre os dois PRs. **Decidir na execução**
> conforme a seção 10 (ordem). Este plano descreve os passos assumindo a versão
> inline; se o core já existir, apenas consuma-o.

### 5.2 Dropdown headless (input + overlay)
Estrutura mínima dentro do slot de `InputBase`:
```
<div class="max-autocomplete" (relativo)>
  <input> nativo
  <ul class="max-autocomplete-overlay"> (v-if aberto e há filtered_values)
     <li v-for item> slot option (label + sub_label) </li>
  </ul>
</div>
```
- **Abrir/fechar overlay:** abrir ao `focus`/digitar; fechar no `blur` (com pequeno
  atraso p/ permitir clique no item, ex. `setTimeout` 150ms ou `mousedown.prevent`
  no `<li>`), `Escape`, ou seleção.
- **Seleção de item:** ao clicar/Enter num item → `temp_value = item`; fecha overlay;
  o `watch(temp_value)` cuida do resto (isDone + emit).
- **Posicionamento:** para o caso simples, `position: absolute` abaixo do input já
  atende (é o layout atual). Se overflow/clipping for problema, considerar
  `floating-vue` (ver skill na seção 9) — mas **começar sem** para minimizar mudança.

### 5.3 Busca assíncrona + loading (específico deste componente)
- Manter o `watch(() => props.data, ...)` **idêntico** ao atual (é a busca por API).
- Adicionar **estado de loading**: um `ref(false)` (`isLoading`/`loading`) setado
  `true` antes de `getCachedApiIDB` e `false` no `.then`/`.finally`.
  - Exibir indicador enquanto carrega (ex.: `MaxIcon` giratório à direita do input,
    ou mensagem "Carregando..." no overlay). Como o comportamento atual **não**
    exibia loading (o PrimeVue não estava configurado para isso via `route`), este é
    um **incremento aceitável e desejado** pela descrição da tarefa, mas deve ser
    **discreto** e **não** alterar o layout/altura do `InputBase` (grid de
    `36px / 19px`). Preferir sobrepor o ícone (absolute) para não empurrar conteúdo.
- **Debounce** (seção 3.4): aplicar ao disparo de `search()`/à reação de digitação,
  usando `props.delay` (300ms). Como `search()` hoje só filtra `list` localmente, o
  debounce evita refiltragens a cada tecla; se no futuro a digitação disparar busca
  remota, o mesmo debounce já cobre.
- **`minLength`:** só abrir/filtrar quando `temp_value_string.length >= props.minLength`
  (default 1) — equivalente ao comportamento do PrimeVue.

### 5.4 Virtual scroll
O PrimeVue usava `virtualScrollerOptions={ itemSize: 40 }`. Para paridade de
performance com listas grandes:
- **Opção simples (preferida p/ 1ª entrega):** `<ul>` com `max-height` + `overflow-y:auto`
  (itens têm 40px — ver `.autocomplete-item-select { height: 40px }`).
- **Opção performática:** `RecycleScroller` do `vue-virtual-scroller` com
  `:item-size="40"` (ver skill seção 9). Usar somente se listas realmente grandes
  forem esperadas; caso contrário evitar a dependência extra.

---

## 6. Passos de implementação

Execute em ordem. **Não** altere `InputBase.vue` nem o manifest.

1. **Ler o código-fonte real** de:
   `src/components/MaxInputAutoCompleteApi.vue`, `src/components/InputBase.vue`,
   `src/components/MaxInputAutoComplete.vue`, `../MaxUse/src/Routes/getCachedApiIDB.ts`,
   `../MaxUse/src/Helpers/Objects/keyExists.ts`, e o teste
   `tests/components/MaxInputAutoCompleteApi.test.ts`. Confirmar assinaturas.

2. **Substituir a interface de props.** Remover `import type { AutoCompleteProps }`
   e o `extends AutoCompleteProps`. Declarar explicitamente TODOS os props da seção
   4.1 (incluindo `placeholder`, `dropdownMode`, `multiple`, `variant`, `minLength`,
   `delay`, `forceSelection`) com os mesmos defaults em `withDefaults`.

3. **Remover `import AutoComplete from 'primevue/autocomplete'`.**

4. **Template:** trocar `<AutoComplete ...>` por o dropdown headless (seção 5.2)
   dentro do `<InputBase v-bind="props" :done="isDone" :error="props.error" :caution="props.caution">`.
   - Manter o slot de item com as MESMAS classes:
     `.autocomplete-item-select`, `.autocomplete-item-select-label` (renderiza
     `option.model`), `.autocomplete-item-select-sub-label` (renderiza `option.sub_label`).
     > **Atenção fiel ao original:** hoje o label do item usa `slotProps.option.model`
     > e o sublabel `slotProps.option.sub_label` (não `optionLabel`). **Preservar
     > exatamente** esses campos para não quebrar a renderização nem o teste
     > "renderiza o slot de option corretamente" (espera `Model Test` / `Sub Test`).
   - `placeholder` do input: `props.placeholder ?? 'SELECIONE'`.
   - `@blur` do input: `isDone = testIsDone()` (mesma expressão atual).

5. **Script — manter idênticos** (mesmos nomes, expostos ao test-utils):
   `temp_value`, `list`, `filtered_values`, `temp_value_string` (computed),
   `isDone`, `isRequiredDone`, `testIsDone`, `search`, o `emit(['update:modelValue'])`,
   o `watch(() => props.data, ..., { deep: true, immediate: true })` e o
   `watch(temp_value, ...)`. Copiar a lógica atual sem alterar semântica.

6. **Adicionar debounce** (seção 3.4) no caminho de digitação/`search()`, usando
   `props.delay`. Garantir `clearTimeout` no `onUnmounted` para evitar vazamento.

7. **Adicionar estado de loading** (`ref(false)`), envolvendo a chamada
   `getCachedApiIDB` (set `true` antes, `false` no `finally`). Renderizar indicador
   discreto (absolute) sem alterar altura do grid do `InputBase`.

8. **Adicionar `minLength`** ao gate de abertura/filtragem do overlay.

9. **Estilos:** manter o bloco `<style lang="scss">` com
   `.autocomplete-item-select-sub-label { font-size: 0.9em; }` e adicionar apenas o
   CSS do novo overlay/input headless reaproveitando classes já existentes em
   `MaxInputAutoComplete.vue` quando possível (`.autocomplete-item-select`, etc.).
   Ver seção 7.

10. **Ordem de blocos no SFC:** `Template → Script → Style` (convenção do projeto).

11. **Convenções de código:** `<script setup lang="ts">`, indentação de **4 espaços**,
    aspas simples, ponto e vírgula, **sem** trailing commas.

12. **Rodar verificação** (seção 8): `type-check`, testes do arquivo, lint.

13. **NÃO** rodar `generateResolver.ts` (nenhum arquivo novo exportado publicamente,
    a menos que você tenha optado por extrair `MaxAutoCompleteCore.vue` — nesse caso
    ele deve ser interno e **não** exportado em `src/index.ts`; ainda assim não é
    necessário regenerar o manifest para um componente não público).

---

## 7. Estilos

- **Preservar** o bloco atual:
  ```scss
  .autocomplete-item-select-sub-label {
      font-size: 0.9em;
  }
  ```
- **Reaproveitar** (copiando/compartilhando com `MaxInputAutoComplete.vue`) as classes
  já existentes para itens e overlay: `.autocomplete-item-select` (grid 40px, label +
  sub-label com ellipsis), `.autocomplete-item-select-label`,
  `.autocomplete-item-select-sub-label`.
- **Novo overlay headless:** criar `.max-autocomplete-overlay` (ou reutilizar naming
  próximo de `.p-autocomplete-overlay` do irmão) com:
  `position: absolute; z-index alto; background var(--background-0); max-height (ex. 240px);
  overflow-y: auto; box-shadow suave; border-radius`. Usar **variáveis do tema Max**
  (`var(--background-...)`, `var(--max-primary-...)`) — nunca cores hardcoded.
- **Input nativo:** herda estilos de `.p-inputtext`/`.p-inputtext` já cobertos por
  `InputBase.vue`? Não necessariamente — o input agora é nativo. Garantir
  `width: 100%`, `height: 36px` (paridade com `.p-inputtext { height: 36px }` do
  InputBase) para não quebrar o grid `36px / 19px`. Reaproveitar a classe do input do
  irmão se aplicável.
- **Loading:** ícone/indicador `position: absolute; right; transform: translateY(-50%)`,
  `pointer-events: none`, `z-index` acima do input — espelhar
  `.icon-input-auto-complete-api` do `MaxInputAutoComplete.vue`.
- **UnoCSS:** classes utilitárias do preset (`color-*`, `bg-background-*`) podem ser
  usadas no template, conforme convenção do projeto.
- Não introduzir mudanças visuais perceptíveis fora do overlay/loading. Comparar
  visualmente no playground (`npm run dev:playground`).

---

## 8. Testes / verificação

### 8.1 Teste existente (deve continuar passando)
`tests/components/MaxInputAutoCompleteApi.test.ts`. Pontos que o novo código
**precisa** satisfazer (o teste stuba `InputBase` e `AutoComplete`):

> **ATENÇÃO — ajuste necessário no stub do teste.** O teste atual stuba um componente
> `AutoComplete` e dispara `blur`/`complete` sobre `.auto-complete`. Após a migração o
> `<AutoComplete>` deixa de existir. Duas alternativas (documente a escolhida no PR):
> - **(A)** Atualizar o teste para stubar/selecionar o novo elemento headless (ex.
>   um `<input>` nativo com classe conhecida) e disparar `blur`/`input` nele.
> - **(B)** Manter compatibilidade máxima expondo, no template, um elemento com
>   handlers de `blur` que o teste consiga acionar.
> A opção **(A)** é a correta (o teste referencia um contrato interno que muda).
> O ajuste do teste é **esperado e permitido** — os *asserts de comportamento*
> (abaixo) é que não podem mudar.

Comportamentos que os asserts verificam e devem ser mantidos:
- Renderiza o componente.
- No mount com `data` preenchido: `getCachedApiIDB` chamado com
  `('/api/test', { category: 1, input_value: '' })`; após resolver, `list.length === 1`.
- Com `data: null`: `getCachedApiIDB` **não** é chamado.
- `temp_value` atribuível diretamente.
- `temp_value_string`: string direta; objeto → `value`→`label`→`id`; `{}` → `''`; `null` → `''`.
- `isDone` no blur: `required` sem valor → `false`; `required` com valor → `true`;
  `done: true` explícito → `true`.
- `testIsDone()` com `caution: true` (sem required) → `false`.
- `search()` filtra por `toSearchableString` (busca "açã" acha "Maçã").
- `update:modelValue` emitido só quando `temp_value` é objeto.
- Slot de option renderiza `option.model` e `option.sub_label`
  (classes `.autocomplete-item-select-label` / `-sub-label`).

### 8.2 Novos testes a acrescentar
- **Loading:** `isLoading`/`loading` vira `true` durante a busca e `false` após resolver.
- **Debounce:** múltiplas digitações rápidas resultam em uma única refiltragem após
  `delay` (usar `vi.useFakeTimers()`).
- **minLength:** overlay não abre/filtra abaixo de `minLength`.
- **Não depende de PrimeVue:** garantir que nenhum import de `primevue/autocomplete`
  permaneça (pode-se checar por ausência via grep no CI ou revisão).

### 8.3 Comandos
```bash
npm run type-check
npx vitest run tests/components/MaxInputAutoCompleteApi.test.ts
npm run lint
npm run dev:playground   # verificação visual manual do overlay + loading + debounce
```
Todos devem passar. Confirmar que `grep -rn "primevue/autocomplete" src/components/MaxInputAutoCompleteApi.vue`
retorna vazio ao final.

---

## 9. Skills necessárias

Caminho base: `/home/johnattas/GitHub/MaxComponentsUi/.claude/skills/<skill>/SKILL.md`.

| Skill | Caminho | Justificativa |
|---|---|---|
| **vue-max-components-ui-development-best-practices** | `.claude/skills/vue-max-components-ui-development-best-practices/SKILL.md` | Padrões da própria lib: uso de `InputBase`, convenções de SFC, `generateResolver.ts`, testes com Vitest/test-utils. Fonte primária de convenções deste PR. |
| **vue-max-use-usecachedapi-state-cache-best-practices** | `.claude/skills/vue-max-use-usecachedapi-state-cache-best-practices/SKILL.md` | Padrões de cache de API do ecossistema Max (stale-while-revalidate, chaves dinâmicas, estados de loading) — diretamente aplicável ao `getCachedApiIDB` e ao novo estado de loading. |
| **vue-inputs-masks-validation-best-practices** | `.claude/skills/vue-inputs-masks-validation-best-practices/SKILL.md` | Boas práticas de inputs Vue 3 (estados, validação, v-model), relevante à reimplementação do campo e dos estados `done/error/caution/required`. |
| **vue-keyboard-shortcuts-navigation-best-practices** | `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices/SKILL.md` | Navegação por teclado do overlay headless (setas ↑/↓, Enter para selecionar, Escape para fechar, gestão de foco) — recurso que o PrimeVue dava de graça e agora precisa ser reimplementado. |
| **vue-virtual-scroller-best-practices** | `.claude/skills/vue-virtual-scroller-best-practices/SKILL.md` | Substituir o `virtualScrollerOptions={ itemSize: 40 }` do PrimeVue por `RecycleScroller` (`:item-size="40"`) caso listas grandes exijam virtualização. |
| **vue-floating-vue-tooltips-popovers-best-practices** | `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices/SKILL.md` | Opcional: posicionamento/flutuação do overlay se `position: absolute` simples causar clipping/overflow. Usar apenas se necessário. |
| **vue-vitest-testing-best-practices** | `.claude/skills/vue-vitest-testing-best-practices/SKILL.md` | Escrever/ajustar os testes (fake timers para debounce, mock de `getCachedApiIDB`, asserts de loading), conforme seção 8. |
| **vue-unocss-styling-best-practices** | `.claude/skills/vue-unocss-styling-best-practices/SKILL.md` | Estilização do overlay/input com utilitários UnoCSS + SCSS e variáveis do tema Max (seção 7). |

---

## 10. Riscos e pontos de atenção

1. **Ordem de dependência com o primitivo compartilhado (crítico).**
   `MaxInputAutoCompleteApi` e `MaxInputAutoComplete` compartilham a lógica de
   dropdown. Recomendação de ordem:
   - **Fase A:** migrar `MaxInputAutoCompleteApi` com dropdown **inline** (sem extrair
     core), mantendo `MaxInputAutoComplete` intacto — menor blast radius, PR isolado.
   - **Fase B (opcional, depois):** extrair `MaxAutoCompleteCore.vue` e refatorar
     ambos para consumi-lo.
   Se, em vez disso, você optar por extrair o core primeiro, `MaxInputAutoComplete`
   também será tocado — o que **amplia o escopo e o risco** deste PR. Escolha
   explicitamente e registre no PR.

2. **`InputBase` continua dependente do PrimeVue.** Este PR **não** torna a árvore
   totalmente independente do PrimeVue enquanto `InputBase` (FloatLabel/IconField/
   InputIcon/Message) não for migrado. Documentar como dependência remanescente.

3. **Contrato de teste interno muda.** O teste atual acopla-se ao stub `AutoComplete`
   e ao elemento `.auto-complete`. O ajuste do teste (seção 8.1) é obrigatório;
   cuidado para **não** relaxar os asserts de comportamento ao adaptá-lo.

4. **Campos do slot de item divergem do `optionLabel`.** O componente API usa
   `option.model` e `option.sub_label` **literais** (diferente do irmão, que usa
   `optionLabel`/`subLabel`). Preservar exatamente — mudar quebraria render e teste.

5. **`update:modelValue` só para objetos.** Regra sutil: strings digitadas **não**
   emitem. Fácil de quebrar ao refatorar o input. Cobrir com teste.

6. **`watch(() => props.data, ..., immediate: true)`.** Dispara no mount. Preservar
   `immediate` e `deep`, e as guardas `isBlank`/`isEqual` (senão: loop de requisições
   ou requisição indevida com `data` vazio). O teste "não busca se data em branco"
   depende disso.

7. **Zerar `files`/`file`.** Não remover a lógica de `keyExists(['files','file'], ...)`
   que zera binários antes de enviar `input_value` — evita payloads gigantes/erros no
   backend.

8. **Debounce + `immediate`/loading.** Garantir que o debounce se aplique à digitação,
   **não** ao `watch(props.data)` (a busca por `data` deve continuar imediata). Não
   confundir os dois caminhos.

9. **Vazamento de timer.** `clearTimeout` do debounce e limpeza de listeners de
   `blur`/`Escape` no `onUnmounted`.

10. **Loading não pode alterar layout.** O `InputBase` usa grid `36px / 19px`. O
    indicador de loading deve ser `absolute`/sobreposto, sem empurrar conteúdo.

11. **Acessibilidade/teclado.** O PrimeVue fornecia navegação por teclado e roles ARIA.
    A reimplementação deve, no mínimo, suportar ↑/↓/Enter/Escape e foco correto
    (ver skill de keyboard-navigation), idealmente com `role="listbox"`/`option`.

12. **Fechamento no blur vs clique no item.** Fechar o overlay no `blur` pode impedir
    a seleção por clique. Usar `mousedown.prevent` no item ou pequeno atraso no
    fechamento. Testar manualmente no playground.

13. **`type-check` com props herdados removidos.** Ao remover `AutoCompleteProps`,
    qualquer prop antes herdada e passada por consumidores precisa existir na nova
    interface (seção 4.1), senão `vue-tsc` acusa em código consumidor / o componente
    perde aceitação de atributos. Declarar todos.

14. **CSS global compartilhado.** Classes como `.autocomplete-item-select` e
    `.p-autocomplete-overlay` estão definidas em `MaxInputAutoComplete.vue` como
    estilos **não** scoped (globais). Reutilizá-las cria acoplamento; se as
    renomear/alterar, verifique o impacto no componente irmão.
