# Plano de Migração — MaxInputSearch

> Plano autossuficiente. Uma IA futura deve conseguir executar esta migração lendo **apenas**
> este arquivo + `src/components/MaxInputSearch.vue` + `src/components/InputBase.vue`.
> **Não** alterar outros componentes. Preservar API pública, estilos e comportamento.

---

## 1. Componente

- **Nome:** `MaxInputSearch`
- **Caminho:** `src/components/MaxInputSearch.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** remover a dependência do PrimeVue substituindo `InputText`
  (`primevue/inputtext`) por um `<input>` HTML nativo, mantendo o wrapper `InputBase`, o ícone de
  busca/loading à direita, o `v-model` e o comportamento de debounce/emissão de `search`.

---

## 2. Dependências do PrimeVue (trechos reais)

O único ponto de acoplamento ao PrimeVue **dentro deste componente** é o `InputText`:

```vue
<!-- template -->
<InputText type="text" v-bind="attrs" fluid v-model="temp_value" @input="onInput" />
```

```ts
// script setup
import InputText from 'primevue/inputtext';
```

Observações:

- `InputText` é apenas um wrapper fino do PrimeVue sobre um `<input>` nativo. Ele aplica a classe
  CSS `p-inputtext` (usada nos estilos do `InputBase`) e aceita a prop booleana `fluid`
  (largura 100%).
- Nenhuma outra API do PrimeVue é usada diretamente aqui. O `IconField`/`InputIcon`/`FloatLabel`
  que envolvem o campo pertencem ao `InputBase` (ver seção 3), **não** a este componente.

### Bloco `<style>` — dependências PrimeVue residuais

O bloco `<style lang="scss">` deste arquivo estiliza classes de **AutoComplete** do PrimeVue
(`.p-autocomplete-option`, `.p-autocomplete-list`, `.p-autocomplete-overlay`) e duas classes
utilitárias (`.tst1`, `.tst2`). Este componente **não usa AutoComplete** — são estilos órfãos
(provável resquício de uma implementação anterior). Ver seção 7 para o tratamento recomendado.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação nesta migração |
|-------------|--------|-------|---------------------|
| `InputBase` | `./InputBase.vue` | Wrapper de layout (FloatLabel + IconField + ícones + mensagens). Recebe `iconRight` para o ícone de busca/loading e repassa `v-bind="attrs"`. | **Preservar.** Depende de `InputBase` já migrado (ver seção 10). |
| `useAttrs` | `vue` | Coleta atributos não declarados como props (`placeholder`, `disabled`, `label`, `class`, estados `done/error/caution`, etc.) e os repassa **tanto** ao `InputBase` **quanto** ao input. | **Preservar exatamente** este duplo `v-bind="attrs"`. |
| `ref`, `watch` | `vue` | Estado interno `temp_value` + sincronização bidirecional com `modelValue`. | **Preservar.** |

Não há uso de stores (`useIconStore`, `usePopoverStore`, `useToastStore`), nem de helpers de
`@maxvue/max-use`, nem de `MaxIcon` diretamente neste componente. O `MaxIcon` e `hasContent`
(`@maxvue/max-use`) são usados **internamente pelo `InputBase`**, não aqui.

---

## 4. API pública a preservar

Contrato observável por quem consome a lib — **NÃO pode mudar**.

### Props

| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `modelValue` | `string` | `''` | v-model. |
| `isLoading` | `boolean` (opcional) | `false` | Controla o ícone à direita (loading vs. busca). |

### `v-model`

- `v-model` liga em `modelValue` e emite `update:modelValue`.

### Emits

| Evento | Payload | Quando |
|--------|---------|--------|
| `update:modelValue` | `string` | A cada mudança de `temp_value` (via `watch`). |
| `search` | `string` (valor atual) | 300ms após o último `input`, **somente** se `temp_value.value && temp_value.value.length > 1`. |

### Atributos repassados (`useAttrs`)

Todo atributo não declarado (ex.: `placeholder`, `disabled`, `label`, `class`, `float`, `done`,
`error`, `caution`, `required`, `msg`/`message`, etc.) deve continuar sendo repassado **para o
`InputBase` e para o input** via `v-bind="attrs"`. Isso é o que permite usar props do `InputBase`
(label flutuante, estados de validação, mensagens) diretamente em `<MaxInputSearch>`.

### Ícone à direita (comportamento observável e testado)

- `isLoading === true` → `iconRight = 'line-md:loading-twotone-loop'`
- `isLoading === false` → `iconRight = 'material-symbols:search-rounded'`

Os testes (`tests/components/MaxInputSearch.test.ts`) verificam:
`ib.props('iconRight')` contém `'loading'` quando carregando e `'search'` quando não.

### Slots

- Nenhum slot próprio exposto. (O `InputBase` tem slot default, mas aqui ele é preenchido pelo
  input interno — não deve ser exposto ao consumidor.)

---

## 5. Estratégia de substituição

Substituição **direta por HTML nativo** — não requer biblioteca headless.

- `InputText` → `<input>` nativo.
- Manter a classe `p-inputtext` no `<input>` para **preservar 100% dos estilos existentes** do
  `InputBase` e deste componente (o SCSS do `InputBase` seleciona `.p-inputtext` para altura,
  disabled, width, etc.). Reaproveitar a classe é a forma de menor risco de manter a aparência.
- A prop `fluid` do PrimeVue significava largura 100%. O `InputBase` já força
  `.p-inputtext { width: 100% !important; }`, então basta manter a classe `p-inputtext`; nenhuma
  ação extra é necessária. (Opcionalmente adicionar `w-full`/`width:100%`, mas é redundante.)
- Manter o `v-model` via `:value` + `@input` explícitos (equivalente ao `v-model="temp_value"`),
  garantindo que `onInput` seja chamado.
- Repassar `v-bind="attrs"` no `<input>` como antes (para `placeholder`, `disabled`, etc.).

### Antes → Depois (template do campo)

**Antes:**

```vue
<InputText type="text" v-bind="attrs" fluid v-model="temp_value" @input="onInput" />
```

**Depois:**

```vue
<input
    type="text"
    class="p-inputtext"
    v-bind="attrs"
    :value="temp_value"
    @input="onInput"
/>
```

Onde `onInput` passa a ler o valor do evento e atualizar `temp_value` (ver seção 6, passo 3),
já que o `v-model` implícito deixa de existir.

---

## 6. Passos de implementação

1. **Remover o import do PrimeVue.** Excluir a linha:
   ```ts
   import InputText from 'primevue/inputtext';
   ```

2. **Trocar o elemento no template.** Substituir `<InputText ... />` pelo `<input>` nativo com
   `class="p-inputtext"`, `type="text"`, `v-bind="attrs"` e `:value="temp_value"`. Manter o
   atributo/binding do `InputBase` (`v-bind="attrs"` + `:iconRight` calculado por `isLoading`)
   exatamente como está.

3. **Ajustar `onInput` para capturar o valor.** Como o `v-model` implícito some, `onInput` deve
   atualizar `temp_value` a partir do evento e então aplicar o debounce. Manter aspas simples,
   ponto e vírgula, indentação de 4 espaços, sem trailing comma:
   ```ts
   const onInput = (event: Event) => {
       temp_value.value = (event.target as HTMLInputElement).value;
       clearTimeout(debounceTimer);
       debounceTimer = setTimeout(() => {
           if (temp_value.value && temp_value.value.length > 1) emit('search', temp_value.value);
       }, 300);
   };
   ```
   > O `watch(temp_value, ...)` existente continua emitindo `update:modelValue` automaticamente.
   > Portanto **não** emitir `update:modelValue` manualmente dentro de `onInput` (evita duplicação).

4. **Preservar o restante do `<script setup>` sem alterações:**
   - `const attrs = useAttrs();`
   - `withDefaults(defineProps<{ modelValue: string; isLoading?: boolean }>(), { modelValue: '', isLoading: false })`
   - `const emit = defineEmits(['update:modelValue', 'search']);`
   - `const temp_value = ref(props.modelValue);`
   - `watch(temp_value, (val) => emit('update:modelValue', val));`
   - `watch(() => props.modelValue, (val) => temp_value.value = val);`
   - `let debounceTimer: ReturnType<typeof setTimeout>;`

5. **Tratar o bloco de estilos** conforme seção 7 (remover estilos órfãos de AutoComplete OU
   mantê-los — decisão de baixo risco; recomendação: manter para não alterar comportamento visual
   de nada que porventura dependa disso, mas idealmente remover por serem órfãos).

6. **Verificar tipagem e lint:** rodar `npm run type-check` e `npm run lint`.

7. **Rodar os testes:** `npx vitest run tests/components/MaxInputSearch.test.ts`.

8. **Não é necessário** regenerar o resolver (`generateResolver.ts`) — nenhum arquivo `.vue` novo
   foi criado nem renomeado.

---

## 7. Estilos

- **Classe `p-inputtext`:** manter no `<input>` nativo é o que preserva a aparência. Os seletores
  relevantes vivem no `InputBase.vue` (não neste arquivo):
  - `.p-inputtext { height: 36px; ... }`
  - `.p-inputtext[disabled] { ... }`
  - `.max-input-main-div .p-inputtext { width: 100% !important; }`
  - regras de `text-center`/`text-right`/`in-line`/`slim` que selecionam `input` e `.p-inputtext`.
  Como o `InputBase` já foi/está sendo migrado, essas regras continuam válidas desde que a classe
  `p-inputtext` seja preservada no input. **Não** renomear a classe.

- **Placeholder:** `.max-input-main-div input::placeholder { color: var(--background-625); }`
  (definido no `InputBase`) continua aplicando ao `<input>` nativo.

- **Bloco `<style lang="scss">` deste arquivo (linhas 39–61):** contém apenas estilos **órfãos**:
  `.p-autocomplete-*` (não há AutoComplete aqui) e `.tst1`/`.tst2` (não referenciados no template).
  - **Recomendação:** removê-los, pois este componente não usa AutoComplete e a migração visa
    reduzir acoplamento a classes PrimeVue. Antes de remover, confirmar com um grep que `tst1`,
    `tst2` e os overlays de autocomplete não são usados por nenhum consumidor deste componente
    (são globais/não-scoped, então tecnicamente afetam qualquer AutoComplete na página).
  - **Alternativa conservadora:** manter o bloco intacto (não altera o comportamento do search).
    Se optar por manter, deixar um comentário indicando que são estilos legados.

- **Sem UnoCSS necessário:** não é preciso adicionar classes utilitárias UnoCSS; a largura 100%
  vem do `InputBase`. Se desejar redundância explícita, `w-full` é a classe UnoCSS equivalente.

- **Convenções de estilo:** manter `<style lang="scss">` como último bloco (ordem
  Template → Script → Style), 4 espaços de indentação.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/MaxInputSearch.test.ts` — **deve continuar passando sem modificações**. Casos:

1. `renderiza corretamente` — monta e encontra `InputBase`.
2. `emite update:modelValue ao digitar` — `input.setValue('busca')` dispara `update:modelValue`.
   > **Atenção:** `setValue` do test-utils seta o `value` e dispara `input`. Com o novo `onInput`
   > lendo `event.target.value`, `temp_value` é atualizado e o `watch` emite `update:modelValue`.
   > Garantir que `:value="temp_value"` + `@input="onInput"` reproduzam isso.
3. `emite search após debounce de 300ms` — após `setValue('teste')` + `trigger('input')` e 350ms,
   `search` é emitido com `'teste'`.
4. `não emite search quando valor tem 1 ou menos caracteres` — `'a'` não dispara `search`.
5. `sincroniza modelValue externo` — `setProps({ modelValue: 'novo valor' })` reflete em
   `input.element.value` (via `watch(() => props.modelValue, ...)`).
6. `exibe ícone de loading quando isLoading=true` — `InputBase.props('iconRight')` contém `loading`.
7. `exibe ícone de busca quando isLoading=false` — `iconRight` contém `search`.

### Comandos de verificação

```bash
npx vitest run tests/components/MaxInputSearch.test.ts   # testes do componente
npm run type-check                                        # vue-tsc sem erros
npm run lint                                              # ESLint + Stylelint
```

### Checklist manual (playground: `npm run dev:playground`)

- [ ] Digitar mostra o texto no campo e atualiza o `v-model`.
- [ ] Após ~300ms sem digitar, com >1 caractere, `@search` é emitido uma única vez.
- [ ] Com 1 caractere, `@search` **não** é emitido.
- [ ] `isLoading` alterna o ícone à direita entre busca e loading.
- [ ] `placeholder`, `disabled` e props de `InputBase` (`label`, `error`, `done`, etc.) continuam
      funcionando via `v-bind="attrs"`.
- [ ] Aparência idêntica à versão anterior (altura 36px, largura 100%, placeholder cinza).

### Casos de borda

- Nenhum import de `primevue/*` deve restar no arquivo após a migração (conferir com grep).
- O `watch(temp_value)` deve continuar sendo a única fonte de `update:modelValue` (não duplicar).
- Não emitir `search` para strings vazias ou de 1 caractere.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (apenas as pertinentes a este componente de nível `baixa`):

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da própria lib (InputBase como wrapper, aliases, estrutura de componente). |
| `.claude/skills/vue-inputs-masks-validation-best-practices` | Este é um input de formulário; padrões de v-model, `useAttrs` e estados de campo. |
| `.claude/skills/vue-typescript-best-practices` | Tipagem correta de `defineProps`, `defineEmits` e do handler `onInput(event: Event)`. |
| `.claude/skills/vue-unocss-styling-best-practices` | Reproduzir aparência via variáveis do tema Max e classes utilitárias (largura/placeholder). |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Garantir 4 espaços, aspas simples, ponto e vírgula, sem trailing comma; SCSS válido. |
| `.claude/skills/vue-vitest-testing-best-practices` | Manter/validar `MaxInputSearch.test.ts` (fake timers, debounce, `setValue`, `findComponent`). |

Skills **não** necessárias aqui (e por quê): `vue-virtual-scroller-*` (sem lista virtualizada),
`vue-floating-vue-*` e `vue-keyboard-shortcuts-*` (não há dropdown/menu/navegação por teclado),
`vue-dayjs-*`, `vue-uppy-*`, `vue-pdf-*` (sem datas/upload/PDF), `vue-pinia-*` (não usa stores).

---

## 10. Riscos e pontos de atenção

- **Ordem / dependência transitiva — `InputBase` primeiro.** Este componente renderiza dentro de
  `InputBase`, que ainda importa PrimeVue (`FloatLabel`, `IconField`, `InputIcon`, `Message`,
  `MaxIcon`). A migração de `MaxInputSearch` só remove o PrimeVue **deste** arquivo; a
  independência total do componente depende de `InputBase` já estar migrado. **Migrar `InputBase`
  antes** (ele é usado por ~19 inputs).

- **Classe `p-inputtext` acopla estilo, não lógica.** Manter a classe é intencional para preservar
  a aparência. Se, na migração global, a classe `p-inputtext` for renomeada no `InputBase`,
  atualizar aqui também. Enquanto o `InputBase` mantiver `p-inputtext`, manter aqui.

- **`v-model` explícito.** Ao trocar `v-model="temp_value"` por `:value` + `@input`, o handler
  `onInput` passa a ser responsável por atualizar `temp_value`. Esquecer essa atualização quebra
  os testes 2, 3 e 5. Garantir `temp_value.value = (event.target as HTMLInputElement).value;` no
  início de `onInput`.

- **Não duplicar `update:modelValue`.** O `watch(temp_value, ...)` já emite. Não adicionar emissão
  manual em `onInput`.

- **Estilos órfãos de AutoComplete.** As regras `.p-autocomplete-*` deste arquivo são globais
  (não scoped) e não pertencem a este componente. Removê-las é o ideal, mas conferir por grep que
  nenhum outro componente depende delas antes de excluir; na dúvida, mantê-las (não afeta o
  search).

- **`fluid` removido.** A largura 100% agora vem exclusivamente do CSS do `InputBase`
  (`.p-inputtext { width: 100% !important; }`). Verificar visualmente que o campo continua
  ocupando 100% do container.

- **Atributos repassados duas vezes.** O `v-bind="attrs"` aparece no `InputBase` e no input. Isso
  é o comportamento atual e deve ser mantido — alterá-lo quebraria o repasse de `placeholder`,
  `disabled` e props de estado do `InputBase`.
