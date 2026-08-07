# Plano de Migração — MaxColorPicker

> Plano autossuficiente para tornar o `MaxColorPicker` independente do PrimeVue.
> Uma IA futura deve conseguir executá-lo lendo apenas este arquivo + o código-fonte
> referenciado. **Não** alterar outros componentes além do previsto aqui.

---

## 1. Componente

- **Nome:** `MaxColorPicker`
- **Arquivo:** `src/components/MaxColorPicker.vue`
- **Export/alias (em `src/index.ts`):** `export { default as MaxColorPicker } from './components/MaxColorPicker.vue';` (apenas 1 alias — preservar).
- **Nível de dificuldade:** `media`
- **Objetivo:** remover as dependências `primevue/inputtext` (`InputText`) e `primevue/colorpicker` (`ColorPicker`), substituindo-as por HTML nativo (`<input>` e `<input type="color">`) sem mudar API pública, aparência nem comportamento.

---

## 2. Dependências do PrimeVue (trechos reais)

No `src/components/MaxColorPicker.vue`:

```ts
import InputText from 'primevue/inputtext';
import ColorPicker from 'primevue/colorpicker';
```

Uso no template:

```vue
<ColorPicker v-model="modelValue" :defaultColor="props.defaultColor" :format="props.format"
    :inline="props.inline" :disabled="props.disabled" :panelClass="props.panelClass"
    :appendTo="props.appendTo" :autoZIndex="props.autoZIndex" :baseZIndex="props.baseZIndex"
    :inputId="props.inputId" :ariaLabel="props.ariaLabel" :ariaLabelledby="props.ariaLabelledby" />
<InputText v-model="modelValue" />
```

### Comportamento relevante do `ColorPicker` do PrimeVue a reproduzir

- `v-model` guarda a cor **sem** o prefixo `#` quando `format='hex'` (ex.: `'ff0000'`, não `'#ff0000'`). O default `defaultColor: 'ff0000'` confirma isso.
- Renderiza um **preview** clicável (`.p-colorpicker-preview`) que abre um painel de seleção de cor (popup) por padrão; com `inline=true` o painel é renderizado embutido.
- `format` pode ser `'hex' | 'rgb' | 'hsb'`. Na prática, para o `<input type="color">` nativo trabalhamos internamente em hex `#rrggbb` e convertemos para/de o formato do `v-model`.
- O CSS existente estiliza `.p-colorpicker-preview` (outline + border-radius) — o novo preview deve manter a mesma classe visual ou equivalente (ver seção 7).

### Dependência transitiva

- `InputBase.vue` importa de PrimeVue: `FloatLabel`, `IconField`, `InputIcon`, `Message`. **Isto NÃO é responsabilidade deste plano** — o `InputBase` será migrado por seu próprio plano. Ver seção 10 (ordem).

---

## 3. Dependências internas (preservar)

- **`InputBase`** — `import InputBase from './InputBase.vue';` (wrapper obrigatório, elemento mais externo). Continua sendo o container. Todas as props visuais/estado (`done`, `error`, `caution`, `required`, `label`, `icon`, etc.) são repassadas via `v-bind="props"`.
- **`@maxvue/max-use`** — `import { toSearchableString, hasContent } from '@maxvue/max-use';`
  - `hasContent(value)` — retorna `true` quando o valor tem conteúdo significativo. Usado em `isEqual`, `isRequiredDone`.
  - `toSearchableString(value)` — normaliza string (minúsculas, sem acentos/símbolos) para comparação. Usado em `isEqual`.
  - **Ambos devem permanecer sendo importados de `@maxvue/max-use` — não reimplementar.**
- **Vue core** — `ref`, `computed`, `watch`, `useAttrs`, `type Ref`, `defineModel`.

Nenhuma store Pinia é usada por este componente.

---

## 4. API pública a preservar

### v-model

- `const modelValue = defineModel<any>({ default: '' });` — **manter exatamente** (tipo `any`, default `''`). É a única forma de emissão do componente (não há `defineEmits` explícito).

### Props (interface `Props` + `withDefaults`) — preservar nomes, tipos e defaults

Específicas do color picker:

| Prop | Tipo | Default | Observação de migração |
|------|------|---------|------------------------|
| `defaultColor` | `string` | `'ff0000'` | Cor exibida quando `modelValue` vazio. Sem `#`. |
| `format` | `'hex' \| 'rgb' \| 'hsb'` | `'hex'` | Formato do valor no `v-model`. |
| `inline` | `boolean` | `false` | Painel embutido vs popup. |
| `panelClass` | `any` | — | Classe do painel. |
| `appendTo` | `'body' \| 'self' \| string \| any` | `'body'` | Onde ancorar o painel (popup). |
| `autoZIndex` | `boolean` | `true` | Gerência automática de z-index. |
| `baseZIndex` | `number` | `0` | z-index base. |
| `inputId` | `string` | — | id do input subjacente. |
| `ariaLabel` | `string` | — | Acessibilidade. |
| `ariaLabelledby` | `string` | — | Acessibilidade. |

Comuns (repassadas ao `InputBase` via `v-bind="props"`):
`icon`, `i`, `disabled` (`false`), `float`, `msg`, `message`, `iconMessage`, `label`, `done` (`undefined`), `error` (`undefined`), `targetValue`, `caution` (`undefined`), `required` (`false`), `placeholder`.

> **Regra:** manter a interface `Props` idêntica e o objeto `withDefaults(...)` idêntico. Mesmo que algumas props (`panelClass`, `appendTo`, `autoZIndex`, `baseZIndex`) percam sentido técnico após remover o painel do PrimeVue, **elas devem continuar existindo na assinatura** para não quebrar consumidores. Podem virar no-ops documentados.

### Slots

- Nenhum slot próprio é definido. O `InputBase` fornece slots internos, mas `MaxColorPicker` não os expõe. Não adicionar slots novos.

### Atributos (`useAttrs`)

- `attrs` é lido para mensagens de erro: `attrs.errMsg`, `attrs.error_message`, `attrs.error_msg`, `attrs.target_value`, `attrs.targetValue`, `attrs['target-value']`. **Preservar essa leitura** integralmente.

### Lógica de validação a preservar (idêntica)

- `isDone` (`ref`), `isEqual`, `isRequiredDone`, `testIsDone()`, `caution` (computed), `error_msg` (computed), e o `watch(modelValue, ...)` com `{ immediate: true }`. **Copiar sem alterações** — não faz parte da dependência do PrimeVue.

---

## 5. Estratégia de substituição

Avaliação das duas alternativas exigidas:

### Opção A — `<input type="color">` nativo (RECOMENDADA)

**Prós:** zero dependências, acessível, popup nativo do SO, suporte universal, mínima superfície de manutenção. Alinha-se ao `description_migration` ("usar `<input type="color">` nativo").

**Contras:**
- O `<input type="color">` **sempre** usa hex `#rrggbb` (7 chars) — não emite `rgb`/`hsb` nem hex sem `#`. É preciso uma **camada de conversão** entre o valor nativo e o `v-model` no `format` pedido.
- O `inline` do PrimeVue (painel embutido) não existe no nativo (o picker é sempre popup do SO). Comportamento aceitável: `inline` vira no-op visual; o swatch nativo continua sendo o gatilho. Documentar em Riscos.
- `panelClass`, `appendTo`, `autoZIndex`, `baseZIndex` deixam de ter efeito (o popup é do SO). Viram no-ops.

### Opção B — Picker headless leve (só se A for insuficiente)

Reimplementar um popup de seleção HSV/roda de cor (ou integrar algo como `vanilla-picker`/`@radix-ui`-like headless). Necessário **apenas** se o projeto exigir de fato o modo `inline` embutido, painel customizado (`panelClass`) ou paridade pixel-perfect com o painel do PrimeVue.

**Decisão:** **usar a Opção A** (`<input type="color">`). É o menor risco e cobre o uso real (preview + escolha de cor + valor hex). Tratar `format='rgb'`/`'hsb'` via conversão de string; tratar `inline`/`panelClass`/`appendTo`/`autoZIndex`/`baseZIndex` como no-ops preservados na API. Se, na verificação, o modo `inline` for realmente usado por algum consumidor, escalar para Opção B (deixar hook de extensão comentado).

### Camada de conversão (helpers locais no `<script setup>`)

Implementar utilitários puros dentro do componente (ou, se preferir centralizar, avaliar mover para `@maxvue/max-use` — mas o padrão mínimo é local):

- `toNativeHex(value: string): string` → normaliza o `modelValue` (hex sem `#`, hex com `#`, `rgb(...)`, ou objeto) para `#rrggbb` que o `<input type="color">` aceita. Fallback: `'#' + props.defaultColor` normalizado.
- `fromNativeHex(hex: string): string` → converte o `#rrggbb` nativo de volta para o `format` do `v-model`:
  - `format='hex'` → retorna **sem** `#` (ex.: `'ff0000'`), preservando o formato atual do PrimeVue.
  - `format='rgb'` → retorna string `rgb(r, g, b)` (ou objeto, conforme o que o PrimeVue emitia — validar; PrimeVue emite objeto `{ r, g, b }` para rgb/hsb). **Verificar o formato exato emitido pelo PrimeVue antes de fixar** (ver Riscos). Por segurança, replicar o objeto `{ r, g, b }` para `rgb` e `{ h, s, b }` para `hsb`.
- Conversões `hexToRgb`, `rgbToHex`, `rgbToHsb`, `hsbToRgb` conforme necessário para `format`.

> Como o default e o uso real é `format='hex'`, priorizar 100% de fidelidade no caminho hex; rgb/hsb podem ser cobertos de forma best-effort e testados.

---

## 6. Passos de implementação

1. **Ler o código atual** de `src/components/MaxColorPicker.vue` e `src/components/InputBase.vue`. Confirmar que este plano corresponde ao código (assinatura de props, defaults, template).

2. **Confirmar pré-requisito:** `InputBase` já deve estar migrado (independente do PrimeVue) OU garantir que continua funcional. Se `InputBase` ainda usa PrimeVue, `MaxColorPicker` ainda dependerá indiretamente dele — aceitável apenas se a ordem recomendada (seção 10) for seguida.

3. **Remover imports do PrimeVue:**
   - Apagar `import InputText from 'primevue/inputtext';`
   - Apagar `import ColorPicker from 'primevue/colorpicker';`

4. **Substituir o preview de cor** (`<ColorPicker>`) por um wrapper contendo `<input type="color">`:
   - Manter a coluna de `30px` do grid `.max-input-color` (seção 7). O swatch nativo ocupa essa coluna.
   - Vincular via um `computed` writable `nativeColor` (getter `toNativeHex(modelValue)`, setter `modelValue = fromNativeHex(value)`), OU handler `@input`.
   - Aplicar `:disabled="props.disabled"`, `:id="props.inputId"`, `:aria-label="props.ariaLabel"`, `:aria-labelledby="props.ariaLabelledby"`.
   - Aplicar classe `p-colorpicker-preview` (ou nova classe equivalente estilizada — ver seção 7) para reaproveitar o estilo existente (outline + radius). Preferir **manter** `p-colorpicker-preview` para não editar o SCSS.

5. **Substituir o `<InputText>`** por um `<input>` nativo:
   - `v-model="modelValue"` (input de texto que mostra/edita o valor da cor como string, exatamente como o `InputText` fazia).
   - Aplicar classe `p-inputtext` (reaproveita estilos globais de `.p-inputtext` já existentes no SCSS do `InputBase` e do tema) para preservar altura/aparência, OU migrar para a classe equivalente que o `InputBase` migrado passar a usar. Preferir manter `p-inputtext` enquanto o tema ainda expõe essa classe.
   - `:disabled`, `:placeholder="props.placeholder"` conforme aplicável.

6. **Adicionar os helpers de conversão** (`toNativeHex`, `fromNativeHex`, `hexToRgb`, `rgbToHex`, etc.) no `<script setup>`, tipados, com aspas simples, 4 espaços, sem trailing commas, ponto e vírgula.

7. **Preservar integralmente** toda a lógica de validação/estado: `attrs`, `isDone`, `isEqual`, `isRequiredDone`, `testIsDone`, `caution`, `error_msg`, `watch`. Copiar sem alteração.

8. **Preservar a interface `Props` e `withDefaults`** exatamente. As props sem efeito técnico (`panelClass`, `appendTo`, `autoZIndex`, `baseZIndex`, `inline`) permanecem declaradas. Adicionar comentário `// no-op após migração (mantido por compatibilidade de API)` onde não forem usadas.

9. **Manter o wrapper `InputBase`** como elemento mais externo com `v-bind="props"`, `:done`, `:error`, `:caution`, `class="max-input-color"` idênticos.

10. **Manter a ordem de blocos** Template → Script → Style e o comentário JSDoc entre template e script (ou movê-lo para cima do `<script>` conforme lint — validar com `npm run lint`).

11. **NÃO** é necessário rodar `generateResolver.ts` (nenhum arquivo `.vue` novo é adicionado; o manifesto não muda).

12. **Rodar** `npm run type-check`, `npm run lint`, e os testes (seção 8).

---

## 7. Estilos

O bloco `<style lang="scss">` atual **deve ser mantido**. Pontos-chave:

```scss
.max-input-color {
    display: grid;
    grid-template-columns: 30px 1fr;   /* col 1 = swatch, col 2 = input texto */
    place-items: center;
    grid-template-rows: 1fr !important;
    gap: 0.5rem;

    .message-spacer { display: none; }
    .p-floatlabel { grid-template-rows: 1fr !important; }

    .p-colorpicker-preview {           /* estiliza o swatch de cor */
        outline: 1px solid var(--background-400);
        border-radius: 0.5rem;
    }
}
```

Diretrizes:

- **Reaproveitar `.p-colorpicker-preview`**: aplicar essa classe ao `<input type="color">` (ou ao wrapper do swatch) para herdar `outline` + `border-radius` sem tocar no SCSS. O `<input type="color">` nativo tem chrome próprio (borda/padding do swatch); neutralizar com regras adicionais se necessário:
  ```scss
  .p-colorpicker-preview {
      width: 30px;
      height: 30px;
      padding: 0;
      border: none;
      cursor: pointer;
      &::-webkit-color-swatch-wrapper { padding: 0; }
      &::-webkit-color-swatch { border: none; border-radius: 0.5rem; }
      &::-moz-color-swatch { border: none; border-radius: 0.5rem; }
  }
  ```
  Adicionar essas regras **dentro** de `.max-input-color` (escopo já existente) apenas se o visual divergir.
- **Input de texto:** manter classe `p-inputtext` para herdar `height: 36px` e demais regras já definidas no SCSS do `InputBase`/tema. Estados `error`/`caution` já colorem `input` via seletores `&.error input`/`&.caution input` no `InputBase`.
- **Variáveis do tema Max:** usar sempre `var(--background-400)`, `var(--background-575)`, `var(--orange-600)`, `var(--max-red-600)` etc. — não hardcodar cores.
- **UnoCSS:** não é necessário adicionar utilitárias novas; o layout é via grid SCSS.
- Manter `grid-template-columns: 30px 1fr` e `gap: 0.5rem` para não deslocar o layout.

---

## 8. Testes / verificação

**Não existe** teste dedicado hoje (`tests/components/MaxColorPicker.test.ts` não existe). Referências úteis: `tests/components/MaxInputText.test.ts` e `tests/components/InputBase.test.ts`. Setup global em `tests/setup.ts` (mocks de `fetch`, `localStorage`, `getComputedStyle`, PrimeVue + Pinia globais, stubs `v-tooltip`/`v-maska`).

Criar `tests/components/MaxColorPicker.test.ts` cobrindo:

1. **Render básico:** monta sem erro; renderiza `InputBase` (classe `max-input-color`), um `<input type="color">` e um `<input>` de texto. **Não** deve haver componentes PrimeVue `ColorPicker`/`InputText` (verificar ausência dos imports/classes exclusivas).
2. **v-model bidirecional (hex):**
   - Passar `modelValue="00ff00"` → o `<input type="color">` reflete `#00ff00`.
   - Simular `input` no swatch com `#0000ff` → `update:modelValue` emite `'0000ff'` (sem `#`, respeitando `format='hex'`).
   - Editar o `<input>` texto → `update:modelValue` emite o valor digitado.
3. **defaultColor:** com `modelValue=''` e `defaultColor='ff0000'`, o swatch mostra `#ff0000`.
4. **required:** `required=true`, valor vazio → `caution`/estado de erro `'Campo obrigatório'` propagado ao `InputBase` (checar via `error_msg`/render de mensagem).
5. **targetValue / isEqual:** `targetValue='ABC'` + `modelValue='abc'` → considerado igual (via `toSearchableString`), `done` verdadeiro; divergente → erro `'Valor esperado: ...'`.
6. **done/caution/error propagados** ao `InputBase` (ícones de status).
7. **disabled:** `disabled=true` desabilita ambos os inputs.
8. **format='rgb'/'hsb'** (best-effort): editar cor emite o formato correspondente. Marcar como `it.todo` se a paridade exata do formato PrimeVue não for confirmada (ver Riscos).

Comandos de verificação:

```bash
npx vitest run tests/components/MaxColorPicker.test.ts
npm run type-check
npm run lint
npm run test        # suíte completa (garantir zero regressão)
```

Checklist manual (via `npm run dev:playground`):

- Clicar no swatch abre o seletor nativo; escolher cor atualiza swatch **e** input de texto.
- Digitar hex no input reflete no swatch (quando válido).
- Estados visuais (`required`, `error`, `caution`, `done`, `label`, `icon`) idênticos ao anterior.
- Layout (grid 30px + input) sem deslocamento.

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills` (apenas as pertinentes a este componente):

- `.claude/skills/vue-max-components-ui-development-best-practices` — convenções da própria lib (InputBase, index/aliases, ordem de blocos, padrão de props). **Essencial** para manter o padrão do projeto.
- `.claude/skills/vue-max-use-development-best-practices` — uso correto de `toSearchableString`/`hasContent` de `@maxvue/max-use` (não reimplementar). Relevante pois a validação depende desses utilitários.
- `.claude/skills/vue-inputs-masks-validation-best-practices` — padrões de inputs, v-model, validação obrigatória/comparação; núcleo deste componente.
- `.claude/skills/vue-typescript-best-practices` — tipagem de `defineProps`/`defineModel` e helpers de conversão em `<script setup lang="ts">`.
- `.claude/skills/vue-unocss-styling-best-practices` — utilitárias/variáveis do tema Max ao ajustar estilos do swatch.
- `.claude/skills/frontend-design-best-practices` — fidelidade visual do preview de cor e paridade de aparência com o `ColorPicker` anterior.
- `.claude/skills/vue-eslint-stylelint-quality-standards` — passar `npm run lint` (indentação 4, aspas simples, sem trailing commas, ponto e vírgula).
- `.claude/skills/vue-vitest-testing-best-practices` — escrita do novo `MaxColorPicker.test.ts` com Vitest + test-utils + happy-dom.
- `.claude/skills/systematic-debugging-best-practices` — depurar divergências de conversão de cor (hex/rgb/hsb) e comportamento do `<input type="color">` durante a migração.

> Skill de popovers (`vue-floating-vue-tooltips-popovers-best-practices`) foi avaliada e **descartada** para a Opção A (o popup é nativo do SO). Só passa a ser necessária se escalar para a Opção B (picker headless com painel próprio).

---

## 10. Riscos e pontos de atenção

- **Ordem — `InputBase` primeiro:** `MaxColorPicker` usa `InputBase` como wrapper, e o `InputBase` ainda importa `FloatLabel`/`IconField`/`InputIcon`/`Message` do PrimeVue. **`InputBase` DEVE ser migrado antes** (ou em conjunto) para que `MaxColorPicker` fique realmente independente do PrimeVue. Enquanto `InputBase` não estiver migrado, esta migração remove apenas as dependências diretas (`InputText`, `ColorPicker`), mas a dependência indireta persiste. Seguir a ordem recomendada em `migration_plan.md` ("InputBase deve ser migrado primeiro").

- **Formato hex sem `#`:** o `<input type="color">` nativo trabalha com `#rrggbb`; o `v-model` atual (PrimeVue, `format='hex'`) guarda **sem** `#`. A camada `fromNativeHex` deve remover o `#` para não quebrar consumidores que esperam `'ff0000'`.

- **`format='rgb'`/`'hsb'`:** o `ColorPicker` do PrimeVue emite **objeto** (`{ r, g, b }` / `{ h, s, b }`), não string, para esses formatos. Antes de fixar a conversão, **confirmar o formato exato** que o PrimeVue emitia (checar docs/versão instalada em `node_modules/primevue/colorpicker`) para replicar fielmente. Como o uso real é `format='hex'`, priorizar hex e cobrir rgb/hsb com testes/`it.todo`.

- **`inline`:** o modo embutido do PrimeVue não tem equivalente no `<input type="color">` (o picker é sempre popup do SO). Vira no-op. Se algum consumidor depende de `inline=true`, escalar para picker headless (Opção B).

- **No-ops de API:** `panelClass`, `appendTo`, `autoZIndex`, `baseZIndex` perdem efeito, mas **permanecem na assinatura** para compatibilidade. Documentar como no-op.

- **Classes CSS legadas do PrimeVue:** o SCSS depende de `.p-colorpicker-preview` e `.p-inputtext`. Ao remover o PrimeVue globalmente, garantir que essas classes continuem sendo aplicadas manualmente pelos elementos nativos, ou migrar os seletores junto com o `InputBase`. Evitar quebrar a fidelidade visual.

- **Entrada inválida no input de texto:** o `<input>` texto permite digitar valores não-cor; o `<input type="color">` ignora hex inválido (mantém última cor válida). Replicar tolerância do PrimeVue: só atualizar o swatch quando `toNativeHex` produzir hex válido.

- **`useAttrs` para mensagens de erro:** preservar a leitura de `attrs.errMsg`/`error_message`/`error_msg`/`target_value` — são parte do contrato observável.

- **Sem alteração no resolver:** nenhum `.vue` novo; não rodar `generateResolver.ts`. Não adicionar aliases novos em `src/index.ts` (manter o único export existente).
