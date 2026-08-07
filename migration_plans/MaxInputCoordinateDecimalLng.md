# Plano de Migração — MaxInputCoordinateDecimalLng

> Plano autossuficiente para tornar o componente **independente do PrimeVue**.
> A IA executora deve ler apenas este arquivo + a fonte referenciada
> (`src/components/MaxInputCoordinateDecimalLng.vue`).
> **Não** alterar a API pública, os estilos, nem o comportamento observável.

---

## 1. Componente

- **Nome:** `MaxInputCoordinateDecimalLng`
- **Caminho:** `src/components/MaxInputCoordinateDecimalLng.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** substituir o `InputText` do PrimeVue por um `<input>`
  HTML nativo, mantendo a máscara Maska, a conversão `toNumber`/`isBlank` e a
  validação de longitude. O wrapper `InputBase` deve continuar sendo usado como
  elemento mais externo.
- **Componente irmão (referência):** `src/components/MaxInputCoordinateDecimalLat.vue`
  segue o mesmo padrão (a única diferença é a faixa de validação e a máscara);
  ao migrar, aplique a mesma estratégia lá para manter consistência.

---

## 2. Dependências do PrimeVue (trechos reais)

Há **uma única** dependência direta do PrimeVue no componente: o `InputText`.

**Import (linha 12):**
```ts
import InputText from 'primevue/inputtext';
```

**Uso no template (linha 3):**
```html
<InputText number type="text" v-model="temp_value" v-maska="maskValue" autoClear="false" slotChar=" " fluid @blur="checkDone()" :placeholder="`00,000000`" />
```

Observações sobre os atributos usados no `InputText` (para reproduzir fielmente):
- `number` / `autoClear="false"` / `slotChar=" "` — atributos que o PrimeVue
  simplesmente repassa ao DOM ou ignora; **não afetam o comportamento** deste
  componente (a máscara é controlada por `v-maska`, não pelo PrimeVue). Podem ser
  descartados ou mantidos como atributos "pass-through" no `<input>` nativo sem
  efeito colateral.
- `type="text"` — deve ser preservado (a máscara insere `-`, `.` e espaços;
  `type="number"` quebraria a máscara).
- `fluid` — no PrimeVue significa "largura 100%". Deve ser reproduzido via CSS
  (`width: 100%`). O `InputBase.vue` já força `.p-inputtext { width: 100% !important }`;
  ver seção **7. Estilos** para o novo seletor.
- `v-maska="maskValue"` — **NÃO é PrimeVue**, é a diretiva da lib `maska/vue`.
  Deve ser preservada exatamente igual no `<input>` nativo.
- `@blur="checkDone()"` — handler nativo, preservar.
- `:placeholder="`00,000000`"` — preservar.

> **Importante:** o `InputBase` (elemento externo) também depende do PrimeVue
> (`FloatLabel`, `IconField`, `InputIcon`, `Message`). **Este componente NÃO deve
> migrar o `InputBase`** — ele apenas o consome. Ver seção **10. Riscos / ordem**.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Preservar? |
|-------------|--------|-------|-----------|
| `InputBase` | `./InputBase.vue` | Wrapper de layout (FloatLabel, ícones, mensagem, estados done/error/caution). Elemento mais externo. | **Sim** — manter import e uso idênticos. |
| `toNumber` | `@maxvue/max-use` | Converte `string \| number` em `number`, com casas decimais opcionais. Assinatura: `toNumber(value, decimals?: number \| null = null): number`. Retorna `0` para valores vazios/inválidos/`NaN`. | **Sim** — lógica de conversão intocada. |
| `isBlank` | `@maxvue/max-use` | Verifica se um valor é "vazio". Usado na validação de campo obrigatório e no `caution`. | **Sim**. |
| `vMaska` | `maska/vue` | Diretiva de máscara. Registrada localmente e usada como `v-maska`. | **Sim** — máscara é a espinha dorsal do formato. |
| `ref`, `computed`, `watch`, `Ref` | `vue` | Reatividade. | **Sim**. |

**Contrato relevante de `toNumber` (fonte real em `@maxvue/max-use`):**
```ts
export function toNumber(value, decimals = null) {
    const data = toValue(value);
    if (!data || isBlank(data) || isNaN(Number(data))) return 0;
    const number = Number(data);
    if (decimals !== null) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    }
    return number;
}
```
Consequência para a validação: qualquer entrada vazia/inválida vira `0`, e a
regra de `done` trata `only_numbers === 0` como inválido.

---

## 4. API pública a preservar

Tudo abaixo é observável por quem consome a lib e **NÃO pode mudar**.

### Props
```ts
{
    modelValue: string | number;      // default: ''
    icon?: string;
    i?: string;
    disabled?: boolean;
    float?: boolean;
    msg?: string;
    message?: string;
    iconMessage?: string;
    label?: string;
    done?: boolean;                   // default: undefined
    error?: string | boolean;
    targetValue?: string;
    caution?: string | boolean;       // default: undefined
    required?: boolean;               // default: false
}
```
Defaults exatos (via `withDefaults`):
`{ modelValue: '', done: undefined, required: false, caution: undefined }`.

> Todas essas props (exceto controle interno) são repassadas ao `InputBase` via
> `v-bind="props"`. Preservar esse `v-bind="props"`.

### Emits
```ts
defineEmits(['update:modelValue', 'complete']);
```
- `update:modelValue` — emitido no `watch(temp_value, ...)` **com `{ immediate: true }`**,
  enviando `toNumber(temp_value.value, 6)` (número arredondado a 6 casas).
- `complete` — emitido no mesmo watch **somente quando `done.value === true`**,
  com o mesmo valor numérico.

### v-model
`v-model` (via `modelValue` + `update:modelValue`) deve continuar funcionando
identicamente, inclusive a emissão imediata na montagem.

### Slots
Nenhum slot próprio exposto (o `<slot>` fica dentro do `InputBase`).

### Propriedades/refs expostas ao teste (mantidas como estão no `<script setup>`)
Os testes acessam via `wrapper.vm`:
- `temp_value` (ref) — valor de exibição/máscara.
- `checkDone()` (função) — copia `done.value` para `isDone.value`.
- `isDone` (ref) — estado done efetivo.
- `done` (computed), `caution` (computed), `error` (computed).

> Em `<script setup>` essas variáveis já são acessíveis nos testes atuais.
> **Preservar os mesmos nomes** para não quebrar `tests/components/MaxInputCoordinateDecimalLng.test.ts`.

### Comportamento de validação (regra de negócio — copiar sem alterar)

`only_numbers = toNumber(temp_value.value)` (sem casas fixas).

`done` (computed):
```ts
if (props.done !== undefined) return props.done;
if (isBlank(temp_value.value) && props.required) return true;
return !(only_numbers.value <= -74 || only_numbers.value > -32.4 || only_numbers.value === 0 || isNaN(only_numbers.value));
```
> Faixa válida de longitude (Brasil): `-74 < lng <= -32.4`, diferente de `0`.

`caution` (computed):
```ts
if (props.caution !== undefined) return props.caution;
if (temp_value.value === '') return false;
return !done.value;
```

`error` (computed):
```ts
if (isBlank(temp_value.value) && props.required) return 'Campo obrigatório';
if (!done.value) return 'Longitude inválida.';
return false;
```

`maskValue` (computed) — **preservar exatamente**:
```ts
const tokens = {
    '#': { pattern: /[0-9]/ },
    '7': { pattern: /[3-7]/ }
};
const mask = '-7#.######';
return { tokens, mask, eager: true };
```

Watches:
```ts
watch(temp_value, () => {
    const val = toNumber(temp_value.value, 6);
    emit('update:modelValue', val);
    if (done.value) emit('complete', val);
}, { immediate: true });

watch(() => props.modelValue, () => temp_value.value = props.modelValue ? toNumber(props.modelValue, 6) : temp_value.value);
```

Inicialização do `temp_value`:
```ts
const temp_value = ref(toNumber(props.modelValue) !== 0 ? toNumber(props.modelValue) : '');
```

---

## 5. Estratégia de substituição

**Substituição direta e mínima** — nível `baixa`, nenhuma biblioteca headless necessária.

1. Trocar `<InputText ... />` por `<input ... />` HTML nativo.
2. Remover o import `import InputText from 'primevue/inputtext';`.
3. Manter **todo** o `<script setup>` intocado (lógica, computeds, watches, máscara).
   A migração é puramente de camada de apresentação.
4. Reproduzir os efeitos visuais que o `InputText` fornecia via CSS/classe
   (largura 100% + estilo base do `.p-inputtext`), pois o SCSS do `InputBase`
   e do tema mira seletores `.p-inputtext` / `input`. Ver seção **7**.

**Mapa de atributos `InputText` → `<input>` nativo:**

| PrimeVue `InputText` | `<input>` nativo | Ação |
|----------------------|------------------|------|
| `v-model="temp_value"` | `v-model="temp_value"` | manter |
| `type="text"` | `type="text"` | manter |
| `v-maska="maskValue"` | `v-maska="maskValue"` | manter (diretiva Maska) |
| `@blur="checkDone()"` | `@blur="checkDone()"` | manter |
| `:placeholder="`00,000000`"` | `:placeholder="`00,000000`"` | manter |
| `fluid` | (CSS `width:100%`) | reproduzir via classe/estilo |
| `number` | — | descartável (sem efeito real aqui) |
| `autoClear="false"` | — | descartável (prop do PrimeVue) |
| `slotChar=" "` | — | descartável (prop do PrimeVue) |

> Não introduzir `disabled` no `<input>` se o original não o passava ao
> `InputText` — o original **não** vincula `:disabled`; o `disabled` chega ao
> `InputBase` via `v-bind="props"`. Manter o mesmo comportamento (não adicionar).

---

## 6. Passos de implementação

Ordem executável:

1. **Pré-condição:** confirmar que `InputBase` já foi migrado para ser
   independente do PrimeVue (ver seção **10**). Se ainda não foi, este plano pode
   ser implementado, mas a verificação visual completa só será possível após a
   migração do `InputBase`. A lógica deste componente não depende do estado
   interno do `InputBase`.

2. **Remover import PrimeVue:** apagar a linha
   `import InputText from 'primevue/inputtext';`.

3. **Editar o template:** substituir a linha do `<InputText>` por um `<input>`
   nativo. Sugestão (respeitando indentação de 4 espaços):
   ```html
   <template>
       <InputBase v-bind="props" :error="error" :caution="caution" :done="isDone">
           <input
               type="text"
               class="max-native-input"
               v-model="temp_value"
               v-maska="maskValue"
               :placeholder="`00,000000`"
               @blur="checkDone()"
           />
       </InputBase>
   </template>
   ```
   - Classe `max-native-input` (ou reutilizar `p-inputtext` — ver nota em **7**)
     para herdar largura/altura/estilo já existentes.

4. **Não tocar no `<script setup>`** — manter integralmente: props, defaults,
   emits, `temp_value`, `only_numbers`, `isDone`, `checkDone`, `done`, `caution`,
   `error`, `maskValue`, os dois `watch` e o import de `vMaska`, `toNumber`,
   `isBlank`, `InputBase`.

5. **Estilos:** garantir que o `<input>` receba as regras visuais equivalentes
   ao antigo `.p-inputtext` (largura 100%, altura 36px, placeholder etc.).
   Ver seção **7** para a decisão de reutilizar a classe `.p-inputtext` vs. criar
   um bloco `<style>` scoped novo.

6. **Aplicar a mesma migração ao irmão** `MaxInputCoordinateDecimalLat.vue`
   (opcional dentro deste plano, mas recomendado para consistência — se estiver
   fora de escopo, apenas registrar no relatório).

7. **Rodar verificação** (seção **8**): lint, type-check e testes do componente.

8. **Se novo componente/arquivo tivesse sido criado** (não é o caso aqui, é
   edição): rodar `npx tsx src/scripts/generateResolver.ts`. Como este é apenas
   um edit de arquivo existente, **não é necessário** regenerar o resolver.

---

## 7. Estilos

O `<input>` nativo precisa parecer idêntico ao antigo `InputText`. Duas rotas:

### Rota A (recomendada, menor risco visual): reutilizar a classe `.p-inputtext`
O tema Max e o `InputBase.vue` já estilizam `.p-inputtext` e `input`:
- `InputBase.vue` (bloco `<style lang="scss">`) contém:
  ```scss
  .p-inputtext { width: 100% !important; }   // dentro de .max-input-main-div
  .p-inputtext { height: 36px; }             // global
  .p-inputtext[disabled] { ... }
  ```
- Vários seletores do `InputBase` já miram diretamente `input` (ex.:
  `&.text-center input { text-align: center }`, `input::placeholder { color: var(--background-625) }`,
  estados `&.error input { border-color: var(--max-red-600) }`,
  `&.caution input { border-color: var(--orange-600) }`).

Portanto, **basta manter uma classe que já é reconhecida pelo tema**. Enquanto o
tema PrimeVue base ainda existir na app consumidora, atribuir `class="p-inputtext"`
ao `<input>` preserva 100% da aparência sem novo CSS. Isso é aceitável na fase de
transição.

### Rota B (independência total de nomes PrimeVue): novo bloco `<style>` scoped
Quando a lib for 100% livre de PrimeVue, criar no próprio componente (ou,
preferencialmente, centralizar no `InputBase` migrado) as regras base do input.
Como os seletores de estado (`.error input`, `.caution input`, `::placeholder`)
já miram `input` (elemento, não classe), a maior parte da aparência é preservada
automaticamente. O que o `.p-inputtext` adiciona e precisa ser replicado:
```scss
input.max-native-input {
    width: 100%;
    height: 36px;
    // border/radius/padding/background devem espelhar o token do tema Max;
    // usar variáveis CSS existentes, ex.: var(--background-0), var(--background-300).
}
input.max-native-input::placeholder {
    color: var(--background-625);
}
input.max-native-input[disabled] {
    background: var(--background-75);
    color: var(--background-400);
}
```
Usar **variáveis CSS do tema Max** (`var(--background-300)`, `var(--max-red-600)`,
`var(--orange-600)`) e classes UnoCSS custom do preset (`src/presetMaxUno.ts`)
quando aplicável. Seguir ordem de blocos Template → Script → Style e
`<style lang="scss">`.

**Decisão sugerida:** implementar **Rota A** agora (classe `p-inputtext`), deixando
comentário `// TODO: migrar estilo base do input junto com InputBase (Rota B)`,
para não duplicar CSS antes do `InputBase` estar migrado. Assim a aparência fica
garantida e a limpeza final acontece junto do `InputBase`.

---

## 8. Testes / verificação

**Arquivo de teste existente (deve continuar passando sem alteração):**
`tests/components/MaxInputCoordinateDecimalLng.test.ts`

Ponto crítico: o teste **já stub-a** `InputBase` e `InputText`:
```ts
stubs: {
    InputBase: { template: '<div><slot /></div>', props: ['error', 'caution', 'done'] },
    InputText: { template: '<input />' }
}
```
- Após a migração, o stub `InputText` deixa de ser usado (não há mais componente
  `InputText`), mas **isso não quebra o teste** — stubs não utilizados são
  ignorados. Não é necessário editar o teste. Opcionalmente, remover a entrada
  `InputText` do stub e o import `vMaska` não utilizado, mas **não é obrigatório**
  e o plano prioriza mudança mínima.
- A diretiva `v-maska` precisa continuar registrada nos testes: o `globalOptions`
  já registra `directives: { maska: vMaska }`. Preservar.

**Comandos de verificação (rodar todos):**
```bash
npx vitest run tests/components/MaxInputCoordinateDecimalLng.test.ts
npm run type-check
npm run lint
```

**Casos de borda a validar manualmente (checklist):**
- [ ] Montagem com `modelValue: ''` → emite `update:modelValue` imediatamente
      (por causa de `{ immediate: true }`).
- [ ] Digitar `-46.633308` em `temp_value` → `update:modelValue` recebe `-46.633308`.
- [ ] `modelValue: '100'` → `done === false`, `caution === true`,
      `error === 'Longitude inválida.'`.
- [ ] `temp_value === ''` → `caution === false`.
- [ ] `required: true` + vazio → `error === 'Campo obrigatório'`.
- [ ] `temp_value = '-46.6'` (válido dentro do Brasil) → emite `complete`.
- [ ] `setProps({ modelValue: '-40' })` → `temp_value === -40`.
- [ ] `done: true, caution: true` (props manuais) → prevalecem sobre computeds.
- [ ] `modelValue: '-46.6', required: true` → `error === false`.
- [ ] Máscara: a diretiva `v-maska` aplica `-7#.######` (primeiro dígito 3-7)
      no `<input>` nativo exatamente como antes.
- [ ] Aparência: largura 100%, altura 36px, placeholder `00,000000`, bordas de
      estado (erro vermelho, caution laranja) idênticas.

---

## 9. Skills necessárias

Selecionadas da pasta `.claude/skills` (priorizando prefixo `vue-` e pertinência
real a este input mascarado de baixa complexidade):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da
  própria lib (uso de `InputBase`, estrutura de componentes, resolver, testes).
  **Essencial** por ser o repositório-alvo.
- `.claude/skills/vue-inputs-masks-validation-best-practices` — cobre Maska v3
  (tokens, `eager`, máscara dinâmica) e validação de inputs; núcleo deste componente.
- `.claude/skills/vue-max-use-development-best-practices` — comportamento de
  `toNumber`/`isBlank` de `@maxvue/max-use`, preservados na migração.
- `.claude/skills/vue-typescript-best-practices` — tipagem correta de
  `defineProps`/`defineEmits`/`Ref` em `<script setup lang="ts">`.
- `.claude/skills/vue-unocss-styling-best-practices` — reprodução fiel de estilos
  com classes utilitárias/UnoCSS e variáveis CSS do tema Max no `<input>` nativo.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — garantir 4 espaços,
  aspas simples, sem trailing commas, ordem de blocos e SCSS válido.
- `.claude/skills/vue-vitest-testing-best-practices` — manter/validar o teste
  existente com Vitest + `@vue/test-utils` (stubs, diretiva `maska`, emits).

> Skills descartadas por não se aplicarem: floating-vue/popovers, keyboard-navigation,
> virtual-scroller, dayjs, uppy, pdf, pinia (o componente não usa store), dynamic-components.

---

## 10. Riscos e pontos de atenção

- **Ordem — `InputBase` primeiro (dependência transitiva):** este componente usa
  `<InputBase>` como wrapper externo, e o `InputBase` ainda depende de PrimeVue
  (`FloatLabel`, `IconField`, `InputIcon`, `Message`). A migração deste input
  **não** remove essa dependência. Para a lib ficar 100% livre de PrimeVue, o
  `InputBase` deve ser migrado **antes** (ou em conjunto). A lógica/validação
  deste componente, porém, pode ser migrada independentemente.
- **Estilo acoplado a `.p-inputtext` / `input`:** boa parte da aparência vem de
  seletores no `InputBase.vue` que miram `.p-inputtext` e o elemento `input`. Ao
  trocar por `<input>` nativo, se **não** usar a classe `p-inputtext` (Rota A),
  garantir que as regras base (largura, altura 36px) sejam replicadas, senão o
  campo pode ficar sem largura/altura corretas. Os estados de erro/caution já
  miram `input` e continuam funcionando.
- **`v-maska` é diretiva, não PrimeVue:** não remover por engano ao "limpar
  imports". A máscara `-7#.######` (token `7` = dígito 3–7) é o que garante o
  formato de longitude; removê-la muda o comportamento observável.
- **Emissão imediata (`{ immediate: true }`):** o `watch(temp_value, ...)` emite
  `update:modelValue` já na montagem. Preservar essa opção — testes e consumidores
  dependem disso.
- **Não usar `type="number"`:** a máscara insere `-`, `.` e caracteres; `type="number"`
  rejeitaria/normalizaria a entrada e quebraria a máscara. Manter `type="text"`.
- **Props manuais têm precedência:** `props.done`/`props.caution` (quando
  `!== undefined`) sobrescrevem os computeds. Não simplificar essa lógica.
- **Componente irmão `MaxInputCoordinateDecimalLat`:** migrar em conjunto para
  evitar divergência de padrão; se ficar para depois, registrar como pendência.
- **Resolver/manifest:** como esta é uma edição (não novo arquivo), **não** é
  necessário rodar `generateResolver.ts`. Rodar apenas se o arquivo for
  renomeado/adicionado.
- **Teste com stub obsoleto:** o stub `InputText` no teste ficará inutilizado após
  a migração — inofensivo. Remoção é opcional e não deve alterar os asserts.
