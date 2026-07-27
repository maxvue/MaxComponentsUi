# Plano de Migração — MaxInputTextList

> Plano autossuficiente para tornar o componente `MaxInputTextList` independente do PrimeVue.
> Uma IA futura deve conseguir executá-lo lendo APENAS este arquivo + o código-fonte referenciado.

---

## 1. Componente

- **Nome:** `MaxInputTextList`
- **Caminho:** `src/components/MaxInputTextList.vue`
- **Nível de dificuldade:** `baixa`
- **Descrição:** Editor de texto multi-linha estilo "code editor" com numeração de
  linhas (gutter), indentação por Tab (4 espaços), auto-indentação no Enter e sincronização
  de scroll entre a coluna de números e o `<textarea>`. É basicamente um `<textarea>` nativo
  encapsulado no wrapper `InputBase`.
- **Export (resolver):** definido em `src/index.ts`:
  `export { default as MaxInputTextList } from './components/MaxInputTextList.vue';`

---

## 2. Dependências do PrimeVue

**NÃO HÁ USO DIRETO DE PRIMEVUE NESTE COMPONENTE.**

Inspeção do `<script setup>` de `src/components/MaxInputTextList.vue` confirma que os únicos
imports são:

```ts
import { ref, computed, watch, useAttrs, nextTick } from 'vue';
import InputBase from './InputBase.vue';
```

- Nenhum `import ... from 'primevue/...'`.
- O template usa apenas HTML nativo (`<div>`, `<textarea>`) dentro de `<InputBase>`.
- Toda a exposição visual do PrimeVue (FloatLabel, IconField, InputIcon, Message) vem
  **transitivamente** de `InputBase.vue`, e não deste componente.

> **Conclusão:** este componente NÃO precisa de nenhuma reescrita relacionada ao PrimeVue por
> conta própria. A sua "migração" consiste essencialmente em **validar/regressão** depois que
> o `InputBase` já estiver migrado. Ver seção 10 (Riscos e ordem).

---

## 3. Dependências internas

| Dependência | Origem | Papel | Deve ser preservada? |
|-------------|--------|-------|----------------------|
| `InputBase` | `./InputBase.vue` (`src/components/InputBase.vue`) | Wrapper de layout (label flutuante, ícones, linha de mensagem, estados done/error/caution/required). Elemento raiz do template. | Sim — obrigatório por convenção (CLAUDE.md: "Any new input component should use `<InputBase>` as its outermost element"). |
| Vue Composition API | `vue` | `ref`, `computed`, `watch`, `useAttrs`, `nextTick`. Sem relação com PrimeVue. | Sim (nativo). |

**Dependências transitivas via `InputBase` (fora do escopo deste plano — migradas no plano do InputBase):**
- `@maxvue/max-use` → `hasContent` (usado internamente pelo InputBase).
- `MaxIcon` (`./MaxIcon.vue`).
- PrimeVue: `FloatLabel`, `IconField`, `InputIcon`, `Message` (dentro do InputBase).

Nenhuma store Pinia (`useIconStore`, `usePopoverStore`, `useToastStore`) nem helper de
`src/helpers` é usado por este componente.

---

## 4. API pública a preservar

A migração deve ser **transparente** para consumidores da lib. Preservar exatamente:

### Props (`withDefaults(defineProps<{...}>(), { modelValue: '' })`)

| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `modelValue` | `any` | `''` | v-model. Convertido para string internamente. |
| `icon` | `string \| undefined` | — | Repassado ao InputBase via `v-bind="{...props}"`. |
| `i` | `string \| undefined` | — | Alias de ícone (InputBase). |
| `disabled` | `boolean \| undefined` | — | Repassado ao InputBase / textarea via attrs. |
| `float` | `boolean \| undefined` | — | InputBase. |
| `msg` | `string \| undefined` | — | InputBase. |
| `message` | `string \| undefined` | — | InputBase. |
| `iconMessage` | `string \| undefined` | — | InputBase. |
| `label` | `string \| undefined` | — | InputBase. |
| `done` | `boolean \| undefined` | — | InputBase (estado). |
| `error` | `string \| boolean \| undefined` | — | InputBase (estado). |
| `targetValue` | `string` | — | Declarada mas não usada no corpo atual — **manter na assinatura** para não quebrar tipos. |
| `caution` | `string \| boolean \| undefined` | — | InputBase (estado). |
| `required` | `boolean` | — | InputBase (estado). |

> **Importante:** o template atual usa `v-bind="{...props}"` no `<InputBase>`, repassando TODAS
> as props acima ao wrapper. Preservar esse repasse integral.

### Emits
- `defineEmits(['update:modelValue'])` — emitido sempre que `temp_value` muda (v-model padrão).

### v-model
- `v-model` liga `modelValue` ↔ `update:modelValue`. Valor sempre string (`String(val ?? '')`).

### `useAttrs()` (fall-through)
- `const attrs = useAttrs();` é aplicado ao `<textarea v-bind="attrs">`. Preservar: qualquer
  atributo extra (ex.: `placeholder`, `rows`, `name`, `id`, eventos DOM) passado pelo consumidor
  cai no `<textarea>`. **Não** habilitar `inheritAttrs: false` a menos que se replique o mesmo
  comportamento (hoje é o comportamento padrão do Vue, mas os attrs são explicitamente re-bindados
  no textarea; manter tal como está).

### Comportamento observável (NÃO pode mudar)
1. **Numeração de linhas:** coluna à esquerda com um número por linha; `lineCount` =
   `(temp_value || '').split(/\r\n|\r|\n/).length || 1`.
2. **Tab (sem seleção):** insere 4 espaços (`'    '`) na posição do cursor; reposiciona o cursor
   após os espaços.
3. **Tab (com seleção):** indenta cada linha do bloco selecionado com 4 espaços
   (`block.replace(/^/gm, spaces)`); ajusta `selectionStart`/`selectionEnd`.
4. **Enter:** auto-indentação — replica os espaços iniciais (`/^\s+/`) da linha atual na nova linha.
   Previne o comportamento default (`e.preventDefault()`).
5. **Scroll sincronizado:** `@scroll` no textarea espelha `scrollTop` na coluna de números.
6. **Atributos fixos do textarea:** `wrap="off"`, `spellcheck="false"`, `class="code-textarea"`.
7. **Sincronização bidirecional:** `watch(temp_value → emit)` e `watch(props.modelValue → temp_value)`.

---

## 5. Estratégia de substituição

**Não há substituição de componente PrimeVue a fazer neste arquivo.** O componente já é
"PrimeVue-free" em nível próprio.

A migração se resume a:

1. **Depender do `InputBase` já migrado.** Após o plano do `InputBase` ser executado (ver seção
   10), `MaxInputTextList` funcionará sem alterações de código, pois só usa `<InputBase>` + HTML
   nativo. Nenhuma biblioteca headless é necessária.
2. **Nenhuma reescrita de template/script obrigatória.** O `<textarea>`, os `<div>` de números e
   toda a lógica de teclado já são nativos e independentes de qualquer framework de UI.
3. **(Opcional, não obrigatório) Hardening leve** — melhorias que NÃO alteram a API nem o
   comportamento, aplicáveis apenas se desejado durante a passagem de migração:
   - Tipar `emit` explicitamente: `defineEmits<{ 'update:modelValue': [value: string] }>();`
     (mantém emit `update:modelValue`, apenas adiciona tipagem — conforme convenção do projeto).
   - Nenhuma outra mudança recomendada, para minimizar risco de regressão.

> Bibliotecas headless (TanStack Table, `@tanstack/vue-virtual`, calendário headless, etc.):
> **NÃO se aplicam** a este componente.

---

## 6. Passos de implementação

> Pré-condição bloqueante: **o plano `migration_plans/InputBase.md` deve estar concluído e
> `InputBase.vue` migrado** antes de validar este componente. Ver seção 10.

1. **Confirmar independência.** Reabrir `src/components/MaxInputTextList.vue` e verificar que não
   há `import ... 'primevue/...'`. (Já confirmado neste plano — nenhum.)
2. **Verificar o InputBase migrado.** Garantir que `InputBase.vue` já não importa componentes
   PrimeVue e que sua API (props `label`, `icon`, `i`, `float`, `msg`, `message`, `iconMessage`,
   `done`, `error`, `caution`, `required`, `disabled`) permanece idêntica — pois `MaxInputTextList`
   repassa essas props via `v-bind="{...props}"`.
3. **Rodar type-check:** `npm run type-check`. Confirmar que a prop `targetValue` (não usada) e o
   `modelValue: any` continuam válidos.
4. **Rodar lint:** `npm run lint` (ESLint + Stylelint). Ajustar apenas se o lint acusar algo
   após a migração do InputBase (indentação de 4 espaços, aspas simples, ponto e vírgula,
   sem trailing commas, ordem Template → Script → Style).
5. **Rodar testes:** `npx vitest run tests/components/MaxInputTextList.test.ts`
   (criar o arquivo de teste se ainda não existir — ver seção 8).
6. **Validação manual no playground:** `npm run dev:playground`. Testar Tab, Shift-select+Tab,
   Enter com indentação, scroll com muitas linhas, e o binding v-model.
7. **(Se aplicada a melhoria opcional)** aplicar a tipagem explícita do `emit` e re-rodar 3–5.
8. **Não** rodar `generateResolver.ts` — nenhum arquivo `.vue` novo é criado; o manifest não muda.
9. **Verificação final antes de concluir:** todos os comandos acima verdes; comportamento idêntico
   ao original (evidência antes de afirmar conclusão).

---

## 7. Estilos

Todo o SCSS já é **nativo** (não depende de PrimeVue) e deve ser **preservado sem alterações**.
Bloco `<style lang="scss">` de `MaxInputTextList.vue`, com escopo raiz `.max-input-text-list-div`
(classe aplicada ao próprio `<InputBase>`):

- `.max-code-editor` — flex container, `min-height: 150px`, `max-height: 400px`, fonte monospace,
  `overflow: hidden`, `background: transparent`.
- `.line-numbers` — gutter:
  - `background-color: var(--background-100, rgb(0 0 0 / 2%))`
  - `color: var(--background-400, #9ca3af)`
  - `border-right: 1px solid var(--background-200, rgb(0 0 0 / 5%))`
  - `border-top-left-radius: inherit; border-bottom-left-radius: inherit;`
  - `user-select: none`, `text-align: right`, `min-width: 40px`, `overflow-y: hidden`.
- `.line-number` — `line-height: 1.5; font-size: 14px;` (deve casar com o textarea para alinhar).
- `.code-textarea` — `border: none !important; box-shadow: none !important; outline: none;`
  `resize: none; white-space: pre; line-height: 1.5; font-size: 14px;`
  `background: transparent; color: inherit; overflow: auto;`.

**Variáveis CSS do tema Max usadas** (preservar): `--background-100`, `--background-200`,
`--background-400` (cada uma com fallback embutido). Não há classes UnoCSS neste componente.

**Regra crítica de fidelidade visual:** `line-height: 1.5` e `font-size: 14px` devem permanecer
idênticos em `.line-number` e `.code-textarea`, caso contrário a numeração desalinha do texto.

> Atenção transitiva: alguns seletores globais do InputBase (`.p-inputtext`, `.p-select` etc.)
> não afetam este componente (ele usa `<textarea>`, não `.p-inputtext`). Após a migração do
> InputBase, garantir que a altura/borda do `<textarea>` continue vindo apenas de `.code-textarea`.

---

## 8. Testes / verificação

**Arquivo de teste alvo:** `tests/components/MaxInputTextList.test.ts` (criar se não existir).
Stack: Vitest + `@vue/test-utils` + `happy-dom` (setup global em `tests/setup.ts` já provê
PrimeVue + Pinia, mocks de `fetch`/`localStorage`/`getComputedStyle`, stub de `virtual:uno.css`).

### Casos de teste (cobrindo o comportamento observável)
1. **Render básico:** monta o componente; existe `.max-code-editor`, `.line-numbers` e
   `textarea.code-textarea`.
2. **v-model / update:modelValue:** definir `modelValue: 'a\nb\nc'`; digitar no textarea deve
   emitir `update:modelValue` com o novo valor (string).
3. **Contagem de linhas:** com `modelValue = 'l1\nl2\nl3'`, devem existir 3 `.line-number`
   (`lineCount` = 3). Com string vazia → 1 linha.
4. **Tab sem seleção:** simular `keydown` Tab com `selectionStart === selectionEnd`; verificar
   que 4 espaços foram inseridos e o valor emitido reflete isso. (`e.preventDefault` chamado.)
5. **Tab com seleção multi-linha:** selecionar bloco de 2+ linhas, disparar Tab; cada linha
   recebe 4 espaços no início (regex `/^/gm`).
6. **Enter com auto-indentação:** cursor após linha iniciada por espaços; Enter insere `\n` +
   os mesmos espaços iniciais.
7. **Sync de scroll:** disparar `scroll` no textarea com `scrollTop` definido; `lineNumbersRef`
   deve receber o mesmo `scrollTop`.
8. **Prop `modelValue` externa:** alterar a prop deve atualizar `temp_value` (watch), refletindo
   no textarea.
9. **Repasse de props ao InputBase:** passar `label`, `error`, `required` e assertar que o
   `InputBase` (stub ou real) recebe essas props (via `v-bind="{...props}"`).

### Checklist manual (playground)
- [ ] Tab insere 4 espaços; não muda foco.
- [ ] Seleção múltipla + Tab indenta todas as linhas.
- [ ] Enter mantém a indentação da linha anterior.
- [ ] Números de linha alinhados com o texto (mesma `line-height`/`font-size`).
- [ ] Scroll vertical sincroniza gutter e textarea.
- [ ] `wrap="off"` mantém rolagem horizontal sem quebra de linha.
- [ ] v-model bidirecional funciona (digitar atualiza pai; pai atualiza campo).
- [ ] Estados do InputBase (`error`, `caution`, `done`, `required`, `label`) exibem corretamente.

### Regressão de baseline
Antes de mexer, capturar o comportamento atual (rodando a suíte com o InputBase original) e
comparar após o InputBase migrado — o diff de comportamento deve ser **zero**.

---

## 9. Skills necessárias

Skills selecionadas de `.claude/skills` (priorizadas por prefixo `vue-` e pela relevância real a
este componente — inputs simples, sem dropdown/data/upload/virtualização/store):

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da própria lib (InputBase como raiz, aliases de export, estrutura de componente) — base para qualquer migração desta lib. |
| `.claude/skills/vue-inputs-masks-validation-best-practices` | O componente é um input de texto (textarea) com manipulação de valor e estados; orienta padrões de input/validação da lib. |
| `.claude/skills/vue-keyboard-shortcuts-navigation-best-practices` | Núcleo do componente é o tratamento de teclado (Tab/Enter, seleção, cursor) — diretrizes de navegação/atalhos por teclado. |
| `.claude/skills/vue-typescript-best-practices` | Tipagem de `defineProps`/`defineEmits` em `<script setup lang="ts">` (ex.: tornar o emit tipado sem quebrar API). |
| `.claude/skills/vue-unocss-styling-best-practices` | Referência das variáveis CSS do tema Max (`--background-100/200/400`) e regras utilitárias, para preservar a aparência do editor. |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Garante conformidade com 4 espaços, aspas simples, ponto e vírgula, sem trailing commas, ordem Template→Script→Style. |
| `.claude/skills/vue-vitest-testing-best-practices` | Escrever/rodar os testes de regressão em `tests/components/` com Vitest + test-utils + happy-dom. |
| `.claude/skills/vue-auto-import-components-best-practices` | Confirmar que o resolver/manifest não precisa ser regenerado (nenhum `.vue` novo criado). |
| `.claude/skills/systematic-debugging-best-practices` | Apoio à depuração de qualquer regressão surgida após a migração do InputBase. |

> Skills descartadas por não se aplicarem: dropdown/popover, virtual-scroller, dayjs, uppy,
> pdf-viewer, pinia (nenhuma store usada), dynamic-components.

---

## 10. Riscos e pontos de atenção

### Ordem / dependência bloqueante (CRÍTICO)
- **Este componente depende EXCLUSIVAMENTE da migração do `InputBase`.** Ele não usa PrimeVue
  diretamente; toda dependência de PrimeVue é transitiva via `InputBase.vue`
  (`FloatLabel`, `IconField`, `InputIcon`, `Message`).
- **Ordem recomendada:** migrar `InputBase` **primeiro** (é dependência de ~19 inputs), depois
  apenas **validar/regredir** `MaxInputTextList`. Não iniciar a validação deste componente antes
  de `InputBase.vue` estar migrado e verde.
- Se a API pública do `InputBase` mudar durante a migração dele, as props repassadas via
  `v-bind="{...props}"` podem quebrar silenciosamente — reconferir a lista da seção 4/6.

### Armadilhas específicas
1. **`v-bind="{...props}"` repassa TODAS as props** ao InputBase (incluindo `modelValue`,
   `disabled`, `targetValue`). Após migrar o InputBase, garantir que ele ignore/aceite props
   desconhecidas sem warnings (o InputBase atual aceita `value`/`modelValue` genéricos).
2. **`targetValue` é prop declarada porém não usada** — manter na assinatura para não quebrar
   tipos de consumidores; não removê-la.
3. **`useAttrs()` no `<textarea>`** — attrs extras do consumidor caem no textarea. Não introduzir
   `inheritAttrs: false` sem replicar o binding. Preservar `wrap`, `spellcheck` e `class` fixos.
4. **Alinhamento gutter ↔ texto** — qualquer mudança em `line-height`/`font-size` desalinha a
   numeração. Manter `1.5` / `14px` em ambos.
5. **Sync de scroll** depende de refs `textareaRef`/`lineNumbersRef` e `@scroll`. Não alterar os
   nomes de ref usados no template.
6. **Regex de indentação** (`/^/gm`, `/^\s+/`, `/\r\n|\r|\n/`) — comportamento sutil; qualquer
   refactor deve manter os mesmos resultados (cobrir com testes 3–6 da seção 8).
7. **`nextTick` antes de reposicionar cursor** — a ordem `await nextTick()` → set
   `selectionStart/End` é necessária porque o valor do textarea só reflete após o re-render.
   Não remover os `await nextTick()`.

### Convenções (CLAUDE.md) a respeitar em qualquer edição
- `<script setup lang="ts">`, indentação de 4 espaços, aspas simples, ponto e vírgula, sem
  trailing commas, ordem **Template → Script → Style**.
- InputBase deve permanecer o elemento raiz do template.

### Escopo
- **Não** modificar código-fonte nesta fase de planejamento. Este arquivo é apenas o plano.
- **Não** regenerar o resolver (`generateResolver.ts`) — nenhum componente novo é adicionado.
