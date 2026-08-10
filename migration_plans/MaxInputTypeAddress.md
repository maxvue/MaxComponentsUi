# Plano de Migração — MaxInputTypeAddress

> Plano autossuficiente. Uma IA futura deve conseguir executar (validar) esta migração lendo
> **apenas** este arquivo + `src/components/MaxInputTypeAddress.vue` + `src/components/MaxInputSelect.vue`.
> **Não** alterar outros componentes. Preservar API pública, estilos e comportamento.
>
> **TL;DR:** Este componente **não importa nem usa PrimeVue diretamente**. Ele é apenas um wrapper
> em cima de `MaxInputSelect`. Toda a dependência de PrimeVue é **transitiva**, herdada do
> `MaxInputSelect`. Portanto, **não há mudança de código específica** neste componente — a migração
> consiste em (1) migrar `MaxInputSelect` antes e (2) **validar** que este wrapper continua com o
> mesmo comportamento observável. Se algo precisar mudar aqui, é sinal de que a API pública do
> `MaxInputSelect` regrediu na migração dele.

---

## 1. Componente

- **Nome:** `MaxInputTypeAddress`
- **Caminho:** `src/components/MaxInputTypeAddress.vue`
- **Nível de dificuldade:** `baixa`
- **Objetivo da migração:** tornar o componente independente do PrimeVue. Como ele **não usa
  PrimeVue diretamente** (apenas `MaxInputSelect`), o objetivo real é **herdar** a migração do
  `MaxInputSelect` e **confirmar** (via testes e checklist visual) que o comportamento de
  auto-detecção do tipo de logradouro, o `v-model` e a lista de opções permanecem idênticos.

---

## 2. Dependências do PrimeVue

**Nenhuma dependência direta.** Uma verificação por grep no arquivo confirma que não há
`import ... from 'primevue/...'` nem uso de componentes PrimeVue no `<template>`:

```bash
grep -n "primevue" src/components/MaxInputTypeAddress.vue   # => sem resultados (exit 1)
```

A **única** dependência de UI é o `MaxInputSelect`:

```vue
<!-- template (linha 2) -->
<MaxInputSelect v-bind="attrs"
    :options="listTypeAddress"
    :optionLabel="attrs.optionLabel ?? 'name'"
    :optionValue="attrs.optionValue ?? 'value'"
    v-model="inputValue" />
```

```ts
// script setup (linha 7)
import MaxInputSelect from './MaxInputSelect.vue';
```

**Toda** a exposição a PrimeVue é **transitiva**, dentro do `MaxInputSelect` (que hoje usa o
`Select`/`Dropdown` do PrimeVue e o `InputBase`). Consequentemente:

- A migração do PrimeVue neste componente é **coberta integralmente** pela migração do
  `MaxInputSelect`.
- **Não existe** import de PrimeVue para remover aqui.

---

## 3. Dependências internas

| Dependência | Origem | Papel | Ação nesta migração |
|-------------|--------|-------|---------------------|
| `MaxInputSelect` | `./MaxInputSelect.vue` | Renderiza o dropdown/select real (label flutuante, opções, filtro, `v-model`). Recebe `options`, `optionLabel`, `optionValue`, `v-model` e todo o resto via `v-bind="attrs"`. | **Preservar.** Depende da migração de `MaxInputSelect` já concluída (ver seção 10). |
| `useAttrs` | `vue` | Coleta atributos não declarados como props (`placeholder`, `label`, estados `done/error/caution`, `filter`, `disabled`, `optionLabel`, `optionValue`, `street`, etc.) e repassa ao `MaxInputSelect`. | **Preservar exatamente** o `v-bind="attrs"`. |
| `ref`, `computed`, `watch` | `vue` | Estado interno `inputValue`; `street` computado a partir de `attrs.street ?? props.street`; watchers de auto-detecção, de `inputValue` e de `props.modelValue`. | **Preservar toda a lógica intacta.** |

- **Não** usa stores (`useIconStore`, `usePopoverStore`, `useToastStore`).
- **Não** usa helpers de `@maxvue/max-use` diretamente. (`hasContent`, `MaxIcon`, etc. são usados
  internamente pelo `InputBase`/`MaxInputSelect`, não aqui.)
- **Não** usa `InputBase` diretamente — o `InputBase` é usado **dentro** do `MaxInputSelect`.

### Lógica de negócio interna a preservar (não tocar)

- `listTypeAddress` — array fixo de 12 tipos de logradouro (`Rua`, `Avenida`, `Alameda`, `Praça`,
  `Rodovia`, `Travessa`, `Vila`, `Estrada`, `Viela`, `Beco`, `Caminho`, `Largo`), cada um com
  `{ name, value, values[] }`. Os `values` são as abreviações reconhecidas (ex.: `av`, `ave`).
- `toSearchable(str)` — normaliza para busca: `NFD`, remove diacríticos (`/[̀-ͯ]/g`),
  `toLowerCase().trim()`. É o que permite casar `Praça` com `praca`.
- Watcher de auto-detecção de `street` (`{ immediate: true, deep: true }`): pega a **primeira
  palavra** de `street`, normaliza, e se ela estiver em `item.values` de algum tipo, seta
  `inputValue` e emite `update:modelValue` — **somente** se o valor ainda não for igual.

---

## 4. API pública a preservar

Contrato observável por quem consome a lib — **NÃO pode mudar**.

### Props

| Prop | Tipo | Default | Observação |
|------|------|---------|------------|
| `modelValue` | `string` | `''` | v-model. |
| `street` | `string` (opcional) | — | Endereço bruto; a **primeira palavra** dispara a auto-detecção do tipo. Também aceito via `attrs.street` (ver abaixo). |

### `v-model`

- `v-model` liga em `modelValue` e emite `update:modelValue`.

### Emits

| Evento | Payload | Quando |
|--------|---------|--------|
| `update:modelValue` | `string` | (a) Auto-detecção por `street` encontra match **e** o valor difere do atual; (b) `inputValue` muda (seleção do usuário no select). |

### Atributos repassados (`useAttrs`)

Todo atributo não declarado (ex.: `placeholder`, `label`, `filter`, `disabled`, `done`, `error`,
`caution`, `required`, `msg`/`message`, `optionLabel`, `optionValue`, `street`, `class`, etc.) é
repassado ao `MaxInputSelect` via `v-bind="attrs"`. **Preservar.**

- `optionLabel` — default `'name'` (mas sobrescritível via `attrs.optionLabel`).
- `optionValue` — default `'value'` (mas sobrescritível via `attrs.optionValue`).
- `street` via `attrs.street` tem **precedência** sobre `props.street`
  (`attrs.street ?? props.street`) — comportamento testado.

### Comportamento observável (auto-detecção) — testado

- `street = 'Rua das Flores'` → emite `'Rua'`.
- `street = 'Av Paulista'` → emite `'Avenida'` (abreviação `av`).
- `street = 'Praça da Sé'` → emite `'Praça'` (normalização de acento: `praca`).
- `street = 'Desconhecido 123'` → **não** emite (sem match).
- `street = ''` → **não** emite.
- `modelValue = 'Rua'` + `street = 'Rua das Flores'` → **não** emite (valor já igual).
- `attrs.street = 'Vila Madalena'` (sem `props.street`) → emite `'Vila'`.
- Setar `inputValue` externamente para `'Travessa'` → emite `'Travessa'`.
- `setProps({ modelValue: 'Avenida' })` → `inputValue` interno passa a `'Avenida'`.

### Slots

- Nenhum slot próprio é declarado/repassado no template atual. **Não introduzir** slots novos.
  (Observação: o `MaxInputSelect` tem slots `option`/`value`/etc., mas este wrapper **não** os
  repassa hoje — manter assim para não alterar a API.)

---

## 5. Estratégia de substituição

**Não há substituição de código neste componente.** A estratégia é de **herança** + **validação**:

1. **Herdar do `MaxInputSelect`.** Como toda a dependência de PrimeVue é transitiva, migrar o
   `MaxInputSelect` (trocar o `Select`/`Dropdown` do PrimeVue por implementação headless/nativa)
   **automaticamente** remove o PrimeVue deste componente. Nenhuma linha precisa mudar aqui.

2. **Preservar a API pública do `MaxInputSelect`.** Este wrapper depende dos contratos:
   - props `options`, `optionLabel`, `optionValue`;
   - `v-model` (`modelValue` + `update:modelValue`);
   - repasse de `v-bind="attrs"` (placeholder, filter, estados de validação, disabled, label).
   Se a migração do `MaxInputSelect` mantiver **exatamente** essas props/eventos, este componente
   funciona sem alteração.

3. **Validar comportamento** com os testes existentes e o checklist manual (seções 7 e 8).

> **Não** é necessária nenhuma biblioteca headless **neste** arquivo. A escolha de biblioteca
> headless (ex.: dropdown headless, `@tanstack/vue-virtual` para listas longas) é uma decisão do
> plano do `MaxInputSelect`, não deste.

### Só mexer aqui se ...

Alterações neste arquivo **só** se justificam se a migração do `MaxInputSelect` **mudar** sua API
pública (o que seria uma regressão a evitar). Cenários e ajuste mínimo correspondente:

- Se `MaxInputSelect` deixar de aceitar `optionLabel`/`optionValue` como strings → mapear
  `listTypeAddress` para o novo formato de opções esperado, **mantendo** `name`/`value`.
- Se `MaxInputSelect` mudar o nome do evento de `v-model` → ajustar o `v-model="inputValue"` para o
  novo contrato. (Evitar; preferir manter `update:modelValue` no `MaxInputSelect`.)

Em ambos os casos, o objetivo é **manter idêntica a API pública do `MaxInputTypeAddress`**.

---

## 6. Passos de implementação

1. **Pré-requisito bloqueante:** confirmar que `MaxInputSelect` **já foi migrado** e que seus
   testes passam (`npx vitest run tests/components/MaxInputSelect.test.ts`, se existir). Ver
   `migration_plans/MaxInputSelect.md` (quando gerado). **Não prosseguir** antes disso.

2. **Verificar ausência de PrimeVue neste arquivo** (sanity check — deve continuar vazio):
   ```bash
   grep -n "primevue" src/components/MaxInputTypeAddress.vue   # esperado: sem resultados
   ```

3. **Rodar os testes deste componente sem modificar código:**
   ```bash
   npx vitest run tests/components/MaxInputTypeAddress.test.ts
   ```
   - Se **passarem**, a migração deste componente está **concluída** (ele herdou tudo do
     `MaxInputSelect`). Ir para o passo 6.
   - Se **falharem**, é porque a API pública do `MaxInputSelect` regrediu na migração dele. Ir ao
     passo 4.

4. **(Somente se testes falharem)** Diagnosticar qual contrato do `MaxInputSelect` mudou (props
   `options`/`optionLabel`/`optionValue`, evento de `v-model`, ou repasse de `attrs`). Preferir
   **corrigir o `MaxInputSelect`** para restaurar a API. Só ajustar este arquivo se o novo contrato
   do `MaxInputSelect` for definitivo — nesse caso, aplicar o ajuste mínimo da seção 5 mantendo:
   - `<script setup lang="ts">`, indentação de 4 espaços, aspas simples, ponto e vírgula, sem
     trailing comma, ordem Template → Script → Style;
   - a lógica de `listTypeAddress`, `toSearchable`, e os três `watch` **intactos**;
   - a API pública (props/emits/v-model) inalterada.

5. **(Somente se houve ajuste)** Rodar novamente os testes até passarem.

6. **Verificar tipagem e lint globais:**
   ```bash
   npm run type-check
   npm run lint
   ```

7. **Não regenerar o resolver.** Nenhum arquivo `.vue` foi criado nem renomeado, então **não**
   rodar `generateResolver.ts`.

---

## 7. Estilos

- O bloco `<style lang="scss">` deste arquivo (linhas 66–97) estiliza a classe
  `.label_div-type-address` e seus filhos (`.icon-div`, `.subLabel`, `.labelz`), usando variáveis
  do tema Max: `var(--background-650)`, `var(--gray-500)`. **Preservar integralmente** — não
  depende de PrimeVue e não deve ser alterado.
  - **Atenção:** este bloco **não** referencia nenhuma classe PrimeVue (`.p-*`), então nada aqui
    quebra com a saída do PrimeVue.
  - **Observação (não bloqueante):** a classe `.label_div-type-address` **não** aparece no
    `<template>` deste arquivo — é um estilo global (não scoped) provavelmente aplicado via slot de
    opção do `MaxInputSelect` em outro contexto ou herdado de uma versão anterior. **Não removê-lo**
    nesta migração (fora de escopo; poderia afetar aparência de consumidores). Se desejar limpeza,
    tratar em tarefa separada após grep confirmando que ninguém depende dele.

- **Aparência do select em si** (altura, largura 100%, placeholder, label flutuante, estados de
  validação) é responsabilidade do `MaxInputSelect`/`InputBase`. A fidelidade visual deste
  componente depende **inteiramente** da fidelidade visual alcançada na migração do
  `MaxInputSelect`. Validar visualmente no playground (seção 8).

- **Sem UnoCSS necessário** neste arquivo. Manter `<style lang="scss">` como último bloco (ordem
  Template → Script → Style), 4 espaços de indentação.

---

## 8. Testes / verificação

### Arquivo de teste existente

`tests/components/MaxInputTypeAddress.test.ts` — **deve continuar passando sem modificações**. O
teste **stuba** `MaxInputSelect` (`stubs: { MaxInputSelect: true }`), portanto valida **apenas** a
lógica própria deste wrapper (auto-detecção, `v-model`, `attrs.street`) — **independentemente** de
como o `MaxInputSelect` esteja implementado. Casos cobertos:

1. `renderiza corretamente`.
2. `auto-detecta "Rua"` a partir de `street = 'Rua das Flores'`.
3. `auto-detecta "Avenida"` a partir da abreviação `Av`.
4. `auto-detecta "Praça"` com normalização de acento (`Praça da Sé`).
5. `não auto-detecta` sem match (`'Desconhecido 123'`).
6. `não auto-detecta` com `street` vazio.
7. `não emite` quando o valor já é igual (`modelValue = 'Rua'` + `street = 'Rua das Flores'`).
8. `detecta mudança de modelValue via prop` (`setProps` reflete em `inputValue`).
9. `detecta mudança de inputValue e emite` (`update:modelValue = 'Travessa'`).
10. `usa attrs.street` quando `props.street` ausente (`Vila Madalena` → `'Vila'`).

> Como esses testes stubam o `MaxInputSelect`, eles **não** detectam regressões na integração real
> com o select migrado. Por isso o checklist manual abaixo é **essencial**.

### Comandos de verificação

```bash
npx vitest run tests/components/MaxInputTypeAddress.test.ts   # lógica do wrapper
npx vitest run tests/components/MaxInputSelect.test.ts        # dependência migrada (se existir)
npm run type-check                                            # vue-tsc sem erros
npm run lint                                                  # ESLint + Stylelint
```

### Checklist manual (playground: `npm run dev:playground`) — integração real (sem stub)

- [ ] O select renderiza com a lista de 12 tipos de logradouro (`Rua`…`Largo`).
- [ ] Selecionar um tipo atualiza o `v-model` (`update:modelValue` com o `value` correto).
- [ ] Preencher `street` com `'Av Paulista'` auto-seleciona `Avenida`.
- [ ] Preencher `street` com `'Praça da Sé'` auto-seleciona `Praça` (acento normalizado).
- [ ] `street` sem match não altera a seleção.
- [ ] `placeholder`, `label`, `filter`, `disabled` e estados (`error`, `done`, `caution`) via
      `v-bind="attrs"` continuam funcionando (chegam ao `MaxInputSelect` migrado).
- [ ] Aparência (altura, largura 100%, label flutuante, opções) idêntica à versão anterior.

### Casos de borda

- Nenhum import de `primevue/*` deve existir neste arquivo (grep vazio) — condição que já é
  verdadeira e deve permanecer.
- `attrs.street` tem precedência sobre `props.street` (`attrs.street ?? props.street`).
- Auto-detecção só considera a **primeira palavra** de `street`.
- Não emitir `update:modelValue` quando o valor detectado é igual ao atual.

---

## 9. Skills necessárias

Skills selecionadas em `.claude/skills` (apenas as pertinentes a este componente de nível `baixa`,
que é essencialmente um wrapper sem PrimeVue direto):

| Skill (caminho) | Justificativa |
|-----------------|---------------|
| `.claude/skills/vue-max-components-ui-development-best-practices` | Convenções da lib (wrapper sobre outro Max component, `useAttrs`, aliases, estrutura Template→Script→Style). |
| `.claude/skills/vue-inputs-masks-validation-best-practices` | É um input de formulário; padrões de `v-model`, `useAttrs` e estados de campo repassados ao `InputBase`/`MaxInputSelect`. |
| `.claude/skills/vue-floating-vue-tooltips-popovers-best-practices` | A dependência real (`MaxInputSelect`) é um dropdown/overlay; útil para entender o comportamento herdado ao validar a integração. |
| `.claude/skills/vue-typescript-best-practices` | Tipagem correta de `defineProps`/`defineEmits` e do `computed`/`watch` caso algum ajuste mínimo seja necessário. |
| `.claude/skills/vue-eslint-stylelint-quality-standards` | Garantir 4 espaços, aspas simples, ponto e vírgula, sem trailing comma; SCSS válido, se houver edição. |
| `.claude/skills/vue-vitest-testing-best-practices` | Rodar/validar `MaxInputTypeAddress.test.ts` (mount com `stubs`, `emitted`, `setProps`, `$nextTick`). |

Skills **não** necessárias aqui (e por quê): `vue-virtual-scroller-*` (sem lista virtualizada neste
wrapper; se aplicável, é no `MaxInputSelect`), `vue-keyboard-shortcuts-*` (navegação por teclado é
herdada do `MaxInputSelect`, não implementada aqui), `vue-dayjs-*`, `vue-uppy-*`, `vue-pdf-*`
(sem datas/upload/PDF), `vue-pinia-*` (não usa stores), `frontend-design-*` (fidelidade visual é
responsabilidade do `MaxInputSelect`).

---

## 10. Riscos e pontos de atenção

- **ORDEM (bloqueante): migrar `MaxInputSelect` ANTES.** Este componente **depende inteiramente**
  da migração do `MaxInputSelect`. Ele **não deve** ser considerado "migrado" enquanto o
  `MaxInputSelect` ainda importar PrimeVue. Executar/validar este plano **somente após**
  `migration_plans/MaxInputSelect.md` estar concluído e verde. Transitivamente, isso também depende
  de `InputBase` (usado dentro do `MaxInputSelect`).

- **Dependência de API, não de implementação.** Este wrapper acopla-se à **API pública** do
  `MaxInputSelect` (props `options`/`optionLabel`/`optionValue`, `v-model` via `update:modelValue`,
  repasse de `attrs`). A migração do `MaxInputSelect` **deve preservar** essa API. Qualquer
  regressão nela quebra este componente — e os testes com stub **não** capturam isso (só o
  checklist manual captura).

- **Testes stubam o select.** `stubs: { MaxInputSelect: true }` isola a lógica do wrapper. Passar
  nos testes **não garante** que a integração real com o `MaxInputSelect` migrado esteja correta.
  Fazer o checklist manual no playground é obrigatório.

- **Não introduzir mudanças desnecessárias.** O risco principal é "gold-plating": alterar este
  arquivo sem necessidade. Se os testes passam após migrar o `MaxInputSelect`, **não tocar** neste
  arquivo. Preservar `listTypeAddress`, `toSearchable` e os três `watch` exatamente como estão.

- **Estilo global órfão.** `.label_div-type-address` não é referenciado no template deste arquivo.
  Não removê-lo nesta migração (poderia afetar consumidores). Tratar em limpeza separada, se
  desejado, após grep de uso.

- **`attrs.street` vs `props.street`.** A precedência (`attrs.street ?? props.street`) e o watcher
  `{ immediate: true, deep: true }` são sutis; qualquer refatoração deve manter esse comportamento
  (coberto pelos testes 10 e 2–4).
